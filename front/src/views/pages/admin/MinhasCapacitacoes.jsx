// View de Minhas Capacitações (tela do Stitch "Minhas Capacitações" + modal de feedback):
// a visão do participante, para todos os perfis. Dados: useMinhasCapacitacoesController.
import { useMinhasCapacitacoesController } from '../../../controllers/useMinhasCapacitacoesController.js';
import { MODALIDADES, rotulo } from '../../../models/regras.js';
import AvaliarCapacitacaoModal from '../../components/formularios/AvaliarCapacitacaoModal.jsx';
import { GraficoBarras } from '../../components/graficos.jsx';
import { Abas, CabecalhoPagina, Carregando, Cartao, Estrelas, Icone, Kpi, Vazio, btn } from '../../components/ui.jsx';
import { data, dataHora, numero, pct } from '../../helpers/formatar.js';

const SITUACAO = {
  concluido: { texto: 'Concluído', classe: 'bg-success-emerald/15 text-success-emerald', icone: 'task_alt', fundo: 'bg-primary-fixed text-primary' },
  agendado: { texto: 'Agendado', classe: 'bg-primary-fixed text-on-primary-fixed-variant', icone: 'event_upcoming', fundo: 'bg-surface-container-high text-primary' },
  aguardando: { texto: 'Aguardando presença', classe: 'bg-tertiary-fixed text-on-tertiary-fixed-variant', icone: 'hourglass_top', fundo: 'bg-surface-container-high text-on-surface-variant' },
  ausente: { texto: 'Ausente', classe: 'bg-error/10 text-error', icone: 'event_busy', fundo: 'bg-surface-container-high text-outline' },
};

function CartaoCapacitacao({ cap, onAvaliar }) {
  const s = SITUACAO[cap.situacao];
  const quando = cap.situacao === 'concluido' ? `Concluído em ${data(cap.data)}` : cap.situacao === 'agendado' ? dataHora(cap.data) : data(cap.data);
  return (
    <Cartao className="p-6 flex flex-col gap-4 card-hover">
      <div className="flex items-start gap-4">
        <span className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${s.fundo}`}><Icone nome={s.icone} className="text-[28px]" /></span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wide ${s.classe}`}>{s.texto}</span>
            <span className="text-label-sm text-on-surface-variant">{quando}</span>
          </div>
          <h3 className="text-title-sm font-title-sm text-on-surface mt-2">{cap.titulo}</h3>
          <p className="text-label-sm text-on-surface-variant mt-0.5">{cap.carga_horaria}h · {rotulo(MODALIDADES, cap.modalidade)} · {cap.local}</p>
        </div>
      </div>
      {cap.descricao && <p className="text-body-md text-on-surface-variant line-clamp-2">{cap.descricao}</p>}
      <p className="text-label-sm text-on-surface-variant flex items-center gap-1"><Icone nome="co_present" className="text-[16px]" /> {cap.facilitador_nome || '—'}</p>
      <div className="mt-auto pt-4 border-t border-border-subtle flex flex-wrap items-center justify-between gap-3">
        {cap.nota ? (
          <span className="flex items-center gap-2 text-label-sm text-on-surface-variant" title={cap.comentario}>Sua avaliação <Estrelas nota={cap.nota} /></span>
        ) : cap.pode_avaliar ? (
          <button className={btn.primario} onClick={() => onAvaliar(cap)}><Icone nome="rate_review" /> Avaliar</button>
        ) : (
          <span className="text-label-sm text-outline">{cap.situacao === 'agendado' ? 'Você foi convocado(a)' : cap.situacao === 'aguardando' ? 'Presença ainda não confirmada' : 'Sem presença registrada'}</span>
        )}
        {cap.certificado && (
          <a className={btn.secundario} href={`/certificado/${cap.certificado}`} target="_blank" rel="noreferrer"><Icone nome="workspace_premium" /> Certificado</a>
        )}
      </div>
    </Cartao>
  );
}

export default function MinhasCapacitacoes() {
  const c = useMinhasCapacitacoesController();
  if (c.carregando) return <Carregando />;
  const { resumo } = c;

  return (
    <div className="space-y-stack-lg">
      <CabecalhoPagina titulo="Minhas Capacitações" subtitulo="Acompanhe suas capacitações e conclua as avaliações pendentes." />

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi rotulo="Concluídas" valor={numero(resumo.concluidas)} icone="task_alt" cor="text-success-emerald" rodape={`${resumo.a_avaliar} para avaliar`} />
        <Kpi rotulo="Horas certificadas" valor={`${numero(resumo.horas)}h`} icone="workspace_premium" cor="text-tertiary" />
        <Kpi rotulo="Próximas" valor={numero(resumo.agendadas)} icone="event_upcoming" rodape="Convocações agendadas" />
        <div className="bg-primary text-on-primary p-5 rounded-xl shadow-md flex flex-col justify-between">
          <Icone nome="military_tech" className="text-[32px]" />
          <div>
            <p className="text-display-lg font-display-lg">{resumo.meta == null ? '—' : pct(resumo.meta)}</p>
            <p className="text-label-upper font-label-upper uppercase opacity-90">Meta de capacitação</p>
          </div>
        </div>
      </section>

      <Cartao className="p-6">
        <div className="mb-4">
          <h3 className="text-title-sm font-title-sm">Minha evolução</h3>
          <p className="text-label-sm text-on-surface-variant">Horas certificadas por mês nos últimos 12 meses (só as suas)</p>
        </div>
        {c.temHistorico
          ? <GraficoBarras dados={c.grafico} x="mes" series={[{ chave: 'horas', nome: 'Horas certificadas' }]} formatar={(v) => `${numero(v)}h`} destaque={c.grafico.at(-1)?.mes} altura={240} />
          : <Vazio icone="bar_chart" texto="Você ainda não tem horas certificadas nos últimos 12 meses." />}
      </Cartao>

      <Abas abas={c.abas} ativa={c.filtro} onMudar={c.setFiltro} />

      {c.lista.length === 0 ? (
        <Cartao><Vazio icone="school" texto={c.filtro === 'todas' ? 'Você ainda não foi convocado(a) para nenhuma capacitação.' : 'Nada por aqui com este filtro.'} /></Cartao>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {c.lista.map((cap) => <CartaoCapacitacao key={cap.frequencia_id} cap={cap} onAvaliar={c.abrirAvaliacao} />)}
        </div>
      )}

      <AvaliarCapacitacaoModal capacitacao={c.avaliar} onFechar={c.fecharAvaliacao} />
    </div>
  );
}
