// View helper: formatação de datas e números no padrão brasileiro (só apresentação).
export const data = (v) => (v ? new Date(v).toLocaleDateString('pt-BR') : '—');
export const dataHora = (v) => (v ? new Date(v).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—');
export const dataLonga = (v) => (v ? new Date(v).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—');
export const numero = (v, casas = 0) => Number(v ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
export const pct = (v, casas = 0) => `${numero((v ?? 0) * 100, casas)}%`;
export const iniciais = (nome) => String(nome || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

export function tempoRelativo(v) {
  const diff = Date.now() - new Date(v).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  if (d === 1) return 'ontem';
  if (d < 30) return `há ${d} dias`;
  return data(v);
}
