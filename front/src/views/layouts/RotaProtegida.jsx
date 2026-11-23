// View: só mostra as telas do Master depois do login e com os dados do Moodle carregados.
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSessao } from '../../controllers/useSessaoController.js';
import { Carregando } from '../components/ui.jsx';

export default function RotaProtegida() {
  const { estado } = useSessao();
  const { pathname } = useLocation();
  if (estado === 'verificando') return <Carregando texto="Carregando dados do Moodle..." />;
  if (estado === 'fora') return <Navigate to="/login" replace state={{ de: pathname }} />;
  return <Outlet />;
}
