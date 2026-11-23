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
 * English strings (mandatory for every Moodle plugin).
 *
 * @package    local_numep
 * @copyright  2026 Fellipe Queiroz
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$string['pluginname'] = 'NUMEP/SUAS';
$string['erro_avaliacao_nota'] = 'The rating must be between 1 and 5.';
$string['erro_capacitacao'] = 'Training not found.';
$string['erro_cpf'] = 'Invalid CPF.';
$string['erro_evento_bloqueado'] = 'Certificates were already issued for this event: date, workload and training can no longer be changed.';
$string['erro_evento_dados'] = 'Fill in place, date and workload (at least 1 hour).';
$string['erro_evento_encerrado'] = 'This event has already been closed.';
$string['erro_evento_futuro'] = 'The event has not happened yet.';
$string['erro_facilitador_xor'] = 'Provide exactly one facilitator: an internal user or an external name.';
$string['erro_formacao'] = 'Invalid education level.';
$string['erro_modalidade'] = 'Invalid modality.';
$string['erro_presenca_certificada'] = 'This attendance already generated a certificate and cannot become an absence.';
$string['erro_publico_alvo'] = 'Invalid target audience.';
$string['erro_regra'] = '{$a}';
$string['erro_titulo'] ='Enter a title of up to 255 characters.';
$string['erro_unidades'] = 'Choose at least one unit.';
$string['facilitadorremovido'] = 'Removed facilitator';
$string['numep:confirmarpresenca'] = 'Confirm attendance';
$string['numep:gerenciarestrutura'] = 'Manage sectors, units, job tags and users';
$string['numep:gerenciarevento'] = 'Manage trainings and events';
$string['numep:participar'] = 'Take part in events';
$string['numep:verrelatorios'] = 'View reports';
$string['privacy:metadata:avaliacao'] = 'Event evaluations made by participants (not anonymous).';
$string['privacy:metadata:avaliacao:comentario'] = 'Free-text comment.';
$string['privacy:metadata:avaliacao:frequencia_id'] = 'The participation being evaluated.';
$string['privacy:metadata:avaliacao:nota'] = 'Rating from 1 to 5.';
$string['privacy:metadata:certificado'] = 'Participant certificates issued after attendance confirmation.';
$string['privacy:metadata:certificado:codigo_verificacao'] = 'Public verification code printed on the certificate.';
$string['privacy:metadata:certificado:emitido_em'] = 'Issue date.';
$string['privacy:metadata:certificado:frequencia_id'] = 'The attendance record that generated the certificate.';
$string['privacy:metadata:certificado_facilitador'] = 'Certificates issued to event facilitators.';
$string['privacy:metadata:certificado_facilitador:nome'] = 'Name of the facilitator at issue time.';
$string['privacy:metadata:evento'] = 'Training events.';
$string['privacy:metadata:evento:facilitador_nome_externo'] = 'Name of an external facilitator.';
$string['privacy:metadata:evento:facilitador_userid'] = 'Internal facilitator of the event.';
$string['privacy:metadata:feedback'] = 'Feedback written by facilitators about an event.';
$string['privacy:metadata:feedback:comentario'] = 'Free-text comment.';
$string['privacy:metadata:feedback:facilitador_userid'] = 'The facilitator who wrote it (internal facilitators only).';
$string['privacy:metadata:frequencia'] = 'Attendance record of a professional in a training event.';
$string['privacy:metadata:frequencia:confirmado_em'] = 'When the attendance was confirmed.';
$string['privacy:metadata:frequencia:confirmado_por_userid'] = 'Who confirmed the attendance (audit trail).';
$string['privacy:metadata:frequencia:presente'] = 'Whether attendance was confirmed.';
$string['privacy:metadata:frequencia:userid'] = 'The participant.';
$string['privacy:metadata:pessoa'] = 'Personal and employment data of each professional, linked 1:1 to the Moodle user.';
$string['privacy:metadata:pessoa:cpf'] = 'Brazilian taxpayer ID (CPF), used to identify the professional and printed on certificates.';
$string['privacy:metadata:pessoa:data_nascimento'] = 'Date of birth.';
$string['privacy:metadata:pessoa:formacao'] = 'Education level.';
$string['privacy:metadata:pessoa:telefone'] = 'Phone number.';
$string['privacy:metadata:pessoa:unidade_id'] = 'Work unit where the professional is assigned.';
$string['privacy:metadata:pessoa:userid'] = 'The Moodle user this record belongs to.';
$string['verificar_botao'] = 'Verify';
$string['verificar_capacitacao'] = 'Training';
$string['verificar_carga'] = 'Workload';
$string['verificar_codigo'] = 'Verification code';
$string['verificar_data'] = 'Event date';
$string['verificar_emitido'] = 'Issued on';
$string['verificar_facilitador'] = 'facilitator';
$string['verificar_invalido'] = 'No certificate found with this code.';
$string['verificar_nome'] = 'Name';
$string['verificar_titulo'] = 'Verify certificate';
$string['verificar_valido'] = 'Valid certificate';
