// Controller da Gestão de Unidades e Órgãos: busca, recorte por perfil
// (o coordenador vê só a própria unidade) e os atalhos de edição (só quem gerencia a estrutura).
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listarUnidadesComEquipes } from '../models/estruturaModel.js';
import { useDados } from './base/useDados.js';
import { usePermissoes } from './usePermissoes.js';

export function useGestaoUnidadesController() {
  const { dados } = useDados(listarUnidadesComEquipes);
  const { perfil, unidadeId, pode } = usePermissoes();
  const [busca, setBusca] = useState('');
  const navegar = useNavigate();

  const unidades = useMemo(() => {
    if (!dados) return [];
    // Coordenador: só a própria unidade. Diretor: as unidades do setor dele (a diretoria).
    const setor = dados.find((u) => u.id === unidadeId)?.setor_id;
    const minhas = perfil === 'coordenador' ? dados.filter((u) => u.id === unidadeId)
      : perfil === 'diretor' ? dados.filter((u) => u.setor_id === setor) : dados;
    const t = busca.trim().toLowerCase();
    if (!t) return minhas;
    return minhas
      .map((u) => (u.nome.toLowerCase().includes(t) || u.setor_nome.toLowerCase().includes(t)
        ? u : { ...u, equipe: u.equipe.filter((p) => p.nome.toLowerCase().includes(t) || p.cargo_nome.toLowerCase().includes(t)) }))
      .filter((u) => u.equipe.length || u.nome.toLowerCase().includes(t));
  }, [dados, perfil, unidadeId, busca]);

  const gerencia = pode('gerenciarestrutura');
  return {
    carregando: !dados,
    unidades,
    soMinha: perfil === 'coordenador',
    daDiretoria: perfil === 'diretor',
    busca, setBusca,
    gerencia,
    adicionarUnidade: () => navegar('/admin/equipes?aba=unidades'),
    editarUnidade: () => navegar('/admin/equipes?aba=unidades'),
    verPerfil: (p) => navegar(`/admin/equipes?id=${p.id}`),
  };
}
