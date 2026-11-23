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
use local_numep\model\dados;

/**
 * Controller da API: devolve os dados que as telas usam, no escopo do perfil logado.
 *
 * A resposta é um JSON em texto (campo "json") porque a estrutura é grande e
 * as telas calculam os indicadores no navegador.
 *
 * @package    local_numep
 * @copyright  2026 Fellipe Queiroz
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class carregar_dados extends external_api {
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
        // Todos os perfis entram; o model limita o que cada um recebe (escopo).
        require_capability('local/numep:participar', $contexto);
        return ['json' => json_encode(dados::carregar(), JSON_UNESCAPED_UNICODE)];
    }

    /**
     * Formato da resposta.
     *
     * @return external_single_structure
     */
    public static function execute_returns(): external_single_structure {
        return new external_single_structure([
            'json' => new external_value(PARAM_RAW, 'dados do NUMEP em JSON'),
        ]);
    }
}
