// Controller do formulário de evento: regras 2 (facilitador), 6 (unidades) e 6.1 (travas).
import { useEffect, useMemo, useState } from 'react';
import { listarCapacitacoes } from '../../models/capacitacaoModel.js';
import { listarUnidades } from '../../models/estruturaModel.js';
import { salvarEvento } from '../../models/eventoModel.js';
import { listarProfissionais } from '../../models/profissionalModel.js';
import { useAviso } from '../AvisoController.jsx';

const VAZIO = {
  capacitacao_id: '', data: '', local: '', carga_horaria: 4, modalidade: 'presencial', publico_alvo: 'unidade',
  unidades: [], facilitador_tipo: 'externo', facilitador_userid: '', facilitador_nome_externo: '',
};

export function useEventoForm({ aberto, evento, capacitacaoId, onFechar, onSalvo }) {
  const [form, setForm] = useState(VAZIO);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [caps, setCaps] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [pessoas, setPessoas] = useState([]);
  const avisar = useAviso();

  useEffect(() => {
    if (!aberto) return;
    setErro('');
    listarCapacitacoes().then(setCaps);
    listarUnidades().then(setUnidades);
    listarProfissionais().then((p) => setPessoas(p.filter((x) => x.ativo)));
    setForm(evento ? {
      ...VAZIO, ...evento,
      facilitador_tipo: evento.facilitador_userid ? 'interno' : 'externo',
      facilitador_userid: evento.facilitador_userid ?? '',
      facilitador_nome_externo: evento.facilitador_nome_externo ?? '',
    } : { ...VAZIO, capacitacao_id: capacitacaoId ?? '' });
  }, [aberto, evento, capacitacaoId]);

  const mudar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  const escolherFacilitador = (tipo) => setForm((f) => ({ ...f, facilitador_tipo: tipo }));
  const alternarUnidade = (id) => setForm((f) => ({ ...f, unidades: f.unidades.includes(id) ? f.unidades.filter((u) => u !== id) : [...f.unidades, id] }));

  const convocados = useMemo(() => {
    if (form.publico_alvo === 'rede_geral') return pessoas.length;
    return pessoas.filter((p) => form.unidades.includes(p.unidade_id)).length;
  }, [form.publico_alvo, form.unidades, pessoas]);

  const enviar = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setErro('');
    try {
      const id = await salvarEvento({ ...form, id: evento?.id });
      avisar(evento ? 'Evento atualizado.' : 'Evento criado e profissionais convocados.');
      onSalvo?.(id);
      onFechar();
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  };

  return {
    form, erro, salvando, caps, unidades, pessoas, convocados,
    travado: Boolean(evento?.tem_certificado),
    mudar, escolherFacilitador, alternarUnidade, enviar,
  };
}
