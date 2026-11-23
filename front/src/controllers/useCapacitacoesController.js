// Controller de Capacitações: busca, filtro, paginação, capacitação aberta,
// modais de criação/edição, exclusões e exportação.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { excluirCapacitacao, listarCapacitacoes } from '../models/capacitacaoModel.js';
import { excluirEvento } from '../models/eventoModel.js';
import { obterIndicadores } from '../models/relatorioModel.js';
import { useAviso } from './AvisoController.jsx';
import { useDados } from './base/useDados.js';
import { baixarCsv } from './base/exportar.js';

const POR_PAGINA = 4;

export function useCapacitacoesController() {
  const { dados: caps } = useDados(listarCapacitacoes);
  const { dados: ind } = useDados(obterIndicadores);
  const [params, setParams] = useSearchParams();
  const navegar = useNavigate();
  const avisar = useAviso();

  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [pagina, setPagina] = useState(1);
  const [aberta, setAberta] = useState(null);
  const [modalCap, setModalCap] = useState({ aberto: false });
  const [modalEv, setModalEv] = useState({ aberto: false });
  const [confirmar, setConfirmar] = useState(null);

  // Atalhos vindos de outras telas: ?novo=evento, ?novo=capacitacao, ?c=<id>
  useEffect(() => {
    const novo = params.get('novo');
    if (novo === 'evento') setModalEv({ aberto: true });
    if (novo === 'capacitacao') setModalCap({ aberto: true });
    if (params.get('c')) setAberta(Number(params.get('c')));
    if (novo || params.get('c')) setParams({}, { replace: true });
  }, [params, setParams]);

  const filtradas = useMemo(() => {
    if (!caps) return [];
    const t = busca.trim().toLowerCase();
    return caps
      .filter((c) => !t || c.titulo.toLowerCase().includes(t) || c.descricao.toLowerCase().includes(t))
      .filter((c) => filtro === 'todos' || (filtro === 'sem_evento' ? c.eventos.length === 0 : c.eventos.some((e) => e.status === filtro)))
      .sort((a, z) => (z.eventos[0]?.data ?? z.criado_em).localeCompare(a.eventos[0]?.data ?? a.criado_em));
  }, [caps, busca, filtro]);

  useEffect(() => setPagina(1), [busca, filtro]);
  useEffect(() => { if (aberta == null && filtradas[0]) setAberta(filtradas[0].id); }, [filtradas, aberta]);

  const pedirExclusaoEvento = (e, quando) => setConfirmar({
    titulo: 'Excluir evento', mensagem: `Excluir o evento de ${quando}? Os convocados serão removidos.`,
    acao: () => excluirEvento(e.id).then(() => avisar('Evento excluído.')),
  });
  const pedirExclusaoCapacitacao = (c) => setConfirmar({
    titulo: 'Excluir capacitação', mensagem: `Excluir "${c.titulo}"?`,
    acao: () => excluirCapacitacao(c.id).then(() => avisar('Capacitação excluída.')),
  });
  const executarConfirmacao = () => confirmar.acao().catch((e) => avisar(e.message, 'erro'));

  const exportar = () => baixarCsv('capacitacoes.csv', caps.flatMap((c) => (c.eventos.length ? c.eventos : [{}]).map((e) => ({ c, e }))), [
    { titulo: 'Capacitação', valor: ({ c }) => c.titulo },
    { titulo: 'Data do evento', valor: ({ e }) => (e.data ? new Date(e.data).toLocaleString('pt-BR') : '') },
    { titulo: 'Local', valor: ({ e }) => e.local ?? '' },
    { titulo: 'Carga horária (h)', valor: ({ e }) => e.carga_horaria ?? '' },
    { titulo: 'Unidades', valor: ({ e }) => (e.unidades_nomes ?? []).join(', ') || (e.publico_alvo === 'rede_geral' ? 'Rede geral' : '') },
    { titulo: 'Convocados', valor: ({ e }) => e.convocados ?? '' },
    { titulo: 'Presentes', valor: ({ e }) => e.presentes ?? '' },
    { titulo: 'Status', valor: ({ e }) => e.status ?? 'sem evento' },
  ]);

  return {
    carregando: !caps || !ind,
    caps, ind, filtradas,
    visiveis: filtradas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA),
    porPagina: POR_PAGINA,
    realizados: ind ? ind.eventos.filter((e) => e.status !== 'agendado').length : 0,
    busca, setBusca, filtro, setFiltro, pagina, setPagina,
    aberta, alternar: (id) => setAberta((a) => (a === id ? null : id)),
    abrirEvento: (id) => navegar(`/admin/eventos/${id}`),
    modalCap, novaCapacitacao: () => setModalCap({ aberto: true }), editarCapacitacao: (capacitacao) => setModalCap({ aberto: true, capacitacao }),
    fecharModalCap: () => setModalCap({ aberto: false }), capacitacaoSalva: (id) => setAberta(id),
    modalEv, novoEvento: (capacitacaoId) => setModalEv({ aberto: true, capacitacaoId }), editarEvento: (evento) => setModalEv({ aberto: true, evento }),
    fecharModalEv: () => setModalEv({ aberto: false }),
    eventoSalvo: (id) => { if (!modalEv.evento) navegar(`/admin/eventos/${id}`); },
    confirmar, fecharConfirmacao: () => setConfirmar(null), executarConfirmacao,
    pedirExclusaoEvento, pedirExclusaoCapacitacao, exportar,
  };
}
