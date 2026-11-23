// View das Configurações. Só apresentação: estado e ações vêm de useConfiguracoesController.
import { useConfiguracoesController } from '../../../controllers/useConfiguracoesController.js';
import { Link } from 'react-router-dom';
import { LIMITES, PERFIS, rotulo } from '../../../models/regras.js';
import RegistroAtividadesModal from '../../components/RegistroAtividadesModal.jsx';
import AlterarSenhaModal from '../../components/formularios/AlterarSenhaModal.jsx';
import { CabecalhoPagina, Campo, Carregando, Confirmar, Icone, btn, campoClasse } from '../../components/ui.jsx';

const TEMAS = [
  { valor: 'claro', icone: 'light_mode', rotulo: 'Claro' },
  { valor: 'escuro', icone: 'dark_mode', rotulo: 'Escuro' },
  { valor: 'auto', icone: 'settings_brightness', rotulo: 'Auto' },
];

function Interruptor({ ligado, onMudar, rotulo }) {
  return (
    <button type="button" role="switch" aria-checked={ligado} aria-label={rotulo} onClick={() => onMudar(!ligado)}
      className={`relative w-11 h-6 rounded-full transition-colors ${ligado ? 'bg-primary' : 'bg-outline-variant'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${ligado ? 'translate-x-5' : ''}`} />
    </button>
  );
}

function Secao({ icone, titulo, children, className = '' }) {
  return (
    <section className={`bg-surface-card rounded-xl p-stack-md border border-border-subtle shadow-xs hover:border-primary/30 transition-all ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg"><Icone nome={icone} className="text-primary" /></div>
        <h3 className="font-title-sm text-title-sm">{titulo}</h3>
      </div>
      {children}
    </section>
  );
}

export default function Configuracoes() {
  const c = useConfiguracoesController();
  // Dados do órgão e restauração dos dados são do sistema todo: só o Master (gerenciarestrutura).
  // Aparência, segurança e notificações são preferências de cada usuário: todos os perfis.
  const { sistema } = c;
  if (c.carregando) return <Carregando />;
  const { form } = c;

  return (
    <div>
      <CabecalhoPagina titulo="Configurações" subtitulo={sistema ? 'Preferências gerais do GECAP-NUMEP.' : 'Suas preferências de aparência, segurança e notificações.'}>
        <button className={btn.secundario} disabled={!c.alterado} onClick={c.descartar}>Descartar</button>
        <button onClick={c.salvar} disabled={!c.alterado || c.estado !== 'parado'}
          className={`${btn.primario} ${c.estado === 'salvo' ? 'bg-success-emerald!' : ''} ${!c.alterado && c.estado === 'parado' ? 'opacity-50' : ''}`}>
          {c.estado === 'salvando' && <><Icone nome="sync" className="animate-spin" /> Salvando...</>}
          {c.estado === 'salvo' && <><Icone nome="check_circle" /> Salvo!</>}
          {c.estado === 'parado' && <><Icone nome="save" className="text-[20px]" /> Salvar alterações</>}
        </button>
      </CabecalhoPagina>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-stack-md">
        {sistema && <Secao icone="domain" titulo="Dados do órgão" className="md:col-span-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Campo rotulo="Nome do órgão" className="md:col-span-2"><input className={campoClasse} value={form.nome_orgao} onChange={c.mudar('nome_orgao')} maxLength={LIMITES.nome_orgao} /></Campo>
            <Campo rotulo="E-mail do NUMEP" dica="Remetente dos certificados por e-mail"><input type="email" className={campoClasse} value={form.email} onChange={c.mudar('email')} /></Campo>
            <Campo rotulo="Cidade / endereço"><input className={campoClasse} value={form.endereco} onChange={c.mudar('endereco')} /></Campo>
          </div>
        </Secao>}
        {!sistema && c.eu && <Secao icone="badge" titulo="Sua conta" className="md:col-span-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[['Nome', c.eu.nome], ['E-mail', c.eu.email], ['Unidade', c.eu.unidade_nome], ['Perfil de acesso', rotulo(PERFIS, c.eu.perfil)]].map(([k, v]) => (
              <div key={k}><p className="text-label-upper font-label-upper text-on-surface-variant uppercase">{k}</p><p className="text-body-md text-on-surface break-all">{v}</p></div>
            ))}
          </div>
          <Link to="/admin/perfil" className="inline-flex items-center gap-1 mt-5 text-primary text-label-sm font-bold hover:underline"><Icone nome="person" className="text-[18px]" /> Ver meu perfil</Link>
        </Secao>}

        <Secao icone="palette" titulo="Aparência" className="md:col-span-4">
          <p className="text-label-sm font-label-sm text-on-surface-variant mb-2">Tema visual</p>
          <div className="grid grid-cols-3 gap-2 mb-5">
            {TEMAS.map((t) => (
              <button key={t.valor} type="button" onClick={() => c.setTema(t.valor)} aria-pressed={c.tema === t.valor}
                className={c.tema === t.valor ? 'flex flex-col items-center gap-1 p-2 rounded-lg border-2 border-primary bg-primary/5 text-primary' : 'flex flex-col items-center gap-1 p-2 rounded-lg border border-border-subtle hover:bg-surface-container-low'}>
                <Icone nome={t.icone} /><span className="text-[10px] font-bold">{t.rotulo}</span>
              </button>
            ))}
          </div>
          <Campo rotulo="Idioma" dica="Outros idiomas: trabalho futuro">
            <select className={campoClasse} value={form.idioma} onChange={c.mudar('idioma')}><option value="pt_br">Português (BR)</option></select>
          </Campo>
        </Secao>

        <Secao icone="security" titulo="Segurança" className="md:col-span-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl">
              <div className="flex items-center gap-3"><Icone nome="password" className="text-on-surface-variant" /><div><p className="text-body-md">Senha da conta</p><p className="text-label-sm text-on-surface-variant">Última alteração há {c.mesesDesdeSenha} {c.mesesDesdeSenha === 1 ? 'mês' : 'meses'}</p></div></div>
              <button className="text-primary text-label-sm font-bold hover:underline" onClick={c.abrirSenha}>Alterar</button>
            </div>
            <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl">
              <div className="flex items-center gap-3"><Icone nome="verified_user" className="text-on-surface-variant" /><div><p className="text-body-md">Verificação em duas etapas</p><p className="text-label-sm text-on-surface-variant">Código por e-mail ao entrar (recurso MFA do Moodle)</p></div></div>
              <Interruptor rotulo="Verificação em duas etapas" ligado={form.dois_fatores} onMudar={c.mudarDoisFatores} />
            </div>
            <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl">
              <div className="flex items-center gap-3"><Icone nome="history" className="text-on-surface-variant" /><div><p className="text-body-md">Registro de atividades</p><p className="text-label-sm text-on-surface-variant">Quem fez o quê e quando</p></div></div>
              <button className="text-primary text-label-sm font-bold hover:underline" onClick={c.abrirLog}>Ver</button>
            </div>
          </div>
        </Secao>

        <Secao icone="notifications_active" titulo="Notificações" className="md:col-span-6">
          <div className="space-y-5">
            {[['emails', 'mail', 'E-mails do sistema (convocações e certificados)'], ['push', 'campaign', 'Avisos no painel'], ['boletim', 'newspaper', 'Boletim mensal de capacitações']].map(([chave, icone, texto]) => (
              <div key={chave} className="flex items-center justify-between">
                <span className="flex items-center gap-3 text-body-md"><Icone nome={icone} className="text-on-surface-variant" />{texto}</span>
                <Interruptor rotulo={texto} ligado={form.notificacoes[chave]} onMudar={c.mudarNotificacao(chave)} />
              </div>
            ))}
            <div className="pt-4 border-t border-border-subtle">
              <p className="text-label-sm text-on-surface-variant mb-2">Horário de silêncio (sem e-mails)</p>
              <div className="flex items-center gap-2">
                <input type="time" className={`${campoClasse} w-auto! py-2`} value={form.silencio.inicio} onChange={c.mudarSilencio('inicio')} aria-label="Início" />
                <span className="text-on-surface-variant">até</span>
                <input type="time" className={`${campoClasse} w-auto! py-2`} value={form.silencio.fim} onChange={c.mudarSilencio('fim')} aria-label="Fim" />
              </div>
            </div>
          </div>
        </Secao>

        {sistema && <section className="md:col-span-12 bg-surface-card/50 rounded-xl p-stack-md border border-error-container/50 border-dashed">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-error-container/20 rounded-lg"><Icone nome="warning" className="text-error" /></div>
              <div>
                <h3 className="font-title-sm text-title-sm text-error">Zona crítica</h3>
                <p className="text-label-sm text-outline">Apaga tudo o que foi cadastrado neste navegador e volta aos dados de exemplo (só na versão de demonstração).</p>
              </div>
            </div>
            <button className={btn.perigo} onClick={c.abrirRestaurar}>Restaurar dados de exemplo</button>
          </div>
        </section>}
      </div>

      <AlterarSenhaModal aberto={c.senha} onFechar={c.fecharSenha} />
      <RegistroAtividadesModal aberto={c.log} onFechar={c.fecharLog} />
      <Confirmar aberto={c.restaurar} titulo="Restaurar dados de exemplo" perigo textoBotao="Restaurar"
        mensagem="Todos os profissionais, eventos, presenças e certificados cadastrados aqui serão substituídos pelos dados de exemplo. Continuar?"
        onFechar={c.fecharRestaurar} onConfirmar={c.confirmarRestauracao} />
    </div>
  );
}
