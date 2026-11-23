import { useCallback, useEffect, useRef, useState } from 'react';

// Busca dados de uma função da api.js e busca de novo sozinho quando algo é
// alterado em qualquer tela (evento "gecap-dados-mudaram").
export function useDados(buscar, deps = []) {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const ref = useRef(buscar);
  ref.current = buscar;

  const recarregar = useCallback(() => {
    let ativo = true;
    setErro(null);
    ref.current()
      .then((d) => ativo && setDados(d))
      .catch((e) => ativo && setErro(e))
      .finally(() => ativo && setCarregando(false));
    return () => { ativo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    setCarregando(true);
    const cancelar = recarregar();
    const ouvir = () => recarregar();
    window.addEventListener('gecap-dados-mudaram', ouvir);
    return () => { cancelar(); window.removeEventListener('gecap-dados-mudaram', ouvir); };
  }, [recarregar]);

  return { dados, carregando, erro, recarregar };
}
