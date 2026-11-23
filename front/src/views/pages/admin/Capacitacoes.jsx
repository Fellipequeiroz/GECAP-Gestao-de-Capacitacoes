// View de Capacitações. Só apresentação: estado e ações vêm de useCapacitacoesController.
import { Link } from 'react-router-dom';
import { useCapacitacoesController } from '../../../controllers/useCapacitacoesController.js';
import { usePermissoes } from '../../../controllers/usePermissoes.js';
import CapacitacaoModal from '../../components/formularios/CapacitacaoModal.jsx';
import EventoModal from '../../components/formularios/EventoModal.jsx';
import {
  CabecalhoPagina, Carregando, Cartao, Confirmar, Icone, Kpi, Paginacao, Selo, Vazio, btn, campoClasse,
} from '../../components/ui.jsx';
import { data, dataHora, numero, pct } from '../../helpers/formatar.js';

const ICONES = ['diversity_3', 'monitoring', 'family_restroom', 'description', 'night_shelter', 'elderly'];

export default function Capacitacoes() {
  const c = useCapacitacoesController();
  const { pode, podeVer } = usePermissoes();
  if (c.carregando) return <Carregando />;
  const { ind } = c;
  // Criar e editar capacitações e eventos: só quem gerencia eventos (Master e Diretor).
  const gerencia = pode('gerenciarevento');
  const abreEvento = podeVer('evento');

  return (
    <div className="space-y-stack-lg">
      <CabecalhoPagina titulo="Capacitações" subtitulo="Temas de formação e os eventos de cada um.">
        {gerencia && <>
          <button className={btn.secundario} onClick={c.novaCapacitacao}><Icone nome="library_add" /> Nova capacitação</button>
          <button className={btn.primario} onClick={() => c.novoEvento()}><Icone nome="add_circle" /> Novo evento</button>
        </>}
      </CabecalhoPagina>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi rotulo="Capacitações" valor={numero(c.caps.length)} icone="school" rodape={`${numero(ind.eventos_total)} eventos no total`} />
        <Kpi rotulo="Eventos realizados" valor={numero(c.realizados)} icone="event_available" cor="text-success-emerald" rodape={`${ind.eventos_agendados} agendado(s)`} />
        <Kpi rotulo="Taxa de presença" valor={pct(ind.taxa_presenca)} icone="how_to_reg" cor="text-success-emerald" barra={ind.taxa_presenca} />
        <Kpi rotulo="Horas ofertadas" valor={`${numero(ind.horas_ofertadas)}h`} icone="schedule" cor="text-tertiary" rodape="Em eventos encerrados" />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[260px] flex-1 max-w-sm">
            <Icone nome="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
            <input className={`${campoClasse} pl-10`} placeholder="Buscar capacitação..." value={c.busca} onChange={(e) => c.setBusca(e.target.value)} />
          </div>
          <select className={`${campoClasse} w-auto!`} value={c.filtro} onChange={(e) => c.setFiltro(e.target.value)} aria-label="Filtrar por situação">
            <option value="todos">Todas as situações</option>
            <option value="agendado">Com evento agendado</option>
            <option value="aguardando_presenca">Aguardando presença</option>
            <option value="encerrado">Com evento encerrado</option>
            <option value="sem_evento">Sem eventos</option>
          </select>
        </div>
        <button className={btn.secundario} onClick={c.exportar}><Icone nome="download" /> Exportar CSV</button>
      </div>

      {c.visiveis.length === 0 ? (
        <Cartao><Vazio icone="search_off" texto="Nenhuma capacitação encontrada com esses filtros." /></Cartao>
      ) : (
        <div className="space-y-4">
          {c.visiveis.map((cap, i) => {
            const expandida = c.aberta === cap.id;
            const proximo = cap.eventos.find((e) => e.status === 'agendado');
            const pend = cap.eventos.filter((e) => e.status === 'aguardando_presenca' || e.status === 'realizado').length;
            return (
              <Cartao key={cap.id} className={`overflow-hidden transition-all ${expandida ? 'border-2 border-primary shadow-md' : 'hover:shadow-md'}`}>
                <button className="w-full text-left p-6 flex items-start gap-5" onClick={() => c.alternar(cap.id)} aria-expanded={expandida}>
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${expandida ? 'bg-primary-fixed text-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                    <Icone nome={ICONES[(cap.id + i) % ICONES.length]} className="text-[28px]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-headline-md font-headline-md text-on-surface">{cap.titulo}</h3>
                      {proximo && <Selo status="agendado" texto={`Próximo: ${data(proximo.data)}`} />}
                      {pend > 0 && <Selo status="aguardando_presenca" texto={`${pend} com presença pendente`} />}
                    </div>
                    <p className="text-body-md text-on-surface-variant mt-1">{cap.eventos.length} evento(s) · {cap.participantes} participação(ões) confirmada(s)</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-label-upper font-label-upper text-on-surface-variant">CARGA TOTAL</p>
                    <p className="text-headline-md font-headline-md text-primary">{cap.total_horas}h</p>
                  </div>
                  <Icone nome={expandida ? 'expand_less' : 'expand_more'} className="text-outline mt-3" />
                </button>

                {expandida && (
                  <div className="border-t border-border-subtle bg-surface-container-low/50 p-6 space-y-5">
                    <div>
                      <p className="text-label-upper font-label-upper text-on-surface-variant mb-1">SOBRE A CAPACITAÇÃO</p>
                      <p className="text-body-md text-on-surface">{cap.descricao || 'Sem descrição.'}</p>
                    </div>
                    {cap.eventos.length === 0 ? (
                      <p className="text-body-md text-on-surface-variant">Nenhum evento ainda.</p>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-border-subtle bg-surface-card">
                        <table className="w-full text-left">
                          <thead className="bg-surface-container-low">
                            <tr className="text-label-upper font-label-upper text-on-surface-variant">
                              <th className="px-4 py-3">DATA</th><th className="px-4 py-3">LOCAL</th><th className="px-4 py-3">PRESENÇA</th><th className="px-4 py-3">SITUAÇÃO</th><th className="px-4 py-3 text-right">AÇÕES</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-subtle">
                            {cap.eventos.map((e) => (
                              <tr key={e.id} className={abreEvento ? 'hover:bg-surface-container-low cursor-pointer' : ''} onClick={() => abreEvento && c.abrirEvento(e.id)}>
                                <td className="px-4 py-3 text-body-md whitespace-nowrap">{dataHora(e.data)}</td>
                                <td className="px-4 py-3 text-body-md">{e.local}<span className="block text-label-sm text-on-surface-variant">{e.carga_horaria}h · {e.unidades_nomes.length ? e.unidades_nomes.join(', ') : 'Rede geral'}</span></td>
                                <td className="px-4 py-3 text-body-md whitespace-nowrap">{e.presentes}/{e.convocados}</td>
                                <td className="px-4 py-3"><Selo status={e.status} /></td>
                                <td className="px-4 py-3 text-right whitespace-nowrap" onClick={(ev) => ev.stopPropagation()}>
                                  {abreEvento && <Link to={`/admin/eventos/${e.id}`} className={btn.icone} title="Abrir presença"><Icone nome="fact_check" /></Link>}
                                  {gerencia && !e.encerrado && <button className={btn.icone} title="Editar evento" onClick={() => c.editarEvento(e)}><Icone nome="edit" /></button>}
                                  {gerencia && !e.tem_certificado && (
                                    <button className={btn.icone} title="Excluir evento" onClick={() => c.pedirExclusaoEvento(e, dataHora(e.data))}><Icone nome="delete" /></button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {gerencia && (
                      <div className="flex flex-wrap gap-3">
                        <button className={btn.primario} onClick={() => c.novoEvento(cap.id)}><Icone nome="add" /> Novo evento desta capacitação</button>
                        <button className={btn.secundario} onClick={() => c.editarCapacitacao(cap)}><Icone nome="edit" /> Editar capacitação</button>
                        {cap.eventos.length === 0 && (
                          <button className={btn.perigo} onClick={() => c.pedirExclusaoCapacitacao(cap)}><Icone nome="delete" /> Excluir</button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Cartao>
            );
          })}
        </div>
      )}

      <Cartao><Paginacao pagina={c.pagina} total={c.filtradas.length} porPagina={c.porPagina} onMudar={c.setPagina} rotulo="capacitações" /></Cartao>

      <CapacitacaoModal aberto={c.modalCap.aberto} capacitacao={c.modalCap.capacitacao} onFechar={c.fecharModalCap} onSalvo={c.capacitacaoSalva} />
      <EventoModal aberto={c.modalEv.aberto} evento={c.modalEv.evento} capacitacaoId={c.modalEv.capacitacaoId} onFechar={c.fecharModalEv} onSalvo={c.eventoSalvo} />
      <Confirmar aberto={Boolean(c.confirmar)} titulo={c.confirmar?.titulo} mensagem={c.confirmar?.mensagem} perigo textoBotao="Excluir"
        onFechar={c.fecharConfirmacao} onConfirmar={c.executarConfirmacao} />
    </div>
  );
}
