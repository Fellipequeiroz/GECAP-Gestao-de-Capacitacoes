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
 * Confere se as tabelas e as regras do NUMEP funcionam neste Moodle.
 *
 * Grava dados de exemplo dentro de uma transação e desfaz tudo no final:
 * o banco fica como estava. Rode na pasta do Moodle:
 *   php public/local/numep/cli/verificar_instalacao.php
 *
 * @package    local_numep
 * @copyright  2026 Fellipe Queiroz
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('CLI_SCRIPT', true);
require(__DIR__ . '/../../../config.php');
require_once($CFG->dirroot.'/user/lib.php');
use local_numep\model\regras;
$ok = 0; $falhas = 0;
function check($nome, $cond) { global $ok, $falhas; echo ($cond ? "OK   " : "FALHA ")."$nome\n"; $cond ? $ok++ : $falhas++; }
function lanca($fn) { try { $fn(); return false; } catch (\Throwable $e) { return get_class($e).': '.$e->getMessage(); } }
function mostra($fn) { $r = lanca($fn); if ($r) { echo "      ($r)\n"; } return $r; }
$t = time();
$tx = $DB->start_delegated_transaction();
$setor = $DB->insert_record('local_numep_setor', ['nome'=>'Proteção Social Básica','timecreated'=>$t,'timemodified'=>$t]);
$un = $DB->insert_record('local_numep_unidade', ['setor_id'=>$setor,'nome'=>'CRAS Centro','timecreated'=>$t,'timemodified'=>$t]);
$cargo = $DB->insert_record('local_numep_cargo_tag', ['nome'=>'Assistente Social','timecreated'=>$t,'timemodified'=>$t]);
$u1 = user_create_user(['username'=>'numep_teste_a','firstname'=>'Ana','lastname'=>'Silva','email'=>'numep_teste_a@example.com','password'=>'Senha123!','auth'=>'manual','confirmed'=>1,'mnethostid'=>$CFG->mnet_localhost_id]);
$u2 = user_create_user(['username'=>'numep_teste_b','firstname'=>'Bruno','lastname'=>'Lima','email'=>'numep_teste_b@example.com','password'=>'Senha123!','auth'=>'manual','confirmed'=>1,'mnethostid'=>$CFG->mnet_localhost_id]);
check('senha guardada com hash SHA-512 crypt', str_starts_with($DB->get_field('user','password',['id'=>$u1]), '$6$'));
$cpf = regras::normalizar_cpf('529.982.247-25');
check('CPF válido normalizado', $cpf === '52998224725');
check('CPF inválido rejeitado', (bool) lanca(fn() => regras::normalizar_cpf('111.111.111-11')));
$DB->insert_record('local_numep_pessoa', ['userid'=>$u1,'cpf'=>$cpf,'formacao'=>'tecnico_superior','unidade_id'=>$un,'cargo_tag_id'=>$cargo,'timecreated'=>$t,'timemodified'=>$t]);
check('CPF duplicado barrado pelo banco', (bool) lanca(fn() => $DB->insert_record('local_numep_pessoa', ['userid'=>$u2,'cpf'=>$cpf,'formacao'=>'tecnico_medio','unidade_id'=>$un,'timecreated'=>$t,'timemodified'=>$t])));
check('formação fora do ENUM rejeitada', (bool) lanca(fn() => regras::validar_formacao('doutorado')));
role_assign($DB->get_field('role','id',['shortname'=>'numep_coordenador']), $u2, context_system::instance());
role_assign($DB->get_field('role','id',['shortname'=>'numep_tecnico']), $u1, context_system::instance());
check('coordenador pode confirmar presença', has_capability('local/numep:confirmarpresenca', context_system::instance(), $u2));
check('técnico NÃO pode gerenciar evento', !has_capability('local/numep:gerenciarevento', context_system::instance(), $u1));
$cap = $DB->insert_record('local_numep_capacitacao', ['titulo'=>'Acolhimento no SUAS','timecreated'=>$t,'timemodified'=>$t]);
$ev = (object)['capacitacao_id'=>$cap,'local'=>'Auditório','data'=>$t,'carga_horaria'=>8,'modalidade'=>'presencial','publico_alvo'=>'unidade','facilitador_userid'=>null,'facilitador_nome_externo'=>null,'timecreated'=>$t,'timemodified'=>$t];
check('evento sem facilitador rejeitado', (bool) lanca(fn() => regras::validar_evento($ev)));
$ev2 = clone $ev; $ev2->facilitador_userid = $u2; $ev2->facilitador_nome_externo = 'Fulano';
check('evento com os dois facilitadores rejeitado', (bool) lanca(fn() => regras::validar_evento($ev2)));
$ev->facilitador_nome_externo = 'Profa. Maria (externa)';
check('evento com só facilitador externo aceito', !lanca(fn() => regras::validar_evento($ev)));
$ev3 = clone $ev; $ev3->modalidade = 'hibrido';
check('modalidade fora do ENUM rejeitada', (bool) lanca(fn() => regras::validar_evento($ev3)));
$ev->id = $DB->insert_record('local_numep_evento', $ev);
$DB->insert_record('local_numep_evento_unidade', ['evento_id'=>$ev->id,'unidade_id'=>$un]);
check('unidade repetida no mesmo evento barrada', (bool) lanca(fn() => $DB->insert_record('local_numep_evento_unidade', ['evento_id'=>$ev->id,'unidade_id'=>$un])));
$fr = $DB->insert_record('local_numep_frequencia', ['evento_id'=>$ev->id,'userid'=>$u1,'presente'=>1,'confirmado_por_userid'=>$u2,'confirmado_em'=>$t,'timecreated'=>$t,'timemodified'=>$t]);
check('frequência duplicada barrada (uq_evento_acesso)', (bool) lanca(fn() => $DB->insert_record('local_numep_frequencia', ['evento_id'=>$ev->id,'userid'=>$u1,'timecreated'=>$t,'timemodified'=>$t])));
$novo = clone $ev; $novo->carga_horaria = 10;
check('edição livre antes do certificado', !lanca(fn() => regras::validar_edicao_evento($ev, $novo)));
$cod = regras::gerar_codigo_verificacao();
check("código no formato certo ($cod)", (bool) preg_match('/^NUMEP-[A-Z2-9]{4}-[A-Z2-9]{4}$/', $cod));
$DB->insert_record('local_numep_certificado', ['frequencia_id'=>$fr,'titulo_evento_snapshot'=>'Acolhimento no SUAS','carga_horaria_snapshot'=>8,'data_evento_snapshot'=>$t,'codigo_verificacao'=>$cod,'emitido_em'=>$t]);
check('segundo certificado para a mesma frequência barrado', (bool) lanca(fn() => $DB->insert_record('local_numep_certificado', ['frequencia_id'=>$fr,'titulo_evento_snapshot'=>'x','carga_horaria_snapshot'=>8,'data_evento_snapshot'=>$t,'codigo_verificacao'=>regras::gerar_codigo_verificacao(),'emitido_em'=>$t])));
check('evento_tem_certificado detecta', regras::evento_tem_certificado($ev->id));
check('carga horária bloqueada após certificado', (bool) lanca(fn() => regras::validar_edicao_evento($ev, $novo)));
$novo2 = clone $ev; $novo2->local = 'Sala 2';
check('local ainda pode mudar após certificado', !lanca(fn() => regras::validar_edicao_evento($ev, $novo2)));
check('nota 6 rejeitada', (bool) lanca(fn() => regras::validar_nota(6)));
$DB->insert_record('local_numep_avaliacao_evento', ['frequencia_id'=>$fr,'nota'=>5,'timecreated'=>$t]);
check('segunda avaliação da mesma frequência barrada', (bool) lanca(fn() => $DB->insert_record('local_numep_avaliacao_evento', ['frequencia_id'=>$fr,'nota'=>4,'timecreated'=>$t])));
$media = $DB->get_records_sql("SELECT u.id, u.nome, AVG(a.nota) AS media FROM {local_numep_avaliacao_evento} a JOIN {local_numep_frequencia} f ON f.id=a.frequencia_id JOIN {local_numep_pessoa} p ON p.userid=f.userid JOIN {local_numep_unidade} u ON u.id=p.unidade_id GROUP BY u.id, u.nome");
check('consulta de média por unidade (regra 9.1) funciona', (float) reset($media)->media === 5.0);
// ---- Models (classes/model) e controllers da API (classes/external) ----
\core\session\manager::set_user($DB->get_record('user', ['id' => $u2]));
$capm = \local_numep\model\capacitacao::criar('Escuta qualificada');
check('model capacitacao cria e lista', in_array($capm, array_column(\local_numep\model\capacitacao::listar(), 'id')));
$dados = (object)['capacitacao_id'=>$capm,'local'=>'CRAS Centro','data'=>$t - 3600,'carga_horaria'=>4,'modalidade'=>'presencial','publico_alvo'=>'unidade','facilitador_nome_externo'=>'Prof. Externo','unidades'=>[$un]];
check('model evento: público por unidade sem unidade rejeitado', (bool) lanca(fn() => \local_numep\model\evento::criar((object) array_merge((array) $dados, ['unidades'=>[]]))));
$evm = \local_numep\model\evento::criar($dados);
$obj = \local_numep\model\evento::obter($evm);
check('model evento convoca só a unidade escolhida (1 convocado)', $obj->convocados == 1 && $obj->status === 'aguardando_presenca');
$fid = $DB->get_field('local_numep_frequencia', 'id', ['evento_id'=>$evm, 'userid'=>$u1]);
check('model frequencia confirma e emite 1 certificado', \local_numep\model\frequencia::confirmar_presenca([$fid]) === 1);
check('quem confirmou fica registrado', $DB->get_field('local_numep_frequencia', 'confirmado_por_userid', ['id'=>$fid]) == $u2);
check('presença certificada não vira falta', (bool) lanca(fn() => \local_numep\model\frequencia::confirmar_presenca([$fid], false)));
$codp = $DB->get_field('local_numep_certificado', 'codigo_verificacao', ['frequencia_id'=>$fid]);
$pub = \local_numep\model\certificado::buscar_por_codigo(strtolower($codp));
check('verificação pública acha o certificado com CPF mascarado', $pub && $pub->cpf_oculto === '***.982.247-**' && $pub->nome === 'Ana Silva');
check('código inexistente não acha nada', \local_numep\model\certificado::buscar_por_codigo('NUMEP-ZZZZ-ZZZZ') === null);
check('model evento: carga horária travada após certificado', (bool) lanca(fn() => \local_numep\model\evento::atualizar((object)['id'=>$evm,'carga_horaria'=>9])));
check('model evento: local pode mudar', !mostra(fn() => \local_numep\model\evento::atualizar((object)['id'=>$evm,'local'=>'Auditório'])));
$r = \core_external\external_api::clean_returnvalue(\local_numep\external\listar_eventos::execute_returns(), \local_numep\external\listar_eventos::execute());
check('API listar_eventos responde no formato declarado', in_array($evm, array_column($r, 'id')));
check('API: coordenador NÃO pode encerrar evento', (bool) lanca(fn() => \local_numep\external\encerrar_evento::execute($evm)));
\core\session\manager::set_user(get_admin());
$r = \local_numep\external\encerrar_evento::execute($evm);
check('API encerrar_evento encerra e emite certificado do facilitador', $r['sucesso'] && $DB->record_exists('local_numep_certificado_facilitador', ['evento_id'=>$evm]));
$codf = $DB->get_field('local_numep_certificado_facilitador', 'codigo_verificacao', ['evento_id'=>$evm]);
check('verificação pública acha certificado do facilitador', \local_numep\model\certificado::buscar_por_codigo($codf)->papel === 'facilitador');
check('evento com certificado não pode ser excluído', (bool) lanca(fn() => \local_numep\model\evento::excluir($evm)));
\core\session\manager::set_user($DB->get_record('user', ['id' => $u1]));
check('API: técnico NÃO pode listar eventos (só participa)', str_contains((string) lanca(fn() => \local_numep\external\listar_eventos::execute()), 'required_capability'));
echo "\n$ok OK, $falhas falhas\n";
echo "Desfazendo os dados de teste...\n";
try {
    throw new \Exception("fim do teste");
} catch (\Exception $e) {
    try {
        $tx->rollback($e);
    } catch (\Exception $ignorado) {
        echo "Pronto. Nada foi gravado.\n";
    }
}
exit($falhas ? 1 : 0);
