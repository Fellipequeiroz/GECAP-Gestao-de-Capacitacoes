// Controllers da sessão: proteção das telas do Master, formulário de login e botão Sair.
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { entrarNoSistema, retomarSessao, sairDoSistema, telaInicial } from '../models/sessaoModel.js';

// Diz se as telas protegidas podem aparecer: verificando | dentro | fora.
export function useSessao() {
  const [estado, setEstado] = useState('verificando');
  useEffect(() => {
    let ativo = true;
    retomarSessao().then((ok) => ativo && setEstado(ok ? 'dentro' : 'fora'));
    // O Moodle recusou o token (expirou ou foi revogado): volta para o login.
    const encerrada = () => { sairDoSistema(); setEstado('fora'); };
    window.addEventListener('gecap-sessao-encerrada', encerrada);
    return () => { ativo = false; window.removeEventListener('gecap-sessao-encerrada', encerrada); };
  }, []);
  return { estado };
}

export function useLoginController() {
  const [f, setF] = useState({ usuario: '', senha: '' });
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const navegar = useNavigate();
  const destino = useLocation().state?.de;

  const enviar = async (e) => {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      await entrarNoSistema(f.usuario, f.senha);
      // Volta para onde estava; se não havia, vai para a tela inicial do perfil.
      navegar(destino && destino !== '/admin' ? destino : telaInicial(), { replace: true });
    } catch (err) {
      setErro(err.message);
      setEnviando(false);
    }
  };

  return { f, erro, enviando, mudar: (campo) => (e) => setF((x) => ({ ...x, [campo]: e.target.value })), enviar };
}

export function useSair() {
  const navegar = useNavigate();
  return () => { sairDoSistema(); navegar('/login', { replace: true }); };
}
