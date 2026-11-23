# Front-end (React)

Aplicação web do GECAP: telas dos quatro perfis (Master, Diretor, Coordenador e Técnico), feitas a partir dos protótipos do Google Stitch ([`docs/prototipos`](prototipos)) e adaptadas ao domínio do NUMEP. Cadastros, filtros, buscas, paginação, gráficos, presença, certificados e exportações trabalham sobre os dados reais do Moodle.

**Stack:** React 18 · React Router 7 · Vite 8 · Tailwind CSS 4 · Recharts 3 · fontes e ícones instalados via npm (sem CDN, por causa da CSP).

Para rodar, veja [Como executar](../README.md#como-executar) no README principal. Requer **Node.js 20.19+** (ou 22.12+).

```bash
cd front
npm install
npm run dev     # http://localhost:5173
npm run build   # versão de produção em dist/
```

---

## Integração com o Moodle

Os dados ficam no banco do Moodle, nas tabelas do plugin `local_numep`. O front conversa com ele pela **API REST de serviços web** (serviço `numep_app`):

| Ação | Função do Moodle | Arquivo do front |
| --- | --- | --- |
| Login (usuário e senha → token) | `login/token.php` | `models/base/moodleApi.js` |
| Carregar os dados das telas (no escopo do perfil) | `local_numep_carregar_dados` | `models/base/banco.js` |
| Gravar (criar, editar, excluir, presença, encerrar...) | `local_numep_executar` | `models/base/repositorio.js` → cada model |
| Sair (revoga o token no servidor) | `local_numep_executar` (ação `sair`) | `models/base/moodleApi.js` |
| Conferir certificado (página pública, sem login) | `local_numep_verificar_certificado` | `models/certificadoModel.js` |

- Depois de cada gravação o front recarrega os dados, e as telas abertas se atualizam sozinhas.
- O Moodle confere a permissão de cada ação (`require_capability`), o escopo do usuário e as regras de negócio. As checagens do front servem para avisar antes de enviar.
- Em desenvolvimento, o Vite repassa `/moodle/...` para `http://localhost:8080` (`vite.config.js`), sem problema de CORS. Em produção, defina `VITE_MOODLE_URL` com o endereço do Moodle.
- O token fica no `sessionStorage` (some ao fechar a aba).

---

## Arquitetura MVC

- **Model** (`models/`): dados e regras de negócio. Só ele fala com a API.
- **Controller** (`controllers/`): hooks do React com o estado de cada tela (filtros, página, formulário aberto...) e as chamadas aos models.
- **View** (`views/`): JSX. Sem regra de negócio; mostra o que o controller entrega e avisa quando o usuário age.

```
front/src/
├── main.jsx, App.jsx            início do app e rotas (cada rota protegida por perfil)
├── models/                      MODEL
│   ├── base/moodleApi.js        chamadas HTTP ao Moodle (token, REST, função pública)
│   ├── base/banco.js            cópia em memória dos dados do Moodle + conversão de datas
│   ├── base/repositorio.js      ações no Moodle, usuário logado, registros completos
│   ├── sessaoModel.js           login, retomar sessão, sair, permissões do usuário
│   ├── regras.js                regras de negócio, permissões e telas de cada perfil
│   ├── capacitacaoModel.js, eventoModel.js, frequenciaModel.js, certificadoModel.js
│   ├── profissionalModel.js, estruturaModel.js, configModel.js, participanteModel.js
│   └── relatorioModel.js        indicadores e dados dos gráficos
├── controllers/                 CONTROLLER
│   ├── base/useDados.js         carrega dados e atualiza quando algo muda
│   ├── base/exportar.js         exportar CSV/JSON (com proteção contra fórmulas no Excel)
│   ├── use<Tela>Controller.js   um por tela
│   ├── formularios/             um por formulário
│   └── usePermissoes.js, AvisoController.jsx, TemaController.jsx
└── views/                       VIEW
    ├── layouts/                 menu lateral retrátil, cabeçalho, rotas protegidas
    ├── pages/admin/             telas internas
    ├── pages/Certificado.jsx    certificado para imprimir / salvar em PDF
    ├── components/              UI, gráficos (Recharts), formulários, certificado, logo
    ├── helpers/formatar.js      datas e números
    └── styles/                  CSS e tokens de cor (tema claro e escuro)
```

---

## Telas

| Tela | Arquivo | Rota | O que faz |
| --- | --- | --- | --- |
| Login | `views/pages/Login.jsx` | `/login` | Entra com o usuário do Moodle; cada perfil vai para a sua tela inicial |
| Dashboard | `views/pages/admin/Dashboard.jsx` | `/admin` | Indicadores, gráfico de presenças (6 meses ou 12 semanas), atalhos, pendências, atividade recente, próximos eventos |
| Capacitações | `views/pages/admin/Capacitacoes.jsx` | `/admin/capacitacoes` | Capacitações e eventos: criar, editar, excluir, buscar, filtrar, paginar, exportar CSV |
| Evento | `views/pages/admin/EventoDetalhe.jsx` | `/admin/eventos/:id` | Convocados, confirmar presença (individual ou em lote) emitindo o certificado, adicionar participantes, avaliações, encerrar, exportar lista |
| Minhas capacitações | `views/pages/admin/MinhasCapacitacoes.jsx` | `/admin/minhas-capacitacoes` | Visão do participante: próximas, concluídas, meta, gráfico "Minha evolução", certificado e modal de avaliação |
| Certificados | `views/pages/admin/Certificados.jsx` | `/admin/certificados` | Lista, busca, verificação pelo código, exportar CSV e **editar o modelo do certificado** (prévia ao vivo) |
| Certificado | `views/pages/Certificado.jsx` | `/certificado/:codigo` | Página pública: certificado do participante ou do facilitador, carga horária por extenso, pronto para imprimir em A4 |
| Relatórios | `views/pages/admin/Relatorios.jsx` | `/admin/relatorios` | Filtros de período e setor, variação contra o período anterior, 5 gráficos, tabela ordenável, CSV e PDF |
| Equipes | `views/pages/admin/Equipes.jsx` | `/admin/equipes` | Profissionais (cadastrar, editar, ativar/desativar, filtros), unidades, cargos e gráficos |
| Unidades/Órgãos | `views/pages/admin/GestaoUnidades.jsx` | `/admin/unidades` | Cada unidade com setor, endereço e equipe, coordenador em destaque |
| Configurações | `views/pages/admin/Configuracoes.jsx` | `/admin/configuracoes` | Aparência, segurança (senha, registro de atividades), notificações; dados do órgão para o Master |
| Perfil | `views/pages/admin/Perfil.jsx` | `/admin/perfil` | Dados da conta, números da atuação, certificados, atividade, exportar os próprios dados (LGPD) |

---

## Perfis

Quem vê cada tela está em `models/regras.js` (`TELAS`). O menu mostra só as telas do perfil, e `views/layouts/Permitido.jsx` redireciona quem tenta abrir um endereço que não é seu. O **recorte dos dados é feito no Moodle** (`numep/classes/model/dados.php`).

| Tela | Master | Diretor | Coordenador | Técnico |
| --- | --- | --- | --- | --- |
| Dashboard e Relatórios | ✔ | ✔ sua diretoria (setor) | ✔ sua unidade | |
| Capacitações | ✔ | ✔ | ✔ consulta | ✔ consulta |
| Criar/editar capacitação e evento | ✔ | ✔ | | |
| Evento (presença) | ✔ | ✔ sua diretoria | ✔ sua unidade | |
| Unidades/Órgãos e Equipes | ✔ edita | ✔ consulta | ✔ consulta | |
| Minhas capacitações, Perfil, Configurações | ✔ | ✔ | ✔ | ✔ |
| Certificados e dados do órgão | ✔ | | | |

- Idioma, notificações, horário de silêncio e verificação em duas etapas são **preferências de cada usuário** (`mdl_user_preferences`).
- Notas são sempre estrelas inteiras, de 1 a 5; as médias também são arredondadas.

---

## Regras de negócio na interface

As regras estão em [`regras-de-negocio.md`](regras-de-negocio.md) e são validadas de novo pelo plugin.

| Regra | Onde aparece |
| --- | --- |
| 1. Uma frequência por pessoa por evento | Convocação e "Adicionar participantes" ignoram quem já está na lista |
| 2. Facilitador interno **ou** externo | Formulário de evento |
| 3. Certificado com dados congelados | O certificado usa os dados do momento da emissão |
| 4. Certificado automático | Confirmar presença emite o do participante; encerrar o evento, o do facilitador |
| 5. Auditoria da presença | "Confirmado por" e data aparecem ao passar o mouse em "Presente" |
| 6. Unidades escolhidas à mão | Formulário de evento; o público-alvo é só um rótulo |
| 6.1 Bloqueio após certificado | Data, carga horária e capacitação ficam travadas |
| 7. Formação | Cadastro de profissional |
| 9. Nota de 1 a 5, uma por participação | Avaliação do participante |
| 9.1 Nota média por unidade | Gráfico em Relatórios |
