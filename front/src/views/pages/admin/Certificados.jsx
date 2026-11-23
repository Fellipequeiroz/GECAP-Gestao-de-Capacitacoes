// View da lista de certificados e da verificação por código.
// Só apresentação: estado e ações vêm de useCertificadosController.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCertificadosController } from '../../../controllers/useCertificadosController.js';
import { usePermissoes } from '../../../controllers/usePermissoes.js';
import ModeloCertificadoModal from '../../components/formularios/ModeloCertificadoModal.jsx';
import { CabecalhoPagina, Carregando, Cartao, Icone, Kpi, Paginacao, Selo, Vazio, btn, campoClasse } from '../../components/ui.jsx';
import { data, numero } from '../../helpers/formatar.js';

export default function Certificados() {
  const c = useCertificadosController();
  // Editar o modelo do certificado: só o Master (configuração do sistema).
  const editaModelo = usePermissoes().pode('gerenciarestrutura');
  const [modelo, setModelo] = useState(false);
  if (c.carregando) return <Carregando />;

  return (
    <div className="space-y-stack-lg">
      <CabecalhoPagina titulo="Certificados" subtitulo="Emitidos automaticamente na confirmação de presença e no encerramento do evento.">
        {editaModelo && <button className={btn.secundario} onClick={() => setModelo(true)}><Icone nome="edit_document" /> Editar modelo do certificado</button>}
        <button className={btn.secundario} onClick={c.exportar}><Icone nome="download" /> Exportar CSV</button>
      </CabecalhoPagina>
      {editaModelo && <ModeloCertificadoModal aberto={modelo} onFechar={() => setModelo(false)} />}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Kpi rotulo="Participantes" valor={numero(c.total.participantes)} icone="workspace_premium" />
        <Kpi rotulo="Facilitadores" valor={numero(c.total.facilitadores)} icone="co_present" cor="text-tertiary" />
        <Kpi rotulo="Horas certificadas" valor={`${numero(c.total.horas)}h`} icone="schedule" cor="text-success-emerald" />
      </section>

      <Cartao className="p-6">
        <h3 className="text-title-sm font-title-sm mb-1 flex items-center gap-2"><Icone nome="verified" className="text-primary" /> Verificar autenticidade</h3>
        <p className="text-label-sm text-on-surface-variant mb-4">Digite o código impresso no certificado.</p>
        <form onSubmit={c.verificar} className="flex flex-wrap gap-3">
          <input className={`${campoClasse} max-w-xs font-mono uppercase`} placeholder="NUMEP-XXXX-XXXX" value={c.codigo} onChange={(e) => c.mudarCodigo(e.target.value)} />
          <button className={btn.primario} disabled={c.codigo.trim().length < 6}>Verificar</button>
        </form>
        {c.verificado === null && <p className="mt-4 rounded-lg bg-error/10 text-error px-4 py-3 text-body-md">Código não encontrado. Este certificado não foi emitido pelo NUMEP.</p>}
        {c.verificado && (
          <div className="mt-4 rounded-lg bg-success-emerald/10 px-4 py-3 text-body-md flex flex-wrap items-center justify-between gap-3">
            <p><b className="text-success-emerald">Certificado válido.</b> {c.verificado.nome} — {c.verificado.titulo_evento_snapshot} ({c.verificado.tipo}), emitido em {data(c.verificado.emitido_em)}.</p>
            <a className="text-primary font-bold hover:underline" href={`/certificado/${c.verificado.codigo_verificacao}`} target="_blank" rel="noreferrer">Abrir</a>
          </div>
        )}
      </Cartao>

      <Cartao className="overflow-hidden">
        <div className="p-6 border-b border-border-subtle flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-title-sm font-title-sm">Emitidos</h3>
          <div className="flex gap-2">
            <input className={`${campoClasse} py-2 w-64!`} placeholder="Buscar por nome, capacitação ou código" value={c.busca} onChange={(e) => c.mudarBusca(e.target.value)} />
            <select className={`${campoClasse} py-2 w-auto!`} value={c.tipo} onChange={(e) => c.mudarTipo(e.target.value)} aria-label="Tipo">
              <option value="todos">Todos</option><option value="participante">Participantes</option><option value="facilitador">Facilitadores</option>
            </select>
          </div>
        </div>
        {c.visiveis.length === 0 ? <Vazio icone="search_off" texto="Nenhum certificado encontrado." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="text-label-upper font-label-upper text-on-surface-variant border-b border-border-subtle">
                <th className="px-6 py-3">CÓDIGO</th><th className="px-4 py-3">NOME</th><th className="px-4 py-3">CAPACITAÇÃO</th><th className="px-4 py-3">HORAS</th><th className="px-4 py-3">EMITIDO</th><th className="px-4 py-3" />
              </tr></thead>
              <tbody className="divide-y divide-border-subtle">
                {c.visiveis.map((cert) => (
                  <tr key={cert.codigo_verificacao} className="hover:bg-surface-container-low/60">
                    <td className="px-6 py-3 font-mono text-label-sm">{cert.codigo_verificacao}</td>
                    <td className="px-4 py-3 text-body-md">{cert.nome}<span className="ml-2"><Selo status={cert.tipo === 'facilitador' ? 'realizado' : 'agendado'} texto={cert.tipo === 'facilitador' ? 'Facilitador' : 'Participante'} /></span></td>
                    <td className="px-4 py-3 text-body-md">{cert.evento_id ? <Link className="hover:text-primary" to={`/admin/eventos/${cert.evento_id}`}>{cert.titulo_evento_snapshot}</Link> : cert.titulo_evento_snapshot}</td>
                    <td className="px-4 py-3 text-body-md">{cert.carga_horaria_snapshot}h</td>
                    <td className="px-4 py-3 text-body-md">{data(cert.emitido_em)}</td>
                    <td className="px-4 py-3 text-right"><a className={btn.icone} href={`/certificado/${cert.codigo_verificacao}`} target="_blank" rel="noreferrer" title="Abrir certificado"><Icone nome="open_in_new" /></a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Paginacao pagina={c.pagina} total={c.lista.length} porPagina={c.porPagina} onMudar={c.setPagina} rotulo="certificados" />
      </Cartao>
    </div>
  );
}
