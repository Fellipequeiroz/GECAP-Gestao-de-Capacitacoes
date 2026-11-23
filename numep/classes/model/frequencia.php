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
 * Model de FREQUENCIA: lista de convocados e confirmação de presença.
 *
 * @package    local_numep
 * @copyright  2026 Fellipe Queiroz
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class frequencia {
    /** @var string Tabela no banco. */
    const TABELA = 'local_numep_frequencia';

    /**
     * Lista os convocados de um evento, com o nome de cada um.
     *
     * @param int $eventoid
     * @return \stdClass[]
     */
    public static function listar_do_evento(int $eventoid): array {
        global $DB;
        $sql = "SELECT f.id, f.userid, f.presente, f.confirmado_em, u.firstname, u.lastname
                  FROM {" . self::TABELA . "} f
                  JOIN {user} u ON u.id = f.userid
                 WHERE f.evento_id = ?
              ORDER BY u.firstname, u.lastname";
        return array_values($DB->get_records_sql($sql, [$eventoid]));
    }

    /**
     * Marca presença (ou falta) e, na presença, emite o certificado do participante
     * com uma "fotografia" dos dados do evento (regra 4). Quem confirmou fica registrado.
     *
     * @param int[] $ids ids de FREQUENCIA
     * @param bool $presente
     * @return int quantos certificados foram emitidos agora
     */
    public static function confirmar_presenca(array $ids, bool $presente = true): int {
        global $DB, $USER;
        $emitidos = 0;
        // 1) Confere tudo antes de gravar (se algo falhar, nada é gravado).
        $itens = [];
        foreach (array_unique(array_map('intval', $ids)) as $id) {
            $f = $DB->get_record(self::TABELA, ['id' => $id], '*', MUST_EXIST);
            $evento = $DB->get_record('local_numep_evento', ['id' => $f->evento_id], '*', MUST_EXIST);
            if ($evento->encerrado) {
                throw new moodle_exception('erro_evento_encerrado', 'local_numep');
            }
            if ($evento->data > time()) {
                throw new moodle_exception('erro_evento_futuro', 'local_numep');
            }
            $temcertificado = $DB->record_exists('local_numep_certificado', ['frequencia_id' => $id]);
            if (!$presente && $temcertificado) {
                // Certificado emitido não é desfeito (regra 6.1).
                throw new moodle_exception('erro_presenca_certificada', 'local_numep');
            }
            $itens[] = [$id, $evento, $temcertificado];
        }
        // 2) Grava tudo junto.
        $transacao = $DB->start_delegated_transaction();
        foreach ($itens as [$id, $evento, $temcertificado]) {
            $DB->update_record(self::TABELA, (object) [
                'id' => $id, 'presente' => $presente ? 1 : 0,
                'confirmado_por_userid' => $USER->id, 'confirmado_em' => time(), 'timemodified' => time(),
            ]);
            if ($presente && !$temcertificado) {
                $DB->insert_record('local_numep_certificado', (object) [
                    'frequencia_id' => $id,
                    'titulo_evento_snapshot' => $DB->get_field('local_numep_capacitacao', 'titulo', ['id' => $evento->capacitacao_id]),
                    'carga_horaria_snapshot' => $evento->carga_horaria,
                    'data_evento_snapshot' => $evento->data,
                    'codigo_verificacao' => regras::gerar_codigo_verificacao(),
                    'emitido_em' => time(),
                ]);
                $emitidos++;
            }
        }
        $transacao->allow_commit();
        return $emitidos;
    }

    /**
     * Acrescenta participantes à lista do evento, procurando cada um pelo e-mail ou CPF.
     * Regra 1: quem já está na lista é contado como repetido.
     *
     * @param int $eventoid
     * @param string[] $chaves e-mails ou CPFs
     * @return array adicionados, repetidos, nao_encontrados (string[])
     */
    public static function adicionar(int $eventoid, array $chaves): array {
        global $DB;
        $evento = $DB->get_record('local_numep_evento', ['id' => $eventoid], '*', MUST_EXIST);
        if ($evento->encerrado) {
            throw new moodle_exception('erro_evento_encerrado', 'local_numep');
        }
        $resultado = ['adicionados' => 0, 'repetidos' => 0, 'nao_encontrados' => []];
        $agora = time();
        $transacao = $DB->start_delegated_transaction();
        foreach ($chaves as $chave) {
            $chave = \core_text::strtolower(trim((string) $chave));
            if ($chave === '') {
                continue;
            }
            $digitos = preg_replace('/\D/', '', $chave);
            $sql = "SELECT p.userid
                      FROM {local_numep_pessoa} p
                      JOIN {user} u ON u.id = p.userid AND u.deleted = 0
                     WHERE LOWER(u.email) = :email OR p.cpf = :cpf";
            $userid = $DB->get_field_sql($sql, ['email' => $chave, 'cpf' => strlen($digitos) === 11 ? $digitos : '-'], IGNORE_MULTIPLE);
            if (!$userid || !self::no_escopo((int) $userid)) {
                // Quem está fora da unidade/diretoria de quem adiciona conta como não encontrado.
                $resultado['nao_encontrados'][] = $chave;
            } else if ($DB->record_exists(self::TABELA, ['evento_id' => $eventoid, 'userid' => $userid])) {
                $resultado['repetidos']++;
            } else {
                $DB->insert_record(self::TABELA, (object) [
                    'evento_id' => $eventoid, 'userid' => $userid, 'presente' => 0, 'timecreated' => $agora, 'timemodified' => $agora,
                ]);
                $resultado['adicionados']++;
            }
        }
        $transacao->allow_commit();
        return $resultado;
    }

    /**
     * Diz se a pessoa está no escopo do usuário logado (unidade do coordenador, setor do diretor).
     *
     * @param int $userid
     * @return bool
     */
    private static function no_escopo(int $userid): bool {
        try {
            pessoa::exigir_mesma_unidade([$userid]);
            return true;
        } catch (moodle_exception $e) {
            return false;
        }
    }

    /**
     * Tira um convocado da lista, se ainda não houver certificado.
     *
     * @param int $id id de FREQUENCIA
     */
    public static function remover(int $id): void {
        global $DB;
        $DB->get_record(self::TABELA, ['id' => $id], 'id', MUST_EXIST);
        if ($DB->record_exists('local_numep_certificado', ['frequencia_id' => $id])) {
            throw new moodle_exception('erro_regra', 'local_numep', '', 'Este participante já tem certificado e não pode ser removido.');
        }
        $transacao = $DB->start_delegated_transaction();
        $DB->delete_records('local_numep_avaliacao_evento', ['frequencia_id' => $id]);
        $DB->delete_records(self::TABELA, ['id' => $id]);
        $transacao->allow_commit();
    }

    /**
     * Registra a avaliação de uma participação (regra 9: nota de 1 a 5, uma por frequência).
     *
     * @param int $id id de FREQUENCIA
     * @param int $nota
     * @param string $comentario
     */
    public static function avaliar(int $id, int $nota, string $comentario = ''): void {
        global $DB;
        regras::validar_nota($nota);
        $f = $DB->get_record(self::TABELA, ['id' => $id], '*', MUST_EXIST);
        if (!$f->presente) {
            throw new moodle_exception('erro_regra', 'local_numep', '', 'Só quem teve presença confirmada pode avaliar.');
        }
        if ($DB->record_exists('local_numep_avaliacao_evento', ['frequencia_id' => $id])) {
            throw new moodle_exception('erro_regra', 'local_numep', '', 'Esta participação já foi avaliada (regra 9).');
        }
        $DB->insert_record('local_numep_avaliacao_evento', (object) [
            'frequencia_id' => $id, 'nota' => $nota, 'comentario' => \core_text::substr($comentario, 0, 2000), 'timecreated' => time(),
        ]);
    }
}
