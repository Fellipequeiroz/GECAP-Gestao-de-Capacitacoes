// View: peças de interface reutilizadas pelas telas (mesmo visual das telas do Stitch).
// Só apresentação: nenhum componente daqui busca ou grava dados.
import { useEffect, useState } from 'react';

export const btn = {
  primario: 'inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-on-primary font-title-sm text-[14px] rounded-xl shadow-md shadow-primary/20 hover:opacity-95 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none',
  secundario: 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-on-surface border border-border-subtle bg-surface-card hover:bg-surface-container-low font-title-sm text-[14px] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none',
  perigo: 'inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-error/10 text-error border border-error/20 rounded-xl font-title-sm text-[14px] hover:bg-error hover:text-on-error active:scale-95 transition-all disabled:opacity-50',
  icone: 'p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-40',
};

export const campoClasse = 'w-full bg-surface-container-low border border-transparent rounded-xl px-4 py-2.5 font-body-md text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all';

export function Icone({ nome, cheio, className = '' }) {
  return <span className={`material-symbols-outlined ${className}`} style={cheio ? { fontVariationSettings: "'FILL' 1" } : undefined} aria-hidden="true">{nome}</span>;
}

export function Campo({ rotulo, dica, erro, children, className = '' }) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="block font-label-upper text-label-upper text-on-surface-variant uppercase">{rotulo}</span>
      {children}
      {dica && !erro && <span className="block text-label-sm text-outline">{dica}</span>}
      {erro && <span className="block text-label-sm text-error">{erro}</span>}
    </label>
  );
}

export function Cartao({ children, className = '' }) {
  return <section className={`bg-surface-card rounded-xl border border-border-subtle shadow-xs ${className}`}>{children}</section>;
}

export function Kpi({ rotulo, valor, icone, cor = 'text-primary', rodape, barra }) {
  return (
    <div className="bg-surface-card p-5 rounded-xl border border-border-subtle shadow-xs card-hover">
      <div className="flex items-center justify-between mb-2">
        <span className="text-label-upper font-label-upper text-secondary uppercase">{rotulo}</span>
        {icone && <Icone nome={icone} className={cor} />}
      </div>
      <p className="text-display-lg font-display-lg">{valor}</p>
      {barra != null && (
        <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden mt-3">
          <div className="bg-success-emerald h-full transition-all duration-700" style={{ width: `${Math.round(barra * 100)}%` }} />
        </div>
      )}
      {rodape && <div className="mt-2 text-label-sm font-label-sm text-secondary">{rodape}</div>}
    </div>
  );
}

const STATUS = {
  agendado: ['Agendado', 'bg-surface-container-high text-on-surface-variant'],
  aguardando_presenca: ['Aguardando presença', 'bg-tertiary-fixed text-on-tertiary-fixed-variant'],
  realizado: ['Realizado', 'bg-primary-fixed text-on-primary-fixed-variant'],
  encerrado: ['Encerrado', 'bg-success-emerald/15 text-success-emerald'],
  ativo: ['Ativo', 'bg-success-emerald/15 text-success-emerald'],
  inativo: ['Inativo', 'bg-error/10 text-error'],
};

export function Selo({ status, texto }) {
  const [rot, cls] = STATUS[status] || [texto || status, 'bg-surface-container-high text-on-surface-variant'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {texto || rot}
    </span>
  );
}

export function Modal({ aberto, titulo, subtitulo, onFechar, children, rodape, largura = 'max-w-2xl' }) {
  useEffect(() => {
    if (!aberto) return undefined;
    const tecla = (e) => e.key === 'Escape' && onFechar();
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [aberto, onFechar]);
  if (!aberto) return null;
  return (
    <div className="fixed inset-0 z-60 modal-overlay flex items-center justify-center p-gutter" onMouseDown={(e) => e.target === e.currentTarget && onFechar()} role="dialog" aria-modal="true" aria-label={titulo}>
      <div className={`bg-surface-card w-full ${largura} max-h-[90vh] flex flex-col rounded-xl shadow-lg border border-border-subtle overflow-hidden`}>
        <div className="px-8 py-5 border-b border-border-subtle flex justify-between items-center gap-4">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface">{titulo}</h2>
            {subtitulo && <p className="text-body-md text-on-surface-variant">{subtitulo}</p>}
          </div>
          <button type="button" onClick={onFechar} aria-label="Fechar" className={btn.icone}><Icone nome="close" /></button>
        </div>
        <div className="p-8 overflow-y-auto custom-scrollbar">{children}</div>
        {rodape && <div className="px-8 py-4 bg-surface-container-low flex justify-end gap-3 border-t border-border-subtle">{rodape}</div>}
      </div>
    </div>
  );
}

export function Confirmar({ aberto, titulo, mensagem, textoBotao = 'Confirmar', perigo, onConfirmar, onFechar }) {
  const [ocupado, setOcupado] = useState(false);
  return (
    <Modal aberto={aberto} titulo={titulo} onFechar={onFechar} largura="max-w-md"
      rodape={<>
        <button className={btn.secundario} onClick={onFechar}>Cancelar</button>
        <button className={perigo ? btn.perigo : btn.primario} disabled={ocupado}
          onClick={async () => { setOcupado(true); try { await onConfirmar(); onFechar(); } finally { setOcupado(false); } }}>{textoBotao}</button>
      </>}>
      <p className="text-body-md text-on-surface-variant">{mensagem}</p>
    </Modal>
  );
}

export function Paginacao({ pagina, total, porPagina, onMudar, rotulo = 'itens' }) {
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  const ini = total === 0 ? 0 : (pagina - 1) * porPagina + 1;
  const fim = Math.min(total, pagina * porPagina);
  const lista = Array.from({ length: paginas }, (_, i) => i + 1).filter((p) => p === 1 || p === paginas || Math.abs(p - pagina) <= 1);
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-border-subtle">
      <span className="text-label-sm font-label-sm text-on-surface-variant">Exibindo {ini}–{fim} de {total} {rotulo}</span>
      <div className="flex items-center gap-1">
        <button className={btn.icone} disabled={pagina <= 1} onClick={() => onMudar(pagina - 1)} aria-label="Página anterior"><Icone nome="chevron_left" /></button>
        {lista.map((p, i) => (
          <span key={p} className="flex items-center">
            {i > 0 && p - lista[i - 1] > 1 && <span className="px-1 text-outline">…</span>}
            <button onClick={() => onMudar(p)} className={`w-8 h-8 rounded-lg text-label-sm font-bold ${p === pagina ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-high'}`}>{p}</button>
          </span>
        ))}
        <button className={btn.icone} disabled={pagina >= paginas} onClick={() => onMudar(pagina + 1)} aria-label="Próxima página"><Icone nome="chevron_right" /></button>
      </div>
    </div>
  );
}

// Nota em estrelas inteiras (1 a 5). Sem nota: traço.
export function Estrelas({ nota, tamanho = 'text-[18px]' }) {
  if (nota == null) return <span className="text-outline">—</span>;
  const n = Math.round(nota);
  return (
    <span className={`${tamanho} tracking-tight whitespace-nowrap`} role="img" aria-label={`Nota ${n} de 5`}>
      <span className="text-tertiary-container">{'★'.repeat(n)}</span><span className="text-outline-variant">{'★'.repeat(5 - n)}</span>
    </span>
  );
}

export function Carregando({ texto = 'Carregando...' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-on-surface-variant">
      <Icone nome="progress_activity" className="animate-spin" /> {texto}
    </div>
  );
}

export function Vazio({ icone = 'inbox', texto, children }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-on-surface-variant text-center">
      <Icone nome={icone} className="text-[40px] text-outline" />
      <p className="text-body-md">{texto}</p>
      {children}
    </div>
  );
}

export function CabecalhoPagina({ titulo, subtitulo, children }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-stack-lg">
      <div>
        <h2 className="text-display-lg font-display-lg text-on-surface tracking-tight">{titulo}</h2>
        {subtitulo && <p className="text-body-md font-body-md text-secondary mt-1">{subtitulo}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
    </div>
  );
}

export function Abas({ abas, ativa, onMudar }) {
  return (
    <div className="flex gap-1 p-1 bg-surface-container-low rounded-xl w-fit" role="tablist">
      {abas.map((a) => (
        <button key={a.valor} role="tab" aria-selected={ativa === a.valor} onClick={() => onMudar(a.valor)}
          className={`px-4 py-2 rounded-lg text-label-sm font-bold transition-all ${ativa === a.valor ? 'bg-surface-card text-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'}`}>
          {a.rotulo}{a.qtd != null && <span className="ml-1.5 text-outline font-medium">{a.qtd}</span>}
        </button>
      ))}
    </div>
  );
}

// Lista de avisos (toast). O estado fica em controllers/AvisoController.jsx.
export function ListaAvisos({ avisos }) {
  return (
    <div className="fixed bottom-6 right-6 z-70 space-y-2" aria-live="polite">
      {avisos.map((a) => (
        <div key={a.id} role="status" className={`px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-white text-body-md max-w-sm ${a.tipo === 'erro' ? 'bg-error-red' : 'bg-success-emerald'}`}>
          <Icone nome={a.tipo === 'erro' ? 'error' : 'check_circle'} />
          {a.texto}
        </div>
      ))}
    </div>
  );
}
