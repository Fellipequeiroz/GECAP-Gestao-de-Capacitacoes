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
 * Regras de negócio que o banco do Moodle não consegue garantir sozinho.
 *
 * O XMLDB não tem ENUM nem CHECK constraint (para funcionar igual em
 * MySQL, PostgreSQL e SQL Server). Por isso essas regras de
 * regras_negocio_numep.md são validadas aqui, antes de gravar no banco.
 * Toda função que grava evento, pessoa ou avaliação deve chamar estes métodos.
 *
 * Faz parte da camada Model (MVC). Uso: \local_numep\model\regras::validar_evento($evento);
 *
 * @package    local_numep
 * @copyright  2026 Fellipe Queiroz
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class regras {
    /** @var string[] Valores aceitos em pessoa.formacao (regra 7). */
    const FORMACOES = ['tecnico_medio', 'tecnico_superior'];

    /** @var string[] Valores aceitos em evento.modalidade. */
    const MODALIDADES = ['presencial', 'ead'];

    /** @var string[] Valores aceitos em evento.publico_alvo (regra 6). */
    const PUBLICOS_ALVO = ['rede_geral', 'setor', 'unidade'];

    /** @var string[] Campos do evento bloqueados após emitir certificado (regra 6.1). */
    const CAMPOS_CRITICOS = ['carga_horaria', 'data', 'capacitacao_id'];

    /**
     * Regra 2: exatamente um facilitador (interno XOR externo).
     *
     * @param \stdClass $evento
     * @throws moodle_exception
     */
    public static function validar_facilitador(\stdClass $evento): void {
        $interno = !empty($evento->facilitador_userid);
        $externo = isset($evento->facilitador_nome_externo) && trim($evento->facilitador_nome_externo) !== '';
        if ($interno === $externo) {
            throw new moodle_exception('erro_facilitador_xor', 'local_numep');
        }
    }

    /**
     * Valida os campos "ENUM" e o facilitador de um evento.
     *
     * @param \stdClass $evento
     * @throws moodle_exception
     */
    public static function validar_evento(\stdClass $evento): void {
        if (!in_array($evento->modalidade ?? 'presencial', self::MODALIDADES, true)) {
            throw new moodle_exception('erro_modalidade', 'local_numep');
        }
        if (!in_array($evento->publico_alvo ?? 'rede_geral', self::PUBLICOS_ALVO, true)) {
            throw new moodle_exception('erro_publico_alvo', 'local_numep');
        }
        self::validar_facilitador($evento);
    }

    /**
     * Diz se o evento já tem algum certificado emitido (participante ou facilitador).
     *
     * @param int $eventoid
     * @return bool
     */
    public static function evento_tem_certificado(int $eventoid): bool {
        global $DB;
        if ($DB->record_exists('local_numep_certificado_facilitador', ['evento_id' => $eventoid])) {
            return true;
        }
        $sql = "SELECT 1
                  FROM {local_numep_certificado} c
                  JOIN {local_numep_frequencia} f ON f.id = c.frequencia_id
                 WHERE f.evento_id = :eventoid";
        return $DB->record_exists_sql($sql, ['eventoid' => $eventoid]);
    }

    /**
     * Regra 6.1: bloqueia a edição de campos críticos se já houver certificado.
     *
     * @param \stdClass $antigo evento como está no banco
     * @param \stdClass $novo evento com as alterações pedidas
     * @throws moodle_exception
     */
    public static function validar_edicao_evento(\stdClass $antigo, \stdClass $novo): void {
        self::validar_evento($novo);
        if (!self::evento_tem_certificado((int) $antigo->id)) {
            return;
        }
        foreach (self::CAMPOS_CRITICOS as $campo) {
            if (property_exists($novo, $campo) && (string) $novo->$campo !== (string) $antigo->$campo) {
                throw new moodle_exception('erro_evento_bloqueado', 'local_numep');
            }
        }
    }

    /**
     * Regra 7: formação dentro do ENUM.
     *
     * @param string $formacao
     * @throws moodle_exception
     */
    public static function validar_formacao(string $formacao): void {
        if (!in_array($formacao, self::FORMACOES, true)) {
            throw new moodle_exception('erro_formacao', 'local_numep');
        }
    }

    /**
     * Regra 9: nota de 1 a 5.
     *
     * @param int $nota
     * @throws moodle_exception
     */
    public static function validar_nota(int $nota): void {
        if ($nota < 1 || $nota > 5) {
            throw new moodle_exception('erro_avaliacao_nota', 'local_numep');
        }
    }

    /**
     * Limpa e valida um CPF (dígitos verificadores). Devolve só os 11 dígitos.
     *
     * @param string $cpf com ou sem pontuação
     * @return string
     * @throws moodle_exception
     */
    public static function normalizar_cpf(string $cpf): string {
        $cpf = preg_replace('/\D/', '', $cpf);
        if (strlen($cpf) !== 11 || preg_match('/^(\d)\1{10}$/', $cpf)) {
            throw new moodle_exception('erro_cpf', 'local_numep');
        }
        for ($t = 9; $t < 11; $t++) {
            $soma = 0;
            for ($i = 0; $i < $t; $i++) {
                $soma += (int) $cpf[$i] * (($t + 1) - $i);
            }
            $digito = ((10 * $soma) % 11) % 10;
            if ((int) $cpf[$t] !== $digito) {
                throw new moodle_exception('erro_cpf', 'local_numep');
            }
        }
        return $cpf;
    }

    /**
     * Gera um código de verificação único entre os dois tipos de certificado.
     *
     * Formato NUMEP-XXXX-XXXX, sem letras parecidas (0/O, 1/I) para facilitar a digitação.
     *
     * @return string
     */
    public static function gerar_codigo_verificacao(): string {
        global $DB;
        $alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        do {
            $partes = [];
            for ($p = 0; $p < 2; $p++) {
                $bloco = '';
                for ($i = 0; $i < 4; $i++) {
                    $bloco .= $alfabeto[random_int(0, strlen($alfabeto) - 1)];
                }
                $partes[] = $bloco;
            }
            $codigo = 'NUMEP-' . implode('-', $partes);
            $existe = $DB->record_exists('local_numep_certificado', ['codigo_verificacao' => $codigo])
                || $DB->record_exists('local_numep_certificado_facilitador', ['codigo_verificacao' => $codigo]);
        } while ($existe);
        return $codigo;
    }

    /**
     * CPF parcialmente oculto para páginas públicas (LGPD): ***.456.789-**
     *
     * @param string|null $cpf só dígitos
     * @return string
     */
    public static function ocultar_cpf(?string $cpf): string {
        $d = preg_replace('/\D/', '', (string) $cpf);
        return strlen($d) === 11 ? '***.' . substr($d, 3, 3) . '.' . substr($d, 6, 3) . '-**' : '';
    }
}
