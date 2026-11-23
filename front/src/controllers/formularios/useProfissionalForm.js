// Controller do formulário de profissional (cadastro e edição).
import { useEffect, useState } from 'react';
import { listarCargos, listarUnidades } from '../../models/estruturaModel.js';
import { salvarProfissional } from '../../models/profissionalModel.js';
import { formatarCpf, mascararCpf } from '../../models/regras.js';
import { useAviso } from '../AvisoController.jsx';

const VAZIO = { nome: '', cpf: '', data_nascimento: '', email: '', telefone: '', formacao: '', perfil: 'tecnico', cargo_tag_id: '', unidade_id: '', ativo: true };

export function useProfissionalForm({ aberto, profissional, onFechar, onSalvo }) {
  const [form, setForm] = useState(VAZIO);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [unidades, setUnidades] = useState([]);
  const [cargos, setCargos] = useState([]);
  const avisar = useAviso();

  useEffect(() => {
    if (!aberto) return;
    setErro('');
    setForm(profissional ? { ...VAZIO, ...profissional, cpf: formatarCpf(profissional.cpf), cargo_tag_id: profissional.cargo_tag_id ?? '' } : VAZIO);
    listarUnidades().then(setUnidades);
    listarCargos().then(setCargos);
  }, [aberto, profissional]);

  const mudar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const mudarCpf = (e) => setForm((f) => ({ ...f, cpf: mascararCpf(e.target.value) }));

  const enviar = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setErro('');
    try {
      const id = await salvarProfissional({ ...form, id: profissional?.id });
      avisar(profissional ? 'Profissional atualizado.' : `${form.nome.split(' ')[0]} cadastrado(a) com sucesso.`);
      onSalvo?.(id);
      onFechar();
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  };

  return { form, erro, salvando, unidades, cargos, mudar, mudarCpf, enviar };
}
