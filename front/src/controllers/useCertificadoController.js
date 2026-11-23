// Controller da página pública do certificado (impressão / PDF).
// Funciona sem login: os dados e o modelo (textos) vêm da consulta pública do Moodle.
import { useParams } from 'react-router-dom';
import { buscarCertificado } from '../models/certificadoModel.js';
import { useDados } from './base/useDados.js';

export function useCertificadoController() {
  const { codigo } = useParams();
  const { dados: certificado, carregando } = useDados(() => buscarCertificado(codigo), [codigo]);
  return { codigo, certificado, carregando, imprimir: () => window.print() };
}
