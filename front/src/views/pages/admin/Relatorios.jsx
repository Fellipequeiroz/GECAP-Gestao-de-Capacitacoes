// View de Relatórios: indicadores e gráficos (Recharts).
// Só apresentação: filtros, ordenação e exportação vêm de useRelatoriosController;
// os cálculos ficam em models/relatorioModel.js.
import { Link } from 'react-router-dom';
import { useRelatoriosController } from '../../../controllers/useRelatoriosController.js';
import { GraficoBarras, GraficoLinha, GraficoRosca } from '../../components/graficos.jsx';
import { CabecalhoPagina, Carregando, Cartao, Estrelas, Icone, Paginacao, Selo, Vazio, btn, campoClasse } from '../../components/ui.jsx';
import { data, numero, pct } from '../../helpers/formatar.js';

function Variacao({ atual, anterior, formato = 'pct' }) {
  // Sem base de comparação (período anterior vazio ou "todo o período"): não mostra variação.
  if (!anterior || atual == null || !Number.isFinite(atual)) return <span className="text-label-sm text-outline" title="Sem dados no período anterior para comparar">—</span>;
  const diff = formato === 'pp' ? (atual - anterior) * 100 : anterior ? ((atual - anterior) / anterior) * 100 : 0;
  const sobe = diff >= 0;
  return (
    <span className={`flex items-center gap-1 text-label-sm font-bold ${sobe ? 'text-success-emerald' : 'text-error-red'}`} title="Comparado ao período anterior de mesmo tamanho">
      <Icone nome={sobe ? 'trending_up' : 'trending_down'} className="text-[18px]" />
      {sobe ? '+' : ''}{numero(diff, 1)}{formato === 'pp' ? ' p.p.' : '%'}
    </span>
  );
}

function CartaoIndicador({ icone, cor, rotulo: titulo, valor, atual, anterior, formato }) {
  return (
    <div className="bg-surface-card p-6 rounded-xl border border-border-subtle shadow-xs card-hover">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2.5 rounded-lg ${cor}`}><Icone nome={icone} /></div>
        <Variacao atual={atual} anterior={anterior} formato={formato} />
      </div>
      <p className="text-label-upper font-label-upper text-on-surface-variant uppercase">{titulo}</p>
      <p className="text-display-lg font-display-lg mt-1">{valor}</p>
    </div>
  );
}

export default function Relatorios() {
  const c = useRelatoriosController();
  if (c.carregando) return <Carregando />;
  const { r, graficos, ordem, ordenar } = c;
  const Th = ({ campo, children }) => (
    <th className="px-6 py-3">
      <button className="flex items-center gap-1 uppercase hover:text-primary" onClick={() => ordenar(campo)}>
        {children}{ordem.campo === campo && <Icone nome={ordem.desc ? 'arrow_downward' : 'arrow_upward'} className="text-[14px]" />}
      </button>
    </th>
  );

  return (
    <div className="space-y-stack-lg">
      <CabecalhoPagina titulo="Relatórios" subtitulo="Desempenho e participação nas capacitações da rede.">
        <select className={`${campoClasse} w-auto! py-2`} value={c.meses} onChange={(e) => c.mudarMeses(e.target.value)} aria-label="Período">
          <option value={3}>Últimos 3 meses</option><option value={6}>Últimos 6 meses</option><option value={12}>Últimos 12 meses</option><option value={0}>Todo o período</option>
        </select>
        <select className={`${campoClasse} w-auto! py-2`} value={c.setor} onChange={(e) => c.mudarSetor(e.target.value)} aria-label="Setor">
          <option value={0}>Todos os setores</option>
          {c.setores.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
        </select>
        <button className={`${btn.secundario} print:hidden`} onClick={c.exportarCsv}><Icone nome="download" /> CSV</button>
        <button className={`${btn.primario} print:hidden`} onClick={c.exportarPdf}><Icone nome="picture_as_pdf" /> Exportar PDF</button>
      </CabecalhoPagina>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <CartaoIndicador icone="event_available" cor="bg-primary-fixed text-primary" rotulo="Eventos" valor={numero(r.realizados)} atual={r.realizados} anterior={c.anterior?.realizados} />
        <CartaoIndicador icone="how_to_reg" cor="bg-success-emerald/15 text-success-emerald" rotulo="Participações" valor={numero(r.presentes)} atual={r.presentes} anterior={c.anterior?.presentes} />
        <CartaoIndicador icone="percent" cor="bg-tertiary-fixed text-tertiary" rotulo="Taxa de presença" valor={r.taxa != null ? pct(r.taxa, 1) : '—'} atual={r.taxa} anterior={c.anterior?.taxa} formato="pp" />
        <CartaoIndicador icone="star" cor="bg-secondary-container text-on-secondary-container" rotulo="Nota média" valor={<Estrelas nota={r.nota} tamanho="text-[26px]" />} atual={r.nota} anterior={c.anterior?.nota} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Cartao className="p-6 lg:col-span-2">
          <h3 className="text-title-sm font-title-sm">Participação por mês</h3>
          <p className="text-label-sm text-on-surface-variant mb-4">Convocados e presentes nos eventos já realizados</p>
          <GraficoLinha dados={graficos.porMes} x="mes" series={[{ chave: 'convocados', nome: 'Convocados' }, { chave: 'presentes', nome: 'Presentes' }]} altura={280} />
        </Cartao>
        <Cartao className="p-6">
          <h3 className="text-title-sm font-title-sm">Taxa de presença por unidade</h3>
          <p className="text-label-sm text-on-surface-variant mb-4">% dos convocados que compareceram</p>
          {graficos.unidades.length ? <GraficoBarras dados={graficos.unidades} x="unidade" series={[{ chave: 'taxa', nome: 'Presença' }]} formatar={(v) => `${v}%`} dominio={[0, 100]} horizontal altura={260} /> : <Vazio texto="Sem dados no período." />}
        </Cartao>
        <Cartao className="p-6">
          <h3 className="text-title-sm font-title-sm">Nota média por unidade</h3>
          <p className="text-label-sm text-on-surface-variant mb-4">Avaliação dos participantes, de 1 a 5 (regra 9.1)</p>
          {graficos.unidades.some((u) => u.nota != null) ? (
            <GraficoBarras dados={graficos.unidades.filter((u) => u.nota != null)} x="unidade" series={[{ chave: 'nota', nome: 'Nota média' }]} formatar={(v) => numero(v)} dominio={[0, 5]} horizontal altura={260} />
          ) : <Vazio texto="Sem avaliações no período." />}
        </Cartao>
        <Cartao className="p-6">
          <h3 className="text-title-sm font-title-sm">Participações por formação</h3>
          <p className="text-label-sm text-on-surface-variant mb-2">Presenças confirmadas, por nível de escolaridade</p>
          {graficos.formacao.some((f) => f.valor) ? <GraficoRosca dados={graficos.formacao} altura={240} centro={<><p className="text-headline-md font-headline-md">{numero(r.presentes)}</p><p className="text-label-sm text-on-surface-variant">presenças</p></>} /> : <Vazio texto="Sem dados no período." />}
        </Cartao>
        <Cartao className="p-6">
          <h3 className="text-title-sm font-title-sm">Horas certificadas por capacitação</h3>
          <p className="text-label-sm text-on-surface-variant mb-4">Presentes × carga horária</p>
          {graficos.horas.length ? <GraficoBarras dados={graficos.horas} x="capacitacao" series={[{ chave: 'horas', nome: 'Horas' }]} formatar={(v) => `${v}h`} horizontal altura={240} /> : <Vazio texto="Sem dados no período." />}
        </Cartao>
      </div>

      <Cartao className="overflow-hidden">
        <div className="p-6 border-b border-border-subtle">
          <h3 className="text-title-sm font-title-sm">Eventos do período</h3>
          <p className="text-label-sm text-on-surface-variant">Clique no título da coluna para ordenar.</p>
        </div>
        {r.eventos.length === 0 ? <Vazio texto="Nenhum evento no período." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-low text-label-upper font-label-upper text-on-surface-variant">
                <tr><Th campo="titulo">Evento</Th><Th campo="facilitador_nome">Facilitador</Th><Th campo="data">Data</Th><Th campo="presentes">Presença</Th><Th campo="nota_media">Nota</Th><Th campo="status">Situação</Th></tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {c.visiveis.map((e) => (
                  <tr key={e.id} className="hover:bg-surface-container-low/60">
                    <td className="px-6 py-3"><Link to={`/admin/eventos/${e.id}`} className="text-body-md font-semibold hover:text-primary">{e.titulo}</Link><p className="text-label-sm text-on-surface-variant">{e.carga_horaria}h · {e.local}</p></td>
                    <td className="px-6 py-3 text-body-md">{e.facilitador_nome}</td>
                    <td className="px-6 py-3 text-body-md whitespace-nowrap">{data(e.data)}</td>
                    <td className="px-6 py-3 text-body-md">{e.presentes}/{e.convocados}</td>
                    <td className="px-6 py-3 text-body-md"><Estrelas nota={e.nota_media} /></td>
                    <td className="px-6 py-3"><Selo status={e.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Paginacao pagina={c.pagina} total={r.eventos.length} porPagina={c.porPagina} onMudar={c.setPagina} rotulo="eventos" />
      </Cartao>
    </div>
  );
}
