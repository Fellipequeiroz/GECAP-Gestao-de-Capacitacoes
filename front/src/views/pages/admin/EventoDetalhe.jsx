// View da tela do evento: convocados, presença, certificados, avaliações e encerramento.
// Só apresentação: estado e ações vêm de useEventoController.
import { Link } from 'react-router-dom';
import { useEventoController } from '../../../controllers/useEventoController.js';
import { MODALIDADES, PUBLICOS_ALVO, rotulo } from '../../../models/regras.js';
import AdicionarParticipantesModal from '../../components/formularios/AdicionarParticipantesModal.jsx';
import AvaliacaoModal from '../../components/formularios/AvaliacaoModal.jsx';
import EventoModal from '../../components/formularios/EventoModal.jsx';
import { GraficoRosca } from '../../components/graficos.jsx';
import { CabecalhoPagina, Carregando, Cartao, Estrelas, Confirmar, Icone, Paginacao, Selo, Vazio, btn, campoClasse } from '../../components/ui.jsx';
import { dataHora, numero } from '../../helpers/formatar.js';

export default function EventoDetalhe() {
  const c = useEventoController();
  const {
    ev, carregando, lista, visiveis, porPagina, aconteceu, podeConfirmar, notas, busca, filtro, pagina, setPagina,
    sel, todosMarcados, marcar, marcarTodos, presenca, exportar, editar, adicionar, avaliar, confirmar,
  } = c;

  if (carregando && !ev) return <Carregando />;
  if (!ev) return <Vazio icone="event_busy" texto="Evento não encontrado."><Link to="/admin/capacitacoes" className={btn.primario}>Voltar</Link></Vazio>;

  return (
    <div className="space-y-stack-lg">
      <nav className="flex items-center gap-2 text-label-sm text-on-surface-variant">
        <Link to="/admin/capacitacoes" className="hover:text-primary">Capacitações</Link><Icone nome="chevron_right" className="text-[16px]" /><span className="text-primary">Evento</span>
      </nav>

      <CabecalhoPagina titulo={ev.titulo} subtitulo={`${dataHora(ev.data)} · ${ev.local}`}>
        <Selo status={ev.status} />
        <button className={btn.secundario} onClick={exportar}><Icone nome="download" /> Lista de presença</button>
        {c.gerencia && !ev.encerrado && <button className={btn.secundario} onClick={c.abrirEdicao}><Icone nome="edit" /> Editar</button>}
        {c.gerencia && !ev.tem_certificado && (
          <button className={btn.perigo} onClick={c.pedirExclusao}>
            <Icone nome="delete" />
          </button>
        )}
        {c.gerencia && podeConfirmar && (
          <button className={btn.primario} onClick={c.pedirEncerramento}><Icone nome="task_alt" /> Encerrar evento</button>
        )}
      </CabecalhoPagina>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Cartao className="p-6 lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-5">
          {[
            ['schedule', 'Carga horária', `${ev.carga_horaria} horas`],
            ['co_present', 'Facilitador', `${ev.facilitador_nome}${ev.facilitador_interno ? '' : ' (externo)'}`],
            ['laptop_chromebook', 'Modalidade', rotulo(MODALIDADES, ev.modalidade)],
            ['groups', 'Público-alvo', rotulo(PUBLICOS_ALVO, ev.publico_alvo)],
            ['apartment', 'Unidades', ev.unidades_nomes.length ? ev.unidades_nomes.join(', ') : 'Toda a rede'],
            ['workspace_premium', 'Certificados', `${ev.certificados} participante(s)${ev.certificado_facilitador ? ' + facilitador' : ''}`],
          ].map(([icone, rot, valor]) => (
            <div key={rot} className="flex gap-3">
              <Icone nome={icone} className="text-primary" />
              <div className="min-w-0"><p className="text-label-upper font-label-upper text-on-surface-variant uppercase">{rot}</p><p className="text-body-md text-on-surface">{valor}</p></div>
            </div>
          ))}
          {ev.certificado_facilitador && (
            <a href={`/certificado/${ev.certificado_facilitador}`} target="_blank" rel="noreferrer" className="col-span-full text-primary text-label-sm font-bold hover:underline flex items-center gap-1">
              <Icone nome="open_in_new" className="text-[16px]" /> Ver certificado do facilitador ({ev.certificado_facilitador})
            </a>
          )}
        </Cartao>
        <Cartao className="p-6">
          <p className="text-label-upper font-label-upper text-on-surface-variant mb-2">PRESENÇA</p>
          <p className="text-display-lg font-display-lg">{ev.presentes}<span className="text-headline-md text-outline">/{ev.convocados}</span></p>
          <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden mt-3">
            <div className="bg-primary h-full transition-all duration-700" style={{ width: `${ev.convocados ? (ev.presentes / ev.convocados) * 100 : 0}%` }} />
          </div>
          <p className="text-label-sm text-on-surface-variant mt-3">
            {ev.nota_media != null ? <>Nota média <Estrelas nota={ev.nota_media} /> em {ev.avaliacoes} avaliação(ões)</> : 'Sem avaliações ainda'}
          </p>
          {notas.length > 0 && <GraficoRosca dados={notas} altura={150} />}
        </Cartao>
      </section>

      <Cartao className="overflow-hidden">
        <div className="p-6 border-b border-border-subtle flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-title-sm font-title-sm">Participantes</h3>
            <p className="text-label-sm text-on-surface-variant">
              {podeConfirmar ? 'Marque quem esteve presente. O certificado sai na hora.' : ev.encerrado ? 'Evento encerrado: lista apenas para consulta.' : 'A presença pode ser confirmada depois que o evento acontecer.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Icone nome="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]" />
              <input className={`${campoClasse} pl-10 py-2 w-56!`} placeholder="Buscar participante..." value={busca} onChange={(e) => c.mudarBusca(e.target.value)} />
            </div>
            <select className={`${campoClasse} py-2 w-auto!`} value={filtro} onChange={(e) => c.mudarFiltro(e.target.value)} aria-label="Filtro">
              <option value="todos">Todos</option><option value="presentes">Presentes</option><option value="pendentes">Sem presença</option>
            </select>
            {c.gerencia && !ev.encerrado && <button className={btn.secundario} onClick={c.abrirAdicionar}><Icone nome="person_add" /> Adicionar</button>}
          </div>
        </div>

        {podeConfirmar && sel.size > 0 && (
          <div className="px-6 py-3 bg-primary/5 border-b border-border-subtle flex items-center gap-3">
            <span className="text-body-md font-semibold">{sel.size} selecionado(s)</span>
            <button className={btn.primario} onClick={() => presenca([...sel], true)}><Icone nome="how_to_reg" /> Confirmar presença</button>
            <button className={btn.secundario} onClick={() => presenca([...sel], false)}>Marcar ausência</button>
            <button className="text-label-sm text-on-surface-variant hover:underline" onClick={c.limparSelecao}>Limpar seleção</button>
          </div>
        )}

        {lista.length === 0 ? <Vazio icone="person_off" texto="Nenhum participante com esses filtros." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-label-upper font-label-upper text-on-surface-variant border-b border-border-subtle">
                  {podeConfirmar && <th className="pl-6 py-3 w-10"><input type="checkbox" className="rounded text-primary" checked={todosMarcados} onChange={marcarTodos} aria-label="Selecionar todos" /></th>}
                  <th className="px-6 py-3">NOME</th><th className="px-4 py-3">UNIDADE</th><th className="px-4 py-3">PRESENÇA</th><th className="px-4 py-3">CERTIFICADO</th><th className="px-4 py-3">NOTA</th><th className="px-4 py-3 text-right">AÇÕES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {visiveis.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-container-low/60">
                    {podeConfirmar && <td className="pl-6 py-3"><input type="checkbox" className="rounded text-primary disabled:opacity-30" disabled={Boolean(p.certificado)} checked={sel.has(p.id)} onChange={() => marcar(p.id)} aria-label={`Selecionar ${p.nome}`} /></td>}
                    <td className="px-6 py-3"><p className="text-body-md font-semibold">{p.nome}</p><p className="text-label-sm text-on-surface-variant">{p.email}</p></td>
                    <td className="px-4 py-3 text-body-md">{p.unidade_nome}</td>
                    <td className="px-4 py-3">
                      {p.presente ? (
                        <span title={`Confirmado por ${p.confirmado_por} em ${dataHora(p.confirmado_em)}`}><Selo status="encerrado" texto="Presente" /></span>
                      ) : podeConfirmar ? (
                        <button className="text-primary text-label-sm font-bold hover:underline" onClick={() => presenca([p.id], true)}>Confirmar</button>
                      ) : <Selo status="agendado" texto={aconteceu ? 'Ausente' : 'Convocado'} />}
                    </td>
                    <td className="px-4 py-3 text-label-sm">
                      {p.certificado ? <a className="text-primary font-mono hover:underline" href={`/certificado/${p.certificado}`} target="_blank" rel="noreferrer">{p.certificado}</a> : <span className="text-outline">—</span>}
                    </td>
                    <td className="px-4 py-3 text-body-md">
                      {p.nota ? <span title={p.comentario}><Estrelas nota={p.nota} /></span>
                        : p.presente && c.podeRegistrarNota ? <button className="text-primary text-label-sm hover:underline" onClick={() => c.abrirAvaliacao(p)}>Registrar</button> : <span className="text-outline">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {c.gerencia && !p.certificado && !ev.encerrado && (
                        <button className={btn.icone} title="Remover da lista" onClick={() => c.pedirRemocao(p)}>
                          <Icone nome="person_remove" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Paginacao pagina={pagina} total={lista.length} porPagina={porPagina} onMudar={setPagina} rotulo="participantes" />
      </Cartao>

      <EventoModal aberto={editar} evento={ev} onFechar={c.fecharEdicao} />
      <AdicionarParticipantesModal aberto={adicionar} eventoId={ev.id} onFechar={c.fecharAdicionar} />
      <AvaliacaoModal participante={avaliar} onFechar={c.fecharAvaliacao} />
      <Confirmar aberto={Boolean(confirmar)} titulo={confirmar?.titulo} mensagem={confirmar?.mensagem} perigo={confirmar?.perigo} textoBotao={confirmar?.botao}
        onFechar={c.fecharConfirmacao} onConfirmar={c.executarConfirmacao} />
    </div>
  );
}
