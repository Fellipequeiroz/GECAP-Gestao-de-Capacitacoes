// Controller: o que o usuário logado pode ver e fazer, para as telas mostrarem
// só os menus e botões do perfil dele.
import { useMemo } from 'react';
import { permissoesAtuais, telaInicial } from '../models/sessaoModel.js';

export function usePermissoes() {
  // O perfil não muda durante a sessão: calcula uma vez.
  return useMemo(() => ({ ...permissoesAtuais(), inicio: telaInicial() }), []);
}
