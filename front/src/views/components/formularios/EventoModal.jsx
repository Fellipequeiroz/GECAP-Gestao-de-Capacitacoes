// View do formulário de evento (ocorrência de uma capacitação).
// Estado, regras e envio ficam em controllers/formularios/useEventoForm.js.
import { useEventoForm } from '../../../controllers/formularios/useEventoForm.js';
import { LIMITES, MODALIDADES, PUBLICOS_ALVO } from '../../../models/regras.js';
import { Campo, Modal, btn, campoClasse } from '../ui.jsx';

export default function EventoModal({ aberto, evento, capacitacaoId, onFechar, onSalvo }) {
  const {
    form, erro, salvando, caps, unidades, pessoas, convocados, travado, mudar, escolherFacilitador, alternarUnidade, enviar,
  } = useEventoForm({ aberto, evento, capacitacaoId, onFechar, onSalvo });

  return (
    <Modal aberto={aberto} onFechar={onFechar} largura="max-w-3xl"
      titulo={evento ? 'Editar evento' : 'Novo evento'}
      subtitulo="Data, local, carga horária e quem participa."
      rodape={<>
        <button type="button" className={btn.secundario} onClick={onFechar}>Cancelar</button>
        <button className={btn.primario} form="form-evento" type="submit" disabled={salvando}>
          <span className="material-symbols-outlined text-[18px]">event_available</span>{salvando ? 'Salvando...' : evento ? 'Salvar' : 'Criar e convocar'}
        </button>
      </>}>
      <form id="form-evento" onSubmit={enviar} className="grid grid-cols-2 gap-5">
        {travado && (
          <p className="col-span-2 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed-variant px-4 py-3 text-body-md">
            Este evento já tem certificados emitidos: capacitação, data e carga horária estão travadas (regra 6.1).
          </p>
        )}
        <Campo rotulo="Capacitação" className="col-span-2">
          <select className={campoClasse} value={form.capacitacao_id} onChange={mudar('capacitacao_id')} disabled={travado} required>
            <option value="">Selecione...</option>
            {caps.map((c) => <option key={c.id} value={c.id}>{c.titulo}</option>)}
          </select>
        </Campo>
        <Campo rotulo="Data e hora">
          <input className={campoClasse} type="datetime-local" value={form.data} onChange={mudar('data')} disabled={travado} required />
        </Campo>
        <Campo rotulo="Carga horária (horas)">
          <input className={campoClasse} type="number" min="1" step="1" value={form.carga_horaria} onChange={mudar('carga_horaria')} disabled={travado} required />
        </Campo>
        <Campo rotulo="Local" className="col-span-2">
          <input className={campoClasse} value={form.local} onChange={mudar('local')} placeholder="Ex.: Auditório da Secretaria" maxLength={LIMITES.local} required />
        </Campo>
        <Campo rotulo="Modalidade">
          <select className={campoClasse} value={form.modalidade} onChange={mudar('modalidade')}>
            {MODALIDADES.map((m) => <option key={m.valor} value={m.valor}>{m.rotulo}</option>)}
          </select>
        </Campo>
        <Campo rotulo="Público-alvo" dica="Rótulo informativo. Quem é convocado são as unidades marcadas.">
          <select className={campoClasse} value={form.publico_alvo} onChange={mudar('publico_alvo')}>
            {PUBLICOS_ALVO.map((p) => <option key={p.valor} value={p.valor}>{p.rotulo}</option>)}
          </select>
        </Campo>

        {form.publico_alvo !== 'rede_geral' && (
          <fieldset className="col-span-2">
            <legend className="font-label-upper text-label-upper text-on-surface-variant uppercase mb-2">Unidades convocadas</legend>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {unidades.map((u) => (
                <label key={u.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-body-md ${form.unidades.includes(u.id) ? 'border-primary bg-primary/5' : 'border-border-subtle'}`}>
                  <input type="checkbox" className="rounded text-primary focus:ring-primary" checked={form.unidades.includes(u.id)} onChange={() => alternarUnidade(u.id)} />
                  <span className="truncate" title={u.nome}>{u.nome}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <p className="col-span-2 text-label-sm text-on-surface-variant -mt-2">
          {convocados} profissional(is) ativo(s) {evento ? 'nas unidades marcadas (novos serão convocados ao salvar)' : 'serão convocados'}.
        </p>

        <fieldset className="col-span-2 space-y-3">
          <legend className="font-label-upper text-label-upper text-on-surface-variant uppercase mb-2">Facilitador</legend>
          <div className="flex gap-4 text-body-md">
            <label className="flex items-center gap-2"><input type="radio" className="text-primary" checked={form.facilitador_tipo === 'interno'} onChange={() => escolherFacilitador('interno')} /> Profissional da rede</label>
            <label className="flex items-center gap-2"><input type="radio" className="text-primary" checked={form.facilitador_tipo === 'externo'} onChange={() => escolherFacilitador('externo')} /> Convidado externo</label>
          </div>
          {form.facilitador_tipo === 'interno' ? (
            <select className={campoClasse} value={form.facilitador_userid} onChange={mudar('facilitador_userid')} required>
              <option value="">Selecione o profissional...</option>
              {pessoas.map((p) => <option key={p.id} value={p.id}>{p.nome} — {p.unidade_nome}</option>)}
            </select>
          ) : (
            <input className={campoClasse} value={form.facilitador_nome_externo} onChange={mudar('facilitador_nome_externo')} placeholder="Nome do facilitador convidado" maxLength={LIMITES.facilitador_nome_externo} required />
          )}
        </fieldset>
        {erro && <p className="col-span-2 rounded-lg bg-error/10 text-error px-4 py-3 text-body-md" role="alert">{erro}</p>}
      </form>
    </Modal>
  );
}
