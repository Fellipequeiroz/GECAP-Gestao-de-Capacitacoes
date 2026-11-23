// View: a logo do GECAP (views/assets/logo-gecap.webp). A imagem tem margem vazia;
// aqui ela é recortada sem editar o arquivo:
// - "completa": símbolo + GECAP + "Gestão de Capacitação / Núcleo Municipal..." (login e menu aberto);
// - "simbolo": só as pessoas, o livro e o notebook (menu recolhido).
// Quem usa a logo a põe num cartão branco: no tema escuro, o verde e o azul do texto sumiriam no fundo.
import logo from '../assets/logo-gecap.webp';

// Recortes em fração da imagem: [esquerda, topo, largura, altura]. Medidos na imagem
// (fundo transparente): conteúdo em 0.104/0.078/0.793/0.852 e símbolo em 0.239/0.078/0.518/0.437,
// com uma pequena folga em volta.
const RECORTES = {
  completa: [0.094, 0.068, 0.813, 0.872],
  simbolo: [0.229, 0.068, 0.538, 0.457],
};

export default function LogoGecap({ variante = 'completa', largura, className = '' }) {
  const [x, y, w, h] = RECORTES[variante];
  const imagem = largura / w; // tamanho da imagem inteira para o recorte caber na largura pedida
  return (
    <span className={`relative block overflow-hidden ${className}`} style={{ width: largura, height: imagem * h }}>
      <img src={logo} alt={variante === 'completa' ? 'GECAP - Gestão de Capacitação, Núcleo Municipal de Educação Permanente' : 'GECAP'}
        draggable="false" className="absolute max-w-none select-none"
        style={{ width: imagem, height: imagem, left: -x * imagem, top: -y * imagem }} />
    </span>
  );
}
