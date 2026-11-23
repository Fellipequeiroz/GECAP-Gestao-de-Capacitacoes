// Controller do "Meu perfil": dados do usuário logado, números da atuação,
// certificados, atividade, copiar e-mail e exportar os próprios dados (LGPD).
import { useMemo, useState } from 'react';
import { listarCertificados } from '../models/certificadoModel.js';
import { listarAtividades, usuarioAtual } from '../models/configModel.js';
import { obterDadosRelatorio } from '../models/relatorioModel.js';
import { useAviso } from './AvisoController.jsx';
import { useDados } from './base/useDados.js';
import { baixarJson } from './base/exportar.js';
import { usePermissoes } from './usePermissoes.js';

export function usePerfilController() {
  const { dados: eu } = useDados(usuarioAtual);
  const { dados: rel } = useDados(obterDadosRelatorio);
  const { dados: atividades } = useDados(() => listarAtividades(200));
  const { dados: certs } = useDados(listarCertificados);
  const [editar, setEditar] = useState(false);
  const avisar = useAviso();
  const { pode, inicio } = usePermissoes();

  const numeros = useMemo(() => {
    if (!eu || !rel || !atividades) return null;
    const minhasFreq = rel.frequencias.filter((f) => f.userid === eu.id);
    return {
      minhas: atividades.filter((a) => a.userid === eu.id),
      confirmadas: rel.frequencias.filter((f) => f.confirmado_por_userid === eu.id).length,
      convocacoes: minhasFreq.length,
      participacoes: minhasFreq.filter((f) => f.presente).length,
      facilitados: rel.eventos.filter((e) => e.facilitador_userid === eu.id).length,
    };
  }, [eu, rel, atividades]);
  const meusCerts = useMemo(() => (certs && eu ? certs.filter((c) => c.userid === eu.id) : []), [certs, eu]);
  const horas = meusCerts.filter((c) => c.tipo === 'participante').reduce((s, c) => s + (c.carga_horaria_snapshot || 0), 0);

  const copiarEmail = async () => {
    try { await navigator.clipboard.writeText(eu.email); avisar('E-mail copiado.'); } catch { avisar('Não foi possível copiar.', 'erro'); }
  };
  const exportarMeusDados = () => baixarJson(`meus-dados-${eu.id}.json`, {
    pessoa: { nome: eu.nome, cpf: eu.cpf, email: eu.email, telefone: eu.telefone, data_nascimento: eu.data_nascimento, formacao: eu.formacao, cargo: eu.cargo_nome, unidade: eu.unidade_nome, perfil: eu.perfil },
    certificados: meusCerts.map((c) => ({ codigo: c.codigo_verificacao, capacitacao: c.titulo_evento_snapshot, horas: c.carga_horaria_snapshot, emitido_em: c.emitido_em })),
    atividades: numeros.minhas.map((a) => ({ acao: a.acao, detalhe: a.detalhe, quando: a.quando })),
    exportado_em: new Date().toISOString(),
  });

  return {
    carregando: !eu || !numeros || !certs,
    eu, numeros: numeros && { ...numeros, horas }, meusCerts,
    confirmaPresenca: pode('confirmarpresenca'), inicio,
    editar, abrirEdicao: () => setEditar(true), fecharEdicao: () => setEditar(false),
    copiarEmail, exportarMeusDados,
  };
}
