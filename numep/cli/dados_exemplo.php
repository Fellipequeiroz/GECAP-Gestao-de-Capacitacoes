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
 * Grava os dados de exemplo do NUMEP (APAGA os dados atuais das tabelas local_numep_*).
 *
 * Também libera o botão "Restaurar dados de exemplo" da tela Configurações.
 * Use só em ambiente de testes. Rode na pasta do Moodle:
 *   php public/local/numep/cli/dados_exemplo.php --confirmar
 *
 * @package    local_numep
 * @copyright  2026 Fellipe Queiroz
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('CLI_SCRIPT', true);
require(__DIR__ . '/../../../config.php');
require_once($CFG->libdir . '/clilib.php');

[$opcoes] = cli_get_params(['confirmar' => false, 'desligar' => false]);

if ($opcoes['desligar']) {
    unset_config('permitir_dados_exemplo', 'local_numep');
    cli_writeln('Botão "Restaurar dados de exemplo" desligado.');
    exit(0);
}
if (!$opcoes['confirmar']) {
    cli_writeln('Isto APAGA todos os dados do NUMEP e grava os de exemplo. Repita com --confirmar para continuar.');
    cli_writeln('Para desligar o botão de restauração da tela Configurações: --desligar');
    exit(1);
}

\core\session\manager::set_user(get_admin());
$login = \local_numep\local\dados_exemplo::gravar();
set_config('permitir_dados_exemplo', 1, 'local_numep');
cli_writeln('Dados de exemplo gravados.');
cli_writeln("Entre no front como Master: $login / " . \local_numep\local\dados_exemplo::SENHA);
