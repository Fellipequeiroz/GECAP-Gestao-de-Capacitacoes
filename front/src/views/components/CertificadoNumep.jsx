// View: o certificado do NUMEP sobre o fundo (views/assets/certificado-fundo.png: moldura,
// faixas e selo; todo o texto é escrito aqui). Posições e tamanhos em % da folha, então o
// certificado escala igual na tela e na impressão A4 deitada.
// Os textos vêm de textosDoCertificado (models/certificadoModel.js), editáveis pelo Master.
import '@fontsource/great-vibes/400.css';
import { textosDoCertificado } from '../../models/certificadoModel.js';
import fundo from '../assets/certificado-fundo.png';

const VERDE = 'text-[#1b5a4f]';

export default function CertificadoNumep({ certificado, modelo, className = '' }) {
  const t = textosDoCertificado(certificado, modelo);
  const facilitador = certificado.tipo === 'facilitador';
  return (
    <article className={`certificado @container relative w-full aspect-[2000/1414] bg-white text-[#33383d] overflow-hidden ${className}`}>
      <img src={fundo} alt="" className="absolute inset-0 w-full h-full select-none pointer-events-none" draggable="false" />

      <h1 className={`absolute inset-x-0 top-[17.7%] -translate-y-1/2 text-center font-black text-[6.4cqw] leading-none tracking-tight ${VERDE}`}>
        CERTIFICADO
      </h1>
      <p className="absolute inset-x-0 top-[24.4%] -translate-y-1/2 text-center text-[2.3cqw] tracking-[0.18em] uppercase">
        {facilitador ? 'de agradecimento' : 'de participação'}
      </p>
      <p className="absolute left-[11%] right-[11%] top-[31.8%] -translate-y-1/2 text-center text-[1.6cqw] leading-tight">
        {t.abertura}
      </p>
      <p className={`absolute left-[12%] right-[12%] top-[41.5%] -translate-y-1/2 text-center font-['Great_Vibes'] text-[5.4cqw] leading-none ${VERDE}`}>
        {t.nome}
      </p>
      <span className="absolute left-[18.35%] right-[18.35%] top-[46%] h-[0.22cqw] bg-[#c9a95a]" />
      <p className="absolute left-[19%] right-[19%] top-[51.5%] text-center text-[1.6cqw] leading-[1.45]">
        {t.corpo}
      </p>
      <p className="absolute inset-x-0 top-[66.3%] -translate-y-1/2 text-center text-[1.55cqw] font-bold">
        {t.local}
      </p>

      <span className="absolute left-[41%] right-[41%] top-[80.5%] h-[0.12cqw] bg-[#1b5a4f]" />
      <p className={`absolute inset-x-0 top-[82.9%] -translate-y-1/2 text-center text-[1.65cqw] font-bold ${VERDE}`}>
        Coordenação do NUMEP
      </p>
      <p className="absolute inset-x-0 top-[85.7%] -translate-y-1/2 text-center text-[1.25cqw]">
        Núcleo Municipal de Educação Permanente
      </p>
      <p className="absolute inset-x-0 top-[89.6%] -translate-y-1/2 text-center text-[0.8cqw] text-[#6b7178]">
        Código de verificação: <b className="font-mono tracking-wide text-[#33383d]">{certificado.codigo_verificacao}</b>
      </p>
    </article>
  );
}
