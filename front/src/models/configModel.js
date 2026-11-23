// Model: usuário logado, configurações do sistema e registro de atividades.
import { lerBanco } from './base/banco.js';
import { esperar, executar, logado, pessoaCompleta, podeLogado } from './base/repositorio.js';
import { ErroRegra, LIMITES, limitar } from './regras.js';

// ---------- Usuário atual e configuração ----------
export function usuarioAtual() {
  const b = lerBanco();
  return esperar(pessoaCompleta(b, logado(b)));
}

export function obterConfig() {
  return esperar(lerBanco().config);
}

// Preferências de cada usuário (o Moodle guarda por pessoa); o resto é do sistema todo.
const PESSOAIS = ['idioma', 'notificacoes', 'silencio', 'dois_fatores'];

// Dados do órgão (e demais configurações do sistema): só o Master.
export function salvarConfig(dados) {
  try { limitar('Nome do órgão', dados.nome_orgao, LIMITES.nome_orgao); } catch (e) { return Promise.reject(e); }
  const config = Object.fromEntries(Object.entries(dados).filter(([k]) => !PESSOAIS.includes(k) && k !== 'senha_alterada_em'));
  return executar('salvar_config', config);
}

// Aparência/idioma, notificações e segurança do próprio usuário: qualquer perfil.
export function salvarPreferencias(dados) {
  return executar('salvar_preferencias', Object.fromEntries(PESSOAIS.map((k) => [k, dados[k]])));
}

export function alterarSenha(atual, nova, confirmacao) {
  if (!atual) return Promise.reject(new ErroRegra('Informe a senha atual.'));
  if (nova.length < 8 || !/\d/.test(nova) || !/[A-Za-z]/.test(nova)) {
    return Promise.reject(new ErroRegra('A nova senha precisa ter pelo menos 8 caracteres, com letras e números.'));
  }
  if (nova !== confirmacao) return Promise.reject(new ErroRegra('A confirmação não confere com a nova senha.'));
  return executar('alterar_senha', { atual, nova });
}

export function restaurarDadosDeExemplo() {
  if (!podeLogado(lerBanco(), 'gerenciarestrutura')) return Promise.reject(new ErroRegra('Você não tem permissão para esta ação.'));
  return executar('restaurar_exemplo');
}

export function listarAtividades(limite = 50) {
  const b = lerBanco();
  return esperar(b.atividades.slice(0, limite).map((a) => ({ ...a, usuario: b.pessoas.find((p) => p.id === a.userid)?.nome ?? '—' })));
}
