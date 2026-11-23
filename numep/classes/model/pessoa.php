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

use moodle_exception;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/user/lib.php');

/**
 * Model de PESSOA: o profissional é um usuário do Moodle (nome, e-mail, senha,
 * ativo) + um registro em local_numep_pessoa (CPF, lotação, cargo...) + um papel
 * numep_* (o perfil de acesso).
 *
 * @package    local_numep
 * @copyright  2026 Fellipe Queiroz
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class pessoa {
    /** @var string Tabela no banco. */
    const TABELA = 'local_numep_pessoa';

    /** @var string[] Perfis de acesso; cada um é o papel numep_<perfil>. */
    const PERFIS = ['master', 'diretor', 'coordenador', 'tecnico'];

    /**
     * Perfil de cada usuário, pelo papel numep_* atribuído no nível do site.
     *
     * @return string[] userid => perfil
     */
    public static function perfis(): array {
        global $DB;
        $sql = "SELECT ra.userid, r.shortname
                  FROM {role_assignments} ra
                  JOIN {role} r ON r.id = ra.roleid
                 WHERE ra.contextid = ? AND r.shortname LIKE 'numep\\_%'
              ORDER BY r.id DESC";
        $perfis = [];
        foreach ($DB->get_recordset_sql($sql, [\context_system::instance()->id]) as $ra) {
            // Se houver mais de um papel, vale o de maior poder (master foi criado primeiro).
            $perfis[$ra->userid] = substr($ra->shortname, strlen('numep_'));
        }
        return $perfis;
    }

    /**
     * Perfil de acesso de um usuário (master, diretor, coordenador, tecnico) ou null se não for do NUMEP.
     *
     * @param int $userid
     * @return string|null
     */
    public static function perfil_de(int $userid): ?string {
        return self::perfis()[$userid] ?? null;
    }

    /**
     * Unidade de lotação de um usuário (0 se não for do NUMEP).
     *
     * @param int $userid
     * @return int
     */
    public static function unidade_de(int $userid): int {
        global $DB;
        return (int) $DB->get_field(self::TABELA, 'unidade_id', ['userid' => $userid]);
    }

    /**
     * Unidades do setor (diretoria) em que o usuário está lotado.
     *
     * @param int $userid
     * @return int[]
     */
    public static function unidades_do_setor_de(int $userid): array {
        global $DB;
        $setor = $DB->get_field('local_numep_unidade', 'setor_id', ['id' => self::unidade_de($userid)]);
        return $setor ? array_map('intval', $DB->get_fieldset_select('local_numep_unidade', 'id', 'setor_id = ?', [$setor])) : [];
    }

    /**
     * Trava de escopo: o coordenador só age sobre pessoas da própria unidade e o diretor
     * sobre pessoas das unidades do seu setor (diretoria). O Master não tem trava.
     *
     * @param int[] $userids pessoas afetadas pela ação
     */
    public static function exigir_mesma_unidade(array $userids): void {
        global $USER;
        $perfil = self::perfil_de((int) $USER->id);
        if ($perfil === 'coordenador') {
            $permitidas = [self::unidade_de((int) $USER->id)];
            $mensagem = 'Como coordenador, você só pode agir sobre profissionais da sua unidade.';
        } else if ($perfil === 'diretor') {
            $permitidas = self::unidades_do_setor_de((int) $USER->id);
            $mensagem = 'Como diretor, você só pode agir sobre profissionais das unidades da sua diretoria.';
        } else {
            return;
        }
        foreach (array_unique($userids) as $userid) {
            if (!in_array(self::unidade_de((int) $userid), $permitidas, true)) {
                throw new moodle_exception('erro_regra', 'local_numep', '', $mensagem);
            }
        }
    }

    /**
     * Troca o perfil de acesso: tira os papéis numep_* e atribui o novo.
     *
     * @param int $userid
     * @param string $perfil
     */
    public static function definir_perfil(int $userid, string $perfil): void {
        global $DB;
        $contexto = \context_system::instance();
        foreach (self::PERFIS as $p) {
            $roleid = $DB->get_field('role', 'id', ['shortname' => 'numep_' . $p], MUST_EXIST);
            if ($p === $perfil) {
                role_assign($roleid, $userid, $contexto->id);
            } else {
                role_unassign($roleid, $userid, $contexto->id);
            }
        }
    }

    /**
     * Cria ou edita um profissional.
     *
     * @param \stdClass $d id (userid, vazio para novo), nome, email, cpf, data_nascimento (timestamp),
     *                     telefone, formacao, perfil, unidade_id, cargo_tag_id, ativo
     * @return int userid
     */
    public static function salvar(\stdClass $d): int {
        global $DB, $USER, $CFG;
        $contexto = \context_system::instance();
        $id = (int) ($d->id ?? 0);
        $proprio = $id && $id === (int) $USER->id;
        if (!$proprio) {
            require_capability('local/numep:gerenciarestrutura', $contexto);
        }

        $nome = trim(preg_replace('/\s+/', ' ', (string) ($d->nome ?? '')));
        $partes = explode(' ', $nome, 2);
        if (count($partes) < 2 || \core_text::strlen($nome) > 200) {
            throw new moodle_exception('erro_regra', 'local_numep', '', 'Informe o nome completo (até 200 caracteres).');
        }
        $email = trim((string) ($d->email ?? ''));
        if (!validate_email($email) || \core_text::strlen($email) > 100) {
            throw new moodle_exception('erro_regra', 'local_numep', '', 'E-mail inválido.');
        }
        regras::validar_formacao((string) ($d->formacao ?? ''));
        if (!in_array($d->perfil ?? '', self::PERFIS, true)) {
            throw new moodle_exception('erro_regra', 'local_numep', '', 'Escolha o perfil de acesso.');
        }
        $cpf = regras::normalizar_cpf((string) ($d->cpf ?? ''));
        $unidade = (int) ($d->unidade_id ?? 0);
        if (!$DB->record_exists('local_numep_unidade', ['id' => $unidade])) {
            throw new moodle_exception('erro_regra', 'local_numep', '', 'Escolha a unidade.');
        }
        $cargo = empty($d->cargo_tag_id) ? null : (int) $d->cargo_tag_id;
        if ($cargo && !$DB->record_exists('local_numep_cargo_tag', ['id' => $cargo])) {
            throw new moodle_exception('erro_regra', 'local_numep', '', 'Cargo não encontrado.');
        }
        $ativo = !isset($d->ativo) || (bool) $d->ativo;
        if ($DB->record_exists_select(self::TABELA, 'cpf = ? AND userid <> ?', [$cpf, $id])) {
            throw new moodle_exception('erro_regra', 'local_numep', '', 'Já existe um profissional com este CPF.');
        }
        if ($DB->record_exists_select('user', 'LOWER(email) = LOWER(?) AND id <> ? AND deleted = 0', [$email, $id])) {
            throw new moodle_exception('erro_regra', 'local_numep', '', 'Já existe um profissional com este e-mail.');
        }

        $atual = $id ? $DB->get_record(self::TABELA, ['userid' => $id]) : null;
        if ($proprio) {
            // Ninguém muda o próprio perfil, lotação ou situação (evita se promover ou se trancar fora).
            $perfilatual = self::perfis()[$id] ?? null;
            if (!$atual || $d->perfil !== $perfilatual || $unidade !== (int) $atual->unidade_id || !$ativo) {
                throw new moodle_exception('erro_regra', 'local_numep', '',
                    'Perfil de acesso, unidade e situação do próprio cadastro só podem ser alterados por outro administrador.');
            }
        }

        $transacao = $DB->start_delegated_transaction();
        $usuario = (object) [
            'firstname' => $partes[0], 'lastname' => $partes[1], 'email' => $email,
            'phone1' => \core_text::substr((string) ($d->telefone ?? ''), 0, 20), 'suspended' => $ativo ? 0 : 1,
        ];
        if ($id) {
            $usuario->id = $id;
            user_update_user($usuario, false, false);
        } else {
            $usuario->username = \core_text::strtolower($email);
            if ($DB->record_exists('user', ['username' => $usuario->username, 'mnethostid' => $CFG->mnet_localhost_id])) {
                throw new moodle_exception('erro_regra', 'local_numep', '', 'Já existe um usuário do Moodle com este e-mail.');
            }
            $usuario->auth = 'manual';
            $usuario->confirmed = 1;
            $usuario->mnethostid = $CFG->mnet_localhost_id;
            $usuario->lang = 'pt_br';
            $usuario->password = generate_password(12);
            $id = user_create_user($usuario, true, false);
            // Senha provisória: a pessoa define a sua no primeiro acesso ("Esqueceu a senha?").
            set_user_preference('auth_forcepasswordchange', 1, $id);
        }

        $agora = time();
        $registro = (object) [
            'userid' => $id, 'cpf' => $cpf, 'formacao' => $d->formacao, 'unidade_id' => $unidade, 'cargo_tag_id' => $cargo,
            'data_nascimento' => empty($d->data_nascimento) ? null : (int) $d->data_nascimento,
            'telefone' => $usuario->phone1, 'timemodified' => $agora,
        ];
        if ($atual) {
            $registro->id = $atual->id;
            $DB->update_record(self::TABELA, $registro);
        } else {
            $registro->timecreated = $agora;
            $DB->insert_record(self::TABELA, $registro);
        }
        if (!$proprio) {
            self::definir_perfil($id, $d->perfil);
        }
        atividade::registrar($atual ? 'Editou o profissional' : 'Cadastrou o profissional', $nome);
        $transacao->allow_commit();
        return $id;
    }

    /**
     * Ativa ou desativa o acesso (campo suspended do Moodle).
     *
     * @param int $userid
     * @return bool se ficou ativo
     */
    public static function alternar_ativo(int $userid): bool {
        global $DB, $USER;
        if ($userid === (int) $USER->id) {
            throw new moodle_exception('erro_regra', 'local_numep', '', 'Você não pode desativar o próprio acesso.');
        }
        $DB->get_record(self::TABELA, ['userid' => $userid], 'id', MUST_EXIST);
        $usuario = \core_user::get_user($userid, '*', MUST_EXIST);
        $ativo = (bool) $usuario->suspended;
        user_update_user((object) ['id' => $userid, 'suspended' => $ativo ? 0 : 1], false, false);
        if (!$ativo) {
            \core\session\manager::destroy_user_sessions($userid);
        }
        atividade::registrar($ativo ? 'Reativou o acesso de' : 'Desativou o acesso de', fullname($usuario));
        return $ativo;
    }
}
