// Controller do Dashboard: busca os dados, guarda o filtro do gráfico e a página
// dos próximos eventos, e responde aos atalhos.
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listarAtividades, usuarioAtual } from '../models/configModel.js';
import { obterDadosRelatorio, obterIndicadores, seriePresencas } from '../models/relatorioModel.js';
import { useDados } from './base/useDados.js';
import { baixarCsv } from './base/exportar.js';
import { usePermissoes } from './usePermissoes.js';

export function useDashboardController() {
  const navegar = useNavigate();
  const { pode } = usePermissoes();
  const [periodo, setPeriodo] = useState('meses');
  const [pagina, setPagina] = useState(0);
  const { dados: ind } = useDados(obterIndicadores);
  const { dados: rel } = useDados(obterDadosRelatorio);
  const { dados: atividades } = useDados(() => listarAtividades(5));
  const { dados: eu } = useDados(usuarioAtual);

  const serie = useMemo(() => (rel ? seriePresencas(rel, periodo) : []), [rel, periodo]);
  const carregando = !ind || !rel;

  const hora = new Date().getHours();
  const proximos = ind ? ind.proximos.slice(pagina * 3, pagina * 3 + 3) : [];
  const paginasProximos = ind ? Math.ceil(ind.proximos.length / 3) : 0;
  const pendente = ind?.eventos_pendentes[0];

  const exportarEventos = () => baixarCsv(`eventos-${new Date().toISOString().slice(0, 10)}.csv`, ind.eventos, [
    { titulo: 'Capacitação', valor: 'titulo' }, { titulo: 'Data', valor: (e) => new Date(e.data).toLocaleDateString('pt-BR') }, { titulo: 'Local', valor: 'local' },
    { titulo: 'Carga horária (h)', valor: 'carga_horaria' }, { titulo: 'Convocados', valor: 'convocados' }, { titulo: 'Presentes', valor: 'presentes' },
    { titulo: 'Status', valor: 'status' },
  ]);

  return {
    carregando, ind, serie, atividades, proximos, pendente,
    primeiroNome: eu?.nome.split(' ')[0] ?? '',
    saudacao: hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite',
    periodo, setPeriodo,
    pagina, paginasProximos,
    paginaAnterior: () => setPagina((p) => Math.max(0, p - 1)),
    proximaPagina: () => setPagina((p) => Math.min(paginasProximos - 1, p + 1)),
    atalhos: {
      novoProfissional: () => navegar('/admin/equipes?novo=1'),
      novoEvento: () => navegar('/admin/capacitacoes?novo=evento'),
      confirmarPresenca: () => navegar(pendente ? `/admin/eventos/${pendente.id}` : '/admin/capacitacoes'),
      exportarEventos,
    },
    // Quais atalhos aparecem para o perfil logado.
    podeAtalho: {
      novoProfissional: pode('gerenciarestrutura'),
      novoEvento: pode('gerenciarevento'),
      confirmarPresenca: pode('confirmarpresenca'),
      exportarEventos: true,
    },
  };
}
