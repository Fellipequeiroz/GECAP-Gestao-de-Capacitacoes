// Controller da tela do evento: lista de convocados (busca, filtro, paginação,
// seleção), confirmação de presença, encerramento, exclusão e exportação.
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { encerrarEvento, excluirEvento, obterEvento } from '../models/eventoModel.js';
import { confirmarPresenca, removerParticipante } from '../models/frequenciaModel.js';
import { useAviso } from './AvisoController.jsx';
import { useDados } from './base/useDados.js';
import { baixarCsv } from './base/exportar.js';
import { usePermissoes } from './usePermissoes.js';

const POR_PAGINA = 10;

export function useEventoController() {
  const id = Number(useParams().id);
  const { dados: ev, carregando } = useDados(() => obterEvento(id), [id]);
  const navegar = useNavigate();
  const avisar = useAviso();
  const { pode } = usePermissoes();
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [pagina, setPagina] = useState(1);
  const [sel, setSel] = useState(new Set());
  const [editar, setEditar] = useState(false);
  const [adicionar, setAdicionar] = useState(false);
  const [avaliar, setAvaliar] = useState(null);
  const [confirmar, setConfirmar] = useState(null);

  const lista = useMemo(() => {
    if (!ev) return [];
    const t = busca.trim().toLowerCase();
    return ev.participantes
      .filter((p) => !t || p.nome.toLowerCase().includes(t) || p.email.toLowerCase().includes(t) || p.unidade_nome.toLowerCase().includes(t))
      .filter((p) => filtro === 'todos' || (filtro === 'presentes' ? p.presente : !p.presente));
  }, [ev, busca, filtro]);

  const aconteceu = ev ? new Date(ev.data).getTime() <= Date.now() : false;
  const visiveis = lista.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  const selecionaveis = visiveis.filter((p) => !p.certificado);
  const todosMarcados = selecionaveis.length > 0 && selecionaveis.every((p) => sel.has(p.id));

  const marcar = (fid) => setSel((s) => { const n = new Set(s); n.has(fid) ? n.delete(fid) : n.add(fid); return n; });
  const marcarTodos = () => setSel((s) => { const n = new Set(s); selecionaveis.forEach((p) => (todosMarcados ? n.delete(p.id) : n.add(p.id))); return n; });

  const presenca = async (ids, presente) => {
    try {
      const n = await confirmarPresenca(ids, presente);
      avisar(presente ? `${n} presença(s) confirmada(s). Certificados emitidos.` : `${n} presença(s) retirada(s).`);
      setSel(new Set());
    } catch (e) { avisar(e.message, 'erro'); }
  };

  const exportar = () => baixarCsv(`lista-presenca-${ev.id}.csv`, ev.participantes, [
    { titulo: 'Nome', valor: 'nome' }, { titulo: 'E-mail', valor: 'email' }, { titulo: 'Unidade', valor: 'unidade_nome' },
    { titulo: 'Presente', valor: (p) => (p.presente ? 'Sim' : 'Não') }, { titulo: 'Confirmado por', valor: (p) => p.confirmado_por ?? '' },
    { titulo: 'Confirmado em', valor: (p) => (p.confirmado_em ? new Date(p.confirmado_em).toLocaleString('pt-BR') : '') }, { titulo: 'Certificado', valor: (p) => p.certificado ?? '' },
    { titulo: 'Nota', valor: (p) => p.nota ?? '' }, { titulo: 'Comentário', valor: 'comentario' },
  ]);

  const pedirExclusao = () => setConfirmar({
    titulo: 'Excluir evento', mensagem: 'O evento e a lista de convocados serão apagados.', perigo: true, botao: 'Excluir',
    acao: () => excluirEvento(ev.id).then(() => { avisar('Evento excluído.'); navegar('/admin/capacitacoes'); }),
  });
  const pedirEncerramento = () => setConfirmar({
    titulo: 'Encerrar evento',
    mensagem: `${ev.convocados - ev.presentes} convocado(s) ainda sem presença confirmada. Ao encerrar, o certificado do facilitador é emitido e o evento não pode mais ser alterado. Continuar?`,
    botao: 'Encerrar evento',
    acao: () => encerrarEvento(ev.id).then(() => avisar('Evento encerrado. Certificado do facilitador emitido.')),
  });
  const pedirRemocao = (p) => setConfirmar({
    titulo: 'Remover participante', mensagem: `Remover ${p.nome} da lista deste evento?`, perigo: true, botao: 'Remover',
    acao: () => removerParticipante(p.id).then(() => avisar('Participante removido.')),
  });

  return {
    ev, carregando, lista, visiveis, porPagina: POR_PAGINA,
    // Confirmar presença: Master, Diretor e Coordenador (este só vê a própria unidade).
    // Editar, encerrar, excluir, adicionar e remover: só quem gerencia eventos.
    aconteceu, podeConfirmar: aconteceu && ev && !ev.encerrado && pode('confirmarpresenca'),
    gerencia: pode('gerenciarevento'),
    podeRegistrarNota: pode('confirmarpresenca'),
    // Distribuição das notas para o gráfico de rosca.
    notas: ev ? [5, 4, 3, 2, 1].map((n) => ({ nome: `${n} estrela${n > 1 ? 's' : ''}`, valor: ev.participantes.filter((p) => p.nota === n).length })).filter((d) => d.valor) : [],
    busca, mudarBusca: (v) => { setBusca(v); setPagina(1); },
    filtro, mudarFiltro: (v) => { setFiltro(v); setPagina(1); },
    pagina, setPagina,
    sel, todosMarcados, marcar, marcarTodos, limparSelecao: () => setSel(new Set()),
    presenca, exportar,
    editar, abrirEdicao: () => setEditar(true), fecharEdicao: () => setEditar(false),
    adicionar, abrirAdicionar: () => setAdicionar(true), fecharAdicionar: () => setAdicionar(false),
    avaliar, abrirAvaliacao: (p) => setAvaliar(p), fecharAvaliacao: () => setAvaliar(null),
    confirmar, fecharConfirmacao: () => setConfirmar(null),
    executarConfirmacao: () => confirmar.acao().catch((e) => avisar(e.message, 'erro')),
    pedirExclusao, pedirEncerramento, pedirRemocao,
  };
}
