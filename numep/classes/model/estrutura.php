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
 * Model da estrutura da rede: UNIDADE e CARGO_TAG (os setores são fixos por ora).
 *
 * @package    local_numep
 * @copyright  2026 Fellipe Queiroz
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class estrutura {
    /**
     * Cria ou edita uma unidade.
     *
     * @param \stdClass $d id (vazio para nova), nome, setor_id, endereco
     * @return int id
     */
    public static function salvar_unidade(\stdClass $d): int {
        global $DB;
        $nome = trim((string) ($d->nome ?? ''));
        $endereco = trim((string) ($d->endereco ?? ''));
        if ($nome === '' || \core_text::strlen($nome) > 255 || \core_text::strlen($endereco) > 255) {
            throw new moodle_exception('erro_regra', 'local_numep', '', 'Informe o nome da unidade (até 255 caracteres).');
        }
        $setor = (int) ($d->setor_id ?? 0);
        if (!$DB->record_exists('local_numep_setor', ['id' => $setor])) {
            throw new moodle_exception('erro_regra', 'local_numep', '', 'Escolha o setor.');
        }
        $registro = (object) ['nome' => $nome, 'setor_id' => $setor, 'endereco' => $endereco, 'timemodified' => time()];
        if (!empty($d->id)) {
            $registro->id = $DB->get_field('local_numep_unidade', 'id', ['id' => (int) $d->id], MUST_EXIST);
            $DB->update_record('local_numep_unidade', $registro);
            atividade::registrar('Editou a unidade', $nome);
            return $registro->id;
        }
        $registro->timecreated = $registro->timemodified;
        $id = $DB->insert_record('local_numep_unidade', $registro);
        atividade::registrar('Cadastrou a unidade', $nome);
        return $id;
    }

    /**
     * Exclui uma unidade sem profissionais e sem eventos.
     *
     * @param int $id
     */
    public static function excluir_unidade(int $id): void {
        global $DB;
        $unidade = $DB->get_record('local_numep_unidade', ['id' => $id], '*', MUST_EXIST);
        if ($DB->record_exists('local_numep_pessoa', ['unidade_id' => $id])) {
            throw new moodle_exception('erro_regra', 'local_numep', '', 'Há profissionais lotados nesta unidade. Transfira-os antes de excluir.');
        }
        if ($DB->record_exists('local_numep_evento_unidade', ['unidade_id' => $id])) {
            throw new moodle_exception('erro_regra', 'local_numep', '', 'Esta unidade está ligada a eventos e não pode ser excluída.');
        }
        $DB->delete_records('local_numep_unidade', ['id' => $id]);
        atividade::registrar('Excluiu a unidade', $unidade->nome);
    }

    /**
     * Cria ou renomeia um cargo (nome único).
     *
     * @param \stdClass $d id (vazio para novo), nome
     * @return int id
     */
    public static function salvar_cargo(\stdClass $d): int {
        global $DB;
        $nome = trim((string) ($d->nome ?? ''));
        $id = (int) ($d->id ?? 0);
        if ($nome === '' || \core_text::strlen($nome) > 100) {
            throw new moodle_exception('erro_regra', 'local_numep', '', 'Informe o nome do cargo (até 100 caracteres).');
        }
        if ($DB->record_exists_select('local_numep_cargo_tag', 'LOWER(nome) = LOWER(?) AND id <> ?', [$nome, $id])) {
            throw new moodle_exception('erro_regra', 'local_numep', '', 'Já existe um cargo com esse nome.');
        }
        $agora = time();
        if ($id) {
            $DB->get_record('local_numep_cargo_tag', ['id' => $id], 'id', MUST_EXIST);
            $DB->update_record('local_numep_cargo_tag', (object) ['id' => $id, 'nome' => $nome, 'timemodified' => $agora]);
            atividade::registrar('Editou o cargo', $nome);
            return $id;
        }
        $id = $DB->insert_record('local_numep_cargo_tag', (object) [
            'nome' => $nome, 'descricao' => '', 'timecreated' => $agora, 'timemodified' => $agora,
        ]);
        atividade::registrar('Cadastrou o cargo', $nome);
        return $id;
    }

    /**
     * Exclui um cargo que ninguém usa.
     *
     * @param int $id
     */
    public static function excluir_cargo(int $id): void {
        global $DB;
        $cargo = $DB->get_record('local_numep_cargo_tag', ['id' => $id], '*', MUST_EXIST);
        if ($DB->record_exists('local_numep_pessoa', ['cargo_tag_id' => $id])) {
            throw new moodle_exception('erro_regra', 'local_numep', '', 'Há profissionais com este cargo. Troque o cargo deles antes de excluir.');
        }
        $DB->delete_records('local_numep_cargo_tag', ['id' => $id]);
        atividade::registrar('Excluiu o cargo', $cargo->nome);
    }
}
