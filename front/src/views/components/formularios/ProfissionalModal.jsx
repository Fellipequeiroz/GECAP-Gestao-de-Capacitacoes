// View do formulário de profissional (antes "Registrar Novo Membro" do Stitch).
// Estado e envio ficam em controllers/formularios/useProfissionalForm.js.
import { useProfissionalForm } from '../../../controllers/formularios/useProfissionalForm.js';
import { FORMACOES, LIMITES, PERFIS } from '../../../models/regras.js';
import { Campo, Modal, btn, campoClasse } from '../ui.jsx';

export default function ProfissionalModal({ aberto, profissional, proprio, onFechar, onSalvo }) {
  const { form, erro, salvando, unidades, cargos, mudar, mudarCpf, enviar } = useProfissionalForm({ aberto, profissional, onFechar, onSalvo });

  return (
    <Modal aberto={aberto} onFechar={onFechar}
      titulo={profissional ? 'Editar profissional' : 'Cadastrar profissional'}
      subtitulo={profissional ? profissional.nome : 'Preencha os dados para dar acesso ao sistema.'}
      rodape={<>
        <button type="button" className={btn.secundario} onClick={onFechar}>Cancelar</button>
        <button className={btn.primario} form="form-profissional" type="submit" disabled={salvando}>
          <span className="material-symbols-outlined text-[18px]">save</span>{salvando ? 'Salvando...' : 'Salvar'}
        </button>
      </>}>
      <form id="form-profissional" onSubmit={enviar} className="grid grid-cols-2 gap-5">
        <Campo rotulo="Nome completo" className="col-span-2">
          <input className={campoClasse} value={form.nome} onChange={mudar('nome')} placeholder="Ex.: João da Silva Santos" maxLength={LIMITES.nome} required autoFocus />
        </Campo>
        <Campo rotulo="CPF">
          <input className={campoClasse} value={form.cpf} onChange={mudarCpf} placeholder="000.000.000-00" inputMode="numeric" required />
        </Campo>
        <Campo rotulo="Data de nascimento">
          <input className={campoClasse} type="date" value={form.data_nascimento || ''} onChange={mudar('data_nascimento')} />
        </Campo>
        <Campo rotulo="E-mail institucional">
          <input className={campoClasse} type="email" value={form.email} onChange={mudar('email')} placeholder="nome.sobrenome@assistenciasocial.gov.br" maxLength={LIMITES.email} required />
        </Campo>
        <Campo rotulo="Telefone">
          <input className={campoClasse} value={form.telefone} onChange={mudar('telefone')} placeholder="(34) 99999-0000" maxLength={LIMITES.telefone} />
        </Campo>
        <Campo rotulo="Formação" dica="Nível de escolaridade (regra 7)">
          <select className={campoClasse} value={form.formacao} onChange={mudar('formacao')} required>
            <option value="">Selecione...</option>
            {FORMACOES.map((f) => <option key={f.valor} value={f.valor}>{f.rotulo}</option>)}
          </select>
        </Campo>
        <Campo rotulo="Cargo" dica="Área de atuação (CARGO_TAG)">
          <select className={campoClasse} value={form.cargo_tag_id} onChange={mudar('cargo_tag_id')}>
            <option value="">Sem cargo</option>
            {cargos.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </Campo>
        <Campo rotulo="Perfil de acesso" dica={proprio ? 'Só outro administrador pode mudar o seu perfil' : 'Define o que a pessoa pode fazer no sistema'}>
          <select className={campoClasse} value={form.perfil} onChange={mudar('perfil')} disabled={proprio}>
            {PERFIS.map((p) => <option key={p.valor} value={p.valor}>{p.rotulo}</option>)}
          </select>
        </Campo>
        <Campo rotulo="Unidade de lotação">
          <select className={campoClasse} value={form.unidade_id} onChange={mudar('unidade_id')} disabled={proprio} required>
            <option value="">Selecione a unidade...</option>
            {unidades.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
          </select>
        </Campo>
        {profissional && !proprio && (
          <label className="col-span-2 flex items-center gap-3 text-body-md">
            <input type="checkbox" className="rounded text-primary focus:ring-primary" checked={form.ativo} onChange={mudar('ativo')} />
            Acesso ativo
          </label>
        )}
        {erro && <p className="col-span-2 rounded-lg bg-error/10 text-error px-4 py-3 text-body-md" role="alert">{erro}</p>}
      </form>
    </Modal>
  );
}
