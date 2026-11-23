<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

namespace local_numep\external;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_single_structure;
use core_external\external_value;
use local_numep\local\dados_exemplo;
use local_numep\model\atividade;
use local_numep\model\capacitacao;
use local_numep\model\configuracao;
use local_numep\model\estrutura;
use local_numep\model\evento;
use local_numep\model\frequencia;
use local_numep\model\pessoa;
use moodle_exception;

/**
 * Controller da API: executa uma ação de gravação pedida pelas telas do Master.
 *
 * Cada ação tem a sua permissão (tabela ACOES) e chama um model. Os dados vêm
 * em JSON no parâmetro "dados" e a resposta volta em JSON no campo "json".
 *
 * @package    local_numep
 * @copyright  2026 Fellipe Queiroz
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class executar extends external_api {
    /** @var string[] Ação => permissão exigida (local/numep:<permissão>). */
    const ACOES = [
        'salvar_capacitacao' => 'gerenciarevento',
        'excluir_capacitacao' => 'gerenciarevento',
        'salvar_evento' => 'gerenciarevento',
        'excluir_evento' => 'gerenciarevento',
        'encerrar_evento' => 'gerenciarevento',
        'adicionar_participantes' => 'gerenciarevento',
        'remover_participante' => 'gerenciarevento',
        'confirmar_presenca' => 'confirmarpresenca',
        'registrar_avaliacao' => 'confirmarpresenca',
        'avaliar_minha' => 'participar',
        'salvar_profissional' => 'participar', // Editar outra pessoa exige gerenciarestrutura (conferido no model).
        'alternar_ativo' => 'gerenciarestrutura',
        'salvar_unidade' => 'gerenciarestrutura',
        'excluir_unidade' => 'gerenciarestrutura',
        'salvar_cargo' => 'gerenciarestrutura',
        'excluir_cargo' => 'gerenciarestrutura',
        'salvar_config' => 'gerenciarestrutura',
        'salvar_preferencias' => 'participar',
        'alterar_senha' => 'participar',
        'sair' => 'participar',
        'restaurar_exemplo' => 'gerenciarestrutura',
    ];

    /**
     * Parâmetros de entrada.
     *
     * @return external_function_parameters
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'acao' => new external_value(PARAM_ALPHANUMEXT, 'nome da ação'),
            'dados' => new external_value(PARAM_RAW, 'dados da ação em JSON', VALUE_DEFAULT, '{}'),
        ]);
    }

    /**
     * Valida, confere a permissão e chama o model.
     *
     * @param string $acao
     * @param string $dados
     * @return array
     */
    public static function execute(string $acao, string $dados = '{}'): array {
        $p = self::validate_parameters(self::execute_parameters(), ['acao' => $acao, 'dados' => $dados]);
        $contexto = \context_system::instance();
        self::validate_context($contexto);
        if (!isset(self::ACOES[$p['acao']])) {
            throw new moodle_exception('erro_regra', 'local_numep', '', 'Ação desconhecida.');
        }
        require_capability('local/numep:' . self::ACOES[$p['acao']], $contexto);
        $d = json_decode($p['dados']);
        if (!$d instanceof \stdClass) {
            throw new moodle_exception('erro_regra', 'local_numep', '', 'Dados inválidos.');
        }
        $resultado = self::{'acao_' . $p['acao']}($d);
        return ['json' => json_encode($resultado, JSON_UNESCAPED_UNICODE)];
    }

    /**
     * Formato da resposta.
     *
     * @return external_single_structure
     */
    public static function execute_returns(): external_single_structure {
        return new external_single_structure([
            'json' => new external_value(PARAM_RAW, 'resultado da ação em JSON'),
        ]);
    }

    // ---------- Capacitações e eventos ----------

    /**
     * @param \stdClass $d id, titulo, descricao
     * @return int
     */
    private static function acao_salvar_capacitacao(\stdClass $d): int {
        $titulo = trim((string) ($d->titulo ?? ''));
        $descricao = \core_text::substr((string) ($d->descricao ?? ''), 0, 2000);
        if (!empty($d->id)) {
            capacitacao::atualizar((int) $d->id, $titulo, $descricao);
            atividade::registrar('Editou a capacitação', $titulo);
            return (int) $d->id;
        }
        $id = capacitacao::criar($titulo, $descricao);
        atividade::registrar('Criou a capacitação', $titulo);
        return $id;
    }

    /**
     * @param \stdClass $d id
     * @return bool
     */
    private static function acao_excluir_capacitacao(\stdClass $d): bool {
        atividade::registrar('Excluiu a capacitação', capacitacao::excluir((int) $d->id));
        return true;
    }

    /**
     * @param \stdClass $d campos do evento (data em timestamp)
     * @return int
     */
    private static function acao_salvar_evento(\stdClass $d): int {
        global $DB;
        $d->unidades = array_map('intval', (array) ($d->unidades ?? []));
        if (!empty($d->id)) {
            $d->id = (int) $d->id;
            evento::atualizar($d);
            atividade::registrar('Editou o evento', self::titulo_evento($d->id));
            return $d->id;
        }
        unset($d->id);
        $id = evento::criar($d);
        $convocados = $DB->count_records('local_numep_frequencia', ['evento_id' => $id]);
        atividade::registrar('Criou o evento', self::titulo_evento($id) . " ($convocados convocados)");
        return $id;
    }

    /**
     * @param \stdClass $d id
     * @return bool
     */
    private static function acao_excluir_evento(\stdClass $d): bool {
        $titulo = self::titulo_evento((int) $d->id);
        evento::excluir((int) $d->id);
        atividade::registrar('Excluiu o evento', $titulo);
        return true;
    }

    /**
     * @param \stdClass $d id
     * @return bool
     */
    private static function acao_encerrar_evento(\stdClass $d): bool {
        evento::encerrar((int) $d->id);
        atividade::registrar('Encerrou o evento', self::titulo_evento((int) $d->id));
        return true;
    }

    /**
     * @param \stdClass $d evento_id, chaves (e-mails ou CPFs)
     * @return array
     */
    private static function acao_adicionar_participantes(\stdClass $d): array {
        $r = frequencia::adicionar((int) $d->evento_id, (array) ($d->chaves ?? []));
        atividade::registrar('Adicionou participantes', $r['adicionados'] . ' em ' . self::titulo_evento((int) $d->evento_id));
        return $r;
    }

    /**
     * @param \stdClass $d id (de FREQUENCIA)
     * @return bool
     */
    private static function acao_remover_participante(\stdClass $d): bool {
        pessoa::exigir_mesma_unidade(self::donos([(int) $d->id]));
        frequencia::remover((int) $d->id);
        return true;
    }

    /**
     * @param \stdClass $d ids (de FREQUENCIA), presente
     * @return int quantas presenças foram alteradas
     */
    private static function acao_confirmar_presenca(\stdClass $d): int {
        global $DB;
        $ids = array_map('intval', (array) ($d->ids ?? []));
        if (!$ids) {
            throw new moodle_exception('erro_regra', 'local_numep', '', 'Nenhum participante selecionado.');
        }
        $presente = !empty($d->presente);
        pessoa::exigir_mesma_unidade(self::donos($ids));
        frequencia::confirmar_presenca($ids, $presente);
        $eventoid = $DB->get_field('local_numep_frequencia', 'evento_id', ['id' => $ids[0]]);
        atividade::registrar($presente ? 'Confirmou presença' : 'Retirou presença',
            count($ids) . ' participante(s) em ' . self::titulo_evento((int) $eventoid));
        return count($ids);
    }

    /**
     * @param \stdClass $d frequencia_id, nota, comentario
     * @return bool
     */
    private static function acao_registrar_avaliacao(\stdClass $d): bool {
        pessoa::exigir_mesma_unidade(self::donos([(int) $d->frequencia_id]));
        frequencia::avaliar((int) $d->frequencia_id, (int) $d->nota, (string) ($d->comentario ?? ''));
        return true;
    }

    /**
     * O próprio participante avalia uma capacitação de que participou (tela Minhas Capacitações).
     *
     * @param \stdClass $d frequencia_id, nota, comentario
     * @return bool
     */
    private static function acao_avaliar_minha(\stdClass $d): bool {
        global $USER;
        if (self::donos([(int) $d->frequencia_id]) !== [(int) $USER->id]) {
            throw new moodle_exception('erro_regra', 'local_numep', '', 'Você só pode avaliar as suas próprias participações.');
        }
        frequencia::avaliar((int) $d->frequencia_id, (int) $d->nota, (string) ($d->comentario ?? ''));
        atividade::registrar('Avaliou a capacitação', self::titulo_evento((int) self::evento_da_frequencia((int) $d->frequencia_id)));
        return true;
    }

    /**
     * Donos (userid) de uma lista de presenças.
     *
     * @param int[] $frequenciaids
     * @return int[]
     */
    private static function donos(array $frequenciaids): array {
        global $DB;
        if (!$frequenciaids) {
            return [];
        }
        [$in, $params] = $DB->get_in_or_equal($frequenciaids);
        return array_values(array_unique(array_map('intval', $DB->get_fieldset_select('local_numep_frequencia', 'userid', "id $in", $params))));
    }

    /**
     * Evento de uma presença.
     *
     * @param int $frequenciaid
     * @return int
     */
    private static function evento_da_frequencia(int $frequenciaid): int {
        global $DB;
        return (int) $DB->get_field('local_numep_frequencia', 'evento_id', ['id' => $frequenciaid]);
    }

    // ---------- Profissionais e estrutura ----------

    /**
     * @param \stdClass $d campos do profissional (data_nascimento em timestamp)
     * @return int userid
     */
    private static function acao_salvar_profissional(\stdClass $d): int {
        return pessoa::salvar($d);
    }

    /**
     * @param \stdClass $d id (userid)
     * @return bool se ficou ativo
     */
    private static function acao_alternar_ativo(\stdClass $d): bool {
        return pessoa::alternar_ativo((int) $d->id);
    }

    /**
     * @param \stdClass $d id, nome, setor_id, endereco
     * @return int
     */
    private static function acao_salvar_unidade(\stdClass $d): int {
        return estrutura::salvar_unidade($d);
    }

    /**
     * @param \stdClass $d id
     * @return bool
     */
    private static function acao_excluir_unidade(\stdClass $d): bool {
        estrutura::excluir_unidade((int) $d->id);
        return true;
    }

    /**
     * @param \stdClass $d id, nome
     * @return int
     */
    private static function acao_salvar_cargo(\stdClass $d): int {
        return estrutura::salvar_cargo($d);
    }

    /**
     * @param \stdClass $d id
     * @return bool
     */
    private static function acao_excluir_cargo(\stdClass $d): bool {
        estrutura::excluir_cargo((int) $d->id);
        return true;
    }

    // ---------- Configurações ----------

    /**
     * @param \stdClass $d campos de configuracao::PADRAO
     * @return array configurações gravadas
     */
    private static function acao_salvar_config(\stdClass $d): array {
        configuracao::salvar($d);
        return configuracao::obter();
    }

    /**
     * Botão Sair do front: apaga no Moodle a chave (token) usada nesta sessão, para que
     * ela não sirva mais nem se alguém a tiver copiado. Só apaga token do próprio usuário.
     *
     * @param \stdClass $d token
     * @return bool se havia um token para apagar
     */
    private static function acao_sair(\stdClass $d): bool {
        global $DB, $USER;
        $token = clean_param((string) ($d->token ?? ''), PARAM_ALPHANUM);
        if ($token === '') {
            return false;
        }
        $apagou = $DB->record_exists('external_tokens', ['token' => $token, 'userid' => $USER->id]);
        $DB->delete_records('external_tokens', ['token' => $token, 'userid' => $USER->id]);
        return $apagou;
    }

    /**
     * @param \stdClass $d idioma, notificacoes, silencio, dois_fatores
     * @return array configurações já com as preferências gravadas
     */
    private static function acao_salvar_preferencias(\stdClass $d): array {
        configuracao::salvar_preferencias($d);
        return configuracao::obter();
    }

    /**
     * @param \stdClass $d atual, nova
     * @return bool
     */
    private static function acao_alterar_senha(\stdClass $d): bool {
        configuracao::alterar_senha((string) ($d->atual ?? ''), (string) ($d->nova ?? ''));
        return true;
    }

    /**
     * Apaga os dados do NUMEP e grava os de exemplo. Só funciona se foi liberado
     * pelo terminal (cli/dados_exemplo.php), para nunca rodar num banco de produção.
     *
     * @param \stdClass $d nada
     * @return bool
     */
    private static function acao_restaurar_exemplo(\stdClass $d): bool {
        if (!get_config('local_numep', 'permitir_dados_exemplo')) {
            throw new moodle_exception('erro_regra', 'local_numep', '',
                'A restauração de dados de exemplo está desligada neste servidor.');
        }
        dados_exemplo::gravar();
        return true;
    }

    /**
     * Título da capacitação de um evento (para o registro de atividades).
     *
     * @param int $eventoid
     * @return string
     */
    private static function titulo_evento(int $eventoid): string {
        global $DB;
        $sql = "SELECT c.titulo
                  FROM {local_numep_evento} e
                  JOIN {local_numep_capacitacao} c ON c.id = e.capacitacao_id
                 WHERE e.id = ?";
        return (string) $DB->get_field_sql($sql, [$eventoid]);
    }
}
