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
 * Model de CERTIFICADO (participante e facilitador): consulta pública pelo código.
 *
 * Devolve só o necessário para conferir a autenticidade; o CPF sai mascarado.
 *
 * @package    local_numep
 * @copyright  2026 Fellipe Queiroz
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class certificado {
    /**
     * Procura um certificado pelo código de verificação.
     *
     * @param string $codigo
     * @return \stdClass|null nome, cpf_oculto, titulo, carga_horaria, data, emitido_em, papel, codigo
     */
    public static function buscar_por_codigo(string $codigo): ?\stdClass {
        global $DB;
        $codigo = strtoupper(preg_replace('/[^A-Za-z0-9-]/', '', $codigo));
        if ($codigo === '' || strlen($codigo) > 32) {
            return null;
        }
        $sql = "SELECT c.*, f.userid, p.cpf
                  FROM {local_numep_certificado} c
                  JOIN {local_numep_frequencia} f ON f.id = c.frequencia_id
             LEFT JOIN {local_numep_pessoa} p ON p.userid = f.userid
                 WHERE c.codigo_verificacao = ?";
        if ($c = $DB->get_record_sql($sql, [$codigo])) {
            return (object) [
                'codigo' => $c->codigo_verificacao,
                'papel' => 'participante',
                'nome' => fullname(\core_user::get_user($c->userid)),
                'cpf_oculto' => regras::ocultar_cpf($c->cpf),
                'titulo' => $c->titulo_evento_snapshot,
                'carga_horaria' => (int) $c->carga_horaria_snapshot,
                'data' => (int) $c->data_evento_snapshot,
                'emitido_em' => (int) $c->emitido_em,
            ];
        }
        $sql = "SELECT cf.*, e.carga_horaria, e.data
                  FROM {local_numep_certificado_facilitador} cf
                  JOIN {local_numep_evento} e ON e.id = cf.evento_id
                 WHERE cf.codigo_verificacao = ?";
        if ($c = $DB->get_record_sql($sql, [$codigo])) {
            return (object) [
                'codigo' => $c->codigo_verificacao,
                'papel' => 'facilitador',
                'nome' => $c->nome_facilitador_snapshot,
                'cpf_oculto' => '',
                'titulo' => $c->titulo_evento_snapshot,
                'carga_horaria' => (int) $c->carga_horaria,
                'data' => (int) $c->data,
                'emitido_em' => (int) $c->emitido_em,
            ];
        }
        return null;
    }
}
