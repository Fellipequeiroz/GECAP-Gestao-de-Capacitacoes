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
 * Funções da API (controllers em classes/external) que o front React chama.
 *
 * @package    local_numep
 * @copyright  2026 Fellipe Queiroz
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$functions = [
    'local_numep_listar_eventos' => [
        'classname' => \local_numep\external\listar_eventos::class,
        'description' => 'Lista os eventos com contagem de convocados e presentes.',
        'type' => 'read',
        'ajax' => true,
        'capabilities' => 'local/numep:verrelatorios',
    ],
    'local_numep_confirmar_presenca' => [
        'classname' => \local_numep\external\confirmar_presenca::class,
        'description' => 'Confirma presença ou falta e emite os certificados.',
        'type' => 'write',
        'ajax' => true,
        'capabilities' => 'local/numep:confirmarpresenca',
    ],
    'local_numep_encerrar_evento' => [
        'classname' => \local_numep\external\encerrar_evento::class,
        'description' => 'Encerra o evento e emite o certificado do facilitador.',
        'type' => 'write',
        'ajax' => true,
        'capabilities' => 'local/numep:gerenciarevento',
    ],
    'local_numep_carregar_dados' => [
        'classname' => \local_numep\external\carregar_dados::class,
        'description' => 'Devolve os dados que as telas usam, no escopo do perfil (tudo, unidade ou próprios).',
        'type' => 'read',
        'ajax' => true,
        'capabilities' => 'local/numep:participar',
    ],
    'local_numep_executar' => [
        'classname' => \local_numep\external\executar::class,
        'description' => 'Executa uma ação de gravação das telas do Master (cada ação confere a sua permissão).',
        'type' => 'write',
        'ajax' => true,
        'capabilities' => 'local/numep:participar',
    ],
    'local_numep_verificar_certificado' => [
        'classname' => \local_numep\external\verificar_certificado::class,
        'description' => 'Confere um certificado pelo código (página pública, sem login).',
        'type' => 'read',
        'ajax' => true,
        'loginrequired' => false,
    ],
];

$services = [
    'NUMEP App' => [
        'functions' => array_keys($functions),
        'shortname' => 'numep_app',
        'restrictedusers' => 0,
        'enabled' => 1,
        'downloadfiles' => 0,
        'uploadfiles' => 0,
    ],
];
