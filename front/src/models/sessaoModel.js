// Model: login, sessão e permissões do usuário logado. O usuário entra com o login
// e a senha do Moodle; o Moodle devolve uma chave (token) que acompanha todas as
// chamadas da API e decide o que cada perfil recebe e pode fazer.
import { bancoCarregado, carregarBanco, esquecerBanco, lerBanco } from './base/banco.js';
import { entrar, sair, temSessao } from './base/moodleApi.js';
import { logado } from './base/repositorio.js';
import { ErroRegra, TELAS, pode, podeVer, telaDoCaminho } from './regras.js';

// Todo usuário precisa ser um profissional ativo do NUMEP (o admin do Moodle, por exemplo, não é).
function conferirAcesso() {
  const eu = logado(lerBanco());
  if (!eu || !eu.ativo) {
    sairDoSistema();
    throw new ErroRegra('Este usuário não está cadastrado como profissional ativo do NUMEP.');
  }
}

export async function entrarNoSistema(usuario, senha) {
  if (!usuario.trim() || !senha) throw new ErroRegra('Informe usuário e senha.');
  await entrar(usuario, senha);
  try {
    await carregarBanco();
  } catch (e) {
    sairDoSistema();
    throw e;
  }
  conferirAcesso();
}

// Ao recarregar a página: se ainda há token, busca os dados de novo.
export async function retomarSessao() {
  if (bancoCarregado()) return true;
  if (!temSessao()) return false;
  try {
    await carregarBanco();
    conferirAcesso();
    return true;
  } catch {
    sairDoSistema();
    return false;
  }
}

export function sairDoSistema() {
  sair();
  esquecerBanco();
}

// Perfil, unidade e o que o usuário logado pode ver e fazer (só para a tela;
// quem garante de verdade é o Moodle).
export function permissoesAtuais() {
  const eu = bancoCarregado() ? logado(lerBanco()) : null;
  return {
    perfil: eu?.perfil ?? null,
    unidadeId: eu?.unidade_id ?? null,
    pode: (permissao) => pode(eu, permissao),
    podeVer: (tela) => podeVer(eu, tela),
    podeAbrir: (caminho) => { const tela = telaDoCaminho(caminho); return !tela || podeVer(eu, tela); },
  };
}

// Primeira tela depois do login: o Painel para a gestão, Minhas Capacitações para o técnico.
export function telaInicial() {
  return permissoesAtuais().podeVer('painel') ? TELAS.painel.caminho : TELAS.minhas.caminho;
}
