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
 * Roda uma única vez, logo depois que o Moodle cria as tabelas do install.xml.
 *
 * Cria os quatro perfis hierárquicos do NUMEP (antes o ENUM ACESSO.perfil)
 * como papéis (roles) do Moodle e distribui as permissões de db/access.php.
 *
 * @package    local_numep
 * @copyright  2026 Fellipe Queiroz
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Instalação do plugin.
 *
 * @return bool
 */
function xmldb_local_numep_install() {
    global $DB;

    // As permissões de db/access.php só são gravadas depois deste arquivo.
    // Chamamos agora para poder atribuí-las aos papéis.
    update_capabilities('local_numep');

    $context = context_system::instance();

    // Matriz de permissões por perfil (definida com o NUMEP).
    $papeis = [
        'numep_master' => [
            'nome' => 'NUMEP - Master',
            'descricao' => 'Secretário e Vigilância Socioassistencial. Acesso total.',
            'permissoes' => ['gerenciarestrutura', 'gerenciarevento', 'confirmarpresenca', 'verrelatorios', 'participar'],
        ],
        'numep_diretor' => [
            'nome' => 'NUMEP - Diretor',
            'descricao' => 'Diretoria. Gerencia eventos e vê relatórios.',
            'permissoes' => ['gerenciarevento', 'confirmarpresenca', 'verrelatorios', 'participar'],
        ],
        'numep_coordenador' => [
            'nome' => 'NUMEP - Coordenador',
            'descricao' => 'Coordenação de unidade. Confirma presença e vê relatórios.',
            'permissoes' => ['confirmarpresenca', 'verrelatorios', 'participar'],
        ],
        'numep_tecnico' => [
            'nome' => 'NUMEP - Técnico',
            'descricao' => 'Técnico da rede. Participa dos eventos.',
            'permissoes' => ['participar'],
        ],
    ];

    foreach ($papeis as $shortname => $dados) {
        $roleid = $DB->get_field('role', 'id', ['shortname' => $shortname]);
        if (!$roleid) {
            $roleid = create_role($dados['nome'], $shortname, $dados['descricao']);
        }
        // Os papéis são atribuídos no nível do site (contexto do sistema).
        set_role_contextlevels($roleid, [CONTEXT_SYSTEM]);
        foreach ($dados['permissoes'] as $permissao) {
            assign_capability('local/numep:' . $permissao, CAP_ALLOW, $roleid, $context->id, true);
        }
    }

    return true;
}
