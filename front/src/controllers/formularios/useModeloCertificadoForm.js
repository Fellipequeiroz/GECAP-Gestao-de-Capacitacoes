// Controller do editor do modelo do certificado (só o Master): textos, prévia e salvar.
import { useEffect, useState } from 'react';
import { MODELO_PADRAO, obterModeloCertificado, salvarModeloCertificado } from '../../models/certificadoModel.js';
import { useAviso } from '../AvisoController.jsx';

// Dados fictícios só para a prévia.
const EXEMPLO = {
  nome: 'Fellipe Queiroz Moreira',
  titulo_evento_snapshot: 'VIII Fórum Municipal dos Trabalhadores do SUAS',
  data_evento_snapshot: '2026-09-16T08:00',
  carga_horaria_snapshot: 6,
  emitido_em: '2026-09-24T10:00',
  codigo_verificacao: 'NUMEP-XXXX-XXXX',
};

export function useModeloCertificadoForm({ aberto, onFechar }) {
  const [modelo, setModelo] = useState(MODELO_PADRAO);
  const [tipo, setTipo] = useState('participante');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const avisar = useAviso();

  useEffect(() => {
    if (!aberto) return;
    setErro('');
    setTipo('participante');
    obterModeloCertificado().then(setModelo);
  }, [aberto]);

  const salvar = async () => {
    setSalvando(true);
    try {
      await salvarModeloCertificado(modelo);
      avisar('Modelo do certificado salvo. Vale para todos os certificados, inclusive os já emitidos.');
      onFechar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  };

  return {
    modelo, mudar: (campo) => (e) => setModelo((m) => ({ ...m, [campo]: e.target.value })),
    restaurarPadrao: () => setModelo(MODELO_PADRAO),
    tipo, setTipo,
    exemplo: { ...EXEMPLO, tipo },
    erro, salvando, salvar,
  };
}
