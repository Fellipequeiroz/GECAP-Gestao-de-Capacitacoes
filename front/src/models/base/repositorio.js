// Base de todos os models: leitura do banco carregado do Moodle, envio das
// gravações para a API (local_numep_executar), conferência de permissão para
// a tela e montagem dos registros completos.
import { carregarBanco } from './banco.js';
import { chamar } from './moodleApi.js';
import { pode } from '../regras.js';

// As leituras devolvem uma cópia, para nenhuma tela alterar o banco por engano.
export const esperar = (dados) => Promise.resolve(structuredClone(dados));

// Envia uma ação ao Moodle, que confere a permissão e as regras e grava no banco.
// Depois recarrega os dados, e todas as telas abertas se atualizam sozinhas.
export async function executar(acao, dados = {}) {
  const r = await chamar('local_numep_executar', { acao, dados: JSON.stringify(dados) });
  await carregarBanco();
  return JSON.parse(r.json);
}

// Usuário logado e permissão (só para a tela; quem decide de verdade é o
// require_capability dentro de cada função da API do Moodle).
export const logado = (b) => b.pessoas.find((p) => p.id === b.usuarioAtualId);

export const podeLogado = (b, permissao) => pode(logado(b), permissao);

// Notas são sempre estrelas inteiras (1 a 5): a média também é arredondada.
export const mediaEmEstrelas = (notas) => (notas.length ? Math.round(notas.reduce((a, n) => a + n, 0) / notas.length) : null);

// ---------- Leituras "enriquecidas" ----------
export function pessoaCompleta(b, p) {
  const unidade = b.unidades.find((u) => u.id === p.unidade_id);
  return {
    ...p,
    unidade_nome: unidade?.nome ?? '—',
    setor_id: unidade?.setor_id ?? null,
    cargo_nome: b.cargos.find((c) => c.id === p.cargo_tag_id)?.nome ?? '—',
  };
}

export function statusEvento(ev, freq) {
  if (ev.encerrado) return 'encerrado';
  const quando = new Date(ev.data).getTime();
  if (quando > Date.now()) return 'agendado';
  const pendentes = freq.filter((f) => f.evento_id === ev.id && !f.presente).length;
  return pendentes ? 'aguardando_presenca' : 'realizado';
}

export function eventoCompleto(b, ev) {
  const cap = b.capacitacoes.find((c) => c.id === ev.capacitacao_id);
  const freq = b.frequencias.filter((f) => f.evento_id === ev.id);
  const facil = ev.facilitador_userid ? b.pessoas.find((p) => p.id === ev.facilitador_userid) : null;
  const ids = new Set(freq.map((f) => f.id));
  const notas = b.avaliacoes.filter((a) => ids.has(a.frequencia_id)).map((a) => a.nota);
  return {
    ...ev,
    titulo: cap?.titulo ?? '—',
    // O Moodle já manda o nome resolvido (quem não recebe a lista de pessoas também vê o facilitador).
    facilitador_nome: ev.facilitador_nome ?? (facil ? facil.nome : ev.facilitador_nome_externo),
    facilitador_interno: Boolean(ev.facilitador_userid),
    unidades_nomes: ev.unidades.map((u) => b.unidades.find((x) => x.id === u)?.nome).filter(Boolean),
    convocados: freq.length,
    presentes: freq.filter((f) => f.presente).length,
    certificados: b.certificados.filter((c) => ids.has(c.frequencia_id)).length,
    nota_media: mediaEmEstrelas(notas),
    avaliacoes: notas.length,
    status: statusEvento(ev, b.frequencias),
    tem_certificado: b.certificados.some((c) => ids.has(c.frequencia_id)) || b.certificadosFacilitador.some((c) => c.evento_id === ev.id),
  };
}
