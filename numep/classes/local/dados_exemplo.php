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

namespace local_numep\local;

use local_numep\model\pessoa;
use local_numep\model\regras;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/user/lib.php');

/**
 * Dados de exemplo do NUMEP, para demonstração e testes (nomes, CPFs e e-mails fictícios):
 * 3 setores, 6 unidades, 6 cargos, 28 profissionais, 6 capacitações, 12 eventos,
 * presenças, certificados e avaliações.
 *
 * ATENÇÃO: apaga TODOS os dados das tabelas local_numep_* antes de gravar.
 * Os usuários de exemplo entram com o e-mail como login e a senha SENHA.
 *
 * @package    local_numep
 * @copyright  2026 Fellipe Queiroz
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class dados_exemplo {
    /** @var string Senha de todos os usuários de exemplo (só para testes locais). */
    const SENHA = 'Numep@2026';

    /** @var int Um dia em segundos. */
    const DIA = 86400;

    /** @var string[] Tabelas do plugin, na ordem em que podem ser esvaziadas. */
    const TABELAS = [
        'local_numep_atividade', 'local_numep_avaliacao_evento', 'local_numep_feedback_facilitador',
        'local_numep_certificado_facilitador', 'local_numep_certificado', 'local_numep_frequencia',
        'local_numep_evento_unidade', 'local_numep_evento', 'local_numep_capacitacao', 'local_numep_pessoa',
        'local_numep_cargo_tag', 'local_numep_unidade', 'local_numep_setor',
    ];

    /** @var string[] Nomes dos profissionais de exemplo. */
    const NOMES = [
        'Ana Paula Ferreira', 'Bruno Lima Santos', 'Carla Mendes Rocha', 'Daniel Oliveira Costa', 'Elaine Cristina Souza',
        'Fábio Henrique Alves', 'Gabriela Martins Silva', 'Helena Duarte Nunes', 'Igor Batista Ramos', 'Juliana Prado Lopes',
        'Karina Teixeira Melo', 'Lucas Andrade Pires', 'Mariana Bezerra Campos', 'Natália Gomes Vieira', 'Otávio Ribeiro Dias',
        'Patrícia Moura Cardoso', 'Rafael Siqueira Barros', 'Sabrina Castro Freitas', 'Tiago Cardoso Moreira', 'Vanessa Amorim Reis',
        'Wesley Fonseca Araújo', 'Yasmin Correia Pinto', 'Aline Rezende Borges', 'Caio Monteiro Lacerda', 'Débora Queiroz Machado',
        'Eduardo Nogueira Faria', 'Fernanda Lima Tavares', 'Gustavo Pereira Rangel',
    ];

    /** @var int Semente do sorteio: os dados saem sempre iguais. */
    private static int $semente = 20261020;

    /**
     * Número "aleatório" entre 0 e 1, sempre na mesma sequência (o mesmo gerador do front).
     *
     * @return float
     */
    private static function sortear(): float {
        self::$semente = (self::$semente * 1664525 + 1013904223) % 4294967296;
        return self::$semente / 4294967296;
    }

    /**
     * Escolhe um item da lista.
     *
     * @param array $lista
     * @return mixed
     */
    private static function escolher(array $lista) {
        return $lista[(int) floor(self::sortear() * count($lista))];
    }

    /**
     * CPF de exemplo com dígitos verificadores corretos.
     *
     * @param int $base9
     * @return string
     */
    private static function cpf(int $base9): string {
        $d = array_map('intval', str_split(str_pad((string) $base9, 9, '0', STR_PAD_LEFT)));
        for ($t = 9; $t < 11; $t++) {
            $soma = 0;
            for ($i = 0; $i < $t; $i++) {
                $soma += $d[$i] * ($t + 1 - $i);
            }
            $d[] = ((10 * $soma) % 11) % 10;
        }
        return implode('', $d);
    }

    /**
     * Apaga os dados do NUMEP e grava os de exemplo.
     *
     * @return string login (e-mail) do usuário Master de exemplo
     */
    public static function gravar(): string {
        global $DB, $CFG;
        self::$semente = 20261020;
        $agora = time();
        $fuso = \core_date::get_server_timezone_object();
        $transacao = $DB->start_delegated_transaction();

        foreach (self::TABELAS as $tabela) {
            $DB->delete_records($tabela);
        }
        $contexto = \context_system::instance();
        foreach (pessoa::PERFIS as $perfil) {
            $roleid = $DB->get_field('role', 'id', ['shortname' => 'numep_' . $perfil], MUST_EXIST);
            role_unassign_all(['roleid' => $roleid, 'contextid' => $contexto->id]);
        }

        $criado = $agora - 400 * self::DIA;
        $setores = [];
        foreach ([
            ['Gestão do SUAS', 'Secretaria e Vigilância Socioassistencial'],
            ['Proteção Social Básica', 'CRAS e serviços de convivência'],
            ['Proteção Social Especial', 'CREAS, Centro POP e acolhimento'],
        ] as [$nome, $descricao]) {
            $setores[] = $DB->insert_record('local_numep_setor', (object) [
                'nome' => $nome, 'descricao' => $descricao, 'timecreated' => $criado, 'timemodified' => $criado,
            ]);
        }
        [$gestao, $psb, $pse] = $setores;
        $unidades = [];
        foreach ([
            [$gestao, 'Secretaria Municipal de Assistência Social', 'Centro Administrativo'],
            [$psb, 'CRAS Centro', 'Rua Major Gote, 100'],
            [$psb, 'CRAS Norte', 'Av. Brasil, 2500'],
            [$psb, 'CRAS Sul', 'Rua Tiradentes, 840'],
            [$pse, 'CREAS', 'Rua Olegário Maciel, 55'],
            [$pse, 'Centro POP', 'Rua José de Santana, 300'],
        ] as [$setor, $nome, $endereco]) {
            $unidades[] = $DB->insert_record('local_numep_unidade', (object) [
                'setor_id' => $setor, 'nome' => $nome, 'endereco' => $endereco, 'timecreated' => $criado, 'timemodified' => $criado,
            ]);
        }
        $nomescargos = ['Assistente Social', 'Psicólogo(a)', 'Educador(a) Social', 'Pedagogo(a)', 'Assistente Administrativo',
            'Coordenador(a) de Unidade'];
        $cargos = [];
        foreach ($nomescargos as $nome) {
            $cargos[] = $DB->insert_record('local_numep_cargo_tag', (object) [
                'nome' => $nome, 'descricao' => '', 'timecreated' => $criado, 'timemodified' => $criado,
            ]);
        }

        // Profissionais: usuário do Moodle + local_numep_pessoa + papel.
        $pessoas = [];
        foreach (self::NOMES as $i => $nome) {
            $palavras = explode(' ', $nome);
            $ascii = fn($s) => \core_text::strtolower(\core_text::specialtoascii($s));
            $email = $ascii($palavras[0]) . '.' . $ascii(end($palavras)) . '@assistenciasocial.gov.br';
            $perfil = 'tecnico';
            $unidade = $unidades[1 + ($i % 5)];
            if ($i === 0 || $i === 19) {
                $perfil = 'master';
                $unidade = $unidades[0];
            } else if ($i === 1) {
                $perfil = 'diretor';
                $unidade = $unidades[0];
            } else if ($i >= 2 && $i <= 6) {
                $perfil = 'coordenador';
            }
            $cargo = $perfil === 'coordenador' ? 5 : ($perfil === 'tecnico' ? $i % 5 : 4);
            $ativo = $i !== 25;
            $telefone = '(34) 9' . substr((string) (88000000 + $i * 12345), 0, 4) . '-' . substr((string) (1000 + $i * 37), 0, 4);

            $usuario = (object) [
                'firstname' => $palavras[0], 'lastname' => implode(' ', array_slice($palavras, 1)), 'email' => $email,
                'phone1' => $telefone, 'suspended' => $ativo ? 0 : 1, 'password' => self::SENHA,
            ];
            $existente = $DB->get_record('user', ['username' => $email, 'mnethostid' => $CFG->mnet_localhost_id, 'deleted' => 0]);
            if ($existente) {
                $usuario->id = $existente->id;
                user_update_user($usuario, true, false);
                $userid = (int) $existente->id;
            } else {
                $usuario->username = $email;
                $usuario->auth = 'manual';
                $usuario->confirmed = 1;
                $usuario->mnethostid = $CFG->mnet_localhost_id;
                $usuario->lang = 'pt_br';
                $userid = user_create_user($usuario, true, false);
            }
            $nascimento = mktime(12, 0, 0, 1 + ($i % 12), 1 + ($i * 3) % 28, 1970 + ($i * 7) % 30);
            $quando = $agora - (300 - $i * 9) * self::DIA;
            $DB->insert_record('local_numep_pessoa', (object) [
                'userid' => $userid, 'cpf' => self::cpf(100000000 + $i * 3141593), 'data_nascimento' => $nascimento,
                'telefone' => $telefone, 'formacao' => in_array($cargo, [2, 4], true) ? 'tecnico_medio' : 'tecnico_superior',
                'unidade_id' => $unidade, 'cargo_tag_id' => $cargos[$cargo], 'timecreated' => $quando, 'timemodified' => $quando,
            ]);
            pessoa::definir_perfil($userid, $perfil);
            $pessoas[] = (object) ['id' => $userid, 'nome' => $nome, 'unidade' => $unidade, 'ativo' => $ativo];
        }
        $master = $pessoas[0];

        $capacitacoes = [];
        foreach ([
            ['Acolhimento no SUAS', 'Escuta qualificada e primeiro atendimento das famílias nos serviços socioassistenciais.'],
            ['Vigilância Socioassistencial', 'Uso de dados do território para planejar a oferta de serviços.'],
            ['PAIF na prática', 'Acompanhamento familiar no Serviço de Proteção e Atendimento Integral à Família.'],
            ['Prontuário SUAS', 'Registro padronizado dos atendimentos e acompanhamentos.'],
            ['Atendimento à população em situação de rua', 'Abordagem social e articulação da rede.'],
            ['Violência contra a pessoa idosa', 'Identificação, notificação e encaminhamentos.'],
        ] as [$titulo, $descricao]) {
            $quando = $agora - 200 * self::DIA;
            $capacitacoes[] = (object) ['titulo' => $titulo, 'id' => $DB->insert_record('local_numep_capacitacao', (object) [
                'titulo' => $titulo, 'descricao' => $descricao, 'timecreated' => $quando, 'timemodified' => $quando,
            ])];
        }

        $locais = ['Auditório da Secretaria', 'Sala de reuniões do CRAS Centro', 'Auditório da UNIPAM', 'Plataforma on-line'];
        $externos = ['Profa. Dra. Márcia Oliveira', 'Dr. Roberto Antunes', 'Equipe do NUMEP Regional'];
        $comentarios = ['Conteúdo muito útil para o dia a dia.', 'Gostaria de mais exemplos práticos.', 'Ótima facilitação.', '',
            'Carga horária poderia ser maior.', ''];
        // [dias a partir de hoje, capacitação, horas, unidades-alvo (índices), encerrado?]
        $plano = [
            [-170, 0, 8, [1, 2, 3], true], [-150, 1, 4, [0, 1, 4], true], [-128, 2, 12, [1, 2, 3], true],
            [-105, 3, 6, [1, 2, 3, 4, 5], true], [-84, 4, 8, [4, 5], true], [-62, 5, 4, [1, 4], true],
            [-41, 0, 8, [2, 3], true], [-24, 2, 6, [1, 2], true], [-9, 3, 4, [1, 2, 3, 4, 5], false],
            [-3, 1, 8, [0, 4, 5], false], [6, 4, 6, [4, 5], false], [18, 5, 8, [1, 2, 3], false],
        ];
        foreach ($plano as [$dias, $ci, $horas, $alvo, $encerrado]) {
            $data = (new \DateTime('@' . ($agora + $dias * self::DIA)))->setTimezone($fuso)->setTime($dias % 2 ? 14 : 8, 0)->getTimestamp();
            $facilitador = self::sortear() < 0.5 ? self::escolher(array_slice($pessoas, 2, 5)) : null;
            $alvos = array_map(fn($u) => $unidades[$u], $alvo);
            $cap = $capacitacoes[$ci];
            $quando = $data - 30 * self::DIA;
            $evento = (object) [
                'capacitacao_id' => $cap->id, 'local' => self::escolher($locais), 'data' => $data, 'carga_horaria' => $horas,
                'modalidade' => 'presencial',
                'publico_alvo' => count($alvo) === 6 ? 'rede_geral' : (count($alvo) > 2 ? 'setor' : 'unidade'),
                'facilitador_userid' => $facilitador ? $facilitador->id : null,
                'facilitador_nome_externo' => $facilitador ? null : self::escolher($externos),
                'encerrado' => $encerrado ? 1 : 0, 'timecreated' => $quando, 'timemodified' => $quando,
            ];
            $evento->id = $DB->insert_record('local_numep_evento', $evento);
            foreach ($alvos as $u) {
                $DB->insert_record('local_numep_evento_unidade', (object) ['evento_id' => $evento->id, 'unidade_id' => $u]);
            }
            foreach ($pessoas as $p) {
                if (!$p->ativo || !in_array($p->unidade, $alvos, true) || ($facilitador && $p->id === $facilitador->id)) {
                    continue;
                }
                $presente = $dias < 0 && ($encerrado ? self::sortear() < 0.82 : self::sortear() < 0.35);
                $confirmado = $data + self::DIA;
                $fid = $DB->insert_record('local_numep_frequencia', (object) [
                    'evento_id' => $evento->id, 'userid' => $p->id, 'presente' => $presente ? 1 : 0,
                    'confirmado_por_userid' => $presente ? $master->id : null, 'confirmado_em' => $presente ? $confirmado : null,
                    'timecreated' => $quando, 'timemodified' => $quando,
                ]);
                if (!$presente) {
                    continue;
                }
                $DB->insert_record('local_numep_certificado', (object) [
                    'frequencia_id' => $fid, 'titulo_evento_snapshot' => $cap->titulo, 'carga_horaria_snapshot' => $horas,
                    'data_evento_snapshot' => $data, 'codigo_verificacao' => regras::gerar_codigo_verificacao(),
                    'emitido_em' => $confirmado,
                ]);
                if (self::sortear() < 0.65) {
                    $DB->insert_record('local_numep_avaliacao_evento', (object) [
                        'frequencia_id' => $fid,
                        'nota' => max(1, min(5, (int) round(3.4 + self::sortear() * 2 - ($ci === 3 ? 0.8 : 0)))),
                        'comentario' => self::escolher($comentarios), 'timecreated' => $data + 2 * self::DIA,
                    ]);
                }
            }
            if ($encerrado) {
                $DB->insert_record('local_numep_certificado_facilitador', (object) [
                    'evento_id' => $evento->id,
                    'nome_facilitador_snapshot' => $facilitador ? $facilitador->nome : $evento->facilitador_nome_externo,
                    'titulo_evento_snapshot' => $cap->titulo, 'codigo_verificacao' => regras::gerar_codigo_verificacao(),
                    'emitido_em' => $data + 2 * self::DIA,
                ]);
            }
        }

        foreach ([
            ['Encerrou o evento', $capacitacoes[2]->titulo, 22],
            ['Cadastrou o profissional', $pessoas[27]->nome, 5],
            ['Criou o evento', $capacitacoes[5]->titulo, 2],
        ] as [$acao, $detalhe, $dias]) {
            $DB->insert_record('local_numep_atividade', (object) [
                'userid' => $master->id, 'acao' => $acao, 'detalhe' => $detalhe, 'timecreated' => $agora - $dias * self::DIA,
            ]);
        }

        set_config('nome_orgao', 'Secretaria Municipal de Assistência Social de Patos de Minas', 'local_numep');
        set_config('email', 'numep@assistenciasocial.gov.br', 'local_numep');
        set_config('endereco', 'Patos de Minas - MG', 'local_numep');
        $transacao->allow_commit();
        return $DB->get_field('user', 'username', ['id' => $master->id]);
    }
}
