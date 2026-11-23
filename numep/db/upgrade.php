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
 * Atualizações do banco depois da primeira instalação.
 *
 * Como funciona: se você instalou o plugin e depois precisar mudar uma
 * tabela, NÃO basta editar o install.xml (ele só roda na 1ª instalação).
 * Faça a mudança nos dois lugares:
 *   1. install.xml (para quem instalar do zero);
 *   2. um bloco novo aqui (para quem já tem o plugin instalado).
 * O Editor XMLDB (Administração do site > Desenvolvimento > Editor XMLDB)
 * gera o código PHP do bloco para você no botão "Ver código PHP".
 * Depois, aumente $plugin->version no version.php.
 *
 * @package    local_numep
 * @copyright  2026 Fellipe Queiroz
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Executa as etapas de atualização.
 *
 * @param int $oldversion versão instalada antes
 * @return bool
 */
function xmldb_local_numep_upgrade($oldversion) {
    global $DB;
    $dbman = $DB->get_manager();

    // Exemplo (deixe comentado até precisar):
    // if ($oldversion < 2026102000) {
    //     $table = new xmldb_table('local_numep_evento');
    //     $field = new xmldb_field('link_ead', XMLDB_TYPE_CHAR, '255', null, null, null, null, 'local');
    //     if (!$dbman->field_exists($table, $field)) {
    //         $dbman->add_field($table, $field);
    //     }
    //     upgrade_plugin_savepoint(true, 2026102000, 'local', 'numep');
    // }

    if ($oldversion < 2026102300) {
        // Registro de atividades, usado pelas telas do Master (Dashboard, Perfil, Configurações).
        $table = new xmldb_table('local_numep_atividade');
        $table->add_field('id', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, XMLDB_SEQUENCE, null);
        $table->add_field('userid', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, null);
        $table->add_field('acao', XMLDB_TYPE_CHAR, '255', null, XMLDB_NOTNULL, null, null);
        $table->add_field('detalhe', XMLDB_TYPE_CHAR, '255', null, null, null, null);
        $table->add_field('timecreated', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');
        $table->add_key('primary', XMLDB_KEY_PRIMARY, ['id']);
        $table->add_key('userid', XMLDB_KEY_FOREIGN, ['userid'], 'user', ['id']);
        if (!$dbman->table_exists($table)) {
            $dbman->create_table($table);
        }
        upgrade_plugin_savepoint(true, 2026102300, 'local', 'numep');
    }

    return true;
}
