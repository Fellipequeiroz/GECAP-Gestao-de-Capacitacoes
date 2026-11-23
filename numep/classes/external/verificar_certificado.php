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
use local_numep\model\certificado;
use local_numep\model\configuracao;

/**
 * Controller da API pública (sem login): confere um certificado pelo código.
 *
 * Usada pela página /certificado/:codigo do front. Devolve o CPF mascarado (LGPD).
 *
 * @package    local_numep
 * @copyright  2026 Fellipe Queiroz
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class verificar_certificado extends external_api {
    /**
     * Parâmetros de entrada.
     *
     * @return external_function_parameters
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'codigo' => new external_value(PARAM_ALPHANUMEXT, 'código NUMEP-XXXX-XXXX'),
        ]);
    }

    /**
     * Procura o certificado.
     *
     * @param string $codigo
     * @return array
     */
    public static function execute(string $codigo): array {
        global $PAGE;
        $p = self::validate_parameters(self::execute_parameters(), ['codigo' => $codigo]);
        // Sem validate_context(): ele exige login quando o site usa "forcelogin", e esta consulta é pública.
        $PAGE->set_context(\context_system::instance());
        $c = certificado::buscar_por_codigo($p['codigo']);
        $orgao = get_config('local_numep', 'nome_orgao') ?: '';
        $modelo = json_encode(configuracao::modelo_certificado(), JSON_UNESCAPED_UNICODE);
        if (!$c) {
            return ['encontrado' => false, 'tipo' => '', 'codigo' => '', 'nome' => '', 'cpf_oculto' => '', 'titulo' => '',
                'carga_horaria' => 0, 'data' => 0, 'emitido_em' => 0, 'nome_orgao' => $orgao, 'modelo' => $modelo];
        }
        return ['encontrado' => true, 'tipo' => $c->papel, 'nome_orgao' => $orgao, 'modelo' => $modelo] + (array) $c;
    }

    /**
     * Formato da resposta.
     *
     * @return external_single_structure
     */
    public static function execute_returns(): external_single_structure {
        return new external_single_structure([
            'encontrado' => new external_value(PARAM_BOOL, 'se o código existe'),
            'tipo' => new external_value(PARAM_ALPHA, 'participante ou facilitador'),
            'codigo' => new external_value(PARAM_ALPHANUMEXT, 'código de verificação'),
            'nome' => new external_value(PARAM_TEXT, 'nome no certificado'),
            'cpf_oculto' => new external_value(PARAM_TEXT, 'CPF mascarado'),
            'titulo' => new external_value(PARAM_TEXT, 'título da capacitação'),
            'carga_horaria' => new external_value(PARAM_INT, 'horas'),
            'data' => new external_value(PARAM_INT, 'data do evento (timestamp)'),
            'emitido_em' => new external_value(PARAM_INT, 'emissão (timestamp)'),
            'nome_orgao' => new external_value(PARAM_TEXT, 'órgão emissor'),
            'modelo' => new external_value(PARAM_RAW, 'modelo do certificado em JSON (textos e cidade)'),
        ]);
    }
}
