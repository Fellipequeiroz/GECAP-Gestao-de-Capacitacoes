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
 * Model de CAPACITACAO (o tema da formação).
 *
 * @package    local_numep
 * @copyright  2026 Fellipe Queiroz
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class capacitacao {
    /** @var string Tabela no banco (o Moodle acrescenta o prefixo mdl_). */
    const TABELA = 'local_numep_capacitacao';

    /**
     * Cria uma capacitação.
     *
     * @param string $titulo
     * @param string $descricao
     * @return int id criado
     */
    public static function criar(string $titulo, string $descricao = ''): int {
        global $DB;
        $titulo = trim($titulo);
        if ($titulo === '' || \core_text::strlen($titulo) > 255) {
            throw new moodle_exception('erro_titulo', 'local_numep');
        }
        $agora = time();
        return $DB->insert_record(self::TABELA, (object) [
            'titulo' => $titulo, 'descricao' => $descricao, 'timecreated' => $agora, 'timemodified' => $agora,
        ]);
    }

    /**
     * Edita título e descrição.
     *
     * @param int $id
     * @param string $titulo
     * @param string $descricao
     */
    public static function atualizar(int $id, string $titulo, string $descricao = ''): void {
        global $DB;
        $titulo = trim($titulo);
        if ($titulo === '' || \core_text::strlen($titulo) > 255) {
            throw new moodle_exception('erro_titulo', 'local_numep');
        }
        $DB->get_record(self::TABELA, ['id' => $id], 'id', MUST_EXIST);
        $DB->update_record(self::TABELA, (object) [
            'id' => $id, 'titulo' => $titulo, 'descricao' => $descricao, 'timemodified' => time(),
        ]);
    }

    /**
     * Exclui uma capacitação que ainda não tem eventos.
     *
     * @param int $id
     * @return string título excluído
     */
    public static function excluir(int $id): string {
        global $DB;
        $titulo = $DB->get_field(self::TABELA, 'titulo', ['id' => $id], MUST_EXIST);
        if ($DB->record_exists('local_numep_evento', ['capacitacao_id' => $id])) {
            throw new moodle_exception('erro_regra', 'local_numep', '', 'Esta capacitação já tem eventos e não pode ser excluída.');
        }
        $DB->delete_records(self::TABELA, ['id' => $id]);
        return $titulo;
    }

    /**
     * Lista as capacitações, com a quantidade de eventos de cada uma.
     *
     * @return \stdClass[]
     */
    public static function listar(): array {
        global $DB;
        $sql = "SELECT c.id, c.titulo, c.descricao, COUNT(e.id) AS eventos
                  FROM {" . self::TABELA . "} c
             LEFT JOIN {local_numep_evento} e ON e.capacitacao_id = c.id
              GROUP BY c.id, c.titulo, c.descricao
              ORDER BY c.titulo";
        return array_values($DB->get_records_sql($sql));
    }
}
