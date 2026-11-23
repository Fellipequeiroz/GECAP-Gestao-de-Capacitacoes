// View do registro de atividades (auditoria). Dados: useRegistroAtividades.
import { useRegistroAtividades } from '../../controllers/useConfiguracoesController.js';
import { dataHora, tempoRelativo } from '../helpers/formatar.js';
import { Carregando, Modal } from './ui.jsx';

function Lista() {
  const { atividades } = useRegistroAtividades();
  if (!atividades) return <Carregando />;
  return (
    <ul className="divide-y divide-border-subtle">
      {atividades.map((a) => (
        <li key={a.id} className="py-3 flex justify-between gap-4">
          <span className="text-body-md"><b>{a.usuario}</b> {a.acao.toLowerCase()} <span className="text-on-surface-variant">{a.detalhe}</span></span>
          <span className="text-label-sm text-on-surface-variant whitespace-nowrap" title={dataHora(a.quando)}>{tempoRelativo(a.quando)}</span>
        </li>
      ))}
    </ul>
  );
}

export default function RegistroAtividadesModal({ aberto, onFechar }) {
  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo="Registro de atividades" subtitulo="Ações feitas no sistema, da mais recente para a mais antiga." largura="max-w-2xl">
      {aberto && <Lista />}
    </Modal>
  );
}
