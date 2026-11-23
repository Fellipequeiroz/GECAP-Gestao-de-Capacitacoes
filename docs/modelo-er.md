# Modelo entidade-relacionamento

Modelo conceitual do GECAP, com o módulo de pessoas e hierarquia e o módulo de capacitações e eventos. A implementação no Moodle (nomes das tabelas e adaptações) está em [`numep/README.md`](../numep/README.md#4-do-modelo-er-para-o-moodle).

> O GitHub desenha o diagrama abaixo automaticamente (Mermaid).

```mermaid
erDiagram

  PESSOA {
    int id PK
    string nome
    string cpf
    date data_nascimento
    string telefone
    enum formacao
    datetime criado_em
  }

  CARGO_TAG {
    int id PK
    string nome
    string descricao
    datetime criado_em
  }

  SETOR {
    int id PK
    string nome
    string descricao
    datetime criado_em
  }

  UNIDADE {
    int id PK
    int setor_id FK
    string nome
    string endereco
    datetime criado_em
  }

  ACESSO {
    int id PK
    int pessoa_id FK
    int unidade_id FK
    int cargo_tag_id FK
    string email
    string senha_hash
    enum perfil
    boolean ativo
    datetime criado_em
  }

  CAPACITACAO {
    int id PK
    string titulo
    string descricao
    datetime criado_em
  }

  EVENTO {
    int id PK
    int capacitacao_id FK
    string local
    date data
    int carga_horaria
    enum modalidade
    enum publico_alvo
    int facilitador_acesso_id FK
    string facilitador_nome_externo
    boolean encerrado
    datetime criado_em
  }

  EVENTO_UNIDADE {
    int id PK
    int evento_id FK
    int unidade_id FK
  }

  FREQUENCIA {
    int id PK
    int evento_id FK
    int acesso_id FK
    boolean presente
    int confirmado_por_acesso_id FK
    datetime confirmado_em
  }

  CERTIFICADO {
    int id PK
    int frequencia_id FK
    string titulo_evento_snapshot
    int carga_horaria_snapshot
    date data_evento_snapshot
    string codigo_verificacao
    datetime emitido_em
  }

  CERTIFICADO_FACILITADOR {
    int id PK
    int evento_id FK
    string nome_facilitador_snapshot
    string titulo_evento_snapshot
    string codigo_verificacao
    datetime emitido_em
  }

  AVALIACAO_EVENTO {
    int id PK
    int frequencia_id FK
    int nota
    string comentario
    datetime criado_em
  }

  FEEDBACK_FACILITADOR {
    int id PK
    int evento_id FK
    int facilitador_acesso_id FK
    string comentario
    datetime criado_em
  }

  SETOR ||--o{ UNIDADE : "contém"
  UNIDADE ||--o{ ACESSO : "lotado em"
  PESSOA ||--|| ACESSO : "tem acesso"
  CARGO_TAG ||--o{ ACESSO : "tem cargo"

  CAPACITACAO ||--o{ EVENTO : "origina"
  EVENTO ||--o{ EVENTO_UNIDADE : "destinado a"
  UNIDADE ||--o{ EVENTO_UNIDADE : "recebe"
  EVENTO ||--o{ FREQUENCIA : "registra"
  ACESSO ||--o{ FREQUENCIA : "participa"
  ACESSO ||--o{ FREQUENCIA : "confirma"
  ACESSO ||--o{ EVENTO : "facilita"
  FREQUENCIA ||--o| CERTIFICADO : "gera"
  EVENTO ||--o| CERTIFICADO_FACILITADOR : "gera"
  FREQUENCIA ||--o| AVALIACAO_EVENTO : "recebe"
  EVENTO ||--o{ FEEDBACK_FACILITADOR : "recebe"
  ACESSO ||--o{ FEEDBACK_FACILITADOR : "registra"
```

---

## Resumo das entidades

| Entidade | Papel |
|---|---|
| `PESSOA` | Dados pessoais (CPF, nome, nascimento, formação) — independente de acesso ao sistema |
| `ACESSO` | Credenciais e permissão (email, senha, perfil hierárquico) — vinculada 1:1 a `PESSOA` |
| `CARGO_TAG` | Tag de profissão/cargo, gerenciada pelo Master |
| `SETOR` / `UNIDADE` | Estrutura organizacional da rede |
| `CAPACITACAO` | Tema/assunto de uma formação |
| `EVENTO` | Ocorrência específica de uma capacitação (data, local, facilitador) |
| `EVENTO_UNIDADE` | Tabela associativa — define quais unidades recebem o evento (seleção manual) |
| `FREQUENCIA` | Registro de presença de um `ACESSO` em um `EVENTO` |
| `CERTIFICADO` | Certificado do participante, gerado a partir da frequência confirmada |
| `CERTIFICADO_FACILITADOR` | Certificado do facilitador, gerado no encerramento do evento |
| `AVALIACAO_EVENTO` | Avaliação do evento pelo participante, vinculada à frequência |
| `FEEDBACK_FACILITADOR` | Feedback do facilitador sobre o evento, não anônimo |

## Relacionamentos com múltiplos papéis (`ACESSO`)

A entidade `ACESSO` participa do módulo de capacitação em três papéis distintos, cada um com sua própria FK:

- **Participante** — `FREQUENCIA.acesso_id`
- **Quem confirma presença** — `FREQUENCIA.confirmado_por_acesso_id`
- **Facilitador interno** — `EVENTO.facilitador_acesso_id`

São três relacionamentos independentes com a mesma tabela de destino — não é redundância de modelagem.

---

*As regras que não aparecem no diagrama (unicidade, facilitador interno ou externo, snapshot do certificado etc.) estão em [`regras-de-negocio.md`](regras-de-negocio.md).*
