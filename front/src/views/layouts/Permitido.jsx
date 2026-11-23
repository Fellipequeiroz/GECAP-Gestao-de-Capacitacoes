// View: só mostra a tela se o perfil logado pode vê-la; senão, leva para a tela inicial dele.
import { Navigate } from 'react-router-dom';
import { usePermissoes } from '../../controllers/usePermissoes.js';

export default function Permitido({ tela, children }) {
  const { podeVer, inicio } = usePermissoes();
  return podeVer(tela) ? children : <Navigate to={inicio} replace />;
}
