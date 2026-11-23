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
 * Permissões (capabilities) do NUMEP.
 *
 * Aqui só se DECLARA cada permissão. Quem recebe cada uma é definido em
 * db/install.php, ao criar os papéis master, diretor, coordenador e tecnico.
 *
 * @package    local_numep
 * @copyright  2026 Fellipe Queiroz
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$capabilities = [
    // Cadastrar setores, unidades, cargos e usuários da rede.
    'local/numep:gerenciarestrutura' => [
        'riskbitmask'  => RISK_PERSONAL | RISK_CONFIG,
        'captype'      => 'write',
        'contextlevel' => CONTEXT_SYSTEM,
        'archetypes'   => ['manager' => CAP_ALLOW],
    ],
    // Criar e editar capacitações e eventos, escolher unidades, encerrar evento.
    'local/numep:gerenciarevento' => [
        'captype'      => 'write',
        'contextlevel' => CONTEXT_SYSTEM,
        'archetypes'   => ['manager' => CAP_ALLOW],
    ],
    // Confirmar presença (gera o certificado do participante).
    'local/numep:confirmarpresenca' => [
        'riskbitmask'  => RISK_PERSONAL,
        'captype'      => 'write',
        'contextlevel' => CONTEXT_SYSTEM,
        'archetypes'   => ['manager' => CAP_ALLOW],
    ],
    // Ver relatórios e médias de avaliação.
    'local/numep:verrelatorios' => [
        'riskbitmask'  => RISK_PERSONAL,
        'captype'      => 'read',
        'contextlevel' => CONTEXT_SYSTEM,
        'archetypes'   => ['manager' => CAP_ALLOW],
    ],
    // Ver os próprios eventos, avaliar e baixar os próprios certificados.
    'local/numep:participar' => [
        'captype'      => 'read',
        'contextlevel' => CONTEXT_SYSTEM,
        'archetypes'   => ['manager' => CAP_ALLOW],
    ],
];
