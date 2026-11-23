# Segurança

O objetivo é um **mínimo de segurança de baixo custo**, cobrindo os pontos mais comuns do OWASP Top 10, sem ferramentas pagas ou trabalho pesado. Revisado em 25/10/2026.

A divisão de responsabilidades é simples: **quem garante a segurança é o back-end (Moodle + plugin)**. O front-end ajuda o usuário e reduz erros, mas qualquer coisa feita no navegador pode ser burlada. Por isso toda regra e toda permissão são conferidas de novo no Moodle.

---

## 1. O que já está feito

### Back-end (Moodle + plugin `local_numep`)

| Medida | Como | Conferido |
| --- | --- | --- |
| Senhas guardadas com hash | Moodle: SHA-512 crypt (`$6$`), salt aleatório por usuário e 10.000 rodadas. O plugin nunca toca na senha: usa `user_create_user()` e `update_internal_user_password()` | No MySQL, todas as senhas começam com `$6$rounds=10000$`; nenhuma em texto puro |
| Política de senha | `passwordpolicy` ligada: mínimo de 8 caracteres, com maiúscula, minúscula, número e símbolo. A troca de senha do front passa por `check_password_policy()` | `cfg.php` |
| **Bloqueio após senhas erradas** | 5 senhas erradas em 30 minutos bloqueiam a conta por 30 minutos (`lockoutthreshold`, `lockoutwindow`, `lockoutduration`), ligado por `cli/configurar_api.php`. Vale para o site e para o login do front (`login/token.php` usa a mesma `authenticate_user_login()`) | 6ª tentativa recusada mesmo com a senha certa |
| Proteção contra SQL injection | O plugin só usa o `$DB` do Moodle, com parâmetros (`?` e `:nome`). As únicas partes concatenadas são o nome fixo da tabela e as listas `IN (...)` geradas por `get_in_or_equal()`, que também são parâmetros | Auditadas as 30 consultas do plugin |
| Validação da entrada | Parâmetros tipados nas funções da API (`PARAM_INT`, `PARAM_ALPHANUMEXT`...), CPF com dígito verificador, campos com valores fixos ("ENUM"), tamanho máximo, horários no formato HH:MM | |
| Autorização em toda ação | Cada função da API chama `require_capability`; a função `executar` tem uma tabela com a permissão de cada ação | Técnico chamando a API direto recebe "Você não tem permissão" |
| **Recorte dos dados por perfil** | Feito no servidor (`classes/model/dados.php`): Master recebe tudo; Diretor, as unidades do seu setor; Coordenador, a própria unidade; Técnico, só os próprios dados. CPF, e-mail e telefone de outras pessoas não chegam ao navegador | |
| Travas de escopo nas ações | Coordenador e Diretor só confirmam presença, registram nota e mexem em participantes da sua unidade/diretoria | Tentativa fora do escopo recusada |
| Ninguém se promove | O usuário não altera o próprio perfil de acesso, unidade ou situação | |
| **Sair revoga a chave de acesso** | O botão Sair apaga no Moodle o token usado na sessão (ação `sair`), não só no navegador. Um token copiado deixa de funcionar na hora | Token apagado da tabela `mdl_external_tokens` e recusado depois |
| Tokens com validade | Os tokens gerados pelo login têm data de validade no Moodle | |
| Integridade dos dados | Índices únicos (CPF, frequência, certificado, avaliação), regras em `classes/model/regras.php` e transações (se uma regra falha no meio, nada é gravado) | `cli/verificar_instalacao.php` |
| Auditoria | `confirmado_por_userid` e `confirmado_em` na frequência, registro de atividades (`local_numep_atividade`) e o log padrão do Moodle | |
| Verificação pública de certificado | Sem login, mas devolve só o necessário; código `NUMEP-XXXX-XXXX` com cerca de 1 trilhão de combinações | |
| **LGPD: registro de dados pessoais** | `classes/privacy/provider.php` declara cada dado pessoal guardado e por quê | |
| **LGPD: direitos do titular** | O provider permite ao Moodle **exportar** e **apagar** os dados de uma pessoa (ferramenta "Solicitações de dados"). Ao apagar, os eventos facilitados pela pessoa continuam, com o nome trocado por "Facilitador removido" | |

### Front-end (React)

| Medida | Como |
| --- | --- |
| Proteção contra XSS | O React escapa todo texto exibido; o código não usa `dangerouslySetInnerHTML`, `innerHTML` nem `eval` |
| Content Security Policy (CSP) | Na versão final (`npm run build`), o navegador só aceita scripts, estilos, fontes e imagens do próprio site (`front/vite.config.js`). Por isso as fontes do certificado são instaladas no projeto, e não buscadas no Google Fonts |
| Sem CSRF | A API usa o token no corpo do pedido, não cookie; outro site não consegue agir em nome do usuário |
| Token só na aba | Guardado em `sessionStorage`: some ao fechar a aba e não fica no disco como o `localStorage` |
| Telas por perfil | Menu, rotas e botões seguem a permissão do perfil (o servidor confere de novo) |
| Limite de tamanho dos campos | Igual às colunas do banco (ex.: nome até 200, e-mail até 100) |
| CSV sem fórmulas maliciosas | Textos que começam com `=`, `+`, `-` ou `@` ganham um `'` na exportação, para o Excel não executar como fórmula ("CSV injection") |
| CPF fora das telas | O Perfil não mostra o CPF; a página pública do certificado não o mostra nem recebe o número completo |
| Exportar os próprios dados | Botão em "Meu perfil" (LGPD) |
| Dependências sem falhas conhecidas | Rodar `npm audit` antes de cada entrega |

> **Observação:** em 21/10/2026 o `npm audit` apontava 9 falhas (3 moderadas e 6 altas) nas ferramentas de build do Vite 5 e do Tailwind CSS 3 (`esbuild`, `braces`, `micromatch`). Elas só rodavam no computador do desenvolvedor e não chegavam ao navegador do usuário. Mesmo assim, as ferramentas foram atualizadas e o visual de todas as telas foi conferido antes e depois.

> **Atenção:** os usuários de demonstração (senha `Numep@2026`) e as senhas do `.devcontainer` (`moodle`/`root`/`Admin@2026`) servem **só para teste**. Nunca use os dados de exemplo nem essas senhas em produção.

---

## 2. HTTPS em produção

Em `localhost` o tráfego não sai do computador. Em produção, **sem HTTPS a senha do login e o token de acesso viajam abertos pela rede** e podem ser copiados por qualquer um no caminho (Wi-Fi público, rede da prefeitura). Por isso HTTPS é obrigatório antes de qualquer uso real.

### Passo a passo (exemplo com Apache ou Nginx em Linux)

1. **Domínio:** apontar um nome (ex.: `numep.patosdeminas.mg.gov.br`) para o servidor.
2. **Certificado gratuito (Let's Encrypt):**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d numep.patosdeminas.mg.gov.br
   ```
   (com Apache: `python3-certbot-apache` e `certbot --apache`). O certbot renova sozinho a cada 90 dias.
3. **Redirecionar HTTP para HTTPS** no servidor web (o certbot oferece fazer isso). No Nginx:
   ```nginx
   server {
       listen 80;
       server_name numep.patosdeminas.mg.gov.br;
       return 301 https://$host$request_uri;
   }
   ```
4. **HSTS** (o navegador passa a usar sempre HTTPS), no bloco `server` da porta 443:
   ```nginx
   add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
   ```
5. **Moodle** (`config.php`):
   ```php
   $CFG->wwwroot = 'https://numep.patosdeminas.mg.gov.br';
   // Só se o HTTPS terminar num proxy/balanceador na frente do Moodle:
   // $CFG->sslproxy = true;
   ```
   Em Administração do site, ligar **Cookies só por HTTPS** (`cookiesecure`).
6. **Front React no mesmo domínio:** publicar o `dist/` em `https://numep.../app/` e gerar o build com
   ```bash
   VITE_MOODLE_URL=https://numep.patosdeminas.mg.gov.br npm run build
   ```
   Assim o front e a API ficam no mesmo endereço (a CSP `connect-src 'self'` continua valendo e não há problema de CORS). Se o front ficar em outro domínio, acrescentar o endereço do Moodle em `connect-src` no `vite.config.js`.
7. **Conferir:** abrir `http://...` e ver se vai sozinho para `https://`; testar em [SSL Labs](https://www.ssllabs.com/ssltest/) (nota A ou A+).

No **GitHub Codespaces** as portas encaminhadas já usam HTTPS (`https://...app.github.dev`), e o front fala com o Moodle por dentro do container.

---

## 3. O que configurar no Moodle ao publicar (checklist)

Tudo isso é configuração, sem programação. Para achar cada item, digite o nome entre parênteses na busca de **Administração do site**.

- [ ] **HTTPS:** ver a seção 2.
- [ ] **Cookies só por HTTPS** (`cookiesecure`): ligado.
- [x] **Política de senha** (`passwordpolicy`): ligada, com tamanho mínimo de 8 (`minpasswordlength`).
- [ ] **Não reutilizar senhas** (`passwordreuselimit`): 3.
- [x] **Bloqueio após tentativas erradas de login** (`lockoutthreshold`): 5 tentativas (feito por `cli/configurar_api.php`).
- [x] **Forçar login** (`forcelogin`): ligado.
- [ ] **Autocadastro** (`registerauth`): desativado. Quem cadastra é o Master.
- [ ] **Permitir o site dentro de frames** (`allowframembedding`): desligado (evita clickjacking).
- [ ] **Verificação em duas etapas:** ativar a ferramenta "Autenticação multifator" (`tool_mfa`) com o fator e-mail, pelo menos para o perfil Master. A opção "Verificação em duas etapas" das Configurações do front hoje só guarda a preferência.
- [x] **Web services:** só o protocolo REST e o serviço `numep_app` com só as funções do NUMEP (feito por `cli/configurar_api.php`).
- [ ] **CORS:** o REST do Moodle responde para qualquer site (`Access-Control-Allow-Origin: *`). Servir o React no **mesmo domínio** do Moodle (seção 2) ou restringir no servidor web.
- [ ] **Banco:** usuário MySQL só para o banco do Moodle (nunca o `root`), MySQL ouvindo só em `127.0.0.1` e senha forte no `root`, como no ambiente de desenvolvimento.
- [ ] **Não gravar dados de exemplo** e desligar o botão de restauração: `php public/local/numep/cli/dados_exemplo.php --desligar`.
- [ ] **`config.php` fora do Git**: ele tem a senha do banco.
- [ ] **Backup:** ligar o backup automático e copiar o banco periodicamente para outro lugar.
- [ ] **Atualizações:** aplicar as versões de correção da 5.3 (5.3.1, 5.3.2...) quando saírem.

---

## 4. Trabalho futuro (fora do mínimo)

- Limite de requisições por IP (rate limiting) no servidor web, inclusive na verificação pública de certificados.
- Anonimato das avaliações (já previsto no `regras_negocio_numep.md`).
- Rodar `npm audit` de tempos em tempos (por exemplo, antes de cada entrega) e atualizar o que ele apontar.
- Alerta para o Master sobre contas bloqueadas por tentativas erradas e acessos negados.
- Validade mais curta para os tokens do serviço `numep_app` (hoje segue o padrão do Moodle).
