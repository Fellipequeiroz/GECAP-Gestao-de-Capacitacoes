// Controller do formulário "Adicionar participantes" (CPFs ou e-mails, digitados ou por CSV).
import { useState } from 'react';
import { adicionarParticipantes } from '../../models/frequenciaModel.js';
import { useAviso } from '../AvisoController.jsx';

export function useAdicionarParticipantes({ eventoId, onFechar }) {
  const [texto, setTexto] = useState('');
  const [resultado, setResultado] = useState(null);
  const avisar = useAviso();

  const lerArquivo = (e) => {
    const arq = e.target.files?.[0];
    if (!arq) return;
    const leitor = new FileReader();
    leitor.onload = () => setTexto(String(leitor.result));
    leitor.readAsText(arq, 'utf-8');
  };
  const enviar = async () => {
    const itens = texto.split(/[\n;,\t]+/).map((s) => s.trim()).filter((s) => s && !/^(cpf|e-?mail|nome)$/i.test(s));
    try {
      const r = await adicionarParticipantes(eventoId, itens);
      setResultado(r);
      if (r.adicionados) avisar(`${r.adicionados} participante(s) adicionado(s).`);
    } catch (e) { avisar(e.message, 'erro'); }
  };
  const fechar = () => { setTexto(''); setResultado(null); onFechar(); };
  return { texto, setTexto, resultado, lerArquivo, enviar, fechar };
}
