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
 * Textos em português (aparecem quando o pacote de idioma pt_br está instalado).
 *
 * @package    local_numep
 * @copyright  2026 Fellipe Queiroz
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$string['pluginname'] = 'NUMEP/SUAS';
$string['erro_avaliacao_nota'] = 'A nota deve ser de 1 a 5.';
$string['erro_capacitacao'] = 'Capacitação não encontrada.';
$string['erro_cpf'] = 'CPF inválido.';
$string['erro_evento_bloqueado'] = 'Este evento já tem certificados emitidos: data, carga horária e capacitação não podem mais ser alteradas.';
$string['erro_evento_dados'] = 'Preencha local, data e carga horária (mínimo 1 hora).';
$string['erro_evento_encerrado'] = 'Este evento já foi encerrado.';
$string['erro_evento_futuro'] = 'O evento ainda não aconteceu.';
$string['erro_facilitador_xor'] = 'Informe exatamente um facilitador: um usuário interno ou um nome externo.';
$string['erro_formacao'] = 'Formação inválida.';
$string['erro_modalidade'] = 'Modalidade inválida.';
$string['erro_presenca_certificada'] = 'Esta presença já gerou certificado e não pode virar falta.';
$string['erro_publico_alvo'] = 'Público-alvo inválido.';
$string['erro_regra'] = '{$a}';
$string['erro_titulo'] ='Informe um título de até 255 caracteres.';
$string['erro_unidades'] = 'Escolha pelo menos uma unidade.';
$string['facilitadorremovido'] = 'Facilitador removido';
$string['numep:confirmarpresenca'] = 'Confirmar presença';
$string['numep:gerenciarestrutura'] = 'Gerenciar setores, unidades, cargos e usuários';
$string['numep:gerenciarevento'] = 'Gerenciar capacitações e eventos';
$string['numep:participar'] = 'Participar de eventos';
$string['numep:verrelatorios'] = 'Ver relatórios';
$string['privacy:metadata:avaliacao'] = 'Avaliações dos eventos feitas pelos participantes (não anônimas).';
$string['privacy:metadata:avaliacao:comentario'] = 'Comentário livre.';
$string['privacy:metadata:avaliacao:frequencia_id'] = 'A participação avaliada.';
$string['privacy:metadata:avaliacao:nota'] = 'Nota de 1 a 5.';
$string['privacy:metadata:certificado'] = 'Certificados de participação emitidos após a confirmação de presença.';
$string['privacy:metadata:certificado:codigo_verificacao'] = 'Código público de verificação impresso no certificado.';
$string['privacy:metadata:certificado:emitido_em'] = 'Data de emissão.';
$string['privacy:metadata:certificado:frequencia_id'] = 'A presença que gerou o certificado.';
$string['privacy:metadata:certificado_facilitador'] = 'Certificados emitidos aos facilitadores dos eventos.';
$string['privacy:metadata:certificado_facilitador:nome'] = 'Nome do facilitador no momento da emissão.';
$string['privacy:metadata:evento'] = 'Eventos de capacitação.';
$string['privacy:metadata:evento:facilitador_nome_externo'] = 'Nome do facilitador externo.';
$string['privacy:metadata:evento:facilitador_userid'] = 'Facilitador interno do evento.';
$string['privacy:metadata:feedback'] = 'Feedback dos facilitadores sobre o evento.';
$string['privacy:metadata:feedback:comentario'] = 'Comentário livre.';
$string['privacy:metadata:feedback:facilitador_userid'] = 'O facilitador que escreveu (só facilitadores internos).';
$string['privacy:metadata:frequencia'] = 'Registro de presença de um profissional em um evento.';
$string['privacy:metadata:frequencia:confirmado_em'] = 'Quando a presença foi confirmada.';
$string['privacy:metadata:frequencia:confirmado_por_userid'] = 'Quem confirmou a presença (auditoria).';
$string['privacy:metadata:frequencia:presente'] = 'Se a presença foi confirmada.';
$string['privacy:metadata:frequencia:userid'] = 'O participante.';
$string['privacy:metadata:pessoa'] = 'Dados pessoais e funcionais de cada profissional, ligados 1:1 ao usuário do Moodle.';
$string['privacy:metadata:pessoa:cpf'] = 'CPF, usado para identificar o profissional e impresso no certificado.';
$string['privacy:metadata:pessoa:data_nascimento'] = 'Data de nascimento.';
$string['privacy:metadata:pessoa:formacao'] = 'Nível de escolaridade.';
$string['privacy:metadata:pessoa:telefone'] = 'Telefone.';
$string['privacy:metadata:pessoa:unidade_id'] = 'Unidade em que o profissional está lotado.';
$string['privacy:metadata:pessoa:userid'] = 'O usuário do Moodle a quem o registro pertence.';
$string['verificar_botao'] = 'Verificar';
$string['verificar_capacitacao'] = 'Capacitação';
$string['verificar_carga'] = 'Carga horária';
$string['verificar_codigo'] = 'Código de verificação';
$string['verificar_data'] = 'Data do evento';
$string['verificar_emitido'] = 'Emitido em';
$string['verificar_facilitador'] = 'facilitador';
$string['verificar_invalido'] = 'Nenhum certificado encontrado com este código.';
$string['verificar_nome'] = 'Nome';
$string['verificar_titulo'] = 'Verificar certificado';
$string['verificar_valido'] = 'Certificado válido';
