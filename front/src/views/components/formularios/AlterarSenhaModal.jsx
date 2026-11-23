// View do formulário de troca de senha. Estado e envio: useAlterarSenhaForm.
import { useAlterarSenhaForm } from '../../../controllers/useConfiguracoesController.js';
import { Campo, Modal, btn, campoClasse } from '../ui.jsx';

export default function AlterarSenhaModal({ aberto, onFechar }) {
  const { f, erro, mudar, enviar } = useAlterarSenhaForm({ aberto, onFechar });
  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo="Alterar senha" largura="max-w-md"
      rodape={<><button className={btn.secundario} onClick={onFechar}>Cancelar</button><button className={btn.primario} form="form-senha">Alterar</button></>}>
      <form id="form-senha" onSubmit={enviar} className="space-y-4">
        <Campo rotulo="Senha atual"><input type="password" className={campoClasse} value={f.atual} onChange={mudar('atual')} autoComplete="current-password" autoFocus /></Campo>
        <Campo rotulo="Nova senha" dica="Pelo menos 8 caracteres, com letras e números."><input type="password" className={campoClasse} value={f.nova} onChange={mudar('nova')} autoComplete="new-password" /></Campo>
        <Campo rotulo="Confirmar nova senha"><input type="password" className={campoClasse} value={f.confirmacao} onChange={mudar('confirmacao')} autoComplete="new-password" /></Campo>
        {erro && <p className="text-error text-body-md">{erro}</p>}
      </form>
    </Modal>
  );
}
