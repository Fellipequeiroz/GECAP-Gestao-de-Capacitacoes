// Controller da lista de certificados: busca, filtro por tipo, paginação,
// verificação pelo código e exportação.
import { useMemo, useState } from 'react';
import { buscarCertificado, listarCertificados } from '../models/certificadoModel.js';
import { useDados } from './base/useDados.js';
import { baixarCsv } from './base/exportar.js';

const POR_PAGINA = 12;

export function useCertificadosController() {
  const { dados: certs } = useDados(listarCertificados);
  const [busca, setBusca] = useState('');
  const [tipo, setTipo] = useState('todos');
  const [pagina, setPagina] = useState(1);
  const [codigo, setCodigo] = useState('');
  const [verificado, setVerificado] = useState(undefined); // undefined = não verificou; null = não achou

  const lista = useMemo(() => {
    if (!certs) return [];
    const t = busca.trim().toLowerCase();
    return certs.filter((c) => (tipo === 'todos' || c.tipo === tipo)
      && (!t || c.nome.toLowerCase().includes(t) || c.titulo_evento_snapshot.toLowerCase().includes(t) || c.codigo_verificacao.toLowerCase().includes(t)));
  }, [certs, busca, tipo]);

  const verificar = async (e) => { e.preventDefault(); setVerificado(await buscarCertificado(codigo).catch(() => null)); };
  const exportar = () => baixarCsv('certificados.csv', lista, [
    { titulo: 'Código', valor: 'codigo_verificacao' }, { titulo: 'Tipo', valor: 'tipo' }, { titulo: 'Nome', valor: 'nome' },
    { titulo: 'Capacitação', valor: 'titulo_evento_snapshot' }, { titulo: 'Carga horária (h)', valor: 'carga_horaria_snapshot' },
    { titulo: 'Data do evento', valor: (c) => new Date(c.data_evento_snapshot).toLocaleDateString('pt-BR') }, { titulo: 'Emitido em', valor: (c) => new Date(c.emitido_em).toLocaleDateString('pt-BR') },
  ]);

  return {
    carregando: !certs,
    total: {
      participantes: certs?.filter((c) => c.tipo === 'participante').length ?? 0,
      facilitadores: certs?.filter((c) => c.tipo === 'facilitador').length ?? 0,
      horas: certs?.filter((c) => c.tipo === 'participante').reduce((s, c) => s + (c.carga_horaria_snapshot || 0), 0) ?? 0,
    },
    lista, visiveis: lista.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA), porPagina: POR_PAGINA,
    busca, mudarBusca: (v) => { setBusca(v); setPagina(1); },
    tipo, mudarTipo: (v) => { setTipo(v); setPagina(1); },
    pagina, setPagina,
    codigo, mudarCodigo: (v) => { setCodigo(v); setVerificado(undefined); }, verificado, verificar,
    exportar,
  };
}
