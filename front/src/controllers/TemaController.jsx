import { createContext, useContext, useEffect, useState } from 'react';

// Controller do tema visual: 'claro', 'escuro' ou 'auto' (segue o sistema operacional).
// Substitui a tela separada "Configurações - modo escuro" do Stitch.
const ThemeContext = createContext({ tema: 'claro', setTema: () => {} });

function lerTemaSalvo() {
  try {
    return localStorage.getItem('gecap-tema') || 'claro';
  } catch {
    return 'claro';
  }
}

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(lerTemaSalvo);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const aplicar = () => {
      const escuro = tema === 'escuro' || (tema === 'auto' && media.matches);
      document.documentElement.classList.toggle('dark', escuro);
    };
    aplicar();
    try {
      localStorage.setItem('gecap-tema', tema);
    } catch {
      // Sem localStorage (ex.: janela anônima): o tema só não fica salvo.
    }
    media.addEventListener('change', aplicar);
    return () => media.removeEventListener('change', aplicar);
  }, [tema]);

  return <ThemeContext.Provider value={{ tema, setTema }}>{children}</ThemeContext.Provider>;
}

export function useTema() {
  return useContext(ThemeContext);
}
