// View do modal "Avaliar Capacitação" (tela do Stitch modal_de_feedback_treinamento):
// o próprio participante dá a nota e deixa comentários. Estado: useAvaliarCapacitacaoForm.
import { useAvaliarCapacitacaoForm } from '../../../controllers/useMinhasCapacitacoesController.js';
import { LIMITES } from '../../../models/regras.js';
import { Icone, btn, campoClasse } from '../ui.jsx';

const ROTULOS = ['', 'Ruim', 'Regular', 'Bom', 'Muito bom', 'Excelente'];

export default function AvaliarCapacitacaoModal({ capacitacao, onFechar }) {
  const { nota, setNota, comentario, setComentario, erro, enviando, enviar } = useAvaliarCapacitacaoForm({ capacitacao, onFechar });
  if (!capacitacao) return null;
  return (
    <div className="fixed inset-0 z-60 modal-overlay flex items-center justify-center p-gutter" role="dialog" aria-modal="true" aria-label="Avaliar capacitação"
      onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <div className="bg-surface-card w-full max-w-xl rounded-xl shadow-lg border border-border-subtle overflow-hidden">
        <div className="p-8 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <span className="w-14 h-14 rounded-xl bg-primary-fixed text-primary flex items-center justify-center"><Icone nome="rate_review" className="text-[28px]" /></span>
            <button type="button" onClick={onFechar} aria-label="Fechar" className={btn.icone}><Icone nome="close" /></button>
          </div>
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface">Avaliar Capacitação</h2>
            <p className="text-body-md text-on-surface-variant mt-1">
              Sua opinião sobre <b className="text-on-surface">{capacitacao.titulo}</b> é fundamental para melhorarmos as ações de educação permanente.
            </p>
          </div>
          <div>
            <p className="text-label-sm font-bold text-on-surface mb-2">Sua nota para este curso</p>
            <div className="flex items-center gap-2" role="radiogroup" aria-label="Nota">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" role="radio" aria-checked={nota === n} aria-label={`${n} estrela(s)`} onClick={() => setNota(n)} className="p-0.5">
                  <Icone nome="star" cheio={n <= nota} className={`text-[36px] transition-colors ${n <= nota ? 'text-tertiary-container' : 'text-outline-variant hover:text-outline'}`} />
                </button>
              ))}
              {nota > 0 && <span className="ml-2 text-label-sm text-on-surface-variant">{ROTULOS[nota]}</span>}
            </div>
          </div>
          <label className="block">
            <span className="block text-label-sm font-bold text-on-surface mb-2">Comentários e Sugestões</span>
            <textarea className={`${campoClasse} min-h-[120px]`} placeholder="Conte-nos o que você achou do conteúdo, do facilitador e da organização..."
              value={comentario} onChange={(e) => setComentario(e.target.value)} maxLength={LIMITES.comentario} />
          </label>
          {erro && <p role="alert" className="text-error text-body-md">{erro}</p>}
        </div>
        <div className="px-8 py-5 bg-surface-container-low flex justify-end gap-3 border-t border-border-subtle">
          <button className={btn.secundario} onClick={onFechar}>Cancelar</button>
          <button className={btn.primario} onClick={enviar} disabled={enviando}>Enviar Feedback</button>
        </div>
      </div>
    </div>
  );
}
