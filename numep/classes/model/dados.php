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
 * Model que monta, numa consulta só, os dados que as telas usam
 * (o front calcula indicadores, filtros e gráficos em cima deles).
 *
 * O que cada perfil recebe (escopo):
 * - master: tudo;
 * - diretor: as pessoas das unidades do setor dele (a diretoria) e o que é delas;
 * - coordenador: as pessoas da própria unidade e as presenças, certificados,
 *   avaliações e atividades delas;
 * - técnico: só os próprios dados.
 * Capacitações, eventos e unidades vão para todos (a lista de capacitações é pública
 * na rede); dados pessoais (CPF, e-mail, telefone) só dentro do escopo.
 *
 * Os nomes dos campos são os do front (models/base/banco.js). Datas saem como
 * timestamp Unix; o front converte para a hora local do navegador.
 *
 * @package    local_numep
 * @copyright  2026 Fellipe Queiroz
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class dados {
    /**
     * Dados do NUMEP no escopo do usuário logado.
     *
     * @return array
     */
    public static function carregar(): array {
        global $USER;
        $dados = self::tudo();
        $perfil = pessoa::perfil_de((int) $USER->id);
        if ($perfil === 'diretor') {
            // Diretoria = setor da unidade do diretor: todas as unidades desse setor.
            $unidades = array_flip(pessoa::unidades_do_setor_de((int) $USER->id));
            $dados = self::filtrar($dados, fn($p) => isset($unidades[$p['unidade_id']]));
            $dados['escopo'] = 'setor';
        } else if ($perfil === 'coordenador') {
            $unidade = pessoa::unidade_de((int) $USER->id);
            $dados = self::filtrar($dados, fn($p) => $p['unidade_id'] === $unidade);
            $dados['escopo'] = 'unidade';
        } else if ($perfil === 'tecnico') {
            $dados = self::filtrar($dados, fn($p) => $p['id'] === (int) $USER->id);
            $dados['escopo'] = 'proprio';
        } else {
            $dados['escopo'] = 'tudo';
        }
        return $dados;
    }

    /**
     * Deixa só as pessoas aceitas por $manter e tudo o que é delas.
     *
     * @param array $d resultado de tudo()
     * @param callable $manter recebe a pessoa e diz se ela fica
     * @return array
     */
    private static function filtrar(array $d, callable $manter): array {
        $d['pessoas'] = array_values(array_filter($d['pessoas'], $manter));
        $ids = array_flip(array_column($d['pessoas'], 'id'));
        $d['frequencias'] = array_values(array_filter($d['frequencias'], fn($f) => isset($ids[$f['userid']])));
        $freqs = array_flip(array_column($d['frequencias'], 'id'));
        $d['certificados'] = array_values(array_filter($d['certificados'], fn($c) => isset($freqs[$c['frequencia_id']])));
        $d['avaliacoes'] = array_values(array_filter($d['avaliacoes'], fn($a) => isset($freqs[$a['frequencia_id']])));
        $d['atividades'] = array_values(array_filter($d['atividades'], fn($a) => isset($ids[$a['userid']])));
        $d['feedbacks'] = [];
        return $d;
    }

    /**
     * Fotografia completa do banco do NUMEP.
     *
     * @return array
     */
    private static function tudo(): array {
        global $DB, $USER;

        $perfis = pessoa::perfis();
        $nomes = [];
        $sql = "SELECT u.id, u.firstname, u.lastname, u.email, u.suspended, p.cpf, p.data_nascimento, p.telefone,
                       p.formacao, p.unidade_id, p.cargo_tag_id, p.timecreated
                  FROM {local_numep_pessoa} p
                  JOIN {user} u ON u.id = p.userid AND u.deleted = 0
              ORDER BY u.firstname, u.lastname";
        $pessoas = [];
        foreach ($DB->get_recordset_sql($sql) as $p) {
            $pessoas[] = [
                'id' => (int) $p->id, 'nome' => trim($p->firstname . ' ' . $p->lastname), 'email' => $p->email,
                'cpf' => $p->cpf, 'data_nascimento' => $p->data_nascimento ? (int) $p->data_nascimento : null,
                'telefone' => (string) $p->telefone, 'formacao' => $p->formacao, 'perfil' => $perfis[$p->id] ?? 'tecnico',
                'unidade_id' => (int) $p->unidade_id, 'cargo_tag_id' => $p->cargo_tag_id ? (int) $p->cargo_tag_id : null,
                'ativo' => !$p->suspended, 'criado_em' => (int) $p->timecreated,
            ];
            $nomes[(int) $p->id] = trim($p->firstname . ' ' . $p->lastname);
        }

        $unidadesdoevento = [];
        foreach ($DB->get_recordset('local_numep_evento_unidade') as $eu) {
            $unidadesdoevento[$eu->evento_id][] = (int) $eu->unidade_id;
        }
        $eventos = array_map(fn($e) => [
            'id' => (int) $e->id, 'capacitacao_id' => (int) $e->capacitacao_id, 'local' => $e->local, 'data' => (int) $e->data,
            'carga_horaria' => (int) $e->carga_horaria, 'modalidade' => $e->modalidade, 'publico_alvo' => $e->publico_alvo,
            'facilitador_userid' => $e->facilitador_userid ? (int) $e->facilitador_userid : null,
            'facilitador_nome_externo' => $e->facilitador_nome_externo, 'encerrado' => (bool) $e->encerrado,
            // Nome do facilitador já resolvido: quem não recebe a lista de pessoas ainda vê quem conduz o evento.
            'facilitador_nome' => $e->facilitador_userid ? ($nomes[(int) $e->facilitador_userid] ?? null) : $e->facilitador_nome_externo,
            'unidades' => $unidadesdoevento[$e->id] ?? [], 'criado_em' => (int) $e->timecreated,
        ], self::tabela('local_numep_evento'));

        return [
            'usuarioAtualId' => (int) $USER->id,
            'config' => configuracao::obter(),
            'setores' => array_map(fn($s) => self::comum($s) + ['nome' => $s->nome, 'descricao' => (string) $s->descricao],
                self::tabela('local_numep_setor')),
            'unidades' => array_map(fn($u) => self::comum($u) + [
                'setor_id' => (int) $u->setor_id, 'nome' => $u->nome, 'endereco' => (string) $u->endereco,
            ], self::tabela('local_numep_unidade')),
            'cargos' => array_map(fn($c) => self::comum($c) + ['nome' => $c->nome, 'descricao' => (string) $c->descricao],
                self::tabela('local_numep_cargo_tag')),
            'pessoas' => $pessoas,
            'capacitacoes' => array_map(fn($c) => self::comum($c) + ['titulo' => $c->titulo, 'descricao' => (string) $c->descricao],
                self::tabela('local_numep_capacitacao')),
            'eventos' => $eventos,
            'frequencias' => array_map(fn($f) => self::comum($f) + [
                'evento_id' => (int) $f->evento_id, 'userid' => (int) $f->userid, 'presente' => (bool) $f->presente,
                'confirmado_por_userid' => $f->confirmado_por_userid ? (int) $f->confirmado_por_userid : null,
                'confirmado_em' => $f->confirmado_em ? (int) $f->confirmado_em : null,
            ], self::tabela('local_numep_frequencia')),
            'certificados' => array_map(fn($c) => [
                'id' => (int) $c->id, 'frequencia_id' => (int) $c->frequencia_id, 'titulo_evento_snapshot' => $c->titulo_evento_snapshot,
                'carga_horaria_snapshot' => (int) $c->carga_horaria_snapshot, 'data_evento_snapshot' => (int) $c->data_evento_snapshot,
                'codigo_verificacao' => $c->codigo_verificacao, 'emitido_em' => (int) $c->emitido_em,
            ], self::tabela('local_numep_certificado')),
            'certificadosFacilitador' => array_map(fn($c) => [
                'id' => (int) $c->id, 'evento_id' => (int) $c->evento_id, 'nome_facilitador_snapshot' => $c->nome_facilitador_snapshot,
                'titulo_evento_snapshot' => $c->titulo_evento_snapshot, 'codigo_verificacao' => $c->codigo_verificacao,
                'emitido_em' => (int) $c->emitido_em,
            ], self::tabela('local_numep_certificado_facilitador')),
            'avaliacoes' => array_map(fn($a) => self::comum($a) + [
                'frequencia_id' => (int) $a->frequencia_id, 'nota' => (int) $a->nota, 'comentario' => (string) $a->comentario,
            ], self::tabela('local_numep_avaliacao_evento')),
            'feedbacks' => array_map(fn($f) => self::comum($f) + [
                'evento_id' => (int) $f->evento_id, 'facilitador_userid' => $f->facilitador_userid ? (int) $f->facilitador_userid : null,
                'comentario' => (string) $f->comentario,
            ], self::tabela('local_numep_feedback_facilitador')),
            'atividades' => array_map(fn($a) => [
                'id' => (int) $a->id, 'userid' => (int) $a->userid, 'acao' => $a->acao, 'detalhe' => (string) $a->detalhe,
                'quando' => (int) $a->timecreated,
            ], atividade::listar()),
        ];
    }

    /**
     * Todos os registros de uma tabela, em ordem de id.
     *
     * @param string $tabela
     * @return \stdClass[]
     */
    private static function tabela(string $tabela): array {
        global $DB;
        return array_values($DB->get_records($tabela, null, 'id'));
    }

    /**
     * Campos comuns: id e data de criação.
     *
     * @param \stdClass $r
     * @return array
     */
    private static function comum(\stdClass $r): array {
        return ['id' => (int) $r->id, 'criado_em' => (int) ($r->timecreated ?? 0)];
    }
}
