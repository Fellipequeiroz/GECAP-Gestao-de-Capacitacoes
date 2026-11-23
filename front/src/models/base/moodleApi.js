// Comunicação com o Moodle (plugin local_numep) pela API REST de serviços web.
// Só os models usam este arquivo. Endereço do Moodle: variável VITE_MOODLE_URL
// (padrão "/moodle", que o Vite repassa para http://localhost:8080 em vite.config.js).
import { ErroRegra } from '../regras.js';

const BASE = import.meta.env.VITE_MOODLE_URL || '/moodle';
const SERVICO = 'numep_app';
const CHAVE_TOKEN = 'gecap-numep-token';

export const temSessao = () => Boolean(lerToken());

function lerToken() {
  try { return sessionStorage.getItem(CHAVE_TOKEN); } catch { return null; }
}

function gravarToken(token) {
  try {
    if (token) sessionStorage.setItem(CHAVE_TOKEN, token);
    else sessionStorage.removeItem(CHAVE_TOKEN);
  } catch {
    // Sem sessionStorage (ex.: bloqueado pelo navegador): a sessão dura até recarregar a página.
  }
}

// Transforma {a: 1, ids: [1, 2]} em a=1&ids[0]=1&ids[1]=2 (formato que o REST do Moodle entende).
function formulario(params, prefixo = '', corpo = new URLSearchParams()) {
  for (const [k, v] of Object.entries(params)) {
    const nome = prefixo ? `${prefixo}[${k}]` : k;
    if (v == null) continue;
    if (typeof v === 'object') formulario(v, nome, corpo);
    else corpo.append(nome, typeof v === 'boolean' ? Number(v) : v);
  }
  return corpo;
}

async function postar(caminho, corpo) {
  let resposta;
  try {
    resposta = await fetch(`${BASE}${caminho}`, { method: 'POST', body: corpo });
  } catch {
    throw new ErroRegra('Não foi possível falar com o Moodle. Confira se ele está ligado.');
  }
  const json = await resposta.json().catch(() => null);
  if (!resposta.ok || !json) throw new ErroRegra(`O Moodle respondeu com erro (${resposta.status}).`);
  return json;
}

// Login: troca usuário e senha do Moodle por uma chave (token) do serviço numep_app.
export async function entrar(usuario, senha) {
  const r = await postar('/login/token.php', formulario({ username: usuario.trim().toLowerCase(), password: senha, service: SERVICO }));
  if (!r.token) {
    throw new ErroRegra(r.errorcode === 'invalidlogin'
      ? 'Usuário ou senha incorretos. Depois de 5 tentativas erradas, a conta fica bloqueada por 30 minutos.'
      : r.error || 'Não foi possível entrar.');
  }
  gravarToken(r.token);
}

// Sair: apaga o token no Moodle (ação "sair" do plugin) e no navegador.
// O pedido segue mesmo se a página mudar logo depois (keepalive); se falhar,
// o token ainda vence sozinho no prazo do Moodle.
export function sair() {
  const token = lerToken();
  gravarToken(null);
  if (!token) return;
  fetch(`${BASE}/webservice/rest/server.php?moodlewsrestformat=json`, {
    method: 'POST',
    keepalive: true,
    body: formulario({ wstoken: token, wsfunction: 'local_numep_executar', acao: 'sair', dados: JSON.stringify({ token }) }),
  }).catch(() => {});
}

// Chama uma função do serviço web com o token do usuário logado.
export async function chamar(funcao, params = {}) {
  const token = lerToken();
  if (!token) throw new ErroRegra('Sessão encerrada. Entre de novo.');
  const r = await postar('/webservice/rest/server.php?moodlewsrestformat=json',
    formulario({ wstoken: token, wsfunction: funcao, ...params }));
  if (r && r.exception) {
    if (r.errorcode === 'invalidtoken' || r.errorcode === 'accessexception') {
      sair();
      window.dispatchEvent(new Event('gecap-sessao-encerrada'));
    }
    throw new ErroRegra(r.message || 'Erro no Moodle.');
  }
  return r;
}

// Chama uma função pública (sem login), como a verificação de certificado.
export async function chamarPublico(funcao, args = {}) {
  const r = await postar('/lib/ajax/service-nologin.php',
    JSON.stringify([{ index: 0, methodname: funcao, args }]));
  if (r[0]?.error) throw new ErroRegra(r[0].exception?.message || 'Erro no Moodle.');
  return r[0].data;
}
