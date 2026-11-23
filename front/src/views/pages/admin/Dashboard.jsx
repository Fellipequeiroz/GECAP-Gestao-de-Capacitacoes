// View do Dashboard. Só apresentação: os dados e as ações vêm de useDashboardController.
import { Link } from 'react-router-dom';
import { useDashboardController } from '../../../controllers/useDashboardController.js';
import { GraficoBarras } from '../../components/graficos.jsx';
import { Cartao, Carregando, Icone, Kpi, Selo, Vazio, btn } from '../../components/ui.jsx';
import { data, dataLonga, numero, pct, tempoRelativo } from '../../helpers/formatar.js';

export default function Dashboard() {
  const c = useDashboardController();
  if (c.carregando) return <Carregando />;
  const { ind } = c;

  return (
    <>
      <section className="mb-stack-lg">
        <h2 className="text-display-lg font-display-lg text-on-surface">{c.saudacao}, {c.primeiroNome}.</h2>
        <p className="text-body-md font-body-md text-secondary mt-1">Aqui está o resumo das capacitações de hoje, {dataLonga(new Date())}.</p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-stack-lg">
        <Kpi rotulo="Profissionais" icone="person" valor={numero(ind.profissionais_ativos)}
          rodape={<><span className="text-success-emerald">+{ind.profissionais_novos_30d}</span> nos últimos 30 dias</>} />
        <Kpi rotulo="Capacitações" icone="school" cor="text-tertiary" valor={numero(ind.capacitacoes)}
          rodape={<><span className="text-primary">{ind.eventos_agendados}</span> evento(s) agendado(s)</>} />
        <Kpi rotulo="Taxa de presença" icone="how_to_reg" cor="text-success-emerald" valor={pct(ind.taxa_presenca, 1)} barra={ind.taxa_presenca} />
        <Kpi rotulo="Certificados" icone="workspace_premium" cor="text-error" valor={numero(ind.certificados)}
          rodape={`${numero(ind.horas_certificadas)} horas certificadas`} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Cartao className="lg:col-span-2 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-title-sm font-title-sm">Presenças confirmadas</h3>
              <p className="text-label-sm font-label-sm text-secondary">Participantes presentes nos eventos do período</p>
            </div>
            <select value={c.periodo} onChange={(e) => c.setPeriodo(e.target.value)} className="bg-surface-container-low border-none text-label-sm font-label-sm rounded-lg px-3 py-1 text-on-surface focus:ring-1 focus:ring-primary">
              <option value="meses">Últimos 6 meses</option>
              <option value="semanas">Últimas 12 semanas</option>
            </select>
          </div>
          <GraficoBarras dados={c.serie} x="periodo" series={[{ chave: 'presencas', nome: 'Presenças' }]} destaque={c.serie.at(-1)?.periodo} altura={340} />
        </Cartao>

        <div className="space-y-6">
          <Cartao className="p-6">
            <h3 className="text-title-sm font-title-sm mb-4">Atalhos rápidos</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['person_add', 'Novo profissional', 'novoProfissional'],
                ['post_add', 'Novo evento', 'novoEvento'],
                ['how_to_reg', 'Confirmar presença', 'confirmarPresenca'],
                ['file_download', 'Exportar eventos', 'exportarEventos'],
              ].filter(([, , chave]) => c.podeAtalho[chave]).map(([icone, texto, chave]) => [icone, texto, c.atalhos[chave]]).map(([icone, texto, acao]) => (
                <button key={texto} onClick={acao} className="flex flex-col items-center justify-center p-4 bg-surface-container-low rounded-xl hover:bg-primary hover:text-on-primary transition-all duration-200 group active:scale-95">
                  <Icone nome={icone} className="mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-label-sm font-label-sm text-center">{texto}</span>
                </button>
              ))}
            </div>
          </Cartao>
          <div className="bg-primary-container p-6 rounded-xl text-on-primary-container relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="font-title-sm text-title-sm mb-1">{ind.eventos_pendentes.length ? `${ind.eventos_pendentes.length} evento(s) com pendência` : 'Nenhuma pendência'}</h4>
              <p className="text-label-sm font-label-sm opacity-90 mb-4">
                {c.pendente ? `Confirme a presença e encerre "${c.pendente.titulo}" para liberar os certificados.` : 'Todas as presenças estão confirmadas.'}
              </p>
              {c.pendente && <Link to={`/admin/eventos/${c.pendente.id}`} className="inline-block bg-on-primary-container text-primary-container px-4 py-2 rounded-lg font-title-sm text-[12px] hover:shadow-lg transition-all active:scale-95">Resolver agora</Link>}
            </div>
            <Icone nome="fact_check" className="absolute -right-4 -bottom-4 text-8xl opacity-10 rotate-12" />
          </div>
        </div>

        <Cartao className="lg:col-span-3">
          <div className="p-6 border-b border-border-subtle flex justify-between items-center">
            <h3 className="text-title-sm font-title-sm flex items-center gap-2"><Icone nome="history" className="text-primary" /> Atividade recente</h3>
            <Link to="/admin/configuracoes?log=1" className="text-primary text-label-sm font-label-sm hover:underline">Ver todas</Link>
          </div>
          {!c.atividades?.length ? <Vazio texto="Nenhuma atividade registrada ainda." /> : (
            <div className="divide-y divide-border-subtle">
              {c.atividades.map((a) => (
                <div key={a.id} className="p-4 flex gap-4 items-start hover:bg-surface-container-low transition-colors">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                  <div className="flex-1 flex justify-between gap-4">
                    <p className="text-body-md"><span className="font-semibold">{a.usuario}</span> {a.acao.toLowerCase()} <span className="text-secondary">{a.detalhe}</span></p>
                    <span className="text-label-sm font-label-sm text-secondary whitespace-nowrap">{tempoRelativo(a.quando)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Cartao>
      </div>

      <section className="mt-stack-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-title-sm font-title-sm">Próximos eventos</h3>
          {c.paginasProximos > 1 && (
            <div className="flex gap-2">
              <button className={btn.icone} disabled={c.pagina === 0} onClick={c.paginaAnterior} aria-label="Anteriores"><Icone nome="chevron_left" /></button>
              <button className={btn.icone} disabled={c.pagina >= c.paginasProximos - 1} onClick={c.proximaPagina} aria-label="Próximos"><Icone nome="chevron_right" /></button>
            </div>
          )}
        </div>
        {c.proximos.length === 0 ? (
          <Cartao><Vazio icone="event_busy" texto="Nenhum evento agendado.">{c.podeAtalho.novoEvento && <button className={btn.primario} onClick={c.atalhos.novoEvento}>Agendar evento</button>}</Vazio></Cartao>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {c.proximos.map((e) => {
              const dias = Math.ceil((new Date(e.data).getTime() - Date.now()) / 864e5);
              return (
                <Link key={e.id} to={`/admin/eventos/${e.id}`} className="bg-surface-card rounded-xl border border-border-subtle shadow-xs overflow-hidden hover:border-primary transition-all card-hover">
                  <div className="h-24 bg-linear-to-br from-primary to-primary-container relative p-4 text-on-primary">
                    <p className="text-[11px] font-bold uppercase opacity-80">{data(e.data)}</p>
                    <p className="text-headline-md font-headline-md">{dias <= 0 ? 'Hoje' : dias === 1 ? 'Amanhã' : `Em ${dias} dias`}</p>
                    <Icone nome="event" className="absolute right-3 bottom-2 text-6xl opacity-15" />
                  </div>
                  <div className="p-4">
                    <h4 className="font-title-sm text-title-sm mb-1 truncate">{e.titulo}</h4>
                    <p className="text-label-sm text-secondary mb-3 truncate">{e.local} • {e.carga_horaria}h</p>
                    <div className="flex items-center justify-between text-label-sm">
                      <span className="text-secondary">Convocados</span>
                      <span className="font-bold text-primary">{e.convocados}</span>
                    </div>
                    <div className="mt-2"><Selo status={e.status} /></div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
