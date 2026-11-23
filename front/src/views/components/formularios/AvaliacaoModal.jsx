// View do formulário de avaliação (registro manual, ex.: avaliação feita em papel).
// Estado e envio: controllers/formularios/useAvaliacaoForm.js.
import { useAvaliacaoForm } from '../../../controllers/formularios/useAvaliacaoForm.js';
import { LIMITES } from '../../../models/regras.js';
import { Campo, Icone, Modal, btn, campoClasse } from '../ui.jsx';

export default function AvaliacaoModal({ participante, onFechar }) {
  const { nota, setNota, comentario, setComentario, erro, enviar } = useAvaliacaoForm({ participante, onFechar });
  return (
    <Modal aberto={Boolean(participante)} onFechar={onFechar} titulo="Registrar avaliação" subtitulo={participante?.nome} largura="max-w-md"
      rodape={<><button className={btn.secundario} onClick={onFechar}>Cancelar</button><button className={btn.primario} onClick={enviar}>Salvar</button></>}>
      <div className="space-y-4">
        <p className="text-label-sm text-on-surface-variant">Use quando a avaliação foi feita em papel. Normalmente o participante avalia pelo próprio acesso.</p>
        <div className="flex gap-1" role="radiogroup" aria-label="Nota">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={nota === n} onClick={() => setNota(n)} className="p-1">
              <Icone nome="star" cheio={n <= nota} className={`text-[32px] ${n <= nota ? 'text-tertiary-container' : 'text-outline'}`} />
            </button>
          ))}
        </div>
        <Campo rotulo="Comentário (opcional)">
          <textarea className={`${campoClasse} min-h-[90px]`} value={comentario} onChange={(e) => setComentario(e.target.value)} maxLength={LIMITES.comentario} />
        </Campo>
        {erro && <p className="text-error text-body-md">{erro}</p>}
      </div>
    </Modal>
  );
}
