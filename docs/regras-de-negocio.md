# Regras de negócio

Regras do domínio do NUMEP definidas na modelagem e que **não aparecem no diagrama ER** ([`modelo-er.md`](modelo-er.md)). Cada uma é garantida no back-end (plugin do Moodle) e, quando faz sentido, avisada antes no front-end.

---

## Capacitações e eventos

### 1. Uma frequência por pessoa por evento

Um profissional não pode ter dois registros de presença no mesmo evento — isso geraria certificados duplicados.

**Onde:** índice único `uq_evento_acesso` (`evento_id`, `userid`) em `local_numep_frequencia`. Convocação e "Adicionar participantes" ignoram quem já está na lista.

### 2. Facilitador interno **ou** externo

O facilitador de um evento é **ou** um profissional cadastrado (`facilitador_userid`) **ou** um nome externo (`facilitador_nome_externo`) — exatamente um dos dois. Assim o certificado do facilitador tem uma única fonte para o nome.

**Onde:** `regras::validar_facilitador()` (o XMLDB do Moodle não tem `CHECK`) e o formulário de evento.

### 3. Certificado com dados congelados (snapshot)

Os certificados guardam uma **cópia** dos dados do evento no momento da emissão (título, carga horária, data e nome do facilitador). Um certificado é um documento comprobatório: editar o evento depois **não pode** alterá-lo.

**Onde:** campos `*_snapshot` em `local_numep_certificado` e `local_numep_certificado_facilitador`.

### 4. Emissão automática de certificados

| Certificado | Gatilho |
| --- | --- |
| Participante | Confirmação da presença |
| Facilitador | Encerramento do evento |

Cada certificado recebe um código público de verificação no formato `NUMEP-XXXX-XXXX` (sem caracteres ambíguos como 0/O e 1/I), único entre os dois tipos.

**Onde:** `frequencia::confirmar_presenca()`, `evento::encerrar()` e `regras::gerar_codigo_verificacao()`.

### 5. Auditoria da presença

Cada confirmação registra **quem** confirmou e **quando** (`confirmado_por_userid`, `confirmado_em`). Em caso de contestação ("o certificado não saiu", "a presença está errada"), é possível rastrear a ação.

### 6. Destinatários do evento

`publico_alvo` (`rede_geral`, `setor` ou `unidade`) é um **rótulo informativo**, útil em filtros e relatórios. Os destinatários reais são escolhidos **à mão** em `local_numep_evento_unidade`, porque nem todo evento de um setor interessa a todas as suas unidades. Uma unidade criada depois não entra retroativamente em eventos já existentes.

### 6.1 Bloqueio de edição após certificado

Quando o evento já tem ao menos um certificado emitido, **data, carga horária e capacitação** não podem mais ser alteradas, para o evento não divergir dos certificados que gerou. Evento encerrado não é editado nem excluído.

**Onde:** `regras::validar_edicao_evento()`.

---

## Avaliação

### 9. Avaliação do participante

O participante avalia a própria participação com **nota de 1 a 5** (estrelas inteiras) e comentário opcional. Só quem teve presença confirmada avalia, e **uma vez por participação**.

**Onde:** `regras::validar_nota()`, índice único em `local_numep_avaliacao_evento.frequencia_id` e a ação `avaliar_minha`, que só aceita a participação do próprio usuário.

> **Decisão registrada:** nesta versão a avaliação **não é anônima** (validado com a orientação do projeto). O anonimato está nos próximos passos.

### 9.1 Nota média por unidade

Calculada por consulta (`avaliação → frequência → pessoa → unidade`, agregando a média), sem campo extra no banco. Aparece em Relatórios.

### 10. Feedback do facilitador

O banco já prevê a opinião do facilitador sobre a turma e o evento (texto livre, não anônimo; quando o facilitador é externo, o campo de usuário fica vazio). A tela para registrá-la está nos próximos passos.

---

## Pessoas e acesso

### 7. Formação

`formacao` é o **nível de escolaridade** (`tecnico_medio` ou `tecnico_superior`). A área de atuação (Assistente Social, Psicólogo etc.) é outra coisa: o **cargo**, mantido pelo Master.

### 8. Perfil de acesso

Quatro perfis fixos — **Master, Diretor, Coordenador e Técnico** — implementados como papéis do Moodle, com as permissões descritas em [`numep/README.md`](../numep/README.md#5-permissões-por-perfil). Além da permissão, vale o **escopo**: o Diretor atua sobre o seu setor (diretoria), o Coordenador sobre a sua unidade e o Técnico sobre os próprios dados.

Ninguém altera o próprio perfil, a própria lotação ou a própria situação (ativo/inativo).
