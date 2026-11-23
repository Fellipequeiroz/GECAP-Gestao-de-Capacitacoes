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

namespace local_numep\privacy;

use context;
use context_system;
use core_privacy\local\metadata\collection;
use core_privacy\local\request\approved_contextlist;
use core_privacy\local\request\approved_userlist;
use core_privacy\local\request\contextlist;
use core_privacy\local\request\transform;
use core_privacy\local\request\userlist;
use core_privacy\local\request\writer;

/**
 * API de privacidade do Moodle (LGPD / GDPR).
 *
 * 1. Declara quais dados pessoais o plugin guarda e por quê (aparece em
 *    Administração do site > Usuários > Privacidade e políticas > Registro de dados).
 * 2. Permite ao Moodle EXPORTAR e APAGAR esses dados quando o titular pedir,
 *    pela ferramenta de solicitações de dados (direitos do titular na LGPD).
 *
 * Todos os dados do NUMEP ficam no contexto do sistema (nível do site).
 *
 * @package    local_numep
 * @copyright  2026 Fellipe Queiroz
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class provider implements
        \core_privacy\local\metadata\provider,
        \core_privacy\local\request\core_userlist_provider,
        \core_privacy\local\request\plugin\provider {
    /**
     * Descreve os dados pessoais guardados pelo plugin.
     *
     * @param collection $collection
     * @return collection
     */
    public static function get_metadata(collection $collection): collection {
        $collection->add_database_table('local_numep_pessoa', [
            'userid' => 'privacy:metadata:pessoa:userid',
            'cpf' => 'privacy:metadata:pessoa:cpf',
            'data_nascimento' => 'privacy:metadata:pessoa:data_nascimento',
            'telefone' => 'privacy:metadata:pessoa:telefone',
            'formacao' => 'privacy:metadata:pessoa:formacao',
            'unidade_id' => 'privacy:metadata:pessoa:unidade_id',
        ], 'privacy:metadata:pessoa');

        $collection->add_database_table('local_numep_frequencia', [
            'userid' => 'privacy:metadata:frequencia:userid',
            'presente' => 'privacy:metadata:frequencia:presente',
            'confirmado_por_userid' => 'privacy:metadata:frequencia:confirmado_por_userid',
            'confirmado_em' => 'privacy:metadata:frequencia:confirmado_em',
        ], 'privacy:metadata:frequencia');

        $collection->add_database_table('local_numep_certificado', [
            'frequencia_id' => 'privacy:metadata:certificado:frequencia_id',
            'codigo_verificacao' => 'privacy:metadata:certificado:codigo_verificacao',
            'emitido_em' => 'privacy:metadata:certificado:emitido_em',
        ], 'privacy:metadata:certificado');

        $collection->add_database_table('local_numep_certificado_facilitador', [
            'nome_facilitador_snapshot' => 'privacy:metadata:certificado_facilitador:nome',
            'codigo_verificacao' => 'privacy:metadata:certificado:codigo_verificacao',
        ], 'privacy:metadata:certificado_facilitador');

        $collection->add_database_table('local_numep_avaliacao_evento', [
            'frequencia_id' => 'privacy:metadata:avaliacao:frequencia_id',
            'nota' => 'privacy:metadata:avaliacao:nota',
            'comentario' => 'privacy:metadata:avaliacao:comentario',
        ], 'privacy:metadata:avaliacao');

        $collection->add_database_table('local_numep_feedback_facilitador', [
            'facilitador_userid' => 'privacy:metadata:feedback:facilitador_userid',
            'comentario' => 'privacy:metadata:feedback:comentario',
        ], 'privacy:metadata:feedback');

        $collection->add_database_table('local_numep_evento', [
            'facilitador_userid' => 'privacy:metadata:evento:facilitador_userid',
            'facilitador_nome_externo' => 'privacy:metadata:evento:facilitador_nome_externo',
        ], 'privacy:metadata:evento');

        return $collection;
    }

    /**
     * Diz se o usuário tem algum dado no NUMEP.
     *
     * @param int $userid
     * @return bool
     */
    private static function tem_dados(int $userid): bool {
        global $DB;
        return $DB->record_exists('local_numep_pessoa', ['userid' => $userid])
            || $DB->record_exists('local_numep_frequencia', ['userid' => $userid])
            || $DB->record_exists('local_numep_evento', ['facilitador_userid' => $userid])
            || $DB->record_exists('local_numep_feedback_facilitador', ['facilitador_userid' => $userid]);
    }

    /**
     * Contextos em que o usuário tem dados (só o do sistema).
     *
     * @param int $userid
     * @return contextlist
     */
    public static function get_contexts_for_userid(int $userid): contextlist {
        $lista = new contextlist();
        if (self::tem_dados($userid)) {
            $lista->add_system_context();
        }
        return $lista;
    }

    /**
     * Usuários com dados no contexto informado.
     *
     * @param userlist $userlist
     */
    public static function get_users_in_context(userlist $userlist) {
        if ($userlist->get_context()->contextlevel != CONTEXT_SYSTEM) {
            return;
        }
        $userlist->add_from_sql('userid', 'SELECT userid FROM {local_numep_pessoa}', []);
        $userlist->add_from_sql('userid', 'SELECT userid FROM {local_numep_frequencia}', []);
        $userlist->add_from_sql('facilitador_userid',
            'SELECT facilitador_userid FROM {local_numep_evento} WHERE facilitador_userid IS NOT NULL', []);
        $userlist->add_from_sql('facilitador_userid',
            'SELECT facilitador_userid FROM {local_numep_feedback_facilitador} WHERE facilitador_userid IS NOT NULL', []);
    }

    /**
     * Exporta os dados do usuário (cadastro, participações, certificados e avaliações).
     *
     * @param approved_contextlist $contextlist
     */
    public static function export_user_data(approved_contextlist $contextlist) {
        global $DB;
        $contexto = context_system::instance();
        if (!in_array($contexto->id, $contextlist->get_contextids())) {
            return;
        }
        $userid = $contextlist->get_user()->id;
        $pasta = [get_string('pluginname', 'local_numep')];

        if ($p = $DB->get_record('local_numep_pessoa', ['userid' => $userid])) {
            writer::with_context($contexto)->export_data($pasta, (object) [
                'cpf' => $p->cpf,
                'data_nascimento' => $p->data_nascimento ? transform::date($p->data_nascimento) : null,
                'telefone' => $p->telefone,
                'formacao' => $p->formacao,
                'unidade' => $DB->get_field('local_numep_unidade', 'nome', ['id' => $p->unidade_id]),
            ]);
        }

        $sql = "SELECT f.id, c.titulo, e.data, e.carga_horaria, f.presente, f.confirmado_em,
                       cert.codigo_verificacao, a.nota, a.comentario
                  FROM {local_numep_frequencia} f
                  JOIN {local_numep_evento} e ON e.id = f.evento_id
                  JOIN {local_numep_capacitacao} c ON c.id = e.capacitacao_id
             LEFT JOIN {local_numep_certificado} cert ON cert.frequencia_id = f.id
             LEFT JOIN {local_numep_avaliacao_evento} a ON a.frequencia_id = f.id
                 WHERE f.userid = :userid
              ORDER BY e.data";
        $participacoes = [];
        foreach ($DB->get_records_sql($sql, ['userid' => $userid]) as $r) {
            $participacoes[] = (object) [
                'capacitacao' => $r->titulo,
                'data' => transform::datetime($r->data),
                'carga_horaria' => $r->carga_horaria,
                'presente' => transform::yesno($r->presente),
                'confirmado_em' => $r->confirmado_em ? transform::datetime($r->confirmado_em) : null,
                'certificado' => $r->codigo_verificacao,
                'nota' => $r->nota,
                'comentario' => $r->comentario,
            ];
        }
        if ($participacoes) {
            writer::with_context($contexto)->export_data(array_merge($pasta, ['participacoes']), (object) ['participacoes' => $participacoes]);
        }

        $facilitados = $DB->get_records_sql(
            "SELECT e.id, c.titulo, e.data FROM {local_numep_evento} e
               JOIN {local_numep_capacitacao} c ON c.id = e.capacitacao_id
              WHERE e.facilitador_userid = :userid", ['userid' => $userid]);
        if ($facilitados) {
            writer::with_context($contexto)->export_data(array_merge($pasta, ['eventos_facilitados']), (object) [
                'eventos' => array_values(array_map(fn($e) => (object) ['capacitacao' => $e->titulo, 'data' => transform::datetime($e->data)], $facilitados)),
            ]);
        }
    }

    /**
     * Apaga os dados de todos os usuários no contexto (só o do sistema).
     *
     * @param context $context
     */
    public static function delete_data_for_all_users_in_context(context $context) {
        global $DB;
        if ($context->contextlevel != CONTEXT_SYSTEM) {
            return;
        }
        $userids = array_unique(array_merge(
            $DB->get_fieldset_select('local_numep_pessoa', 'userid', '1 = 1'),
            $DB->get_fieldset_select('local_numep_frequencia', 'userid', '1 = 1'),
            $DB->get_fieldset_select('local_numep_evento', 'facilitador_userid', 'facilitador_userid IS NOT NULL'),
            $DB->get_fieldset_select('local_numep_feedback_facilitador', 'facilitador_userid', 'facilitador_userid IS NOT NULL')
        ));
        foreach ($userids as $userid) {
            self::apagar_usuario((int) $userid);
        }
    }

    /**
     * Apaga os dados de um usuário.
     *
     * @param approved_contextlist $contextlist
     */
    public static function delete_data_for_user(approved_contextlist $contextlist) {
        if (in_array(context_system::instance()->id, $contextlist->get_contextids())) {
            self::apagar_usuario($contextlist->get_user()->id);
        }
    }

    /**
     * Apaga os dados de vários usuários.
     *
     * @param approved_userlist $userlist
     */
    public static function delete_data_for_users(approved_userlist $userlist) {
        if ($userlist->get_context()->contextlevel != CONTEXT_SYSTEM) {
            return;
        }
        foreach ($userlist->get_userids() as $userid) {
            self::apagar_usuario((int) $userid);
        }
    }

    /**
     * Remove os dados pessoais de um usuário no NUMEP.
     *
     * Nos eventos em que ele foi facilitador, o evento continua existindo
     * (outras pessoas têm certificado dele), mas o nome é trocado por
     * "Facilitador removido" para manter a regra 2 (facilitador interno OU externo).
     *
     * @param int $userid
     */
    private static function apagar_usuario(int $userid): void {
        global $DB;
        $transacao = $DB->start_delegated_transaction();

        $freqids = $DB->get_fieldset_select('local_numep_frequencia', 'id', 'userid = ?', [$userid]);
        if ($freqids) {
            [$in, $params] = $DB->get_in_or_equal($freqids);
            $DB->delete_records_select('local_numep_avaliacao_evento', "frequencia_id $in", $params);
            $DB->delete_records_select('local_numep_certificado', "frequencia_id $in", $params);
            $DB->delete_records_select('local_numep_frequencia', "id $in", $params);
        }
        $DB->delete_records('local_numep_pessoa', ['userid' => $userid]);
        $DB->delete_records('local_numep_feedback_facilitador', ['facilitador_userid' => $userid]);

        $eventos = $DB->get_fieldset_select('local_numep_evento', 'id', 'facilitador_userid = ?', [$userid]);
        if ($eventos) {
            [$in, $params] = $DB->get_in_or_equal($eventos);
            $DB->delete_records_select('local_numep_certificado_facilitador', "evento_id $in", $params);
            $DB->set_field_select('local_numep_evento', 'facilitador_nome_externo',
                get_string('facilitadorremovido', 'local_numep'), "id $in", $params);
            $DB->set_field_select('local_numep_evento', 'facilitador_userid', null, "id $in", $params);
        }
        $transacao->allow_commit();
    }
}
