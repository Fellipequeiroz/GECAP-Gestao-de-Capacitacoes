// Model: capacitações (CAPACITACAO, o tema da formação).
import { lerBanco } from './base/banco.js';
import { esperar, executar, eventoCompleto } from './base/repositorio.js';
import { ErroRegra, LIMITES, limitar } from './regras.js';

// ---------- Capacitações e eventos ----------
export function listarCapacitacoes() {
  const b = lerBanco();
  return esperar(b.capacitacoes.map((c) => {
    const evs = b.eventos.filter((e) => e.capacitacao_id === c.id).map((e) => eventoCompleto(b, e));
    return {
      ...c,
      eventos: evs.sort((a, z) => z.data.localeCompare(a.data)),
      total_horas: evs.reduce((s, e) => s + e.carga_horaria, 0),
      participantes: evs.reduce((s, e) => s + e.presentes, 0),
    };
  }));
}

export function salvarCapacitacao(dados) {
  const titulo = dados.titulo?.trim();
  if (!titulo) return Promise.reject(new ErroRegra('Informe o título da capacitação.'));
  try { limitar('Título', titulo, LIMITES.titulo); limitar('Descrição', dados.descricao, LIMITES.descricao); } catch (e) { return Promise.reject(e); }
  return executar('salvar_capacitacao', { id: dados.id || null, titulo, descricao: dados.descricao || '' });
}

export function excluirCapacitacao(id) {
  const b = lerBanco();
  if (b.eventos.some((e) => e.capacitacao_id === id)) return Promise.reject(new ErroRegra('Esta capacitação já tem eventos e não pode ser excluída.'));
  return executar('excluir_capacitacao', { id });
}
