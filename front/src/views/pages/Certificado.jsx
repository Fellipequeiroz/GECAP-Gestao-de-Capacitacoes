// View do certificado pronto para imprimir ou salvar em PDF (botão "Imprimir" do navegador).
// Usa os dados "congelados" (snapshot) do certificado: se o evento for editado
// depois, o certificado não muda (regra 3). Dados: useCertificadoController.
import { useCertificadoController } from '../../controllers/useCertificadoController.js';
import CertificadoNumep from '../components/CertificadoNumep.jsx';
import { Carregando, Icone, btn } from '../components/ui.jsx';

export default function Certificado() {
  const { codigo, certificado: c, carregando, imprimir } = useCertificadoController();
  if (carregando) return <Carregando />;
  if (!c) return <p className="p-10 text-center text-body-md">Certificado {codigo} não encontrado.</p>;

  return (
    <div className="min-h-screen bg-surface-bg py-8 print:py-0 print:bg-white">
      <div className="max-w-[1100px] mx-auto mb-4 px-gutter flex justify-end gap-3 print:hidden">
        <button className={btn.primario} onClick={imprimir}><Icone nome="print" /> Imprimir / salvar em PDF</button>
      </div>
      <div className="max-w-[1100px] mx-auto px-gutter print:p-0 print:max-w-none">
        <CertificadoNumep certificado={c} modelo={c.modelo} className="shadow-lg print:shadow-none" />
      </div>
    </div>
  );
}
