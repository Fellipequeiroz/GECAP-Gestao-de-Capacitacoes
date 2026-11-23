// Controller helper: gera arquivos (CSV, JSON) e dispara o download no navegador.

// Exporta uma lista de objetos para CSV (abre no Excel) e baixa o arquivo.
export function baixarCsv(nomeArquivo, linhas, colunas) {
  // Segurança: um texto que começa com = + - @ vira fórmula no Excel ("CSV injection").
  // Um apóstrofo na frente faz o Excel tratar como texto.
  const esc = (v) => {
    let t = String(v ?? '');
    if (/^[=+\-@\t\r]/.test(t) && !/^-?\d+([.,]\d+)?$/.test(t)) t = `'${t}`;
    return `"${t.replace(/"/g, '""')}"`;
  };
  const corpo = [colunas.map((c) => esc(c.titulo)).join(';'), ...linhas.map((l) => colunas.map((c) => esc(typeof c.valor === 'function' ? c.valor(l) : l[c.valor])).join(';'))].join('\r\n');
  const blob = new Blob(['﻿' + corpo], { type: 'text/csv;charset=utf-8' });
  baixarBlob(nomeArquivo, blob);
}

export function baixarJson(nomeArquivo, dados) {
  baixarBlob(nomeArquivo, new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' }));
}

function baixarBlob(nome, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
