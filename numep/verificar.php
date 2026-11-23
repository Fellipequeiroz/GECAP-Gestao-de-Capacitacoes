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
 * Controller da página pública de verificação de certificado.
 *
 * Recebe o código, pede ao model (classes/model/certificado.php) e manda
 * os dados para a view (templates/verificar_certificado.mustache).
 *
 * @package    local_numep
 * @copyright  2026 Fellipe Queiroz
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// Página pública: qualquer pessoa pode conferir um certificado sem login.
// phpcs:ignore moodle.Files.RequireLogin.Missing
require(__DIR__ . '/../../config.php');

use local_numep\model\certificado;

$codigo = optional_param('codigo', '', PARAM_ALPHANUMEXT);
$url = new moodle_url('/local/numep/verificar.php');

$PAGE->set_url($url);
$PAGE->set_context(context_system::instance());
$PAGE->set_pagelayout('standard');
$PAGE->set_title(get_string('verificar_titulo', 'local_numep'));
$PAGE->set_heading(get_string('verificar_titulo', 'local_numep'));

$contexto = ['acao' => $url->out(false), 'codigo' => $codigo, 'pesquisou' => $codigo !== ''];
if ($codigo !== '' && ($c = certificado::buscar_por_codigo($codigo))) {
    $formato = get_string('strftimedate', 'langconfig');
    $contexto['certificado'] = [
        'nome' => $c->nome,
        'cpf_oculto' => $c->cpf_oculto,
        'titulo' => $c->titulo,
        'carga_horaria' => $c->carga_horaria,
        'data' => userdate($c->data, $formato),
        'emitido_em' => userdate($c->emitido_em, $formato),
        'facilitador' => $c->papel === 'facilitador',
    ];
}

echo $OUTPUT->header();
echo $OUTPUT->render_from_template('local_numep/verificar_certificado', $contexto);
echo $OUTPUT->footer();
