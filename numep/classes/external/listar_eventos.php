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
use core_external\external_multiple_structure;
use core_external\external_single_structure;
use core_external\external_value;
use local_numep\model\evento;

/**
 * Controller da API: lista os eventos (para o front React).
 *
 * @package    local_numep
 * @copyright  2026 Fellipe Queiroz
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class listar_eventos extends external_api {
    /**
     * Parâmetros de entrada (nenhum).
     *
     * @return external_function_parameters
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([]);
    }

    /**
     * Confere a permissão e pede os dados ao model.
     *
     * @return array
     */
    public static function execute(): array {
        $contexto = \context_system::instance();
        self::validate_context($contexto);
        require_capability('local/numep:verrelatorios', $contexto);
        return array_map(fn($e) => [
            'id' => $e->id, 'titulo' => $e->titulo, 'local' => $e->local, 'data' => $e->data,
            'carga_horaria' => $e->carga_horaria, 'modalidade' => $e->modalidade, 'status' => $e->status,
            'convocados' => $e->convocados, 'presentes' => $e->presentes,
        ], evento::listar());
    }

    /**
     * Formato da resposta.
     *
     * @return external_multiple_structure
     */
    public static function execute_returns(): external_multiple_structure {
        return new external_multiple_structure(new external_single_structure([
            'id' => new external_value(PARAM_INT, 'id do evento'),
            'titulo' => new external_value(PARAM_TEXT, 'título da capacitação'),
            'local' => new external_value(PARAM_TEXT, 'local'),
            'data' => new external_value(PARAM_INT, 'data (timestamp)'),
            'carga_horaria' => new external_value(PARAM_INT, 'carga horária em horas'),
            'modalidade' => new external_value(PARAM_ALPHANUMEXT, 'modalidade'),
            'status' => new external_value(PARAM_ALPHANUMEXT, 'situação'),
            'convocados' => new external_value(PARAM_INT, 'quantidade de convocados'),
            'presentes' => new external_value(PARAM_INT, 'quantidade de presentes'),
        ]));
    }
}
