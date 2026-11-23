// View do layout das telas internas: menu lateral e cabeçalho, iguais em todas as telas.
// O menu mostra só as telas do perfil logado (models/regras.js, TELAS).
// Os dados (usuário, busca, notificações) vêm de controllers/useLayoutController.js.
// Aqui fica só estado visual (menu suspenso aberto ou fechado).
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useBuscaGeral, useLayoutController, useNotificacoes } from '../../controllers/useLayoutController.js';
import { usePermissoes } from '../../controllers/usePermissoes.js';
import { PERFIS, rotulo } from '../../models/regras.js';
import LogoGecap from '../components/LogoGecap.jsx';
import { Icone, Modal, btn } from '../components/ui.jsx';
import { data, iniciais } from '../helpers/formatar.js';

const MENU = [
  { tela: 'painel', to: '/admin', icone: 'dashboard', rotulo: 'Dashboard', end: true },
  { tela: 'capacitacoes', to: '/admin/capacitacoes', icone: 'school', rotulo: 'Capacitações' },
  { tela: 'minhas', to: '/admin/minhas-capacitacoes', icone: 'local_library', rotulo: 'Minhas capacitações' },
  { tela: 'certificados', to: '/admin/certificados', icone: 'workspace_premium', rotulo: 'Certificados' },
  { tela: 'relatorios', to: '/admin/relatorios', icone: 'assessment', rotulo: 'Relatórios' },
  { tela: 'equipes', to: '/admin/equipes', icone: 'groups', rotulo: 'Equipes' },
  { tela: 'unidades', to: '/admin/unidades', icone: 'account_balance', rotulo: 'Unidades/Órgãos' },
  { tela: 'configuracoes', to: '/admin/configuracoes', icone: 'settings', rotulo: 'Configurações' },
];

// Texto que some suavemente quando o menu é recolhido (o ícone continua).
const textoMenu = (recolhido) => `whitespace-nowrap overflow-hidden transition-all duration-300 ${recolhido ? 'max-w-0 opacity-0' : 'max-w-48 opacity-100'}`;

function ItemMenu({ to, icone, rotulo: texto, end, recolhido }) {
  const base = `flex items-center px-3 py-2 rounded-xl transition-all duration-200 active:scale-95 ${recolhido ? 'gap-0' : 'gap-3'}`;
  return (
    <NavLink to={to} end={end} title={recolhido ? texto : undefined} aria-label={texto}
      className={({ isActive }) => (isActive
        ? `${base} bg-primary text-on-primary shadow-md`
        : `${base} text-on-surface-variant hover:bg-surface-container-high`)}>
      {({ isActive }) => (<><Icone nome={icone} cheio={isActive} /><span className={`text-label-sm font-label-sm ${textoMenu(recolhido)}`}>{texto}</span></>)}
    </NavLink>
  );
}

// Fecha um menu suspenso ao clicar fora dele.
function useFora(ref, fechar) {
  useEffect(() => {
    const f = (e) => ref.current && !ref.current.contains(e.target) && fechar();
    document.addEventListener('mousedown', f);
    return () => document.removeEventListener('mousedown', f);
  }, [ref, fechar]);
}

function BuscaGeral() {
  const { texto, setTexto, resultados, ir: irPara, mostrar } = useBuscaGeral();
  const [aberto, setAberto] = useState(false);
  const ref = useRef(null);
  useFora(ref, () => setAberto(false));
  const ir = (link) => { setAberto(false); irPara(link); };

  return (
    <div className="relative w-full max-w-md" ref={ref}>
      <Icone nome="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
      <input
        className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-full font-body-md text-body-md text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 transition-all"
        placeholder="Buscar profissionais, capacitações, eventos..." value={texto}
        onChange={(e) => { setTexto(e.target.value); setAberto(true); }} onFocus={() => setAberto(true)}
        onKeyDown={(e) => { if (e.key === 'Enter' && resultados[0]) ir(resultados[0].link); if (e.key === 'Escape') setAberto(false); }}
        aria-label="Busca geral"
      />
      {aberto && mostrar && (
        <div className="absolute top-full mt-2 w-full bg-surface-card border border-border-subtle rounded-xl shadow-lg overflow-hidden z-50">
          {resultados.length === 0 ? (
            <p className="px-4 py-3 text-body-md text-on-surface-variant">Nada encontrado para “{texto}”.</p>
          ) : resultados.map((r, i) => (
            <button key={i} onClick={() => ir(r.link)} className="w-full text-left px-4 py-2.5 hover:bg-surface-container-low flex items-center justify-between gap-3">
              <span className="min-w-0">
                <span className="block text-body-md text-on-surface truncate">{r.titulo}</span>
                <span className="block text-label-sm text-on-surface-variant truncate">{r.sub}</span>
              </span>
              <span className="text-[10px] font-bold uppercase text-primary shrink-0">{r.tipo}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Notificacoes() {
  const [aberto, setAberto] = useState(false);
  const ref = useRef(null);
  const { avisos: lista } = useNotificacoes();
  useFora(ref, () => setAberto(false));
  // Apresentação de cada aviso (cor e texto).
  const avisos = lista.map((a) => (a.tipo === 'pendencia'
    ? { ...a, cor: 'bg-error-red', texto: `${a.faltam} participante(s) sem confirmação · ${data(a.data)}` }
    : { ...a, cor: 'bg-primary', texto: `${data(a.data)} · ${a.local}` }));
  return (
    <div className="relative" ref={ref}>
      <button className="text-on-surface-variant hover:bg-surface-container-low rounded-full p-2 transition-colors relative" onClick={() => setAberto((a) => !a)} aria-label={`Notificações (${avisos.length})`}>
        <Icone nome="notifications" />
        {avisos.length > 0 && <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-error-red rounded-full text-[10px] font-bold text-white flex items-center justify-center">{avisos.length}</span>}
      </button>
      {aberto && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-surface-card border border-border-subtle rounded-xl shadow-lg z-50 overflow-hidden">
          <p className="px-4 py-3 border-b border-border-subtle font-title-sm text-title-sm">Notificações</p>
          {avisos.length === 0 ? <p className="px-4 py-6 text-body-md text-on-surface-variant">Nenhuma pendência. Tudo em dia!</p> : (
            <div className="max-h-96 overflow-y-auto custom-scrollbar divide-y divide-border-subtle">
              {avisos.map((a, i) => (
                <Link key={i} to={a.link} onClick={() => setAberto(false)} className="flex gap-3 px-4 py-3 hover:bg-surface-container-low">
                  <span className={`w-2 h-2 rounded-full mt-2 shrink-0 ${a.cor}`} />
                  <span><span className="block text-body-md text-on-surface">{a.titulo}</span><span className="block text-label-sm text-on-surface-variant">{a.texto}</span></span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Ajuda() {
  const [aberto, setAberto] = useState(false);
  const passos = [
    ['Capacitações', 'Crie a capacitação (o tema) e depois um evento com data, local e unidades. Os profissionais ativos dessas unidades são convocados.'],
    ['Presença', 'Depois do evento, abra-o e marque quem esteve presente. O certificado do participante é gerado na hora.'],
    ['Encerramento', 'Ao encerrar o evento, sai o certificado do facilitador e o evento fica travado para edição.'],
    ['Certificados', 'Qualquer certificado pode ser conferido pelo código NUMEP-XXXX-XXXX na tela Certificados.'],
    ['Equipes', 'Cadastre profissionais, unidades e cargos. O perfil de acesso define o que cada um pode fazer.'],
  ];
  return (
    <>
      <button className="text-on-surface-variant hover:bg-surface-container-low rounded-full p-2 transition-colors" onClick={() => setAberto(true)} aria-label="Ajuda"><Icone nome="help_outline" /></button>
      <Modal aberto={aberto} onFechar={() => setAberto(false)} titulo="Como usar o GECAP-NUMEP" largura="max-w-xl"
        rodape={<button className={btn.primario} onClick={() => setAberto(false)}>Entendi</button>}>
        <ol className="space-y-4">
          {passos.map(([t, d], i) => (
            <li key={t} className="flex gap-3">
              <span className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">{i + 1}</span>
              <span><span className="block font-title-sm text-title-sm">{t}</span><span className="text-body-md text-on-surface-variant">{d}</span></span>
            </li>
          ))}
        </ol>
      </Modal>
    </>
  );
}

export default function AdminLayout() {
  const { usuario, sair, novoEvento, recolhido, alternarMenu } = useLayoutController();
  const { podeVer, pode, inicio } = usePermissoes();
  const perfilLink = podeVer('perfil');

  // --menu: largura do menu lateral (aberto 16rem, recolhido 5rem); cabeçalho e conteúdo acompanham com animação.
  return (
    <div className="text-on-surface" style={{ '--menu': recolhido ? '5rem' : '16rem' }}>
      <aside className="print:hidden fixed left-0 top-0 h-full w-(--menu) transition-[width] duration-300 ease-in-out bg-surface-container-lowest border-r border-outline-variant shadow-xs flex flex-col py-6 px-4 z-50 overflow-hidden">
        <div className={`mb-stack-lg flex ${recolhido ? 'flex-col items-center gap-3' : 'items-start justify-between gap-1'}`}>
          {/* Logo: completa com o menu aberto, só o símbolo com o menu recolhido. Fundo branco para o tema escuro. */}
          <Link to={inicio} aria-label="Página inicial" className="bg-white rounded-xl p-1.5 shrink-0 transition-all duration-300">
            {recolhido ? <LogoGecap variante="simbolo" largura={36} /> : <LogoGecap variante="completa" largura={152} />}
          </Link>
          <button onClick={alternarMenu} className={`${btn.icone} shrink-0`} aria-expanded={!recolhido}
            aria-label={recolhido ? 'Expandir menu' : 'Recolher menu'} title={recolhido ? 'Expandir menu' : 'Recolher menu'}>
            <Icone nome={recolhido ? 'left_panel_open' : 'left_panel_close'} />
          </button>
        </div>
        <nav className="flex-1 space-y-2">
          {MENU.filter((item) => podeVer(item.tela)).map((item) => <ItemMenu key={item.to} {...item} recolhido={recolhido} />)}
        </nav>
        {pode('gerenciarevento') && (
          <button onClick={novoEvento} title={recolhido ? 'Novo evento' : undefined} aria-label="Novo evento"
            className={`w-full flex items-center justify-center bg-primary text-on-primary py-3 rounded-xl font-label-sm text-label-sm shadow-md transition-all duration-300 hover:opacity-90 active:scale-95 ${recolhido ? 'px-0 gap-0' : 'px-4 gap-2'}`}>
            <Icone nome="add" className="text-[20px]" /><span className={textoMenu(recolhido)}>Novo evento</span>
          </button>
        )}
      </aside>

      <header className="print:hidden fixed top-0 right-0 left-(--menu) transition-[left] duration-300 ease-in-out h-header-height bg-surface border-b border-border-subtle z-40">
        <div className="flex justify-between items-center px-gutter h-full">
          <div className="flex items-center gap-4 w-1/2"><BuscaGeral /></div>
          <div className="flex items-center gap-4">
            {podeVer('evento') && <Notificacoes />}
            <Ajuda />
            <Link to={perfilLink ? '/admin/perfil' : '#'} onClick={(e) => !perfilLink && e.preventDefault()}
              className={`flex items-center gap-3 pl-4 border-l border-border-subtle ${perfilLink ? '' : 'cursor-default'}`}>
              <div className="text-right">
                <p className="font-title-sm text-title-sm">{usuario?.nome ?? '...'}</p>
                <p className="text-label-sm font-label-sm text-secondary">{usuario ? `${rotulo(PERFIS, usuario.perfil)} · ${usuario.unidade_nome}` : ''}</p>
              </div>
              <span className="w-10 h-10 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-bold flex items-center justify-center border-2 border-primary/20">{iniciais(usuario?.nome)}</span>
            </Link>
            <button className="text-on-surface-variant hover:bg-surface-container-low rounded-full p-2 transition-colors" onClick={sair} aria-label="Sair" title="Sair"><Icone nome="logout" /></button>
          </div>
        </div>
      </header>

      <main className="ml-(--menu) transition-[margin] duration-300 ease-in-out pt-header-height min-h-screen print:ml-0 print:pt-0">
        <div className="max-w-container-max mx-auto px-gutter py-stack-lg">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
