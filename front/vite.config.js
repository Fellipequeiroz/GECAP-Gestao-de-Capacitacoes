import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Segurança: Content Security Policy (CSP) na versão final (npm run build).
// Diz ao navegador para só carregar scripts, estilos, fontes e imagens do
// próprio site, o que barra a maior parte dos ataques de injeção de script (XSS).
// Não vale no "npm run dev", porque o Vite injeta scripts próprios em desenvolvimento.
// Se o front for publicado fora do Moodle, acrescente o endereço dele em connect-src
// (ex.: https://moodle.exemplo.gov.br) e defina VITE_MOODLE_URL com esse endereço.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'", // estilos inline do React (style={...}) e dos gráficos
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const seguranca = {
  name: 'gecap-seguranca',
  apply: 'build',
  transformIndexHtml: (html) => html.replace(
    '<meta charset="UTF-8" />',
    `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />\n    <meta name="referrer" content="strict-origin-when-cross-origin" />`,
  ),
};

export default defineConfig({
  plugins: [react(), seguranca],
  // O pacote final passa de 500 kB por causa da biblioteca de gráficos (Recharts).
  // Para um sistema interno isso é aceitável; o limite só tira o aviso do build.
  build: { chunkSizeWarningLimit: 1000 },
  // Em desenvolvimento, /moodle/... é repassado ao Moodle local (http://localhost:8080, ou MOODLE_URL).
  // Assim o navegador vê tudo no mesmo endereço e não há bloqueio de CORS.
  server: {
    proxy: {
      '/moodle': {
        target: process.env.MOODLE_URL || 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (caminho) => caminho.replace(/^\/moodle/, ''),
      },
    },
  },
});
