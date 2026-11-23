// Controller dos avisos (toast): guarda a fila de mensagens e some com cada uma após 4 s.
// Qualquer controller chama useAviso()("texto") para avisar o usuário.
import { createContext, useCallback, useContext, useState } from 'react';
import { ListaAvisos } from '../views/components/ui.jsx';

const AvisoContexto = createContext(() => {});

export function AvisoProvider({ children }) {
  const [avisos, setAvisos] = useState([]);
  const avisar = useCallback((texto, tipo = 'sucesso') => {
    const id = Math.random();
    setAvisos((a) => [...a, { id, texto, tipo }]);
    setTimeout(() => setAvisos((a) => a.filter((x) => x.id !== id)), 4000);
  }, []);
  return (
    <AvisoContexto.Provider value={avisar}>
      {children}
      <ListaAvisos avisos={avisos} />
    </AvisoContexto.Provider>
  );
}

export const useAviso = () => useContext(AvisoContexto);
