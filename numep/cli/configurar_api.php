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

/**
 * Liga a API REST do Moodle para o front React do NUMEP.
 *
 * Faz o mesmo que estes passos na tela de administração:
 *   1. Recursos avançados > Habilitar serviços web;
 *   2. Servidor > Serviços web > Gerenciar protocolos > habilitar REST;
 *   3. Servidor > Serviços web > Serviços externos > "NUMEP App" > habilitado;
 *   4. Papéis numep_* com permissão de usar o REST e de gerar a própria chave (token);
 *   5. Segurança > Políticas do site > bloqueio de conta após 5 senhas erradas.
 * Rode na pasta do Moodle:
 *   php public/local/numep/cli/configurar_api.php
 *
 * @package    local_numep
 * @copyright  2026 Fellipe Queiroz
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('CLI_SCRIPT', true);
require(__DIR__ . '/../../../config.php');

set_config('enablewebservices', 1);
$protocolos = array_filter(explode(',', (string) get_config('core', 'webserviceprotocols')));
if (!in_array('rest', $protocolos, true)) {
    $protocolos[] = 'rest';
    set_config('webserviceprotocols', implode(',', $protocolos));
}
$DB->set_field('external_services', 'enabled', 1, ['shortname' => 'numep_app']);

$contexto = context_system::instance();
foreach (['master', 'diretor', 'coordenador', 'tecnico'] as $perfil) {
    $roleid = $DB->get_field('role', 'id', ['shortname' => 'numep_' . $perfil], MUST_EXIST);
    foreach (['webservice/rest:use', 'moodle/webservice:createtoken'] as $permissao) {
        assign_capability($permissao, CAP_ALLOW, $roleid, $contexto->id, true);
    }
}
$contexto->mark_dirty();

// Proteção contra tentativa e erro de senha: 5 senhas erradas em 30 minutos
// bloqueiam a conta por 30 minutos (vale para o site e para o login do front).
set_config('lockoutthreshold', 5);
set_config('lockoutwindow', 30 * MINSECS);
set_config('lockoutduration', 30 * MINSECS);

echo "API REST ligada. O front entra pelo serviço 'numep_app':\n";
echo "  bloqueio: 5 senhas erradas em 30 min bloqueiam a conta por 30 min\n";
echo "  token:   POST {$CFG->wwwroot}/login/token.php (username, password, service=numep_app)\n";
echo "  funções: POST {$CFG->wwwroot}/webservice/rest/server.php?moodlewsrestformat=json\n";
