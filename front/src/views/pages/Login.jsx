// View da tela de login: usuário e senha do Moodle. Dados: useLoginController.
import { useLoginController } from '../../controllers/useSessaoController.js';
import LogoGecap from '../components/LogoGecap.jsx';
import { Campo, Cartao, Icone, btn, campoClasse } from '../components/ui.jsx';

export default function Login() {
  const { f, erro, enviando, mudar, enviar } = useLoginController();
  return (
    <div className="min-h-screen bg-surface-bg flex items-center justify-center p-gutter text-on-surface">
      <Cartao className="w-full max-w-md p-8">
        <h1 className="mb-stack-lg flex justify-center">
          <span className="bg-white rounded-2xl p-3"><LogoGecap variante="completa" largura={240} /></span>
        </h1>
        <form onSubmit={enviar} className="space-y-5">
          <Campo rotulo="Usuário ou e-mail">
            <input className={campoClasse} value={f.usuario} onChange={mudar('usuario')} autoComplete="username" autoFocus />
          </Campo>
          <Campo rotulo="Senha">
            <input className={campoClasse} type="password" value={f.senha} onChange={mudar('senha')} autoComplete="current-password" />
          </Campo>
          {erro && (
            <p role="alert" className="flex items-start gap-2 text-body-md text-error"><Icone nome="error" /> {erro}</p>
          )}
          <button type="submit" className={`${btn.primario} w-full`} disabled={enviando}>
            {enviando ? <Icone nome="progress_activity" className="animate-spin" /> : <Icone nome="login" />} Entrar
          </button>
        </form>
        <p className="mt-6 text-label-sm text-outline">Use o mesmo login e senha do Moodle.</p>
      </Cartao>
    </div>
  );
}
