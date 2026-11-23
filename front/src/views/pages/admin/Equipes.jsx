// View de Equipes: profissionais, unidades e cargos da rede.
// Só apresentação: estado e ações vêm de controllers/useEquipesController.js.
import {
  useCargosController, useEquipesController, useProfissionaisController, useUnidadesController,
} from '../../../controllers/useEquipesController.js';
import { usePermissoes } from '../../../controllers/usePermissoes.js';
import { FORMACOES, PERFIS, rotulo } from '../../../models/regras.js';
import ProfissionalModal from '../../components/formularios/ProfissionalModal.jsx';
import { GraficoBarras } from '../../components/graficos.jsx';
import {
  Abas, CabecalhoPagina, Campo, Carregando, Cartao, Confirmar, Icone, Modal, Paginacao, Vazio, btn, campoClasse,
} from '../../components/ui.jsx';
import { iniciais, numero, pct, tempoRelativo } from '../../helpers/formatar.js';

const COR_PERFIL = { master: 'bg-primary text-on-primary', diretor: 'bg-primary-fixed text-on-primary-fixed-variant', coordenador: 'bg-secondary-container text-on-secondary-container', tecnico: 'bg-surface-container-high text-on-surface-variant' };

function Profissionais({ pessoas, unidades, abrirNovo, abrirEditar, gerencia }) {
  const c = useProfissionaisController(pessoas);
  return (
    <div className="space-y-stack-lg">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-6 rounded-xl shadow-xs flex items-center gap-5">
          <div className="w-14 h-14 rounded-xl bg-primary-fixed flex items-center justify-center text-primary"><Icone nome="groups" className="text-[30px]" /></div>
          <div><p className="text-label-upper font-label-upper text-on-surface-variant">PROFISSIONAIS ATIVOS</p><p className="text-display-lg font-display-lg leading-none">{numero(c.totalAtivos)}</p></div>
        </div>
        <div className="glass-card p-6 rounded-xl shadow-xs flex items-center gap-5">
          <div className="w-14 h-14 rounded-xl bg-primary-fixed flex items-center justify-center text-primary"><Icone nome="apartment" className="text-[30px]" /></div>
          <div><p className="text-label-upper font-label-upper text-on-surface-variant">UNIDADES</p><p className="text-display-lg font-display-lg leading-none">{unidades.length}</p></div>
        </div>
        <div className="glass-card p-6 rounded-xl shadow-xs bg-linear-to-br from-primary to-primary-container text-on-primary border-none">
          <p className="text-label-upper font-label-upper text-primary-fixed mb-1">PRESENÇA DA EQUIPE</p>
          <p className="text-display-lg font-display-lg">{pct(c.presencaEquipe, 1)}</p>
          <div className="w-full bg-white/20 h-1.5 rounded-full mt-4 overflow-hidden"><div className="bg-white h-full transition-all duration-700" style={{ width: `${c.presencaEquipe * 100}%` }} /></div>
        </div>
      </div>

      <Cartao className="overflow-hidden">
        <div className="p-6 border-b border-border-subtle flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-title-sm font-title-sm">Profissionais da rede</h3>
          <div className="flex flex-wrap gap-2">
            <input className={`${campoClasse} py-2 w-56!`} placeholder="Nome, e-mail ou CPF" value={c.busca} onChange={(e) => c.setBusca(e.target.value)} aria-label="Buscar profissional" />
            <select className={`${campoClasse} py-2 w-auto!`} value={c.unidade} onChange={(e) => c.setUnidade(e.target.value)} aria-label="Unidade">
              <option value="">Todas as unidades</option>{unidades.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
            </select>
            <select className={`${campoClasse} py-2 w-auto!`} value={c.perfil} onChange={(e) => c.setPerfil(e.target.value)} aria-label="Perfil">
              <option value="">Todos os perfis</option>{PERFIS.map((p) => <option key={p.valor} value={p.valor}>{p.rotulo}</option>)}
            </select>
            <select className={`${campoClasse} py-2 w-auto!`} value={c.situacao} onChange={(e) => c.setSituacao(e.target.value)} aria-label="Situação">
              <option value="ativos">Ativos</option><option value="inativos">Inativos</option><option value="todos">Todos</option>
            </select>
            <button className={btn.icone} onClick={c.exportar} title="Exportar CSV"><Icone nome="download" /></button>
          </div>
        </div>
        {c.visiveis.length === 0 ? <Vazio icone="person_search" texto="Nenhum profissional encontrado.">{gerencia && <button className={btn.primario} onClick={abrirNovo}>Cadastrar profissional</button>}</Vazio> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="text-label-upper font-label-upper text-on-surface-variant border-b border-border-subtle">
                <th className="px-6 py-3">NOME</th><th className="px-4 py-3">CARGO</th><th className="px-4 py-3">PERFIL</th><th className="px-4 py-3">UNIDADE</th><th className="px-4 py-3">PRESENÇA</th><th className="px-4 py-3 text-right">AÇÕES</th>
              </tr></thead>
              <tbody className="divide-y divide-border-subtle">
                {c.visiveis.map((p) => (
                  <tr key={p.id} className={`hover:bg-surface-container-low/60 ${p.ativo ? '' : 'opacity-60'}`}>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-lg bg-primary-fixed text-primary font-bold flex items-center justify-center shrink-0">{iniciais(p.nome)}</span>
                        <div className="min-w-0"><p className="text-body-md font-semibold">{p.nome}</p><p className="text-label-sm text-on-surface-variant truncate">{p.email}</p></div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-body-md">{p.cargo_nome}<span className="block text-label-sm text-on-surface-variant">{rotulo(FORMACOES, p.formacao)}</span></td>
                    <td className="px-4 py-3"><span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${COR_PERFIL[p.perfil]}`}>{rotulo(PERFIS, p.perfil)}</span></td>
                    <td className="px-4 py-3 text-body-md">{p.unidade_nome}</td>
                    <td className="px-4 py-3 text-body-md">{p.participacoes}/{p.convocacoes}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {gerencia && <>
                        <button className={btn.icone} title="Editar" onClick={() => abrirEditar(p)}><Icone nome="edit" /></button>
                        <button className={btn.icone} title={p.ativo ? 'Desativar acesso' : 'Reativar acesso'} onClick={() => c.alternar(p)}>
                          <Icone nome={p.ativo ? 'person_off' : 'person_check'} />
                        </button>
                      </>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Paginacao pagina={c.pagina} total={c.lista.length} porPagina={c.porPagina} onMudar={c.setPagina} rotulo="profissionais" />
      </Cartao>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Cartao className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-title-sm font-title-sm">Distribuição da equipe</h3>
            <select className="bg-surface-container-low border-none text-label-sm rounded-lg px-3 py-1 text-on-surface" value={c.agrupar} onChange={(e) => c.setAgrupar(e.target.value)} aria-label="Agrupar por">
              <option value="cargo">Por cargo</option><option value="perfil">Por perfil</option>
            </select>
          </div>
          <GraficoBarras dados={c.distribuicao} x="grupo" series={[{ chave: 'qtd', nome: 'Profissionais' }]} horizontal altura={Math.max(160, c.distribuicao.length * 38)} />
        </Cartao>
        <Cartao className="p-6">
          <h3 className="text-title-sm font-title-sm mb-4">Cadastrados recentemente</h3>
          <div className="space-y-4">
            {c.recentes.map((p) => (
              <button key={p.id} onClick={() => gerencia && abrirEditar(p)} className="w-full flex items-center gap-4 text-left hover:bg-surface-container-low rounded-lg p-1">
                <span className="w-10 h-10 rounded-full bg-primary-fixed text-primary font-bold flex items-center justify-center">{iniciais(p.nome)}</span>
                <span><span className="block text-label-sm font-bold">{p.nome}</span><span className="text-label-sm text-on-surface-variant">{p.unidade_nome} · {tempoRelativo(p.criado_em)}</span></span>
              </button>
            ))}
          </div>
        </Cartao>
      </div>
    </div>
  );
}

function Unidades({ unidades, setores, gerencia }) {
  const c = useUnidadesController(unidades, setores);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <Cartao className="lg:col-span-3 overflow-hidden">
        <div className="p-6 border-b border-border-subtle flex justify-between items-center">
          <h3 className="text-title-sm font-title-sm">Unidades da rede</h3>
          {gerencia && <button className={btn.primario} onClick={c.nova}><Icone nome="add" /> Nova unidade</button>}
        </div>
        <table className="w-full text-left">
          <thead><tr className="text-label-upper font-label-upper text-on-surface-variant border-b border-border-subtle"><th className="px-6 py-3">UNIDADE</th><th className="px-4 py-3">SETOR</th><th className="px-4 py-3">PROFISSIONAIS</th><th className="px-4 py-3" /></tr></thead>
          <tbody className="divide-y divide-border-subtle">
            {unidades.map((u) => (
              <tr key={u.id} className="hover:bg-surface-container-low/60">
                <td className="px-6 py-3"><p className="text-body-md font-semibold">{u.nome}</p><p className="text-label-sm text-on-surface-variant">{u.endereco}</p></td>
                <td className="px-4 py-3 text-body-md">{u.setor_nome}</td>
                <td className="px-4 py-3 text-body-md">{u.profissionais}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {gerencia && <>
                    <button className={btn.icone} title="Editar" onClick={() => c.editar(u)}><Icone nome="edit" /></button>
                    <button className={btn.icone} title="Excluir" onClick={() => c.pedirExclusao(u)}><Icone nome="delete" /></button>
                  </>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Cartao>
      <Cartao className="lg:col-span-2 p-6">
        <h3 className="text-title-sm font-title-sm mb-4">Profissionais por unidade</h3>
        <GraficoBarras dados={c.grafico} x="unidade" series={[{ chave: 'qtd', nome: 'Profissionais' }]} horizontal altura={Math.max(200, c.grafico.length * 40)} />
      </Cartao>
      <Modal aberto={Boolean(c.form)} onFechar={c.fecharForm} titulo={c.form?.id ? 'Editar unidade' : 'Nova unidade'} largura="max-w-lg"
        rodape={<><button className={btn.secundario} onClick={c.fecharForm}>Cancelar</button><button className={btn.primario} form="form-unidade">Salvar</button></>}>
        {c.form && (
          <form id="form-unidade" onSubmit={c.salvar} className="space-y-4">
            <Campo rotulo="Nome"><input className={campoClasse} value={c.form.nome} onChange={c.mudar('nome')} autoFocus /></Campo>
            <Campo rotulo="Setor"><select className={campoClasse} value={c.form.setor_id} onChange={c.mudar('setor_id')}>{setores.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}</select></Campo>
            <Campo rotulo="Endereço"><input className={campoClasse} value={c.form.endereco} onChange={c.mudar('endereco')} /></Campo>
            {c.erro && <p className="text-error text-body-md">{c.erro}</p>}
          </form>
        )}
      </Modal>
      <Confirmar aberto={Boolean(c.excluir)} titulo="Excluir unidade" mensagem={`Excluir ${c.excluir?.nome}?`} perigo textoBotao="Excluir" onFechar={c.fecharExclusao} onConfirmar={c.confirmarExclusao} />
    </div>
  );
}

function Cargos({ cargos, pessoas, gerencia }) {
  const c = useCargosController(pessoas);
  return (
    <Cartao className="overflow-hidden max-w-3xl">
      <div className="p-6 border-b border-border-subtle">
        <h3 className="text-title-sm font-title-sm mb-1">Cargos (áreas de atuação)</h3>
        <p className="text-label-sm text-on-surface-variant mb-4">Separado do perfil de acesso: o cargo diz a profissão, o perfil diz o que a pessoa pode fazer no sistema.</p>
        {gerencia && <form className="flex gap-2" onSubmit={c.adicionar}>
          <input className={campoClasse} placeholder="Novo cargo, ex.: Orientador(a) Social" value={c.novo} onChange={(e) => c.setNovo(e.target.value)} />
          <button className={btn.primario} disabled={!c.novo.trim()}><Icone nome="add" /> Adicionar</button>
        </form>}
      </div>
      <ul className="divide-y divide-border-subtle">
        {cargos.map((cargo) => (
          <li key={cargo.id} className="px-6 py-3 flex items-center justify-between gap-3">
            {c.editando?.id === cargo.id ? (
              <form className="flex gap-2 flex-1" onSubmit={c.salvarEdicao}>
                <input className={`${campoClasse} py-2`} value={c.editando.nome} onChange={(e) => c.setEditando({ ...c.editando, nome: e.target.value })} autoFocus />
                <button className={btn.primario}>Salvar</button><button type="button" className={btn.secundario} onClick={() => c.setEditando(null)}>Cancelar</button>
              </form>
            ) : (
              <>
                <span className="text-body-md">{cargo.nome} <span className="text-label-sm text-on-surface-variant">· {c.contar(cargo.id)} profissional(is)</span></span>
                {gerencia && <span className="whitespace-nowrap">
                  <button className={btn.icone} title="Renomear" onClick={() => c.setEditando({ id: cargo.id, nome: cargo.nome })}><Icone nome="edit" /></button>
                  <button className={btn.icone} title="Excluir" onClick={() => c.excluir(cargo)}><Icone nome="delete" /></button>
                </span>}
              </>
            )}
          </li>
        ))}
      </ul>
    </Cartao>
  );
}

export default function Equipes() {
  const c = useEquipesController();
  // Cadastrar e editar profissionais, unidades e cargos: só o Master (gerenciarestrutura).
  const gerencia = usePermissoes().pode('gerenciarestrutura');
  if (c.carregando) return <Carregando />;
  return (
    <div className="space-y-stack-lg">
      <CabecalhoPagina titulo="Gestão de Equipes" subtitulo="Profissionais, unidades e cargos da rede socioassistencial.">
        {gerencia && <button className={btn.primario} onClick={c.novoProfissional}><Icone nome="person_add" /> Cadastrar profissional</button>}
      </CabecalhoPagina>
      <Abas ativa={c.aba} onMudar={c.setAba} abas={c.abas} />
      {c.aba === 'profissionais' && <Profissionais pessoas={c.pessoas} unidades={c.unidades} abrirNovo={c.novoProfissional} abrirEditar={c.editarProfissional} gerencia={gerencia} />}
      {c.aba === 'unidades' && <Unidades unidades={c.unidades} setores={c.setores} gerencia={gerencia} />}
      {c.aba === 'cargos' && <Cargos cargos={c.cargos} pessoas={c.pessoas} gerencia={gerencia} />}
      {gerencia && <ProfissionalModal aberto={c.modal.aberto} profissional={c.modal.profissional} onFechar={c.fecharModal} />}
    </div>
  );
}
