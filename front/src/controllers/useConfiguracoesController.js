// Controllers das Configurações: formulário do sistema (salvar/descartar),
// tema, troca de senha, registro de atividades e restauração dos dados.
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { alterarSenha, listarAtividades, obterConfig, restaurarDadosDeExemplo, salvarConfig, salvarPreferencias, usuarioAtual } from '../models/configModel.js';
import { usePermissoes } from './usePermissoes.js';
import { useAviso } from './AvisoController.jsx';
import { useTema } from './TemaController.jsx';
import { useDados } from './base/useDados.js';

export function useConfiguracoesController() {
  const { tema, setTema } = useTema();
  const { dados: salvo } = useDados(obterConfig);
  const { dados: eu } = useDados(usuarioAtual);
  const [form, setForm] = useState(null);
  const [estado, setEstado] = useState('parado'); // parado | salvando | salvo
  const [senha, setSenha] = useState(false);
  const [log, setLog] = useState(false);
  const [restaurar, setRestaurar] = useState(false);
  const [params, setParams] = useSearchParams();
  const avisar = useAviso();
  // Configurações do sistema (dados do órgão, restaurar dados): só o Master.
  const sistema = usePermissoes().pode('gerenciarestrutura');

  useEffect(() => { if (salvo) setForm(salvo); }, [salvo]);
  useEffect(() => { if (params.get('log')) { setLog(true); setParams({}, { replace: true }); } }, [params, setParams]);

  const salvar = async () => {
    if (sistema && !form.nome_orgao.trim()) { avisar('Informe o nome do órgão.', 'erro'); return; }
    setEstado('salvando');
    try {
      // Dados do órgão só o Master grava; as preferências pessoais, todos.
      if (sistema && ['nome_orgao', 'email', 'endereco'].some((k) => form[k] !== salvo[k])) await salvarConfig(form);
      await salvarPreferencias(form);
      setEstado('salvo');
      setTimeout(() => setEstado('parado'), 2000);
    } catch (e) {
      setEstado('parado');
      avisar(e.message, 'erro');
    }
  };

  const mesesDesdeSenha = form ? Math.round((Date.now() - new Date(form.senha_alterada_em).getTime()) / (30 * 864e5)) : 0;

  return {
    carregando: !form,
    sistema, eu,
    form, alterado: form && JSON.stringify(form) !== JSON.stringify(salvo), estado, mesesDesdeSenha,
    mudar: (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value })),
    mudarNotificacao: (campo) => (v) => setForm((f) => ({ ...f, notificacoes: { ...f.notificacoes, [campo]: v } })),
    mudarSilencio: (campo) => (e) => setForm((f) => ({ ...f, silencio: { ...f.silencio, [campo]: e.target.value } })),
    mudarDoisFatores: (v) => setForm((f) => ({ ...f, dois_fatores: v })),
    descartar: () => setForm(salvo), salvar,
    tema, setTema,
    senha, abrirSenha: () => setSenha(true), fecharSenha: () => setSenha(false),
    log, abrirLog: () => setLog(true), fecharLog: () => setLog(false),
    restaurar, abrirRestaurar: () => setRestaurar(true), fecharRestaurar: () => setRestaurar(false),
    confirmarRestauracao: () => restaurarDadosDeExemplo().then(() => avisar('Dados de exemplo restaurados.')).catch((e) => avisar(e.message, 'erro')),
  };
}

export function useAlterarSenhaForm({ aberto, onFechar }) {
  const [f, setF] = useState({ atual: '', nova: '', confirmacao: '' });
  const [erro, setErro] = useState('');
  const avisar = useAviso();
  useEffect(() => { if (aberto) { setF({ atual: '', nova: '', confirmacao: '' }); setErro(''); } }, [aberto]);
  const enviar = async (e) => {
    e.preventDefault();
    try { await alterarSenha(f.atual, f.nova, f.confirmacao); avisar('Senha alterada.'); onFechar(); } catch (err) { setErro(err.message); }
  };
  return { f, erro, mudar: (campo) => (e) => setF((x) => ({ ...x, [campo]: e.target.value })), enviar };
}

export function useRegistroAtividades() {
  const { dados } = useDados(() => listarAtividades(100));
  return { atividades: dados };
}
