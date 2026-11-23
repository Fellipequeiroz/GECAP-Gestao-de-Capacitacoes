# Plugin `local_numep` — back-end do GECAP no Moodle

Plugin local para **Moodle 5.3** que implementa o back-end do GECAP: cria as tabelas do NUMEP, os quatro perfis de acesso (papéis do Moodle), as regras de negócio e a API REST usada pelo front-end React. Ele **não altera nenhuma tabela nem arquivo do Moodle**.

**Requisitos:** Moodle 5.3, PHP 8.3+ e MySQL 8.4+ (ou MariaDB 11.4+, ou PostgreSQL).

---

## 1. Instalação

1. Copie esta pasta para `public/local/numep` do Moodle (o arquivo final fica em `public/local/numep/version.php`).
2. Rode a atualização: entre no Moodle como administrador e confirme "Plugins a atualizar", ou, no terminal, na pasta do Moodle:
   ```bash
   php admin/cli/upgrade.php
   ```
3. Confira a instalação (grava dados de teste numa transação e desfaz tudo no final; rode com o banco do NUMEP vazio):
   ```bash
   php public/local/numep/cli/verificar_instalacao.php    # 38 OK, 0 falhas
   ```
4. Ligue a API REST para o front-end (serviços web, protocolo REST, serviço `numep_app`, permissões dos papéis e bloqueio de conta após senhas erradas):
   ```bash
   php public/local/numep/cli/configurar_api.php
   ```
5. *(Só para demonstração)* Grave os dados de exemplo — **apaga** os dados atuais do NUMEP:
   ```bash
   php public/local/numep/cli/dados_exemplo.php --confirmar
   ```
   Cria 28 profissionais fictícios (login = e-mail, senha `Numep@2026`). Para desligar o botão "Restaurar dados de exemplo" do front: `--desligar`.

---

## 2. Arquivos

| Arquivo | Para que serve |
| --- | --- |
| `version.php` | Nome e versão do plugin |
| `db/install.xml` | As 13 tabelas (12 do modelo ER + registro de atividades), em XMLDB |
| `db/install.php` | Cria os papéis `numep_master`, `numep_diretor`, `numep_coordenador`, `numep_tecnico` e distribui as permissões |
| `db/access.php` | As 5 permissões (capabilities) do NUMEP |
| `db/upgrade.php` | Mudanças no banco entre versões |
| `db/services.php` | Funções da API e o serviço `numep_app` |
| **Model** — `classes/model/regras.php` | Regras que o banco não garante sozinho: valores permitidos, facilitador XOR, bloqueio de edição, CPF, código do certificado |
| **Model** — `classes/model/evento.php` | Criar (convoca os profissionais), editar, encerrar (certificado do facilitador), excluir |
| **Model** — `classes/model/frequencia.php` | Presença (emite o certificado e registra quem confirmou), participantes, avaliação |
| **Model** — `classes/model/pessoa.php` | Profissionais (usuário do Moodle + `local_numep_pessoa` + papel) e travas de escopo |
| **Model** — `classes/model/dados.php` | Os dados das telas numa resposta só, **recortados pelo perfil** |
| **Model** — `capacitacao`, `estrutura`, `certificado`, `configuracao`, `atividade` | Capacitações, unidades e cargos, verificação pública, configurações e preferências, registro de atividades |
| **Controller (API)** — `classes/external/*.php` | Funções chamadas pelo front: conferem login, permissão e parâmetros e chamam os models |
| **Controller (página)** — `verificar.php` + `templates/verificar_certificado.mustache` | Página pública do Moodle para conferir um certificado |
| `classes/privacy/provider.php` | LGPD: declara os dados pessoais e permite exportá-los e apagá-los a pedido do titular |
| `classes/local/dados_exemplo.php` | Dados fictícios de demonstração |
| `cli/*.php` | Verificação da instalação, configuração da API e dados de exemplo |
| `lang/en`, `lang/pt_br` | Textos do plugin |

```
pedido (React ou navegador)
   │
   ▼
Controller  classes/external/*.php  ou  verificar.php
   │  confere login, permissão e parâmetros
   ▼
Model       classes/model/*.php
   │  aplica as regras e o escopo do perfil; lê/grava no banco ($DB, em transações)
   ▼
View        JSON da API (React)  ou  templates/*.mustache (página)
```

---

## 3. API

| Função | Tipo | Permissão | O que faz |
| --- | --- | --- | --- |
| `local_numep_carregar_dados` | leitura | `participar` | Todos os dados das telas, no escopo do perfil: Master tudo, Diretor o seu setor, Coordenador a sua unidade, Técnico só os próprios dados |
| `local_numep_executar` | gravação | por ação | Todas as gravações. A tabela `ACOES` em `classes/external/executar.php` define a permissão exigida por ação (ex.: `salvar_evento` → `gerenciarevento`) |
| `local_numep_verificar_certificado` | leitura pública | — | Confere um certificado pelo código, sem login |
| `local_numep_listar_eventos`, `confirmar_presenca`, `encerrar_evento` | — | por função | Funções específicas, também usadas pelos testes |

---

## 4. Do modelo ER para o Moodle

As tabelas recebem o prefixo `mdl_` no banco (`local_numep_evento` → `mdl_local_numep_evento`). O modelo conceitual está em [`docs/modelo-er.md`](../docs/modelo-er.md).

| Modelo ER | No Moodle | Observação |
| --- | --- | --- |
| `ACESSO` (e-mail, senha, ativo) | `mdl_user` | Login e senha são do Moodle; `ativo` = campo `suspended` |
| `ACESSO.perfil` | Papéis `numep_*` | O perfil vira um papel com permissões, no nível do site |
| `PESSOA` + lotação e cargo | `local_numep_pessoa` | Ligada 1:1 a `mdl_user` por `userid` |
| `SETOR`, `UNIDADE`, `CARGO_TAG` | `local_numep_setor`, `_unidade`, `_cargo_tag` | Iguais ao modelo |
| `CAPACITACAO`, `EVENTO`, `EVENTO_UNIDADE` | `local_numep_capacitacao`, `_evento`, `_evento_unidade` | `facilitador_acesso_id` → `facilitador_userid` |
| `FREQUENCIA` | `local_numep_frequencia` | `acesso_id` → `userid`; auditoria em `confirmado_por_userid` |
| `CERTIFICADO`, `CERTIFICADO_FACILITADOR` | `local_numep_certificado`, `_certificado_facilitador` | Com os campos de snapshot |
| `AVALIACAO_EVENTO`, `FEEDBACK_FACILITADOR` | `local_numep_avaliacao_evento`, `_feedback_facilitador` | Iguais ao modelo |
| — | `local_numep_atividade` | Registro de atividades exibido nas telas |

**Adaptações exigidas pelo Moodle:**

- **Datas são inteiros** (timestamp Unix); `criado_em` virou `timecreated`, com `timemodified` ao lado.
- **Sem ENUM nem CHECK** (o XMLDB funciona em vários bancos): os valores permitidos e o facilitador XOR são validados em `regras.php`.
- **Chaves estrangeiras viram índices**, não constraints; a integridade fica no código, como em todo plugin do Moodle.
- **A unicidade continua no banco:** uma frequência por pessoa e evento, uma unidade por evento, CPF, código de verificação, uma avaliação e um certificado por frequência, um certificado de facilitador por evento.
- **Senhas:** SHA-512 crypt com salt e 10.000 rodadas, do próprio Moodle.

| Regra de negócio | Onde é garantida |
| --- | --- |
| 1. Unicidade de frequência | Índice único `uq_evento_acesso` |
| 2. Facilitador XOR | `regras::validar_facilitador()` |
| 3. Snapshot no certificado | Campos `*_snapshot` |
| 4. Certificado automático | `frequencia::confirmar_presenca()` e `evento::encerrar()` |
| 5. Auditoria | `confirmado_por_userid` + `confirmado_em` |
| 6. Público-alvo | Rótulo em `publico_alvo`; destinatários em `local_numep_evento_unidade` |
| 6.1 Bloqueio após certificado | `regras::validar_edicao_evento()` |
| 7. Formação | `regras::validar_formacao()` |
| 8. Perfil | Papéis do Moodle (`db/install.php`) |
| 9. Avaliação de 1 a 5, uma por frequência | `regras::validar_nota()` + índice único |
| 9.1 Média por unidade | Consulta agregada |

---

## 5. Permissões por perfil

| Permissão | Master | Diretor | Coordenador | Técnico |
| --- | :---: | :---: | :---: | :---: |
| `gerenciarestrutura` (setores, unidades, cargos, usuários, configurações) | ✔ | | | |
| `gerenciarevento` (capacitações e eventos) | ✔ | ✔ | | |
| `confirmarpresenca` | ✔ | ✔ | ✔ | |
| `verrelatorios` | ✔ | ✔ | ✔ | |
| `participar` (ver eventos, avaliar, certificados) | ✔ | ✔ | ✔ | ✔ |

Além da permissão, o plugin aplica o **escopo**: o Coordenador só age sobre pessoas da sua unidade e o Diretor sobre as do seu setor (`pessoa::exigir_mesma_unidade()`).

---

## 6. Evolução do banco

O `install.xml` só roda na primeira instalação. Para mudar uma tabela depois:

1. Abra *Administração do site → Desenvolvimento → Editor XMLDB* e carregue `local/numep/db`.
2. Faça a mudança e salve (o `install.xml` é atualizado).
3. Copie o código PHP gerado ("Ver código PHP") para `db/upgrade.php`.
4. Aumente `$plugin->version` em `version.php` e rode `php admin/cli/upgrade.php`.
