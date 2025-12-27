# Modelo de Dados - PixelLife

## Princípio Fundamental

**Todo dado no PixelLife é tratado como uma Atividade.**

Uma Atividade é qualquer ocorrência registrável na vida do usuário, com um tempo, um tipo e um significado contextual.

Isso permite que:

- hábitos
- entradas de diário
- livros lidos
- filmes vistos
- gastos
- eventos biográficos

sejam tratados de forma unificada, comparável e extensível.

## Entidade Central: Activity

### Estrutura Base

```typescript
Activity {
  id: string
  userId: string
  type: ActivityType
  subtype?: string
  timestamp: Date
  timePrecision: "exact" | "day" | "month" | "range"
  value?: number
  unit?: string
  text?: string
  tags?: string[]
  source: "manual" | "api" | "imported" | "derived"
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}
```

## Campos Explicados (com intenção)

### type: ActivityType

Define a categoria estrutural da atividade.

```typescript
type ActivityType =
  | "habit"
  | "journal"
  | "finance"
  | "media"
  | "biography"
  | "goal"
  | "health"
  | "social"
```

**Importante:** `type` define como a atividade pode ser agregada, não seu significado psicológico.

### subtype?: string

Especialização livre do tipo.

Exemplos:

- `habit` → `"workout"`
- `media` → `"book"`
- `media` → `"movie"`
- `finance` → `"expense"`
- `finance` → `"income"`

Isso evita explosão de tipos rígidos.

### timestamp: Date

Momento principal do evento.

### timePrecision

Permite lidar com memória imprecisa (central para biografia).

```typescript
"timePrecision": 
  | "exact"   // 2025-03-14 18:42
  | "day"     // 2025-03-14
  | "month"   // 2025-03
  | "range"   // 2017–2018
```

Esse campo é um diferencial forte do PixelLife em relação a trackers tradicionais.

### value e unit

Campos quantitativos opcionais.

Exemplos:

- treino → `value: 1, unit: "session"`
- gasto → `value: -42.5, unit: "BRL"`
- páginas lidas → `value: 30, unit: "pages"`

### text

Conteúdo livre.

Usado em:

- diário
- descrição de eventos
- notas de hábitos
- biografia

### tags

Classificação semântica leve.

Exemplos:

- `["saúde", "rotina", "ansiedade"]`
- `["trabalho", "social"]`
- `["prazer", "escape"]`

### source

Origem do dado.

```typescript
source:
  | "manual"
  | "api"
  | "imported"
  | "derived"
```

Exemplo:

- Goodreads → `source: "api"`
- Insight gerado → `source: "derived"`

### metadata

Campo crítico para extensibilidade.

Exemplos:

```json
{
  "goodreadsId": "123456",
  "letterboxdRating": 4.5,
  "mood": "low",
  "location": "home"
}
```

Nada aqui é obrigatório.

## Modelos Derivados (Views)

Essas entidades não são dados novos, mas projeções do modelo Activity.

### HabitSummary

```typescript
HabitSummary {
  habitId: string
  name: string
  totalCount: number
  firstOccurrence: Date
  lastOccurrence: Date
  frequency: {
    weekly?: number
    monthly?: number
  }
  streak?: number
}
```

Exemplo de feedback:

> "Você treinou 142 dias desde 2022."

### MediaSummary

```typescript
MediaSummary {
  type: "book" | "movie" | "series"
  totalCount: number
  favorites?: string[]
  sources: ("manual" | "goodreads" | "letterboxd")[]
}
```

Exemplo:

> "Você leu 67 livros ao longo da vida."

### LifeStats (My Stats)

```typescript
LifeStat {
  label: string
  value: number | string
  unit?: string
  pinned: boolean
}
```

Exemplos:

- Treinos: 140 dias
- Livros lidos: 67
- Entradas de diário: 312

### BiographyEvent

```typescript
BiographyEvent {
  title: string
  description?: string
  timeRange: {
    start: Date
    end?: Date
    precision: "year" | "month" | "range"
  }
  linkedActivities?: string[] // ids
}
```

Exemplo:

> "Fase de adaptação à faculdade (2017–2018)"

## Histórico Unificado

O Histórico é apenas:

```typescript
Activity[]
  .sortedBy(timestamp)
```

Com filtros:

- por tipo
- por período
- por intensidade
- por tag

## Feedback e Insights (Derivados)

Insights não são dados primários.

```typescript
Insight {
  id: string
  generatedAt: Date
  basedOn: {
    activityTypes: ActivityType[]
    dateRange: { start: Date; end: Date }
  }
  pattern: string
  description: string
  confidence?: number
}
```

Exemplo:

- **Padrão:** instabilidade temporal
- **Descrição:** hábitos com alta variância de horário ao longo da semana.

## Por que esse modelo funciona

### ✅ Escala com poucos dados

Mesmo com:

- 10 hábitos
- 20 entradas de diário

já gera valor.

### ✅ Escala com muitos dados

APIs, sensores, IA entram sem quebrar o modelo.

### ✅ Compatível com psicometria e PBT

Permite mapear:

- frequência
- variabilidade
- persistência
- sensibilidade a contexto

Sem reduzir o usuário a scores fixos.

### ✅ Sustenta narrativa

O usuário vê:

- números
- eventos
- fases
- histórias

No mesmo sistema.

## Robustez do Modelo (Análise Técnica)

### 1. Flexibilidade Infinita (Polimorfismo)

Ao usar uma tabela única `activities` com um campo `type` e `metadata` (JSONB), você evita ter que criar tabelas novas (`books`, `movies`, `workouts`) cada vez que quiser adicionar uma feature.

**Exemplo prático:**

Se amanhã você quiser integrar "Meditação", basta começar a salvar atividades com:

```typescript
{
  type: 'habit',
  subtype: 'meditation',
  timestamp: Date,
  // ... outros campos
}
```

**O banco não muda.** Nenhuma migração necessária.

### 2. Consultas Temporais Fáceis

Como tudo tem `timestamp`, é trivial responder perguntas complexas: "O que eu fiz em Novembro de 2024?".

**Query simples:**

```sql
SELECT * 
FROM activities 
WHERE user_id = ? 
  AND timestamp BETWEEN '2024-11-01' AND '2024-11-30'
ORDER BY timestamp DESC
```

Isso traz treinos, gastos, livros e diário na mesma lista. **Isso é o coração da visualização de Timeline.**

### 3. Separação de "Fato" vs. "Interpretação"

- A tabela `activities` guarda o **fato**
- A tabela `insights` guarda a **interpretação**

Se você mudar a lógica da IA/Análise, os fatos continuam lá intactos.

### 4. Robustez Epistêmica

Esse modelo é robusto porque ele **não assume uma teoria psicológica única**.

Você pode, sobre o mesmo conjunto de atividades:

- rodar um modelo comportamental (frequência, variância, persistência)
- rodar um modelo psicométrico (traços latentes)
- rodar um modelo narrativo (eventos de vida)
- rodar um modelo clínico-processual (ACT / DBT / PBT)

**Nada quebra o banco.**

Isso é crucial se você quer:

- comparar usuários
- evoluir o produto sem reescrever tudo
- não ficar preso a MBTI / Big Five / ACT como dogma

### 5. Escala de Complexidade Progressiva (Market Fit Real)

O mesmo modelo atende usuários com níveis diferentes de engajamento:

| Usuário | O que ele faz | O que você usa |
|---------|---------------|----------------|
| Casual | Marca hábitos | `activities` (type=habit) |
| Médio | Diário + gastos | `activities` + timeline |
| Avançado | Goodreads / Letterboxd | `activities` (importadas) |
| Power user | Quer feedback | `insights` |
| Clínico / research | Quer processos | `insights` + aggregation |

Isso evita o erro de apps que já nascem complexos demais.

### 6. Compatibilidade com APIs Externas (Sem Refatorar)

Com esse modelo, integrações são simples:

```typescript
activity = {
  user_id,
  type: "media",
  subtype: "book",
  timestamp,
  source: "api",
  metadata: {
    source: "goodreads",
    title,
    author,
    isbn,
    rating
  }
}
```

**Nenhuma tabela nova.**
**Nenhuma migração.**
**Nenhum redesign estrutural.**

Isso é produto profissional, não side project.

### 7. Robustez Narrativa (Diferencial PixelLife)

Esse modelo permite múltiplas narrativas sobre a mesma vida:

- cronológica (biografia)
- estatística (stats)
- simbólica (avatar / ficha)
- clínica (processos)
- afetiva ("fases da vida")

A maioria dos apps escolhe uma narrativa só. **Você está criando um sistema narrativo, não uma feature.**

## Pontos de Atenção (Onde Cuidar)

### ⚠️ Indexação é Crítica

A tabela `activities` vai crescer rápido. Você precisa criar índices compostos.

**Exemplo essencial:**

```sql
CREATE INDEX idx_user_timestamp ON activities (user_id, timestamp DESC);
```

Para carregar o feed rápido.

**Exemplo para filtros:**

```sql
CREATE INDEX idx_user_type ON activities (user_id, type);
```

### ⚠️ Cuidado com o JSONB

O campo `metadata` é poderoso, mas consultas complexas dentro do JSON podem ser lentas se mal feitas.

**Regra de ouro:**

- **Coluna** → tudo que entra em:
  - filtros frequentes
  - ordenação
  - agregações
  
- **JSONB** → tudo que é:
  - identificador externo
  - detalhe contextual
  - texto livre
  - variável por integração

**Exemplo prático:**

- ❌ **Não faça:** `metadata->>'amount'` em filtros frequentes
- ✅ **Faça:** Use coluna `value` para valores numéricos
- ✅ **Use JSONB para:** `goodreadsId`, `letterboxdRating`, `mood`, `location`

Isso mantém performance e flexibilidade.

### ⚠️ Insights como "Cache Semântico"

Insights não substituem cálculo, eles:

- guardam interpretações caras
- mantêm histórico ("você era assim em 2023")
- permitem explicabilidade ("por que estou vendo isso?")

Isso é muito mais sério do que "IA que responde no chat".

## Frase-síntese

> "Tudo no PixelLife é uma atividade: coisas que você faz, sente, consome ou vive. A partir disso, o app constrói estatísticas, memória e narrativa — sem te dizer quem você é, mas te mostrando padrões do que você faz."

