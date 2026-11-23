// Controller de Relatórios: filtros de período e setor, ordenação e paginação da
// tabela, e exportações. Os cálculos ficam em models/relatorioModel.js.
import { useMemo, useState } from 'react';
import { FORMACOES } from '../models/regras.js';
import { dadosDosGraficos, indicadoresDoPeriodo, obterDadosRelatorio } from '../models/relatorioModel.js';
import { useDados } from './base/useDados.js';
import { baixarCsv } from './base/exportar.js';

const POR_PAGINA = 6;

export function useRelatoriosController() {
  const { dados: rel } = useDados(obterDadosRelatorio);
  const [meses, setMeses] = useState(6);
  const [setor, setSetor] = useState(0);
  const [ordem, setOrdem] = useState({ campo: 'data', desc: true });
  const [pagina, setPagina] = useState(1);

  const r = useMemo(() => rel && indicadoresDoPeriodo(rel, meses, setor), [rel, meses, setor]);
  const anterior = useMemo(() => rel && meses && indicadoresDoPeriodo(rel, meses, setor, 1), [rel, meses, setor]);
  const graficos = useMemo(() => rel && r && dadosDosGraficos(rel, r, meses, FORMACOES), [rel, r, meses]);

  const ordenados = useMemo(() => (r ? [...r.eventos].sort((a, z) => {
    const va = a[ordem.campo]; const vz = z[ordem.campo];
    const c = typeof va === 'number' ? va - vz : String(va ?? '').localeCompare(String(vz ?? ''));
    return ordem.desc ? -c : c;
  }) : []), [r, ordem]);

  const exportarCsv = () => baixarCsv(`relatorio-${new Date().toISOString().slice(0, 10)}.csv`, ordenados, [
    { titulo: 'Capacitação', valor: 'titulo' }, { titulo: 'Data', valor: (e) => new Date(e.data).toLocaleDateString('pt-BR') }, { titulo: 'Facilitador', valor: 'facilitador_nome' },
    { titulo: 'Carga horária (h)', valor: 'carga_horaria' }, { titulo: 'Convocados', valor: 'convocados' }, { titulo: 'Presentes', valor: 'presentes' },
    { titulo: 'Nota média', valor: (e) => (e.nota_media ?? '') }, { titulo: 'Situação', valor: 'status' },
  ]);

  return {
    carregando: !rel || !r,
    setores: rel?.setores ?? [],
    r, anterior, graficos,
    meses, mudarMeses: (v) => { setMeses(Number(v)); setPagina(1); },
    setor, mudarSetor: (v) => { setSetor(Number(v)); setPagina(1); },
    ordem, ordenar: (campo) => setOrdem((o) => ({ campo, desc: o.campo === campo ? !o.desc : true })),
    visiveis: ordenados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA), porPagina: POR_PAGINA,
    pagina, setPagina,
    exportarCsv, exportarPdf: () => window.print(),
  };
}
