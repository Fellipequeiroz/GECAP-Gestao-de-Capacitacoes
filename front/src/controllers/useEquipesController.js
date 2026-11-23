// Controllers da tela Equipes: um para a página (abas e modal) e um para cada aba
// (profissionais, unidades, cargos).
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { excluirCargo, excluirUnidade, listarCargos, listarSetores, listarUnidades, salvarCargo, salvarUnidade } from '../models/estruturaModel.js';
import { alternarAtivo, listarProfissionais } from '../models/profissionalModel.js';
import { FORMACOES, PERFIS, formatarCpf, rotulo } from '../models/regras.js';
import { useAviso } from './AvisoController.jsx';
import { useDados } from './base/useDados.js';
import { baixarCsv } from './base/exportar.js';

const POR_PAGINA = 8;

export function useEquipesController() {
  const { dados: pessoas } = useDados(listarProfissionais);
  const { dados: unidades } = useDados(listarUnidades);
  const { dados: setores } = useDados(listarSetores);
  const { dados: cargos } = useDados(listarCargos);
  const [params, setParams] = useSearchParams();
  const [aba, setAba] = useState('profissionais');
  const [modal, setModal] = useState({ aberto: false });

  // Atalhos: ?novo=1 (Dashboard), ?id=<profissional> (busca), ?aba=unidades
  useEffect(() => {
    if (params.get('novo')) setModal({ aberto: true });
    if (params.get('aba')) setAba(params.get('aba'));
    if (params.get('id') && pessoas) {
      const p = pessoas.find((x) => x.id === Number(params.get('id')));
      if (p) setModal({ aberto: true, profissional: p });
    }
    if ([...params.keys()].length && (pessoas || !params.get('id'))) setParams({}, { replace: true });
  }, [params, setParams, pessoas]);

  return {
    carregando: !pessoas || !unidades || !setores || !cargos,
    pessoas, unidades, setores, cargos,
    aba, setAba,
    abas: pessoas && unidades && cargos ? [
      { valor: 'profissionais', rotulo: 'Profissionais', qtd: pessoas.filter((p) => p.ativo).length },
      { valor: 'unidades', rotulo: 'Unidades', qtd: unidades.length },
      { valor: 'cargos', rotulo: 'Cargos', qtd: cargos.length },
    ] : [],
    modal,
    novoProfissional: () => setModal({ aberto: true }),
    editarProfissional: (profissional) => setModal({ aberto: true, profissional }),
    fecharModal: () => setModal({ aberto: false }),
  };
}

export function useProfissionaisController(pessoas) {
  const avisar = useAviso();
  const [busca, setBusca] = useState('');
  const [unidade, setUnidade] = useState('');
  const [perfil, setPerfil] = useState('');
  const [situacao, setSituacao] = useState('ativos');
  const [pagina, setPagina] = useState(1);
  const [agrupar, setAgrupar] = useState('cargo');

  const lista = useMemo(() => {
    const t = busca.trim().toLowerCase();
    const d = t.replace(/\D/g, '');
    return pessoas
      .filter((p) => !t || p.nome.toLowerCase().includes(t) || p.email.toLowerCase().includes(t) || (d.length >= 3 && p.cpf.includes(d)))
      .filter((p) => !unidade || p.unidade_id === Number(unidade))
      .filter((p) => !perfil || p.perfil === perfil)
      .filter((p) => situacao === 'todos' || (situacao === 'ativos' ? p.ativo : !p.ativo))
      .sort((a, z) => a.nome.localeCompare(z.nome));
  }, [pessoas, busca, unidade, perfil, situacao]);
  useEffect(() => setPagina(1), [busca, unidade, perfil, situacao]);

  const ativos = pessoas.filter((p) => p.ativo);
  const convocacoes = ativos.reduce((s, p) => s + p.convocacoes, 0);
  const participacoes = ativos.reduce((s, p) => s + p.participacoes, 0);
  const distribuicao = (agrupar === 'cargo'
    ? [...new Set(ativos.map((p) => p.cargo_nome))].map((c) => ({ grupo: c, qtd: ativos.filter((p) => p.cargo_nome === c).length }))
    : PERFIS.map((p) => ({ grupo: p.rotulo, qtd: ativos.filter((x) => x.perfil === p.valor).length }))
  ).filter((d) => d.qtd).sort((a, z) => z.qtd - a.qtd);

  const exportar = () => baixarCsv('profissionais.csv', lista, [
    { titulo: 'Nome', valor: 'nome' }, { titulo: 'CPF', valor: (p) => formatarCpf(p.cpf) }, { titulo: 'E-mail', valor: 'email' },
    { titulo: 'Telefone', valor: 'telefone' }, { titulo: 'Formação', valor: (p) => rotulo(FORMACOES, p.formacao) }, { titulo: 'Cargo', valor: 'cargo_nome' },
    { titulo: 'Perfil', valor: (p) => rotulo(PERFIS, p.perfil) }, { titulo: 'Unidade', valor: 'unidade_nome' }, { titulo: 'Situação', valor: (p) => (p.ativo ? 'Ativo' : 'Inativo') },
    { titulo: 'Participações', valor: 'participacoes' },
  ]);
  const alternar = (p) => alternarAtivo(p.id)
    .then((ativo) => avisar(ativo ? 'Acesso reativado.' : 'Acesso desativado.'))
    .catch((e) => avisar(e.message, 'erro'));

  return {
    lista, visiveis: lista.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA), porPagina: POR_PAGINA,
    totalAtivos: ativos.length,
    presencaEquipe: convocacoes ? participacoes / convocacoes : 0,
    distribuicao, agrupar, setAgrupar,
    recentes: [...pessoas].sort((a, z) => z.criado_em.localeCompare(a.criado_em)).slice(0, 4),
    busca, setBusca, unidade, setUnidade, perfil, setPerfil, situacao, setSituacao, pagina, setPagina,
    exportar, alternar,
  };
}

export function useUnidadesController(unidades, setores) {
  const avisar = useAviso();
  const [form, setForm] = useState(null);
  const [erro, setErro] = useState('');
  const [excluir, setExcluir] = useState(null);
  const salvar = async (e) => {
    e.preventDefault();
    try { await salvarUnidade(form); avisar('Unidade salva.'); setForm(null); } catch (err) { setErro(err.message); }
  };
  return {
    grafico: unidades.map((u) => ({ unidade: u.nome.replace('Secretaria Municipal de Assistência Social', 'Secretaria'), qtd: u.profissionais })),
    form, erro,
    nova: () => { setErro(''); setForm({ nome: '', setor_id: setores[0]?.id ?? '', endereco: '' }); },
    editar: (u) => { setErro(''); setForm({ ...u }); },
    mudar: (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value })),
    fecharForm: () => setForm(null),
    salvar,
    excluir, pedirExclusao: setExcluir, fecharExclusao: () => setExcluir(null),
    confirmarExclusao: () => excluirUnidade(excluir.id).then(() => avisar('Unidade excluída.')).catch((e) => avisar(e.message, 'erro')),
  };
}

export function useCargosController(pessoas) {
  const avisar = useAviso();
  const [novo, setNovo] = useState('');
  const [editando, setEditando] = useState(null);
  const salvar = (dados) => salvarCargo(dados)
    .then(() => { avisar('Cargo salvo.'); setNovo(''); setEditando(null); })
    .catch((e) => avisar(e.message, 'erro'));
  return {
    novo, setNovo, editando, setEditando,
    contar: (id) => pessoas.filter((p) => p.cargo_tag_id === id && p.ativo).length,
    adicionar: (e) => { e.preventDefault(); salvar({ nome: novo }); },
    salvarEdicao: (e) => { e.preventDefault(); salvar(editando); },
    excluir: (c) => excluirCargo(c.id).then(() => avisar('Cargo excluído.')).catch((e) => avisar(e.message, 'erro')),
  };
}
