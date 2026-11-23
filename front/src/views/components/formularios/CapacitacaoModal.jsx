// View do formulário de capacitação (o tema da formação, sem data nem local).
// Estado e envio ficam em controllers/formularios/useCapacitacaoForm.js.
import { useCapacitacaoForm } from '../../../controllers/formularios/useCapacitacaoForm.js';
import { LIMITES } from '../../../models/regras.js';
import { Campo, Modal, btn, campoClasse } from '../ui.jsx';

export default function CapacitacaoModal({ aberto, capacitacao, onFechar, onSalvo }) {
  const { form, erro, mudar, enviar } = useCapacitacaoForm({ aberto, capacitacao, onFechar, onSalvo });

  return (
    <Modal aberto={aberto} onFechar={onFechar} largura="max-w-xl"
      titulo={capacitacao ? 'Editar capacitação' : 'Nova capacitação'}
      subtitulo="A capacitação é o tema. Data, local e carga horária ficam no evento."
      rodape={<>
        <button type="button" className={btn.secundario} onClick={onFechar}>Cancelar</button>
        <button className={btn.primario} form="form-capacitacao" type="submit">Salvar</button>
      </>}>
      <form id="form-capacitacao" onSubmit={enviar} className="space-y-5">
        <Campo rotulo="Título">
          <input className={campoClasse} value={form.titulo} onChange={mudar('titulo')} placeholder="Ex.: Acolhimento no SUAS" maxLength={LIMITES.titulo} required autoFocus />
        </Campo>
        <Campo rotulo="Descrição">
          <textarea className={`${campoClasse} min-h-[110px]`} value={form.descricao} onChange={mudar('descricao')} placeholder="Objetivo e conteúdo da capacitação" maxLength={LIMITES.descricao} />
        </Campo>
        {erro && <p className="rounded-lg bg-error/10 text-error px-4 py-3 text-body-md" role="alert">{erro}</p>}
      </form>
    </Modal>
  );
}
