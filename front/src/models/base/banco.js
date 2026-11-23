// Banco do NUMEP visto pelo front: uma cópia em memória dos dados do Moodle
// (função local_numep_carregar_dados do plugin), recarregada depois de cada gravação.
// Os models leem daqui com lerBanco(); as gravações vão para o Moodle (repositorio.js).
//
// O Moodle guarda datas como timestamp Unix; aqui elas viram texto ISO na hora
// local ("2026-10-20T14:00"), formato que as telas já usavam.
import { chamar } from './moodleApi.js';

const DIA = 24 * 60 * 60 * 1000;

function iso(data) {
  const d = new Date(data);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

// Timestamp do Moodle (segundos) -> texto ISO. Vazio continua vazio.
const deTimestamp = (t) => (t ? iso(t * 1000) : null);

// Texto ISO (ou só a data "AAAA-MM-DD") -> timestamp do Moodle (segundos).
export function paraTimestamp(texto) {
  if (!texto) return null;
  const data = /^\d{4}-\d{2}-\d{2}$/.test(texto) ? `${texto}T12:00` : texto; // meio-dia: sem risco de mudar de dia pelo fuso
  return Math.round(new Date(data).getTime() / 1000);
}

const CAMPOS_DATA = ['criado_em', 'data', 'confirmado_em', 'emitido_em', 'data_evento_snapshot', 'quando'];

function converter(bruto) {
  const banco = { ...bruto };
  for (const [nome, lista] of Object.entries(bruto)) {
    if (!Array.isArray(lista)) continue;
    banco[nome] = lista.map((r) => {
      const x = { ...r };
      for (const c of CAMPOS_DATA) if (c in x) x[c] = deTimestamp(x[c]);
      return x;
    });
  }
  banco.pessoas = banco.pessoas.map((p) => ({ ...p, data_nascimento: p.data_nascimento ? deTimestamp(p.data_nascimento).slice(0, 10) : null }));
  banco.config = { ...bruto.config, senha_alterada_em: deTimestamp(bruto.config.senha_alterada_em) };
  return banco;
}

let cache = null;

export function lerBanco() {
  if (!cache) throw new Error('Os dados do Moodle ainda não foram carregados.');
  return cache;
}

export const bancoCarregado = () => Boolean(cache);

// Busca tudo no Moodle e avisa as telas abertas para se atualizarem.
export async function carregarBanco() {
  const r = await chamar('local_numep_carregar_dados');
  cache = converter(JSON.parse(r.json));
  window.dispatchEvent(new Event('gecap-dados-mudaram'));
  return cache;
}

export function esquecerBanco() {
  cache = null;
}

export { iso, DIA };
