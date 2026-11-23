// Model: consulta e verificação de certificados, e os textos do certificado do NUMEP.
import { lerBanco } from './base/banco.js';
import { chamarPublico } from './base/moodleApi.js';
import { esperar, executar } from './base/repositorio.js';
import { ErroRegra } from './regras.js';

// Modelo padrão (o mesmo de numep/classes/model/configuracao.php). Marcadores:
// {nome}, {evento}, {data} (dd/mm/aaaa) e {carga_horaria} ("6 (seis) horas").
export const MODELO_PADRAO = {
  abertura: 'O Núcleo Municipal de Educação Permanente do SUAS - NUMEP/SUAS certifica que',
  participante: 'participou do {evento}, no dia {data}, perfazendo uma carga horária de {carga_horaria}.',
  facilitador: 'atuou como facilitador(a) do {evento}, no dia {data}, perfazendo uma carga horária de {carga_horaria}.',
  cidade: 'Patos de Minas',
};

export const MARCADORES = [
  ['{nome}', 'nome de quem recebe'],
  ['{evento}', 'título da capacitação'],
  ['{data}', 'data do evento (dd/mm/aaaa)'],
  ['{carga_horaria}', 'ex.: 6 (seis) horas'],
];

// ---------- Números e datas por extenso (padrão do certificado) ----------
const UNIDADES = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze',
  'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
const DEZENAS = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
const CENTENAS = ['', 'cento', 'duzentas', 'trezentas', 'quatrocentas', 'quinhentas', 'seiscentas', 'setecentas', 'oitocentas', 'novecentas'];
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

// Até 999, no feminino (concorda com "horas"): 1 → uma, 2 → duas, 21 → vinte e uma.
export function horasPorExtenso(n) {
  const feminino = (u) => (u === 1 ? 'uma' : u === 2 ? 'duas' : UNIDADES[u]);
  const ate99 = (x) => (x < 20 ? feminino(x) : DEZENAS[Math.floor(x / 10)] + (x % 10 ? ` e ${feminino(x % 10)}` : ''));
  if (n === 0) return 'zero';
  if (n === 100) return 'cem';
  const c = Math.floor(n / 100);
  const resto = n % 100;
  return [CENTENAS[c], resto ? ate99(resto) : ''].filter(Boolean).join(' e ');
}

export const cargaHoraria = (h) => `${h} (${horasPorExtenso(h)}) ${h === 1 ? 'hora' : 'horas'}`;

const dataCurta = (v) => new Date(v).toLocaleDateString('pt-BR');
const dataPorExtenso = (v) => { const d = new Date(v); return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`; };

// Textos prontos do certificado, com os marcadores trocados pelos dados.
export function textosDoCertificado(cert, modelo = MODELO_PADRAO) {
  const m = { ...MODELO_PADRAO, ...modelo };
  const valores = {
    '{nome}': cert.nome,
    '{evento}': cert.titulo_evento_snapshot,
    '{data}': cert.data_evento_snapshot ? dataCurta(cert.data_evento_snapshot) : '',
    '{carga_horaria}': cert.carga_horaria_snapshot ? cargaHoraria(cert.carga_horaria_snapshot) : '',
  };
  const preencher = (texto) => Object.entries(valores).reduce((t, [chave, valor]) => t.split(chave).join(valor ?? ''), texto);
  return {
    abertura: preencher(m.abertura),
    nome: cert.nome,
    corpo: preencher(cert.tipo === 'facilitador' ? m.facilitador : m.participante),
    local: `${m.cidade}, ${dataPorExtenso(cert.emitido_em)}.`,
  };
}

// ---------- Certificados ----------
// Consulta pública pelo código (funciona sem login): local_numep_verificar_certificado.
// O Moodle devolve só o CPF parcialmente oculto, nunca o número completo (LGPD).
export async function buscarCertificado(codigo) {
  const limpo = String(codigo).toUpperCase().replace(/[^A-Z0-9-]/g, '');
  if (!limpo) return null;
  const c = await chamarPublico('local_numep_verificar_certificado', { codigo: limpo });
  if (!c.encontrado) return null;
  const quando = (t) => new Date(t * 1000).toISOString();
  return {
    tipo: c.tipo,
    codigo_verificacao: c.codigo,
    nome: c.nome,
    cpf_oculto: c.cpf_oculto,
    titulo_evento_snapshot: c.titulo,
    carga_horaria_snapshot: c.carga_horaria,
    data_evento_snapshot: quando(c.data),
    emitido_em: quando(c.emitido_em),
    nome_orgao: c.nome_orgao,
    modelo: JSON.parse(c.modelo || '{}'),
  };
}

export function listarCertificados() {
  const b = lerBanco();
  const part = b.certificados.map((c) => {
    const f = b.frequencias.find((x) => x.id === c.frequencia_id);
    const p = b.pessoas.find((x) => x.id === f?.userid);
    return { ...c, tipo: 'participante', userid: p?.id ?? null, nome: p?.nome ?? '—', unidade_nome: b.unidades.find((u) => u.id === p?.unidade_id)?.nome ?? '—', evento_id: f?.evento_id };
  });
  const fac = b.certificadosFacilitador.map((c) => {
    const ev = b.eventos.find((e) => e.id === c.evento_id);
    return { ...c, tipo: 'facilitador', userid: ev?.facilitador_userid ?? null, nome: c.nome_facilitador_snapshot, unidade_nome: '—', carga_horaria_snapshot: ev?.carga_horaria, data_evento_snapshot: ev?.data };
  });
  return esperar([...part, ...fac].sort((a, z) => z.emitido_em.localeCompare(a.emitido_em)));
}

// ---------- Modelo do certificado (só o Master edita) ----------
export function obterModeloCertificado() {
  return esperar({ ...MODELO_PADRAO, ...(lerBanco().config.certificado ?? {}) });
}

export function salvarModeloCertificado(modelo) {
  for (const [chave, texto] of Object.entries(modelo)) {
    if (!String(texto ?? '').trim()) return Promise.reject(new ErroRegra('Preencha todos os textos do certificado.'));
    if (String(texto).length > 600) return Promise.reject(new ErroRegra(`O texto "${chave}" passa de 600 caracteres.`));
  }
  const { senha_alterada_em: _, ...config } = lerBanco().config;
  return executar('salvar_config', { ...config, certificado: modelo });
}
