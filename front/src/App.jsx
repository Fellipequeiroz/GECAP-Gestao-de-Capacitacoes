// Rotas do sistema (o "front controller": cada endereço aponta para uma view).
// Organização MVC: models/ (dados e regras), controllers/ (lógica de cada tela),
// views/ (só apresentação). Ver front/README.md.
// Quem vê cada tela está em models/regras.js (TELAS); <Permitido> aplica essa regra.
import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './views/layouts/AdminLayout.jsx';
import Permitido from './views/layouts/Permitido.jsx';
import RotaProtegida from './views/layouts/RotaProtegida.jsx';
import Login from './views/pages/Login.jsx';
import Capacitacoes from './views/pages/admin/Capacitacoes.jsx';
import Certificados from './views/pages/admin/Certificados.jsx';
import Configuracoes from './views/pages/admin/Configuracoes.jsx';
import Dashboard from './views/pages/admin/Dashboard.jsx';
import Equipes from './views/pages/admin/Equipes.jsx';
import EventoDetalhe from './views/pages/admin/EventoDetalhe.jsx';
import GestaoUnidades from './views/pages/admin/GestaoUnidades.jsx';
import MinhasCapacitacoes from './views/pages/admin/MinhasCapacitacoes.jsx';
import Perfil from './views/pages/admin/Perfil.jsx';
import Relatorios from './views/pages/admin/Relatorios.jsx';
import Certificado from './views/pages/Certificado.jsx';

const tela = (nome, elemento) => <Permitido tela={nome}>{elemento}</Permitido>;

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="/login" element={<Login />} />
      {/* Telas internas: só depois do login (dados vêm do Moodle), cada uma para os perfis de TELAS. */}
      <Route element={<RotaProtegida />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={tela('painel', <Dashboard />)} />
          <Route path="capacitacoes" element={tela('capacitacoes', <Capacitacoes />)} />
          <Route path="minhas-capacitacoes" element={tela('minhas', <MinhasCapacitacoes />)} />
          <Route path="eventos/:id" element={tela('evento', <EventoDetalhe />)} />
          <Route path="certificados" element={tela('certificados', <Certificados />)} />
          <Route path="relatorios" element={tela('relatorios', <Relatorios />)} />
          <Route path="equipes" element={tela('equipes', <Equipes />)} />
          <Route path="unidades" element={tela('unidades', <GestaoUnidades />)} />
          <Route path="configuracoes" element={tela('configuracoes', <Configuracoes />)} />
          <Route path="perfil" element={tela('perfil', <Perfil />)} />
        </Route>
      </Route>
      {/* Pública: qualquer pessoa confere o certificado pelo código. */}
      <Route path="/certificado/:codigo" element={<Certificado />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
