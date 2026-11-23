// Model: estrutura da rede (SETOR, UNIDADE e CARGO_TAG).
import { lerBanco } from './base/banco.js';
import { esperar, executar } from './base/repositorio.js';
import { ErroRegra, LIMITES, limitar } from './regras.js';

// ---------- Estrutura: setores, unidades, cargos ----------
export function listarSetores() { return esperar(lerBanco().setores); }

export function listarCargos() { return esperar(lerBanco().cargos); }

export function listarUnidades() {
  const b = lerBanco();
  return esperar(b.unidades.map((u) => ({
    ...u,
    setor_nome: b.setores.find((s) => s.id === u.setor_id)?.nome ?? '—',
    profissionais: b.pessoas.filter((p) => p.unidade_id === u.id && p.ativo).length,
  })));
}

// Unidades com a equipe de cada uma (tela Gestão de Unidades e Órgãos): coordenadores
// primeiro, depois por nome. O coordenador só recebe do Moodle as pessoas da própria unidade.
export function listarUnidadesComEquipes() {
  const b = lerBanco();
  const ordem = { master: 1, diretor: 1, coordenador: 0, tecnico: 2 };
  return esperar(b.unidades.map((u) => ({
    ...u,
    setor_nome: b.setores.find((s) => s.id === u.setor_id)?.nome ?? '—',
    equipe: b.pessoas.filter((p) => p.unidade_id === u.id)
      .map((p) => ({ id: p.id, nome: p.nome, email: p.email, perfil: p.perfil, ativo: p.ativo, cargo_nome: b.cargos.find((c) => c.id === p.cargo_tag_id)?.nome ?? '—' }))
      .sort((a, z) => (ordem[a.perfil] - ordem[z.perfil]) || a.nome.localeCompare(z.nome)),
  })));
}

export function salvarUnidade(dados) {
  if (!dados.nome?.trim()) return Promise.reject(new ErroRegra('Informe o nome da unidade.'));
  try { limitar('Nome', dados.nome, LIMITES.nome_unidade); limitar('Endereço', dados.endereco, LIMITES.endereco); } catch (e) { return Promise.reject(e); }
  if (!dados.setor_id) return Promise.reject(new ErroRegra('Escolha o setor.'));
  return executar('salvar_unidade', { id: dados.id || null, nome: dados.nome.trim(), setor_id: Number(dados.setor_id), endereco: dados.endereco || '' });
}

export function excluirUnidade(id) {
  const b = lerBanco();
  if (b.pessoas.some((p) => p.unidade_id === id)) return Promise.reject(new ErroRegra('Há profissionais lotados nesta unidade. Transfira-os antes de excluir.'));
  if (b.eventos.some((e) => e.unidades.includes(id))) return Promise.reject(new ErroRegra('Esta unidade está ligada a eventos e não pode ser excluída.'));
  return executar('excluir_unidade', { id });
}

export function salvarCargo(dados) {
  const nome = dados.nome?.trim();
  if (!nome) return Promise.reject(new ErroRegra('Informe o nome do cargo.'));
  if (nome.length > LIMITES.nome_cargo) return Promise.reject(new ErroRegra(`Nome do cargo: no máximo ${LIMITES.nome_cargo} caracteres.`));
  const b = lerBanco();
  if (b.cargos.some((c) => c.nome.toLowerCase() === nome.toLowerCase() && c.id !== dados.id)) {
    return Promise.reject(new ErroRegra('Já existe um cargo com esse nome.'));
  }
  return executar('salvar_cargo', { id: dados.id || null, nome });
}

export function excluirCargo(id) {
  const b = lerBanco();
  if (b.pessoas.some((p) => p.cargo_tag_id === id)) return Promise.reject(new ErroRegra('Há profissionais com este cargo. Troque o cargo deles antes de excluir.'));
  return executar('excluir_cargo', { id });
}
