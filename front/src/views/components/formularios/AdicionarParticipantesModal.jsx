// View do formulário "Adicionar participantes". Estado e envio: controllers/formularios/useAdicionarParticipantes.js.
import { useAdicionarParticipantes } from '../../../controllers/formularios/useAdicionarParticipantes.js';
import { Campo, Icone, Modal, btn, campoClasse } from '../ui.jsx';

export default function AdicionarParticipantesModal({ aberto, eventoId, onFechar }) {
  const { texto, setTexto, resultado, lerArquivo, enviar, fechar } = useAdicionarParticipantes({ eventoId, onFechar });
  return (
    <Modal aberto={aberto} onFechar={fechar} titulo="Adicionar participantes" subtitulo="Para quem não foi convocado pelas unidades." largura="max-w-xl"
      rodape={<><button className={btn.secundario} onClick={fechar}>Fechar</button><button className={btn.primario} onClick={enviar} disabled={!texto.trim()}>Adicionar</button></>}>
      <div className="space-y-4">
        <Campo rotulo="CPFs ou e-mails" dica="Um por linha, ou separados por vírgula. Só entram profissionais já cadastrados.">
          <textarea className={`${campoClasse} min-h-[140px] font-mono text-[13px]`} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={'123.456.789-09\nfulano@assistenciasocial.gov.br'} />
        </Campo>
        <label className={`${btn.secundario} cursor-pointer w-fit`}>
          <Icone nome="upload_file" /> Importar arquivo CSV
          <input type="file" accept=".csv,.txt" className="hidden" onChange={lerArquivo} />
        </label>
        {resultado && (
          <div className="rounded-lg bg-surface-container-low p-4 text-body-md space-y-1">
            <p><b>{resultado.adicionados}</b> adicionado(s) · <b>{resultado.repetidos}</b> já estavam na lista</p>
            {resultado.nao_encontrados.length > 0 && <p className="text-error">Não encontrados: {resultado.nao_encontrados.join(', ')}</p>}
          </div>
        )}
      </div>
    </Modal>
  );
}
