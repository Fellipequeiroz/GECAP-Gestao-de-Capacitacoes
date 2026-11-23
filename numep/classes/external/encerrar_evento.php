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
use local_numep\model\evento;

/**
 * Controller da API: encerra o evento e emite o certificado do facilitador.
 *
 * @package    local_numep
 * @copyright  2026 Fellipe Queiroz
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class encerrar_evento extends external_api {
    /**
     * Parâmetros de entrada.
     *
     * @return external_function_parameters
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'eventoid' => new external_value(PARAM_INT, 'id do evento'),
        ]);
    }

    /**
     * Valida, confere a permissão e pede ao model.
     *
     * @param int $eventoid
     * @return array
     */
    public static function execute(int $eventoid): array {
        $p = self::validate_parameters(self::execute_parameters(), ['eventoid' => $eventoid]);
        $contexto = \context_system::instance();
        self::validate_context($contexto);
        require_capability('local/numep:gerenciarevento', $contexto);
        evento::encerrar($p['eventoid']);
        return ['sucesso' => true];
    }

    /**
     * Formato da resposta.
     *
     * @return external_single_structure
     */
    public static function execute_returns(): external_single_structure {
        return new external_single_structure([
            'sucesso' => new external_value(PARAM_BOOL, 'encerrado com sucesso'),
        ]);
    }
}
