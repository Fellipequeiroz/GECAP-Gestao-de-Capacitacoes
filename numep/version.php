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
 * Informações de versão do plugin NUMEP/SUAS.
 *
 * Sempre que mudar algo no banco (db/install.xml + db/upgrade.php) ou nas
 * permissões (db/access.php), aumente o número de $plugin->version.
 * O Moodle compara esse número com o que está gravado no banco e roda a
 * atualização sozinho.
 *
 * @package    local_numep
 * @copyright  2026 Fellipe Queiroz
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$plugin->component = 'local_numep';     // Nome completo do plugin: tipo_nome.
$plugin->version   = 2026102504;        // Formato AAAAMMDDXX.
$plugin->requires  = 2026100500;        // Moodle 5.3.
$plugin->supported = [503, 503];        // Testado apenas na 5.3.
$plugin->maturity  = MATURITY_ALPHA;
$plugin->release   = '0.1.0';
