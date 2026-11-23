// Model: indicadores, dados para relatórios e busca geral.
import { lerBanco } from './base/banco.js';
import { esperar, mediaEmEstrelas, pessoaCompleta, eventoCompleto } from './base/repositorio.js';

// ---------- Indicadores para Dashboard e Relatórios ----------
export function obterIndicadores() {
  const b = lerBanco();
  const eventos = b.eventos.map((e) => eventoCompleto(b, e));
  const pessoasAtivas = b.pessoas.filter((p) => p.ativo);
  const passados = eventos.filter((e) => new Date(e.data).getTime() <= Date.now());
  const convocados = passados.reduce((s, e) => s + e.convocados, 0);
  const presentes = passados.reduce((s, e) => s + e.presentes, 0);
  const notas = b.avaliacoes.map((a) => a.nota);

  return esperar({
    profissionais_ativos: pessoasAtivas.length,
    profissionais_novos_30d: b.pessoas.filter((p) => Date.now() - new Date(p.criado_em).getTime() < 30 * 864e5).length,
    capacitacoes: b.capacitacoes.length,
    eventos_total: eventos.length,
    eventos_agendados: eventos.filter((e) => e.status === 'agendado').length,
    eventos_pendentes: eventos.filter((e) => e.status === 'aguardando_presenca' || e.status === 'realizado'),
    taxa_presenca: convocados ? presentes / convocados : 0,
    horas_ofertadas: eventos.filter((e) => e.encerrado).reduce((s, e) => s + e.carga_horaria, 0),
    horas_certificadas: b.certificados.reduce((s, c) => s + c.carga_horaria_snapshot, 0),
    certificados: b.certificados.length + b.certificadosFacilitador.length,
    nota_media: mediaEmEstrelas(notas),
    avaliacoes: notas.length,
    proximos: eventos.filter((e) => e.status === 'agendado').sort((a, z) => a.data.localeCompare(z.data)),
    eventos,
  });
}

// Dados "crus" para os gráficos (as telas agregam conforme o filtro escolhido).
export function obterDadosRelatorio() {
  const b = lerBanco();
  return esperar({
    eventos: b.eventos.map((e) => eventoCompleto(b, e)),
    frequencias: b.frequencias,
    avaliacoes: b.avaliacoes,
    certificados: b.certificados,
    pessoas: b.pessoas.map((p) => pessoaCompleta(b, p)),
    unidades: b.unidades,
    setores: b.setores,
    cargos: b.cargos,
  });
}

// Busca do cabeçalho: profissionais, capacitações, eventos e unidades.
export function buscarGeral(texto) {
  const t = texto.trim().toLowerCase();
  if (t.length < 2) return esperar([]);
  const b = lerBanco();
  const tem = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .includes(t.normalize('NFD').replace(/[̀-ͯ]/g, ''));
  const r = [];
  for (const p of b.pessoas) if (tem(p.nome) || tem(p.email) || p.cpf.includes(t.replace(/\D/g, '') || '#')) r.push({ tipo: 'Profissional', titulo: p.nome, sub: p.email, link: `/admin/equipes?id=${p.id}` });
  for (const c of b.capacitacoes) if (tem(c.titulo)) r.push({ tipo: 'Capacitação', titulo: c.titulo, sub: `${b.eventos.filter((e) => e.capacitacao_id === c.id).length} evento(s)`, link: `/admin/capacitacoes?c=${c.id}` });
  for (const u of b.unidades) if (tem(u.nome)) r.push({ tipo: 'Unidade', titulo: u.nome, sub: b.setores.find((s) => s.id === u.setor_id)?.nome, link: `/admin/equipes?aba=unidades` });
  for (const e of b.eventos) {
    const titulo = b.capacitacoes.find((c) => c.id === e.capacitacao_id)?.titulo;
    if (tem(titulo) || tem(e.local)) r.push({ tipo: 'Evento', titulo, sub: `${new Date(e.data).toLocaleDateString('pt-BR')} · ${e.local}`, link: `/admin/eventos/${e.id}` });
  }
  return esperar(r.slice(0, 12));
}

// ---------- Cálculos (regras de negócio dos indicadores, sem tela) ----------

const MESES_CURTOS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const DIA = 864e5;

// Presenças confirmadas por mês (últimos 6) ou por semana (últimas 12).
export function seriePresencas(rel, periodo) {
  const hoje = new Date();
  const baldes = [];
  if (periodo === 'meses') {
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      baldes.push({ rotulo: i === 0 ? 'ESTE MÊS' : MESES_CURTOS[d.getMonth()], ini: d, fim: new Date(d.getFullYear(), d.getMonth() + 1, 1) });
    }
  } else {
    const inicioSemana = new Date(hoje); inicioSemana.setHours(0, 0, 0, 0); inicioSemana.setDate(hoje.getDate() - hoje.getDay());
    for (let i = 11; i >= 0; i--) {
      const ini = new Date(inicioSemana.getTime() - i * 7 * DIA);
      baldes.push({ rotulo: i === 0 ? 'ESTA SEM.' : `${ini.getDate()}/${ini.getMonth() + 1}`, ini, fim: new Date(ini.getTime() + 7 * DIA) });
    }
  }
  const dataEvento = new Map(rel.eventos.map((e) => [e.id, new Date(e.data)]));
  return baldes.map((b) => {
    const noPeriodo = rel.frequencias.filter((f) => { const d = dataEvento.get(f.evento_id); return d >= b.ini && d < b.fim && d <= hoje; });
    return { periodo: b.rotulo, presencas: noPeriodo.filter((f) => f.presente).length, convocados: noPeriodo.length };
  });
}

// Indicadores de um período (meses = 0: todo o período), filtrados por setor.
// deslocamento = 1 calcula o período anterior de mesmo tamanho (para comparar).
export function indicadoresDoPeriodo(rel, meses, setor, deslocamento = 0) {
  const fim = Date.now() - deslocamento * meses * 30 * DIA;
  const ini = meses ? fim - meses * 30 * DIA : 0;
  const unidadesSetor = new Set(rel.unidades.filter((u) => !setor || u.setor_id === setor).map((u) => u.id));
  const pessoaUnidade = new Map(rel.pessoas.map((p) => [p.id, p.unidade_id]));
  const eventos = rel.eventos.filter((e) => {
    const t = new Date(e.data).getTime();
    return t >= ini && t <= fim && (!setor || e.publico_alvo === 'rede_geral' || e.unidades.some((u) => unidadesSetor.has(u)));
  });
  const ids = new Set(eventos.map((e) => e.id));
  const freq = rel.frequencias.filter((f) => ids.has(f.evento_id) && unidadesSetor.has(pessoaUnidade.get(f.userid)));
  const freqIds = new Set(freq.map((f) => f.id));
  const notas = rel.avaliacoes.filter((a) => freqIds.has(a.frequencia_id));
  const presentes = freq.filter((f) => f.presente).length;
  return {
    eventos, freq, notas, unidadesSetor, ini,
    realizados: eventos.length,
    presentes,
    taxa: freq.length ? presentes / freq.length : null,
    nota: mediaEmEstrelas(notas.map((a) => a.nota)),
    horas: rel.certificados.filter((c) => freqIds.has(c.frequencia_id)).reduce((s, c) => s + c.carga_horaria_snapshot, 0),
  };
}

// Dados dos gráficos de Relatórios a partir dos indicadores do período.
export function dadosDosGraficos(rel, r, meses, formacoes) {
  const nMeses = meses || 12;
  const hoje = new Date();
  const porMes = Array.from({ length: nMeses }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - (nMeses - 1 - i), 1);
    return { mes: `${MESES[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`, ini: d, fim: new Date(d.getFullYear(), d.getMonth() + 1, 1), convocados: 0, presentes: 0 };
  });
  const dataEv = new Map(r.eventos.map((e) => [e.id, new Date(e.data)]));
  for (const f of r.freq) {
    const d = dataEv.get(f.evento_id);
    const m = porMes.find((x) => d >= x.ini && d < x.fim);
    if (m && d <= hoje) { m.convocados += 1; if (f.presente) m.presentes += 1; }
  }
  const pessoa = new Map(rel.pessoas.map((p) => [p.id, p]));
  // Regra 9.1: nota média por unidade calculada por consulta, sem campo extra no banco.
  const unidades = rel.unidades.filter((u) => r.unidadesSetor.has(u.id)).map((u) => {
    const fu = r.freq.filter((f) => pessoa.get(f.userid)?.unidade_id === u.id && dataEv.get(f.evento_id) <= hoje);
    const ids = new Set(fu.map((f) => f.id));
    const nu = r.notas.filter((a) => ids.has(a.frequencia_id));
    return {
      unidade: u.nome.replace('Secretaria Municipal de Assistência Social', 'Secretaria'),
      taxa: fu.length ? Math.round((fu.filter((f) => f.presente).length / fu.length) * 1000) / 10 : 0,
      nota: mediaEmEstrelas(nu.map((a) => a.nota)),
      avaliacoes: nu.length,
    };
  }).filter((u) => u.taxa > 0 || u.nota != null);
  const formacao = formacoes.map((f) => ({ nome: f.rotulo, valor: r.freq.filter((x) => x.presente && pessoa.get(x.userid)?.formacao === f.valor).length }));
  const porCap = new Map();
  for (const e of r.eventos) porCap.set(e.titulo, (porCap.get(e.titulo) || 0) + e.presentes * e.carga_horaria);
  const horas = [...porCap].map(([capacitacao, h]) => ({ capacitacao, horas: h })).filter((x) => x.horas).sort((a, z) => z.horas - a.horas);
  return { porMes, unidades, formacao, horas };
}
