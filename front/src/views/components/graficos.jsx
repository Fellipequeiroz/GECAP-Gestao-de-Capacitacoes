// Gráficos do sistema, feitos com a biblioteca Recharts (https://recharts.org).
// Cada gráfico recebe os dados por "props" e se redesenha sozinho quando eles mudam.
// As cores vêm do tema (claro/escuro), lidas das variáveis CSS de styles/tokens.css.
import { useEffect, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { useTema } from '../../controllers/TemaController.jsx';

function lerCor(nome) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(`--c-${nome}`).trim();
  return v ? `rgb(${v.split(/\s+/).join(',')})` : '#888';
}

// Lê as cores do tema atual e relê quando o tema muda.
export function useCores() {
  const { tema } = useTema();
  const ler = () => ({
    primaria: lerCor('primary'),
    primariaClara: lerCor('primary-fixed-dim'),
    sucesso: lerCor('success-emerald'),
    alerta: lerCor('tertiary-container'),
    erro: lerCor('error-red'),
    texto: lerCor('on-surface'),
    textoFraco: lerCor('on-surface-variant'),
    grade: lerCor('border-subtle'),
    fundo: lerCor('surface-card'),
    serie: [lerCor('primary'), lerCor('success-emerald'), lerCor('tertiary-container'), lerCor('secondary'), lerCor('primary-fixed-dim'), lerCor('error-red')],
  });
  const [cores, setCores] = useState(ler);
  useEffect(() => {
    // espera o tema ser aplicado no <html> antes de ler
    const t = setTimeout(() => setCores(ler()), 0);
    const obs = new MutationObserver(() => setCores(ler()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => { clearTimeout(t); obs.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tema]);
  return cores;
}

function Dica({ active, payload, label, formatar = (v) => v, cores }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-card px-3 py-2 shadow-md text-label-sm">
      {label != null && <p className="font-bold text-on-surface mb-1">{label}</p>}
      {payload.map((p) => (
        <p key={p.dataKey ?? p.name} className="flex items-center gap-2 text-on-surface-variant">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.payload?.fill || cores.primaria }} />
          {p.name}: <span className="font-bold text-on-surface">{formatar(p.value, p)}</span>
        </p>
      ))}
    </div>
  );
}

const eixo = (cores) => ({ stroke: cores.grade, tick: { fill: cores.textoFraco, fontSize: 11 }, tickLine: false, axisLine: false });

// Barras: series = [{ chave, nome }]. "destaque" pinta uma categoria com a cor forte.
export function GraficoBarras({ dados, x, series, altura = 260, formatar, destaque, empilhado, horizontal, onClicar, dominio }) {
  const cores = useCores();
  const umaSerie = series.length === 1;
  return (
    <ResponsiveContainer width="100%" height={altura}>
      <BarChart data={dados} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ top: 8, right: 8, left: horizontal ? 8 : -12, bottom: 0 }} barCategoryGap="22%">
        <CartesianGrid stroke={cores.grade} strokeDasharray="3 3" vertical={horizontal} horizontal={!horizontal} />
        {horizontal ? (
          <>
            <XAxis type="number" {...eixo(cores)} tickFormatter={formatar} domain={dominio} />
            <YAxis type="category" dataKey={x} width={150} {...eixo(cores)} />
          </>
        ) : (
          <>
            <XAxis dataKey={x} {...eixo(cores)} interval={0} />
            <YAxis {...eixo(cores)} tickFormatter={formatar} allowDecimals={false} domain={dominio} />
          </>
        )}
        <Tooltip cursor={{ fill: cores.grade, opacity: 0.4 }} content={<Dica formatar={formatar} cores={cores} />} />
        {!umaSerie && <Legend wrapperStyle={{ fontSize: 12, color: cores.textoFraco }} />}
        {series.map((s, i) => (
          <Bar key={s.chave} dataKey={s.chave} name={s.nome} stackId={empilhado ? 'a' : undefined}
            fill={s.cor || cores.serie[i]} radius={empilhado && i < series.length - 1 ? 0 : horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]}
            onClick={onClicar ? (d) => onClicar(d.payload ?? d) : undefined} cursor={onClicar ? 'pointer' : undefined}
            animationDuration={700}>
            {umaSerie && destaque != null && dados.map((d) => (
              <Cell key={d[x]} fill={d[x] === destaque ? cores.primaria : cores.primariaClara} />
            ))}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function GraficoLinha({ dados, x, series, altura = 260, formatar, dominio }) {
  const cores = useCores();
  return (
    <ResponsiveContainer width="100%" height={altura}>
      <LineChart data={dados} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
        <CartesianGrid stroke={cores.grade} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={x} {...eixo(cores)} />
        <YAxis {...eixo(cores)} tickFormatter={formatar} domain={dominio} allowDecimals={false} />
        <Tooltip content={<Dica formatar={formatar} cores={cores} />} />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12, color: cores.textoFraco }} />}
        {series.map((s, i) => (
          <Line key={s.chave} type="monotone" dataKey={s.chave} name={s.nome} stroke={s.cor || cores.serie[i]} strokeWidth={2.5}
            dot={{ r: 3, fill: cores.fundo, strokeWidth: 2 }} activeDot={{ r: 5 }} connectNulls animationDuration={700} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// Rosca (partes de um todo): dados = [{ nome, valor }]
export function GraficoRosca({ dados, altura = 240, formatar, centro }) {
  const cores = useCores();
  const total = dados.reduce((s, d) => s + d.valor, 0);
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={altura}>
        <PieChart>
          <Pie data={dados} dataKey="valor" nameKey="nome" innerRadius="58%" outerRadius="85%" paddingAngle={2} stroke={cores.fundo} strokeWidth={2} animationDuration={700}>
            {dados.map((d, i) => <Cell key={d.nome} fill={d.cor || cores.serie[i % cores.serie.length]} />)}
          </Pie>
          <Tooltip content={<Dica formatar={formatar || ((v) => `${v} (${Math.round((v / (total || 1)) * 100)}%)`)} cores={cores} />} />
          <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" wrapperStyle={{ fontSize: 12, color: cores.textoFraco }} />
        </PieChart>
      </ResponsiveContainer>
      {centro && (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex flex-col items-center justify-center" style={{ width: 'calc(100% - 150px)' }}>
          {centro}
        </div>
      )}
    </div>
  );
}
