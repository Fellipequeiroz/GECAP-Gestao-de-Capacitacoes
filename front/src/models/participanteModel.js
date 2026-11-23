// Model: a visão do participante (tela Minhas Capacitações). Vale para todos os perfis:
// cada um vê as capacitações para as quais foi convocado e avalia as que concluiu.
import { lerBanco } from './base/banco.js';
import { esperar, eventoCompleto, executar, logado } from './base/repositorio.js';
import { ErroRegra, LIMITES, limitar, validarNota } from './regras.js';

// Situação de uma convocação, do ponto de vista do participante.
function situacao(f, ev) {
  if (f.presente) return 'concluido';
  if (new Date(ev.data).getTime() > Date.now()) return 'agendado';
  return ev.encerrado ? 'ausente' : 'aguardando';
}

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// Horas certificadas e capacitações concluídas do próprio usuário, mês a mês (últimos 12 meses).
function evolucaoMensal(lista) {
  const hoje = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const ini = new Date(hoje.getFullYear(), hoje.getMonth() - (11 - i), 1);
    const fim = new Date(ini.getFullYear(), ini.getMonth() + 1, 1);
    const doMes = lista.filter((x) => x.situacao === 'concluido' && new Date(x.data) >= ini && new Date(x.data) < fim);
    return {
      mes: `${MESES[ini.getMonth()]}/${String(ini.getFullYear()).slice(2)}`,
      horas: doMes.reduce((s, x) => s + x.horas_certificadas, 0),
      concluidas: doMes.length,
    };
  });
}

export function listarMinhasCapacitacoes() {
  const b = lerBanco();
  const eu = logado(b);
  const lista = b.frequencias.filter((f) => f.userid === eu.id).map((f) => {
    const ev = eventoCompleto(b, b.eventos.find((e) => e.id === f.evento_id));
    const cap = b.capacitacoes.find((c) => c.id === ev.capacitacao_id);
    const cert = b.certificados.find((c) => c.frequencia_id === f.id);
    const aval = b.avaliacoes.find((a) => a.frequencia_id === f.id);
    return {
      frequencia_id: f.id,
      evento_id: ev.id,
      titulo: ev.titulo,
      descricao: cap?.descricao ?? '',
      data: ev.data,
      local: ev.local,
      carga_horaria: ev.carga_horaria,
      modalidade: ev.modalidade,
      facilitador_nome: ev.facilitador_nome,
      situacao: situacao(f, ev),
      confirmado_em: f.confirmado_em,
      certificado: cert?.codigo_verificacao ?? null,
      horas_certificadas: cert?.carga_horaria_snapshot ?? 0,
      nota: aval?.nota ?? null,
      comentario: aval?.comentario ?? '',
      pode_avaliar: f.presente && !aval,
    };
  }).sort((a, z) => z.data.localeCompare(a.data));

  const concluidas = lista.filter((x) => x.situacao === 'concluido').length;
  const ausentes = lista.filter((x) => x.situacao === 'ausente').length;
  return esperar({
    lista,
    grafico: evolucaoMensal(lista),
    resumo: {
      concluidas,
      agendadas: lista.filter((x) => x.situacao === 'agendado').length,
      horas: lista.reduce((s, x) => s + x.horas_certificadas, 0),
      // Meta de capacitação: presença nas capacitações que já aconteceram e foram fechadas.
      meta: concluidas + ausentes ? concluidas / (concluidas + ausentes) : null,
      a_avaliar: lista.filter((x) => x.pode_avaliar).length,
    },
  });
}

// O próprio participante avalia (regra 9: nota de 1 a 5, uma por participação).
export function avaliarMinha(frequenciaId, nota, comentario) {
  try {
    validarNota(nota);
    limitar('Comentário', comentario, LIMITES.comentario);
  } catch (e) {
    return Promise.reject(e);
  }
  const b = lerBanco();
  if (b.avaliacoes.some((a) => a.frequencia_id === frequenciaId)) return Promise.reject(new ErroRegra('Você já avaliou esta capacitação.'));
  return executar('avaliar_minha', { frequencia_id: frequenciaId, nota: Number(nota), comentario: comentario || '' });
}
