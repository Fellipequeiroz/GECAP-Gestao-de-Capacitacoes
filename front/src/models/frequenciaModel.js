// Model: presença (FREQUENCIA), certificados de participante e avaliações.
import { lerBanco } from './base/banco.js';
import { executar } from './base/repositorio.js';
import { ErroRegra, LIMITES, limitar, validarNota } from './regras.js';

// Regra 4: confirmar presença gera o certificado do participante na hora (no Moodle).
export function confirmarPresenca(frequenciaIds, presente = true) {
  const b = lerBanco();
  let ids = new Set(frequenciaIds);
  const ev = b.eventos.find((e) => e.id === b.frequencias.find((f) => ids.has(f.id))?.evento_id);
  if (!ev) return Promise.reject(new ErroRegra('Nenhum participante selecionado.'));
  if (ev.encerrado) return Promise.reject(new ErroRegra('O evento já foi encerrado.'));
  if (new Date(ev.data).getTime() > Date.now()) return Promise.reject(new ErroRegra('Só é possível confirmar presença depois que o evento acontecer.'));
  // Certificado emitido não volta atrás: quem já tem certificado não pode virar falta.
  if (!presente) ids = new Set([...ids].filter((id) => !b.certificados.some((c) => c.frequencia_id === id)));
  if (!ids.size) return Promise.resolve(0);
  return executar('confirmar_presenca', { ids: [...ids], presente });
}

export function adicionarParticipantes(eventoId, cpfsOuEmails) {
  const b = lerBanco();
  const ev = b.eventos.find((e) => e.id === eventoId);
  if (ev.encerrado) return Promise.reject(new ErroRegra('O evento já foi encerrado.'));
  const chaves = cpfsOuEmails.map((s) => s.trim().toLowerCase()).filter(Boolean);
  return executar('adicionar_participantes', { evento_id: eventoId, chaves });
}

export function removerParticipante(frequenciaId) {
  const b = lerBanco();
  if (b.certificados.some((c) => c.frequencia_id === frequenciaId)) return Promise.reject(new ErroRegra('Este participante já tem certificado e não pode ser removido.'));
  return executar('remover_participante', { id: frequenciaId });
}

export function registrarAvaliacao(frequenciaId, nota, comentario) {
  try {
    validarNota(nota);
    limitar('Comentário', comentario, LIMITES.comentario);
  } catch (e) {
    return Promise.reject(e);
  }
  const b = lerBanco();
  const f = b.frequencias.find((x) => x.id === frequenciaId);
  if (!f?.presente) return Promise.reject(new ErroRegra('Só quem teve presença confirmada pode avaliar.'));
  if (b.avaliacoes.some((a) => a.frequencia_id === frequenciaId)) return Promise.reject(new ErroRegra('Esta participação já foi avaliada (regra 9).'));
  return executar('registrar_avaliacao', { frequencia_id: frequenciaId, nota: Number(nota), comentario: comentario || '' });
}
