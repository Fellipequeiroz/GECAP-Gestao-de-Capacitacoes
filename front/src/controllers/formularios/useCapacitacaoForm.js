// Controller do formulário de capacitação.
import { useEffect, useState } from 'react';
import { salvarCapacitacao } from '../../models/capacitacaoModel.js';
import { useAviso } from '../AvisoController.jsx';

export function useCapacitacaoForm({ aberto, capacitacao, onFechar, onSalvo }) {
  const [form, setForm] = useState({ titulo: '', descricao: '' });
  const [erro, setErro] = useState('');
  const avisar = useAviso();

  useEffect(() => {
    if (aberto) { setErro(''); setForm(capacitacao ? { titulo: capacitacao.titulo, descricao: capacitacao.descricao || '' } : { titulo: '', descricao: '' }); }
  }, [aberto, capacitacao]);

  const mudar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  const enviar = async (e) => {
    e.preventDefault();
    try {
      const id = await salvarCapacitacao({ ...form, id: capacitacao?.id });
      avisar(capacitacao ? 'Capacitação atualizada.' : 'Capacitação criada. Agora crie um evento para ela.');
      onSalvo?.(id);
      onFechar();
    } catch (err) {
      setErro(err.message);
    }
  };
  return { form, erro, mudar, enviar };
}
