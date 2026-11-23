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
use local_numep\model\frequencia;

/**
 * Controller da API: confirma presença (ou falta) de convocados.
 *
 * @package    local_numep
 * @copyright  2026 Fellipe Queiroz
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class confirmar_presenca extends external_api {
    /**
     * Parâmetros de entrada.
     *
     * @return external_function_parameters
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'frequenciaids' => new external_multiple_structure(new external_value(PARAM_INT, 'id de FREQUENCIA')),
            'presente' => new external_value(PARAM_BOOL, 'presente (1) ou falta (0)', VALUE_DEFAULT, true),
        ]);
    }

    /**
     * Valida, confere a permissão e pede ao model.
     *
     * @param int[] $frequenciaids
     * @param bool $presente
     * @return array
     */
    public static function execute(array $frequenciaids, bool $presente = true): array {
        $p = self::validate_parameters(self::execute_parameters(), ['frequenciaids' => $frequenciaids, 'presente' => $presente]);
        $contexto = \context_system::instance();
        self::validate_context($contexto);
        require_capability('local/numep:confirmarpresenca', $contexto);
        return ['certificados_emitidos' => frequencia::confirmar_presenca($p['frequenciaids'], $p['presente'])];
    }

    /**
     * Formato da resposta.
     *
     * @return external_single_structure
     */
    public static function execute_returns(): external_single_structure {
        return new external_single_structure([
            'certificados_emitidos' => new external_value(PARAM_INT, 'certificados emitidos nesta chamada'),
        ]);
    }
}
