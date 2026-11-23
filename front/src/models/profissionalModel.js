// Model: profissionais (PESSOA + usuário do Moodle).
import { lerBanco, paraTimestamp } from './base/banco.js';
import { esperar, executar, logado, pessoaCompleta, podeLogado } from './base/repositorio.js';
import { ErroRegra, FORMACOES, LIMITES, PERFIS, limitar, normalizarCpf } from './regras.js';

// ---------- Profissionais (usuário + pessoa) ----------
export function listarProfissionais() {
  const b = lerBanco();
  return esperar(b.pessoas.map((p) => {
    const freq = b.frequencias.filter((f) => f.userid === p.id);
    return {
      ...pessoaCompleta(b, p),
      convocacoes: freq.length,
      participacoes: freq.filter((f) => f.presente).length,
    };
  }));
}

export function obterProfissional(id) {
  const b = lerBanco();
  const p = b.pessoas.find((x) => x.id === id);
  return esperar(p ? pessoaCompleta(b, p) : null);
}

export function salvarProfissional(dados) {
  try {
    if (!dados.nome?.trim() || dados.nome.trim().split(/\s+/).length < 2) throw new ErroRegra('Informe o nome completo.');
    limitar('Nome', dados.nome.trim(), LIMITES.nome);
    limitar('E-mail', dados.email, LIMITES.email);
    limitar('Telefone', dados.telefone, LIMITES.telefone);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(dados.email || '')) throw new ErroRegra('E-mail inválido.');
    if (!FORMACOES.some((f) => f.valor === dados.formacao)) throw new ErroRegra('Escolha a formação.');
    if (!PERFIS.some((p) => p.valor === dados.perfil)) throw new ErroRegra('Escolha o perfil de acesso.');
    if (!dados.unidade_id) throw new ErroRegra('Escolha a unidade.');
    dados = { ...dados, cpf: normalizarCpf(dados.cpf) };
  } catch (e) {
    return Promise.reject(e);
  }
  const b = lerBanco();
  if (b.pessoas.some((p) => p.cpf === dados.cpf && p.id !== dados.id)) return Promise.reject(new ErroRegra('Já existe um profissional com este CPF.'));
  if (b.pessoas.some((p) => p.email.toLowerCase() === dados.email.toLowerCase() && p.id !== dados.id)) return Promise.reject(new ErroRegra('Já existe um profissional com este e-mail.'));
  const eu = logado(b);
  const proprio = dados.id && dados.id === eu?.id;
  if (!podeLogado(b, 'gerenciarestrutura') && !proprio) return Promise.reject(new ErroRegra('Você não tem permissão para esta ação.'));
  return executar('salvar_profissional', {
    id: dados.id || null,
    nome: dados.nome.trim(),
    email: dados.email.trim(),
    cpf: dados.cpf,
    data_nascimento: paraTimestamp(dados.data_nascimento),
    telefone: dados.telefone || '',
    formacao: dados.formacao,
    perfil: dados.perfil,
    unidade_id: Number(dados.unidade_id),
    cargo_tag_id: dados.cargo_tag_id ? Number(dados.cargo_tag_id) : null,
    ativo: dados.ativo !== false,
  });
}

export function alternarAtivo(id) {
  if (id === lerBanco().usuarioAtualId) return Promise.reject(new ErroRegra('Você não pode desativar o próprio acesso.'));
  return executar('alternar_ativo', { id });
}
