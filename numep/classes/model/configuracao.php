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

/**
 * Model das configurações do sistema (tela Configurações) e da troca de senha.
 *
 * As configurações ficam na tabela de configurações de plugin do Moodle
 * (mdl_config_plugins, plugin = local_numep), sem tabela própria.
 *
 * @package    local_numep
 * @copyright  2026 Fellipe Queiroz
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class configuracao {
    /** @var array Valores iniciais de cada configuração. */
    const PADRAO = [
        'nome_orgao' => 'Secretaria Municipal de Assistência Social',
        'email' => '',
        'endereco' => '',
        'idioma' => 'pt_br',
        'notificacoes' => ['emails' => true, 'push' => true, 'boletim' => false],
        'silencio' => ['inicio' => '22:00', 'fim' => '07:00'],
        'dois_fatores' => false,
        // Modelo do certificado (o Master edita em Certificados > Editar modelo). Marcadores:
        // {nome}, {evento}, {data} (dd/mm/aaaa) e {carga_horaria} ("6 (seis) horas").
        'certificado' => [
            'abertura' => 'O Núcleo Municipal de Educação Permanente do SUAS - NUMEP/SUAS certifica que',
            'participante' => 'participou do {evento}, no dia {data}, perfazendo uma carga horária de {carga_horaria}.',
            'facilitador' => 'atuou como facilitador(a) do {evento}, no dia {data}, perfazendo uma carga horária de {carga_horaria}.',
            'cidade' => 'Patos de Minas',
        ],
    ];

    /** @var string[] Preferências de cada usuário (ficam em mdl_user_preferences, não valem para o sistema todo). */
    const PESSOAIS = ['idioma', 'notificacoes', 'silencio', 'dois_fatores'];

    /**
     * Modelo do certificado (textos e cidade), com os padrões para o que não foi editado.
     * Não depende do usuário logado: a página pública de verificação também usa.
     *
     * @return array
     */
    public static function modelo_certificado(): array {
        $salvo = get_config('local_numep', 'certificado');
        return array_merge(self::PADRAO['certificado'], $salvo ? (json_decode($salvo, true) ?: []) : []);
    }

    /**
     * Configurações do sistema + preferências do usuário logado + quando ele trocou a senha.
     *
     * @return array
     */
    public static function obter(): array {
        global $USER;
        $config = [];
        foreach (self::PADRAO as $campo => $padrao) {
            $valor = get_config('local_numep', $campo);
            if (in_array($campo, self::PESSOAIS, true)) {
                // Preferência pessoal; quem ainda não escolheu herda o valor do sistema (ou o padrão).
                $valor = get_user_preferences('local_numep_' . $campo, $valor === false ? null : $valor) ?? false;
            }
            if ($valor === false) {
                $config[$campo] = $padrao;
            } else {
                // Listas: o que foi salvo por cima dos padrões (campos novos ganham o valor padrão).
                $config[$campo] = is_array($padrao) ? array_merge($padrao, json_decode($valor, true) ?: []) : $valor;
            }
        }
        $config['dois_fatores'] = (bool) $config['dois_fatores'];
        $config['senha_alterada_em'] = (int) get_user_preferences('local_numep_senha_alterada_em', $USER->timecreated ?? time());
        return $config;
    }

    /**
     * Grava as configurações do sistema (dados do órgão e modelo do certificado). Só o Master.
     *
     * @param \stdClass $d
     */
    public static function salvar(\stdClass $d): void {
        $nome = trim((string) ($d->nome_orgao ?? ''));
        if ($nome === '' || \core_text::strlen($nome) > 255) {
            throw new moodle_exception('erro_regra', 'local_numep', '', 'Informe o nome do órgão (até 255 caracteres).');
        }
        foreach (self::PADRAO as $campo => $padrao) {
            if (property_exists($d, $campo) && !in_array($campo, self::PESSOAIS, true)) {
                set_config($campo, self::normalizar($campo, $d->$campo), 'local_numep');
            }
        }
        atividade::registrar('Alterou as configurações do sistema', '');
    }

    /**
     * Grava as preferências do usuário logado (idioma, notificações, silêncio, verificação em duas etapas).
     * Qualquer perfil pode: cada um mexe só nas suas.
     *
     * @param \stdClass $d
     */
    public static function salvar_preferencias(\stdClass $d): void {
        if (isset($d->silencio)) {
            foreach (['inicio', 'fim'] as $hora) {
                if (!preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', (string) ($d->silencio->$hora ?? ''))) {
                    throw new moodle_exception('erro_regra', 'local_numep', '', 'Horário de silêncio inválido.');
                }
            }
        }
        foreach (self::PESSOAIS as $campo) {
            if (property_exists($d, $campo)) {
                set_user_preference('local_numep_' . $campo, self::normalizar($campo, $d->$campo));
            }
        }
        atividade::registrar('Alterou as próprias preferências', '');
    }

    /**
     * Ajusta o valor de um campo para gravar: listas em JSON (só as chaves conhecidas),
     * sim/não em 0/1 e textos limitados.
     *
     * @param string $campo
     * @param mixed $valor
     * @return string|int
     */
    private static function normalizar(string $campo, $valor) {
        $padrao = self::PADRAO[$campo];
        if (is_bool($padrao)) {
            return $valor ? 1 : 0;
        }
        if (!is_array($padrao)) {
            return \core_text::substr(trim((string) $valor), 0, 255);
        }
        $valor = array_intersect_key((array) $valor, $padrao);
        if ($campo === 'certificado') {
            // Textos do certificado: obrigatórios e com tamanho limitado.
            foreach ($valor as $chave => $texto) {
                $texto = trim((string) $texto);
                if ($texto === '' || \core_text::strlen($texto) > 600) {
                    throw new moodle_exception('erro_regra', 'local_numep', '',
                        'Preencha todos os textos do certificado (até 600 caracteres cada).');
                }
                $valor[$chave] = $texto;
            }
        } else {
            // Notificações (sim/não) e horários: só os tipos esperados.
            $valor = array_map(fn($v) => is_bool($v) || is_int($v) ? (bool) $v : \core_text::substr((string) $v, 0, 5), $valor);
        }
        return json_encode($valor, JSON_UNESCAPED_UNICODE);
    }

    /**
     * Troca a senha do usuário logado (conferindo a atual), pela autenticação do Moodle.
     *
     * @param string $atual
     * @param string $nova
     */
    public static function alterar_senha(string $atual, string $nova): void {
        global $USER;
        $usuario = \core_user::get_user($USER->id, '*', MUST_EXIST);
        if (!validate_internal_user_password($usuario, $atual)) {
            throw new moodle_exception('erro_regra', 'local_numep', '', 'A senha atual não confere.');
        }
        $erros = '';
        if (!check_password_policy($nova, $erros, $usuario)) {
            throw new moodle_exception('erro_regra', 'local_numep', '', trim(strip_tags($erros)));
        }
        update_internal_user_password($usuario, $nova);
        set_user_preference('local_numep_senha_alterada_em', time());
        atividade::registrar('Alterou a própria senha', '');
    }
}
