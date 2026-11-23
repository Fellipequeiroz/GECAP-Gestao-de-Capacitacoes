// View da Gestão de Unidades e Órgãos (tela do Stitch gest_o_de_unidades_gecap):
// cada unidade com a equipe, o coordenador em destaque. Dados: useGestaoUnidadesController.
import { useGestaoUnidadesController } from '../../../controllers/useGestaoUnidadesController.js';
import { CabecalhoPagina, Carregando, Cartao, Icone, Vazio, btn, campoClasse } from '../../components/ui.jsx';
import { iniciais } from '../../helpers/formatar.js';

// Cor e ícone de cada setor (a ordem segue os setores dos dados de exemplo).
const ESTILO_SETOR = [
  { teste: /gest/i, icone: 'account_balance', etiqueta: 'bg-primary-fixed text-on-primary-fixed-variant', caixa: 'bg-primary-fixed text-primary' },
  { teste: /b[aá]sica/i, icone: 'home_work', etiqueta: 'bg-success-emerald/15 text-success-emerald', caixa: 'bg-success-emerald/10 text-success-emerald' },
  { teste: /especial/i, icone: 'shield', etiqueta: 'bg-tertiary-fixed text-on-tertiary-fixed-variant', caixa: 'bg-tertiary-fixed text-tertiary' },
];
const estiloDo = (setor) => ESTILO_SETOR.find((e) => e.teste.test(setor)) ?? { icone: 'apartment', etiqueta: 'bg-surface-container-high text-on-surface-variant', caixa: 'bg-surface-container-high text-on-surface-variant' };

function CartaoUnidade({ u, c }) {
  const estilo = estiloDo(u.setor_nome);
  return (
    <Cartao className="overflow-hidden">
      <div className="p-6 flex items-start gap-5">
        <span className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${estilo.caixa}`}><Icone nome={estilo.icone} className="text-[28px]" /></span>
        <div className="flex-1 min-w-0">
          <h3 className="text-headline-md font-headline-md text-on-surface">{u.nome}</h3>
          <div className="flex flex-wrap items-center gap-3 mt-1">
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase ${estilo.etiqueta}`}>{u.setor_nome}</span>
            {u.endereco && <span className="text-label-sm text-on-surface-variant flex items-center gap-1"><Icone nome="location_on" className="text-[16px]" />{u.endereco}</span>}
          </div>
        </div>
        {c.gerencia && <button className={btn.icone} title="Editar unidade" onClick={c.editarUnidade}><Icone nome="edit" /></button>}
      </div>
      {u.equipe.length === 0 ? (
        <p className="px-6 pb-6 text-body-md text-on-surface-variant">Nenhum profissional lotado nesta unidade.</p>
      ) : (
        <div className="overflow-x-auto border-t border-border-subtle">
          <table className="w-full text-left">
            <thead>
              <tr className="text-label-upper font-label-upper text-on-surface-variant bg-surface-container-low/60">
                <th className="px-6 py-3">TRABALHADOR</th><th className="px-4 py-3">CARGO / FUNÇÃO</th><th className="px-4 py-3">STATUS</th>
                {c.gerencia && <th className="px-6 py-3 text-right">AÇÕES</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {u.equipe.map((p) => {
                const coord = p.perfil === 'coordenador';
                return (
                  <tr key={p.id} className={coord ? 'bg-primary/5 shadow-[inset_4px_0_0_var(--color-primary)]' : 'hover:bg-surface-container-low/60'}>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <span className={`w-10 h-10 rounded-full font-bold flex items-center justify-center shrink-0 ${coord ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>{iniciais(p.nome)}</span>
                        <div className="min-w-0">
                          <p className={`text-body-md ${coord ? 'font-bold' : ''} flex flex-wrap items-center gap-2`}>
                            {p.nome}{coord && <span className="px-2 py-0.5 rounded-full bg-primary text-on-primary text-[10px] font-bold uppercase">Coordenador</span>}
                          </p>
                          <p className="text-label-sm text-on-surface-variant truncate">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-body-md ${coord ? 'font-semibold' : ''}`}>{p.cargo_nome}</td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1.5 text-[11px] font-bold uppercase ${p.ativo ? 'text-success-emerald' : 'text-error'}`}>
                        <span className="w-2 h-2 rounded-full bg-current" />{p.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    {c.gerencia && (
                      <td className="px-6 py-3 text-right">
                        <button className="text-primary text-label-sm font-bold hover:underline" onClick={() => c.verPerfil(p)}>Ver perfil</button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Cartao>
  );
}

export default function GestaoUnidades() {
  const c = useGestaoUnidadesController();
  if (c.carregando) return <Carregando />;
  return (
    <div className="space-y-stack-lg">
      <CabecalhoPagina titulo="Gestão de Unidades e Órgãos"
        subtitulo={c.soMinha ? 'A estrutura e a equipe técnica da sua unidade.'
          : c.daDiretoria ? 'As unidades da sua diretoria, com coordenações e equipes técnicas.'
            : 'Estrutura organizacional, coordenações e equipes técnicas das unidades do SUAS.'}>
        {c.gerencia && <button className={btn.primario} onClick={c.adicionarUnidade}><Icone nome="add" /> Adicionar unidade</button>}
      </CabecalhoPagina>
      <div className="relative max-w-md">
        <Icone nome="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
        <input className={`${campoClasse} pl-10`} placeholder="Buscar unidade, trabalhador ou cargo..." value={c.busca} onChange={(e) => c.setBusca(e.target.value)} aria-label="Buscar" />
      </div>
      {c.unidades.length === 0 ? <Cartao><Vazio icone="domain_disabled" texto="Nenhuma unidade encontrada." /></Cartao>
        : c.unidades.map((u) => <CartaoUnidade key={u.id} u={u} c={c} />)}
    </div>
  );
}
