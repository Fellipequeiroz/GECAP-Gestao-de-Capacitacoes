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

namespace local_numep\model;

/**
 * Model do registro de atividades (quem fez o quê e quando), mostrado no
 * Dashboard, no Perfil e em Configurações > Registro de atividades.
 *
 * @package    local_numep
 * @copyright  2026 Fellipe Queiroz
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class atividade {
    /** @var string Tabela no banco. */
    const TABELA = 'local_numep_atividade';

    /** @var int Quantos registros são guardados (os mais antigos são apagados). */
    const LIMITE = 500;

    /**
     * Registra uma ação do usuário logado.
     *
     * @param string $acao ex.: "Criou o evento"
     * @param string|null $detalhe ex.: título do evento
     */
    public static function registrar(string $acao, ?string $detalhe = ''): void {
        global $DB, $USER;
        $DB->insert_record(self::TABELA, (object) [
            'userid' => $USER->id,
            'acao' => \core_text::substr($acao, 0, 255),
            'detalhe' => \core_text::substr((string) $detalhe, 0, 255),
            'timecreated' => time(),
        ]);
        // O primeiro registro além do limite marca o corte.
        $corte = $DB->get_records_sql('SELECT id FROM {' . self::TABELA . '} ORDER BY id DESC', [], self::LIMITE, 1);
        if ($corte) {
            $DB->delete_records_select(self::TABELA, 'id <= ?', [key($corte)]);
        }
    }

    /**
     * Lista as atividades, da mais recente para a mais antiga.
     *
     * @param int $limite
     * @return \stdClass[]
     */
    public static function listar(int $limite = 200): array {
        global $DB;
        return array_values($DB->get_records(self::TABELA, null, 'id DESC', '*', 0, $limite));
    }
}
