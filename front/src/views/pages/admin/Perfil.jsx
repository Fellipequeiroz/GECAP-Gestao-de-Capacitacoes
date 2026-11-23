// View do "Meu perfil". Só apresentação: dados e ações vêm de usePerfilController.
import { Link } from 'react-router-dom';
import { usePerfilController } from '../../../controllers/usePerfilController.js';
import { FORMACOES, PERFIS, rotulo } from '../../../models/regras.js';
import ProfissionalModal from '../../components/formularios/ProfissionalModal.jsx';
import { Carregando, Cartao, Icone, Selo, Vazio, btn } from '../../components/ui.jsx';
import { data, iniciais, numero, tempoRelativo } from '../../helpers/formatar.js';

export default function Perfil() {
  const c = usePerfilController();
  if (c.carregando) return <Carregando />;
  const { eu, numeros, meusCerts } = c;

  return (
    <div className="space-y-stack-lg">
      <nav className="flex items-center gap-2 text-label-sm text-on-surface-variant"><Link to={c.inicio} className="hover:text-primary">Início</Link><Icone nome="chevron_right" className="text-[16px]" /><span className="text-primary">Meu perfil</span></nav>

      <Cartao className="overflow-hidden">
        <div className="h-28 bg-linear-to-r from-primary to-primary-container" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.18) 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
        <div className="px-8 pb-6 flex flex-wrap items-end gap-6 -mt-12">
          <span className="w-28 h-28 rounded-2xl border-4 border-surface-card bg-primary-fixed text-primary text-[40px] font-black flex items-center justify-center shadow-md">{iniciais(eu.nome)}</span>
          <div className="flex-1 min-w-[220px] pb-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-display-lg font-display-lg">{eu.nome}</h2>
              <Selo status={eu.ativo ? 'ativo' : 'inativo'} texto={eu.ativo ? 'Conta ativa' : 'Conta inativa'} />
            </div>
            <p className="text-title-sm text-on-surface-variant">{eu.cargo_nome} · Perfil {rotulo(PERFIS, eu.perfil)}</p>
          </div>
          <div className="flex gap-3 pb-1">
            <button className={btn.secundario} onClick={c.abrirEdicao}><Icone nome="edit" /> Editar perfil</button>
            <button className={btn.primario} onClick={c.exportarMeusDados} title="Baixar meus dados (LGPD)"><Icone nome="download" /> Exportar meus dados</button>
          </div>
        </div>
      </Cartao>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <Cartao className="p-6">
            <h3 className="text-title-sm font-title-sm mb-5 flex items-center gap-2"><Icone nome="badge" className="text-primary" /> Dados da conta</h3>
            <dl className="space-y-4">
              {[
                ['E-MAIL', <span className="flex items-center gap-2 break-all">{eu.email}<button onClick={c.copiarEmail} className="text-primary" aria-label="Copiar e-mail"><Icone nome="content_copy" className="text-[18px]" /></button></span>],
                ['TELEFONE', eu.telefone || '—'],
                ['UNIDADE', eu.unidade_nome],
                ['FORMAÇÃO', rotulo(FORMACOES, eu.formacao)],
                ['CADASTRO', data(eu.criado_em)],
              ].map(([k, v]) => (
                <div key={k}><dt className="text-label-upper font-label-upper text-on-surface-variant">{k}</dt><dd className="text-body-md text-on-surface">{v}</dd></div>
              ))}
            </dl>
          </Cartao>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {[
              // Quem não confirma presença (técnico) vê as próprias horas certificadas no lugar.
              c.confirmaPresenca ? ['PRESENÇAS CONFIRMADAS', numero(numeros.confirmadas), true] : ['HORAS CERTIFICADAS', `${numero(numeros.horas)}h`, true],
              ['EVENTOS FACILITADOS', numero(numeros.facilitados)],
              ['MINHAS PARTICIPAÇÕES', `${numeros.participacoes}/${numeros.convocacoes}`],
            ].map(([k, v, forte]) => (
              <div key={k} className={`p-5 rounded-xl border text-center ${forte ? 'bg-primary-fixed/40 border-primary/20' : 'bg-surface-card border-border-subtle'}`}>
                <p className={`text-label-upper font-label-upper ${forte ? 'text-primary' : 'text-on-surface-variant'}`}>{k}</p>
                <p className={`text-display-lg font-display-lg ${forte ? 'text-primary' : ''}`}>{v}</p>
              </div>
            ))}
          </div>

          <Cartao className="overflow-hidden">
            <div className="p-6 border-b border-border-subtle"><h3 className="text-title-sm font-title-sm">Meus certificados</h3></div>
            {meusCerts.length === 0 ? <Vazio icone="workspace_premium" texto="Você ainda não tem certificados." /> : (
              <ul className="divide-y divide-border-subtle">
                {meusCerts.slice(0, 5).map((c) => (
                  <li key={c.codigo_verificacao} className="px-6 py-3 flex items-center justify-between gap-3">
                    <span><span className="block text-body-md">{c.titulo_evento_snapshot}</span><span className="text-label-sm text-on-surface-variant">{c.carga_horaria_snapshot}h · {data(c.data_evento_snapshot)} · {c.tipo}</span></span>
                    <a className="text-primary font-mono text-label-sm hover:underline" href={`/certificado/${c.codigo_verificacao}`} target="_blank" rel="noreferrer">{c.codigo_verificacao}</a>
                  </li>
                ))}
              </ul>
            )}
          </Cartao>

          <Cartao className="overflow-hidden">
            <div className="p-6 border-b border-border-subtle flex justify-between items-center">
              <h3 className="text-title-sm font-title-sm">Minha atividade recente</h3>
              <Link to="/admin/configuracoes?log=1" className="text-primary text-label-sm font-bold hover:underline">Ver tudo</Link>
            </div>
            {numeros.minhas.length === 0 ? <Vazio texto="Nenhuma atividade ainda." /> : (
              <ul className="divide-y divide-border-subtle">
                {numeros.minhas.slice(0, 5).map((a) => (
                  <li key={a.id} className="p-5 flex gap-4">
                    <span className="w-10 h-10 rounded-lg bg-primary-fixed text-primary flex items-center justify-center shrink-0"><Icone nome="task_alt" /></span>
                    <span><span className="block text-body-md">{a.acao} <b>{a.detalhe}</b></span><span className="text-label-sm text-on-surface-variant">{tempoRelativo(a.quando)}</span></span>
                  </li>
                ))}
              </ul>
            )}
          </Cartao>
        </div>
      </div>

      <ProfissionalModal aberto={c.editar} profissional={eu} proprio onFechar={c.fecharEdicao} />
    </div>
  );
}
