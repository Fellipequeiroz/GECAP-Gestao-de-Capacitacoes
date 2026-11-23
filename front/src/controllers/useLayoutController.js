// Controllers do layout (menu e cabeçalho): usuário logado, busca geral,
// notificações de pendências e o botão "Novo evento".
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usuarioAtual } from '../models/configModel.js';
import { buscarGeral, obterIndicadores } from '../models/relatorioModel.js';
import { useDados } from './base/useDados.js';
import { usePermissoes } from './usePermissoes.js';
import { useSair } from './useSessaoController.js';

export function useLayoutController() {
  const { dados: usuario } = useDados(usuarioAtual);
  const navegar = useNavigate();
  const sair = useSair();
  const { pathname } = useLocation();
  // Chaves: no Chrome novo, scrollTo devolve uma Promise, e o React não aceita isso como retorno do efeito.
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  const [recolhido, setRecolhido] = useState(lerMenuRecolhido);
  const alternarMenu = () => { gravarMenuRecolhido(!recolhido); setRecolhido(!recolhido); };
  return { usuario, sair, recolhido, alternarMenu, novoEvento: () => navegar('/admin/capacitacoes?novo=evento') };
}

// O menu recolhido é lembrado neste navegador (só preferência visual).
const CHAVE_MENU = 'gecap-menu-recolhido';
function lerMenuRecolhido() {
  try { return localStorage.getItem(CHAVE_MENU) === '1'; } catch { return false; }
}
function gravarMenuRecolhido(valor) {
  try { localStorage.setItem(CHAVE_MENU, valor ? '1' : '0'); } catch { /* sem localStorage: só não fica lembrado */ }
}

export function useBuscaGeral() {
  const [texto, setTexto] = useState('');
  const [resultados, setResultados] = useState([]);
  const navegar = useNavigate();
  const { podeAbrir } = usePermissoes();
  useEffect(() => {
    // Espera parar de digitar; mostra só resultados de telas que o perfil pode abrir.
    const t = setTimeout(() => buscarGeral(texto).then((r) => setResultados(r.filter((x) => podeAbrir(x.link)))), 200);
    return () => clearTimeout(t);
  }, [texto, podeAbrir]);
  const ir = (link) => { setTexto(''); navegar(link); };
  return { texto, setTexto, resultados, ir, mostrar: texto.trim().length >= 2 };
}

export function useNotificacoes() {
  const { dados } = useDados(obterIndicadores);
  const avisos = useMemo(() => {
    if (!dados) return [];
    const lista = [];
    for (const e of dados.eventos_pendentes) {
      lista.push({ tipo: 'pendencia', titulo: `Presença pendente: ${e.titulo}`, faltam: e.convocados - e.presentes, data: e.data, link: `/admin/eventos/${e.id}` });
    }
    for (const e of dados.proximos.filter((x) => new Date(x.data).getTime() - Date.now() < 7 * 864e5)) {
      lista.push({ tipo: 'em_breve', titulo: `Evento em breve: ${e.titulo}`, data: e.data, local: e.local, link: `/admin/eventos/${e.id}` });
    }
    return lista;
  }, [dados]);
  return { avisos };
}
