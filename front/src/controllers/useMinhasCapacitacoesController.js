// Controller de Minhas Capacitações: filtro por situação e o modal "Avaliar capacitação".
import { useEffect, useMemo, useState } from 'react';
import { avaliarMinha, listarMinhasCapacitacoes } from '../models/participanteModel.js';
import { useAviso } from './AvisoController.jsx';
import { useDados } from './base/useDados.js';

export function useMinhasCapacitacoesController() {
  const { dados } = useDados(listarMinhasCapacitacoes);
  const [filtro, setFiltro] = useState('todas');
  const [avaliar, setAvaliar] = useState(null);

  const lista = useMemo(() => {
    if (!dados) return [];
    if (filtro === 'avaliar') return dados.lista.filter((x) => x.pode_avaliar);
    return filtro === 'todas' ? dados.lista : dados.lista.filter((x) => x.situacao === filtro);
  }, [dados, filtro]);

  const contar = (s) => dados?.lista.filter((x) => x.situacao === s).length ?? 0;

  return {
    carregando: !dados,
    resumo: dados?.resumo,
    grafico: dados?.grafico ?? [],
    temHistorico: Boolean(dados?.grafico.some((m) => m.horas > 0)),
    lista,
    filtro, setFiltro,
    abas: [
      { valor: 'todas', rotulo: 'Todas', qtd: dados?.lista.length ?? 0 },
      { valor: 'agendado', rotulo: 'Próximas', qtd: contar('agendado') },
      { valor: 'concluido', rotulo: 'Concluídas', qtd: contar('concluido') },
      { valor: 'avaliar', rotulo: 'Para avaliar', qtd: dados?.resumo.a_avaliar ?? 0 },
    ],
    avaliar, abrirAvaliacao: setAvaliar, fecharAvaliacao: () => setAvaliar(null),
  };
}

export function useAvaliarCapacitacaoForm({ capacitacao, onFechar }) {
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const avisar = useAviso();
  useEffect(() => { if (capacitacao) { setNota(0); setComentario(''); setErro(''); } }, [capacitacao]);

  const enviar = async () => {
    if (!nota) { setErro('Escolha uma nota de 1 a 5 estrelas.'); return; }
    setEnviando(true);
    try {
      await avaliarMinha(capacitacao.frequencia_id, nota, comentario);
      avisar('Obrigado! Sua avaliação foi enviada.');
      onFechar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  };
  return { nota, setNota, comentario, setComentario, erro, enviando, enviar };
}
