// View do editor do modelo do certificado (só o Master): textos à esquerda, prévia ao vivo à direita.
// Estado e envio: controllers/formularios/useModeloCertificadoForm.js.
import { useModeloCertificadoForm } from '../../../controllers/formularios/useModeloCertificadoForm.js';
import { MARCADORES } from '../../../models/certificadoModel.js';
import CertificadoNumep from '../CertificadoNumep.jsx';
import { Abas, Campo, Modal, btn, campoClasse } from '../ui.jsx';

export default function ModeloCertificadoModal({ aberto, onFechar }) {
  const f = useModeloCertificadoForm({ aberto, onFechar });
  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo="Modelo do certificado" largura="max-w-7xl"
      subtitulo="O fundo (moldura, logos e assinatura) é fixo. Aqui você muda os textos e a cidade."
      rodape={<>
        <button className={`${btn.secundario} mr-auto`} onClick={f.restaurarPadrao}>Voltar ao texto padrão</button>
        <button className={btn.secundario} onClick={onFechar}>Cancelar</button>
        <button className={btn.primario} onClick={f.salvar} disabled={f.salvando}>Salvar modelo</button>
      </>}>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <Campo rotulo="Abertura"><textarea className={`${campoClasse} min-h-[70px]`} value={f.modelo.abertura} onChange={f.mudar('abertura')} maxLength={600} /></Campo>
          <Campo rotulo="Texto do participante"><textarea className={`${campoClasse} min-h-[90px]`} value={f.modelo.participante} onChange={f.mudar('participante')} maxLength={600} /></Campo>
          <Campo rotulo="Texto do facilitador"><textarea className={`${campoClasse} min-h-[90px]`} value={f.modelo.facilitador} onChange={f.mudar('facilitador')} maxLength={600} /></Campo>
          <Campo rotulo="Cidade" dica="Aparece antes da data de emissão: “Patos de Minas, 24 de Setembro de 2026.”">
            <input className={campoClasse} value={f.modelo.cidade} onChange={f.mudar('cidade')} maxLength={100} />
          </Campo>
          <div className="p-4 bg-surface-container-low rounded-xl">
            <p className="text-label-upper font-label-upper text-on-surface-variant mb-2">MARCADORES</p>
            <ul className="space-y-1 text-label-sm text-on-surface-variant">
              {MARCADORES.map(([m, d]) => <li key={m}><code className="font-mono text-primary">{m}</code> {d}</li>)}
            </ul>
          </div>
          {f.erro && <p role="alert" className="text-error text-body-md">{f.erro}</p>}
        </div>
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-label-upper font-label-upper text-on-surface-variant">PRÉVIA</p>
            <Abas ativa={f.tipo} onMudar={f.setTipo} abas={[{ valor: 'participante', rotulo: 'Participante' }, { valor: 'facilitador', rotulo: 'Facilitador' }]} />
          </div>
          <CertificadoNumep certificado={f.exemplo} modelo={f.modelo} className="rounded-lg border border-border-subtle shadow-md" />
        </div>
      </div>
    </Modal>
  );
}
