// Regras de negócio do NUMEP no front-end.
// São as mesmas de numep/classes/local/regras.php (plugin do Moodle) e do
// regras_negocio_numep.md. O back-end continua sendo quem garante as regras;
// aqui elas servem para avisar o usuário antes de enviar.

export const PERFIS = [
  { valor: 'master', rotulo: 'Master' },
  { valor: 'diretor', rotulo: 'Diretor' },
  { valor: 'coordenador', rotulo: 'Coordenador' },
  { valor: 'tecnico', rotulo: 'Técnico' },
];

export const FORMACOES = [
  { valor: 'tecnico_medio', rotulo: 'Técnico de nível médio' },
  { valor: 'tecnico_superior', rotulo: 'Técnico de nível superior' },
];

export const MODALIDADES = [
  { valor: 'presencial', rotulo: 'Presencial' },
  { valor: 'ead', rotulo: 'EaD' },
];

export const PUBLICOS_ALVO = [
  { valor: 'rede_geral', rotulo: 'Rede geral' },
  { valor: 'setor', rotulo: 'Setor' },
  { valor: 'unidade', rotulo: 'Unidade' },
];

// Regra 6.1: campos que não podem mudar depois de emitido um certificado.
export const CAMPOS_CRITICOS = ['carga_horaria', 'data', 'capacitacao_id'];

export function rotulo(lista, valor) {
  return lista.find((i) => i.valor === valor)?.rotulo ?? valor;
}

export class ErroRegra extends Error {}

// Regra 2: exatamente um facilitador (interno OU externo).
export function validarFacilitador(evento) {
  const interno = Boolean(evento.facilitador_userid);
  const externo = Boolean(evento.facilitador_nome_externo && evento.facilitador_nome_externo.trim());
  if (interno === externo) {
    throw new ErroRegra('Informe exatamente um facilitador: um profissional da rede ou um nome externo.');
  }
}

export function validarEvento(evento) {
  if (!evento.capacitacao_id) throw new ErroRegra('Escolha a capacitação.');
  if (!evento.local?.trim()) throw new ErroRegra('Informe o local.');
  if (!evento.data) throw new ErroRegra('Informe a data.');
  const ch = Number(evento.carga_horaria);
  if (!Number.isInteger(ch) || ch < 1) throw new ErroRegra('A carga horária deve ser um número inteiro de horas (1 ou mais).');
  if (!MODALIDADES.some((m) => m.valor === evento.modalidade)) throw new ErroRegra('Modalidade inválida.');
  if (!PUBLICOS_ALVO.some((p) => p.valor === evento.publico_alvo)) throw new ErroRegra('Público-alvo inválido.');
  if (evento.publico_alvo !== 'rede_geral' && !(evento.unidades?.length > 0)) {
    throw new ErroRegra('Escolha pelo menos uma unidade (regra 6: a seleção de unidades é sempre manual).');
  }
  validarFacilitador(evento);
}

export function validarNota(nota) {
  const n = Number(nota);
  if (!Number.isInteger(n) || n < 1 || n > 5) throw new ErroRegra('A nota deve ser de 1 a 5.');
}

// Limpa e valida o CPF (dígitos verificadores). Devolve só os 11 dígitos.
export function normalizarCpf(cpf) {
  const d = String(cpf).replace(/\D/g, '');
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) throw new ErroRegra('CPF inválido.');
  for (let t = 9; t < 11; t++) {
    let soma = 0;
    for (let i = 0; i < t; i++) soma += Number(d[i]) * (t + 1 - i);
    const digito = ((10 * soma) % 11) % 10;
    if (Number(d[t]) !== digito) throw new ErroRegra('CPF inválido.');
  }
  return d;
}

export function formatarCpf(d) {
  const s = String(d || '').replace(/\D/g, '');
  return s.length === 11 ? `${s.slice(0, 3)}.${s.slice(3, 6)}.${s.slice(6, 9)}-${s.slice(9)}` : s;
}

// Máscara enquanto digita: 000.000.000-00
export function mascararCpf(valor) {
  let v = String(valor).replace(/\D/g, '').slice(0, 11);
  if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
  else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
  else if (v.length > 3) v = v.replace(/(\d{3})(\d{1,3})/, '$1.$2');
  return v;
}

// Código de verificação do certificado: NUMEP-XXXX-XXXX (sem 0, O, 1 e I).
export function gerarCodigo(existentes) {
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let codigo;
  do {
    const bloco = () => Array.from({ length: 4 }, () => alfabeto[Math.floor(Math.random() * alfabeto.length)]).join('');
    codigo = `NUMEP-${bloco()}-${bloco()}`;
  } while (existentes.has(codigo));
  return codigo;
}

// ---------- Segurança ----------

// Permissões de cada perfil: a mesma matriz de numep/db/install.php.
// Quem decide de verdade é o Moodle (require_capability em cada função da API);
// aqui serve só para a tela esconder ou avisar antes de enviar.
export const PERMISSOES = {
  master: ['gerenciarestrutura', 'gerenciarevento', 'confirmarpresenca', 'verrelatorios', 'participar'],
  diretor: ['gerenciarevento', 'confirmarpresenca', 'verrelatorios', 'participar'],
  coordenador: ['confirmarpresenca', 'verrelatorios', 'participar'],
  tecnico: ['participar'],
};

export function pode(pessoa, permissao) {
  return Boolean(pessoa?.ativo && PERMISSOES[pessoa.perfil]?.includes(permissao));
}

// Telas que cada perfil vê (definido com o NUMEP). O diretor vê só as unidades do
// setor dele (a diretoria), o coordenador só a própria unidade e o técnico só os
// próprios dados: esse recorte é feito pelo Moodle.
const GESTAO = ['master', 'diretor', 'coordenador'];
const TODOS = ['master', 'diretor', 'coordenador', 'tecnico'];
export const TELAS = {
  painel: { caminho: '/admin', perfis: GESTAO },
  capacitacoes: { caminho: '/admin/capacitacoes', perfis: TODOS },
  minhas: { caminho: '/admin/minhas-capacitacoes', perfis: TODOS },
  evento: { caminho: '/admin/eventos', perfis: GESTAO },
  certificados: { caminho: '/admin/certificados', perfis: ['master'] },
  relatorios: { caminho: '/admin/relatorios', perfis: GESTAO },
  equipes: { caminho: '/admin/equipes', perfis: GESTAO },
  unidades: { caminho: '/admin/unidades', perfis: GESTAO },
  configuracoes: { caminho: '/admin/configuracoes', perfis: TODOS },
  perfil: { caminho: '/admin/perfil', perfis: TODOS },
};

export function podeVer(pessoa, tela) {
  return Boolean(pessoa?.ativo && TELAS[tela]?.perfis.includes(pessoa.perfil));
}

// Tela a que um endereço pertence (para esconder links de telas que o perfil não vê).
export function telaDoCaminho(caminho) {
  const limpo = caminho.split('?')[0];
  return Object.entries(TELAS)
    .filter(([, t]) => limpo === t.caminho || (t.caminho !== '/admin' && limpo.startsWith(`${t.caminho}/`)))
    .map(([nome]) => nome)[0] ?? (limpo === '/admin' ? 'painel' : null);
}

// Tamanho máximo de cada campo (o mesmo das colunas do banco / do Moodle).
export const LIMITES = {
  nome: 200, email: 100, telefone: 20, local: 255, titulo: 255, descricao: 2000,
  comentario: 2000, endereco: 255, nome_unidade: 255, nome_cargo: 100, facilitador_nome_externo: 255, nome_orgao: 255,
};

export function limitar(rotuloCampo, valor, max) {
  if (String(valor ?? '').length > max) throw new ErroRegra(`${rotuloCampo}: no máximo ${max} caracteres.`);
}

// CPF parcialmente oculto, para telas e documentos públicos (LGPD): ***.456.789-**
export function ocultarCpf(cpf) {
  const d = String(cpf || '').replace(/\D/g, '');
  return d.length === 11 ? `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**` : '';
}
