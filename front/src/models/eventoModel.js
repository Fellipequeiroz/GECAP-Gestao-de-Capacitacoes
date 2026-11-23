// Model: eventos (EVENTO + EVENTO_UNIDADE), convocação e encerramento.
import { lerBanco, paraTimestamp } from './base/banco.js';
import { esperar, executar, eventoCompleto } from './base/repositorio.js';
import { CAMPOS_CRITICOS, ErroRegra, LIMITES, limitar, validarEvento } from './regras.js';

export function listarEventos() {
  const b = lerBanco();
  return esperar(b.eventos.map((e) => eventoCompleto(b, e)).sort((a, z) => z.data.localeCompare(a.data)));
}

export function obterEvento(id) {
  const b = lerBanco();
  const ev = b.eventos.find((e) => e.id === id);
  if (!ev) return esperar(null);
  const participantes = b.frequencias.filter((f) => f.evento_id === id).map((f) => {
    const p = b.pessoas.find((x) => x.id === f.userid);
    const cert = b.certificados.find((c) => c.frequencia_id === f.id);
    const aval = b.avaliacoes.find((a) => a.frequencia_id === f.id);
    return {
      ...f,
      nome: p?.nome ?? '—',
      email: p?.email ?? '',
      unidade_nome: b.unidades.find((u) => u.id === p?.unidade_id)?.nome ?? '—',
      confirmado_por: b.pessoas.find((x) => x.id === f.confirmado_por_userid)?.nome ?? null,
      certificado: cert?.codigo_verificacao ?? null,
      nota: aval?.nota ?? null,
      comentario: aval?.comentario ?? '',
    };
  }).sort((a, z) => a.nome.localeCompare(z.nome));
  return esperar({
    ...eventoCompleto(b, ev),
    participantes,
    certificado_facilitador: b.certificadosFacilitador.find((c) => c.evento_id === id)?.codigo_verificacao ?? null,
  });
}

// Ao salvar, o Moodle convoca os profissionais ativos das unidades escolhidas
// (ou de toda a rede), sem repetir quem já está na lista (regra 1).
export function salvarEvento(dados) {
  const ev = {
    ...dados,
    capacitacao_id: Number(dados.capacitacao_id),
    carga_horaria: Number(dados.carga_horaria),
    facilitador_userid: dados.facilitador_tipo === 'interno' ? Number(dados.facilitador_userid) || null : null,
    facilitador_nome_externo: dados.facilitador_tipo === 'externo' ? dados.facilitador_nome_externo : null,
    unidades: dados.publico_alvo === 'rede_geral' ? [] : (dados.unidades || []).map(Number),
  };
  try {
    validarEvento(ev);
    limitar('Local', ev.local, LIMITES.local);
    limitar('Facilitador', ev.facilitador_nome_externo, LIMITES.facilitador_nome_externo);
  } catch (e) {
    return Promise.reject(e);
  }
  const b = lerBanco();
  if (ev.id) {
    const antigo = b.eventos.find((e) => e.id === ev.id);
    if (antigo.encerrado) return Promise.reject(new ErroRegra('Evento encerrado não pode ser editado.'));
    const comCertificado = eventoCompleto(b, antigo).tem_certificado;
    if (comCertificado && CAMPOS_CRITICOS.some((c) => String(antigo[c]) !== String(ev[c]))) {
      return Promise.reject(new ErroRegra('Este evento já tem certificados emitidos: data, carga horária e capacitação não podem mais ser alteradas (regra 6.1).'));
    }
  }
  return executar('salvar_evento', {
    id: ev.id || null,
    capacitacao_id: ev.capacitacao_id, local: ev.local.trim(), data: paraTimestamp(ev.data), carga_horaria: ev.carga_horaria,
    modalidade: ev.modalidade, publico_alvo: ev.publico_alvo, facilitador_userid: ev.facilitador_userid,
    facilitador_nome_externo: ev.facilitador_nome_externo, unidades: ev.unidades,
  });
}

export function excluirEvento(id) {
  const b = lerBanco();
  const ev = b.eventos.find((e) => e.id === id);
  if (eventoCompleto(b, ev).tem_certificado) return Promise.reject(new ErroRegra('Este evento já tem certificados e não pode ser excluído.'));
  return executar('excluir_evento', { id });
}

// Encerramento gera o certificado do facilitador (regra 4).
export function encerrarEvento(id) {
  const b = lerBanco();
  const ev = b.eventos.find((e) => e.id === id);
  if (ev.encerrado) return Promise.reject(new ErroRegra('O evento já está encerrado.'));
  if (new Date(ev.data).getTime() > Date.now()) return Promise.reject(new ErroRegra('O evento ainda não aconteceu.'));
  return executar('encerrar_evento', { id });
}
