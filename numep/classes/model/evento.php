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

namespace local_numep\model;

use moodle_exception;

/**
 * Model de EVENTO (+ EVENTO_UNIDADE): criar, editar, convocar, encerrar e consultar.
 *
 * As regras de regras_negocio_numep.md são aplicadas aqui, antes de gravar.
 *
 * @package    local_numep
 * @copyright  2026 Fellipe Queiroz
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class evento {
    /** @var string Tabela no banco. */
    const TABELA = 'local_numep_evento';

    /**
     * Busca um evento com título e contagens.
     *
     * @param int $id
     * @return \stdClass
     */
    public static function obter(int $id): \stdClass {
        global $DB;
        $evento = $DB->get_record(self::TABELA, ['id' => $id], '*', MUST_EXIST);
        return self::completar($evento);
    }

    /**
     * Lista todos os eventos, do mais recente para o mais antigo.
     *
     * @return \stdClass[]
     */
    public static function listar(): array {
        global $DB;
        return array_map([self::class, 'completar'], array_values($DB->get_records(self::TABELA, null, 'data DESC')));
    }

    /**
     * Acrescenta título, unidades, contagens e situação ao registro do banco.
     *
     * @param \stdClass $e
     * @return \stdClass
     */
    private static function completar(\stdClass $e): \stdClass {
        global $DB;
        $e->titulo = $DB->get_field('local_numep_capacitacao', 'titulo', ['id' => $e->capacitacao_id]);
        $e->unidades = array_values($DB->get_fieldset_select('local_numep_evento_unidade', 'unidade_id', 'evento_id = ?', [$e->id]));
        $e->convocados = $DB->count_records('local_numep_frequencia', ['evento_id' => $e->id]);
        $e->presentes = $DB->count_records('local_numep_frequencia', ['evento_id' => $e->id, 'presente' => 1]);
        if ($e->encerrado) {
            $e->status = 'encerrado';
        } else if ($e->data > time()) {
            $e->status = 'agendado';
        } else {
            $e->status = $e->presentes < $e->convocados ? 'aguardando_presenca' : 'realizado';
        }
        return $e;
    }

    /**
     * Cria o evento, grava as unidades e convoca os profissionais.
     *
     * @param \stdClass $dados capacitacao_id, local, data, carga_horaria, modalidade, publico_alvo,
     *                         facilitador_userid ou facilitador_nome_externo, unidades (int[])
     * @return int id criado
     */
    public static function criar(\stdClass $dados): int {
        global $DB;
        $dados = self::normalizar($dados);
        regras::validar_evento($dados);
        self::validar_unidades($dados);
        if (!$DB->record_exists('local_numep_capacitacao', ['id' => $dados->capacitacao_id])) {
            throw new moodle_exception('erro_capacitacao', 'local_numep');
        }
        $transacao = $DB->start_delegated_transaction();
        $agora = time();
        $registro = clone $dados;
        unset($registro->unidades);
        $registro->encerrado = 0;
        $registro->timecreated = $agora;
        $registro->timemodified = $agora;
        $id = $DB->insert_record(self::TABELA, $registro);
        foreach ($dados->unidades as $unidade) {
            $DB->insert_record('local_numep_evento_unidade', ['evento_id' => $id, 'unidade_id' => $unidade]);
        }
        $registro->id = $id;
        $registro->unidades = $dados->unidades;
        self::convocar($registro);
        $transacao->allow_commit();
        return $id;
    }

    /**
     * Edita o evento. Regra 6.1: depois de emitido um certificado, data,
     * carga horária e capacitação não mudam.
     *
     * @param \stdClass $dados precisa ter id
     */
    public static function atualizar(\stdClass $dados): void {
        global $DB;
        $antigo = $DB->get_record(self::TABELA, ['id' => $dados->id], '*', MUST_EXIST);
        if ($antigo->encerrado) {
            throw new moodle_exception('erro_evento_encerrado', 'local_numep');
        }
        if (!isset($dados->unidades)) {
            // Sem unidades no pedido: mantém as que já estão gravadas.
            $dados->unidades = $DB->get_fieldset_select('local_numep_evento_unidade', 'unidade_id', 'evento_id = ?', [$antigo->id]);
        }
        $novo = self::normalizar((object) array_merge((array) $antigo, (array) $dados));
        regras::validar_edicao_evento($antigo, $novo);
        self::validar_unidades($novo);
        $transacao = $DB->start_delegated_transaction();
        $registro = clone $novo;
        unset($registro->unidades);
        $registro->timemodified = time();
        $DB->update_record(self::TABELA, $registro);
        // Unidades: grava as novas (as antigas continuam, pois já há convocados delas).
        $atuais = $DB->get_fieldset_select('local_numep_evento_unidade', 'unidade_id', 'evento_id = ?', [$novo->id]);
        foreach (array_diff($novo->unidades, $atuais) as $unidade) {
            $DB->insert_record('local_numep_evento_unidade', ['evento_id' => $novo->id, 'unidade_id' => $unidade]);
        }
        self::convocar($novo);
        $transacao->allow_commit();
    }

    /**
     * Encerra o evento e emite o certificado do facilitador (regra 4).
     *
     * @param int $id
     */
    public static function encerrar(int $id): void {
        global $DB;
        $evento = $DB->get_record(self::TABELA, ['id' => $id], '*', MUST_EXIST);
        if ($evento->encerrado) {
            throw new moodle_exception('erro_evento_encerrado', 'local_numep');
        }
        if ($evento->data > time()) {
            throw new moodle_exception('erro_evento_futuro', 'local_numep');
        }
        $transacao = $DB->start_delegated_transaction();
        $DB->set_field(self::TABELA, 'encerrado', 1, ['id' => $id]);
        $nome = $evento->facilitador_userid
            ? fullname(\core_user::get_user($evento->facilitador_userid))
            : $evento->facilitador_nome_externo;
        $DB->insert_record('local_numep_certificado_facilitador', (object) [
            'evento_id' => $id,
            'nome_facilitador_snapshot' => $nome,
            'titulo_evento_snapshot' => $DB->get_field('local_numep_capacitacao', 'titulo', ['id' => $evento->capacitacao_id]),
            'codigo_verificacao' => regras::gerar_codigo_verificacao(),
            'emitido_em' => time(),
        ]);
        $transacao->allow_commit();
    }

    /**
     * Exclui o evento e os convocados, se ainda não houver certificado.
     *
     * @param int $id
     */
    public static function excluir(int $id): void {
        global $DB;
        if (regras::evento_tem_certificado($id)) {
            throw new moodle_exception('erro_evento_bloqueado', 'local_numep');
        }
        $transacao = $DB->start_delegated_transaction();
        $DB->delete_records('local_numep_frequencia', ['evento_id' => $id]);
        $DB->delete_records('local_numep_evento_unidade', ['evento_id' => $id]);
        $DB->delete_records(self::TABELA, ['id' => $id]);
        $transacao->allow_commit();
    }

    /**
     * Convoca os profissionais ativos das unidades do evento (ou de toda a rede).
     * Regra 1: quem já está na lista não entra de novo.
     *
     * @param \stdClass $evento
     * @return int quantos foram convocados agora
     */
    private static function convocar(\stdClass $evento): int {
        global $DB;
        $params = ['eventoid' => $evento->id, 'facilitador' => (int) ($evento->facilitador_userid ?? 0)];
        $filtro = '';
        if ($evento->publico_alvo !== 'rede_geral') {
            [$in, $inparams] = $DB->get_in_or_equal($evento->unidades, SQL_PARAMS_NAMED, 'un');
            $filtro = "AND p.unidade_id $in";
            $params += $inparams;
        }
        $sql = "SELECT p.userid
                  FROM {local_numep_pessoa} p
                  JOIN {user} u ON u.id = p.userid AND u.deleted = 0 AND u.suspended = 0
                 WHERE p.userid <> :facilitador $filtro
                   AND NOT EXISTS (SELECT 1 FROM {local_numep_frequencia} f WHERE f.evento_id = :eventoid AND f.userid = p.userid)";
        $agora = time();
        $n = 0;
        foreach ($DB->get_fieldset_sql($sql, $params) as $userid) {
            $DB->insert_record('local_numep_frequencia', (object) [
                'evento_id' => $evento->id, 'userid' => $userid, 'presente' => 0, 'timecreated' => $agora, 'timemodified' => $agora,
            ]);
            $n++;
        }
        return $n;
    }

    /**
     * Ajusta tipos e campos opcionais vindos do formulário ou da API.
     *
     * @param \stdClass $d
     * @return \stdClass
     */
    private static function normalizar(\stdClass $d): \stdClass {
        $d->capacitacao_id = (int) $d->capacitacao_id;
        $d->carga_horaria = (int) $d->carga_horaria;
        $d->data = (int) $d->data;
        $d->local = trim((string) $d->local);
        $d->modalidade = $d->modalidade ?? 'presencial';
        $d->publico_alvo = $d->publico_alvo ?? 'rede_geral';
        $d->facilitador_userid = empty($d->facilitador_userid) ? null : (int) $d->facilitador_userid;
        $d->facilitador_nome_externo = isset($d->facilitador_nome_externo) && trim($d->facilitador_nome_externo) !== ''
            ? trim($d->facilitador_nome_externo) : null;
        $d->unidades = $d->publico_alvo === 'rede_geral' ? [] : array_values(array_unique(array_map('intval', $d->unidades ?? [])));
        return $d;
    }

    /**
     * Regra 6: fora da rede geral, as unidades são escolhidas à mão (pelo menos uma).
     *
     * @param \stdClass $d
     */
    private static function validar_unidades(\stdClass $d): void {
        if ($d->carga_horaria < 1 || $d->local === '' || $d->data <= 0) {
            throw new moodle_exception('erro_evento_dados', 'local_numep');
        }
        if ($d->publico_alvo !== 'rede_geral' && empty($d->unidades)) {
            throw new moodle_exception('erro_unidades', 'local_numep');
        }
    }
}
