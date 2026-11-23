// Controller do formulário de avaliação (nota de 1 a 5 e comentário).
import { useState } from 'react';
import { registrarAvaliacao } from '../../models/frequenciaModel.js';
import { useAviso } from '../AvisoController.jsx';

export function useAvaliacaoForm({ participante, onFechar }) {
  const [nota, setNota] = useState(5);
  const [comentario, setComentario] = useState('');
  const [erro, setErro] = useState('');
  const avisar = useAviso();
  const enviar = async () => {
    try {
      await registrarAvaliacao(participante.id, nota, comentario);
      avisar('Avaliação registrada.');
      onFechar();
    } catch (e) { setErro(e.message); }
  };
  return { nota, setNota, comentario, setComentario, erro, enviar };
}
