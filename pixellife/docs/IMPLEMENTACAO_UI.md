# Implementação de UI - PixelLife

## Conexão Modelo de Dados → Interface

Tudo é a mesma tabela `activities`, só muda a lente de visualização.

## Profile (Estado Atual / Identidade Resumida)

### Query Mental

> "O que define esse usuário agora?"

### O que a UI mostra:

- **Avatar** (representação visual)
- **Stats fixados** ("treinou 140 dias", "leu 67 livros")
- **Identidade narrativa** ("Explorador disciplinado", "Regulador por fuga" etc.)

### Tecnicamente:

```typescript
// Stats = agregações sobre activities
const stats = {
  workouts: activities.filter(a => 
    a.type === 'habit' && a.subtype === 'workout'
  ).length,
  books: activities.filter(a => 
    a.type === 'media' && a.subtype === 'book'
  ).length,
  // ...
}

// Identidade = insight com alta confiança
const identity = insights.find(i => 
  i.confidence > 0.8 && i.category === 'identity'
)
```

### Implementação:

- **My Stats Panel**: Exibe métricas fixadas pelo usuário
- **Profile Panel**: Avatar + configurações de visibilidade
- **Display Section**: Combinação de stats + identidade narrativa

## Stats (Quantificação Explícita)

### Query Mental

> "Quanto disso eu fiz?"

### Exemplos de Queries:

```sql
-- Contagem de treinos
SELECT COUNT(*) 
FROM activities 
WHERE user_id = ? 
  AND type = 'habit' 
  AND subtype = 'workout'

-- Contagem de livros
SELECT COUNT(*) 
FROM activities 
WHERE user_id = ? 
  AND type = 'media' 
  AND subtype = 'book'

-- Soma de gastos
SELECT SUM(value) 
FROM activities 
WHERE user_id = ? 
  AND type = 'finance'
```

### Princípio:

**O usuário escolhe o que vira stat. Nada é imposto.**

### Implementação:

- **StatsPanel**: Componente que exibe métricas selecionadas
- **Customização**: Usuário pode fixar/desfixar stats
- **Agregação em tempo real**: Calcula a partir de `activities`

## Biografia / Timeline (Vida como Sequência)

### Query Mental

> "O que aconteceu na minha vida?"

### Query Única:

```sql
SELECT * 
FROM activities 
WHERE user_id = ? 
ORDER BY timestamp DESC
```

### O que a UI decide:

- **Agrupar** por período (dia, semana, mês, ano)
- **Colapsar** eventos menores
- **Destacar** eventos marcantes
- **Puxar descrições longas** (journal entries)
- **Puxar eventos importados** (Goodreads, Letterboxd)

### Implementação:

- **BiographyTimeline**: Visualização cronológica de eventos
- **BiographyModal**: Edição de eventos biográficos
- **Journal History**: Entradas de diário como atividades
- **Event Cards**: Cards individuais para cada tipo de atividade

### Diferencial:

> Isso transforma o app em um **arquivo pessoal da vida**, não só tracker.

## Histórico Unificado

### Conceito

O Histórico é apenas:

```typescript
activities
  .filter(/* filtros do usuário */)
  .sort((a, b) => b.timestamp - a.timestamp)
```

### Filtros Disponíveis:

- **Por tipo**: `type === 'habit'`
- **Por período**: `timestamp BETWEEN start AND end`
- **Por intensidade**: `value > threshold`
- **Por tag**: `tags.includes('saúde')`

### Visualização:

- **Timeline vertical**: Eventos ordenados cronologicamente
- **Agrupamento temporal**: Por dia, semana, mês, ano
- **Cards diferenciados**: Cada tipo de atividade tem seu card visual
- **Navegação temporal**: Scroll infinito ou paginação

## Múltiplas Narrativas sobre a Mesma Vida

### 1. Narrativa Cronológica (Biografia)

**Query:**
```sql
SELECT * FROM activities 
WHERE user_id = ? 
ORDER BY timestamp ASC
```

**UI:** Timeline linear, eventos em sequência temporal

### 2. Narrativa Estatística (Stats)

**Query:**
```sql
SELECT type, subtype, COUNT(*), SUM(value)
FROM activities 
WHERE user_id = ?
GROUP BY type, subtype
```

**UI:** Painel de métricas, gráficos, comparações

### 3. Narrativa Simbólica (Avatar / Ficha)

**Query:**
```sql
SELECT * FROM activities 
WHERE user_id = ? 
  AND type IN ('habit', 'biography')
ORDER BY timestamp DESC
LIMIT 50
```

**UI:** Avatar visual, ficha RPG, representação simbólica

### 4. Narrativa Clínica (Processos)

**Query:**
```sql
SELECT * FROM insights 
WHERE user_id = ? 
  AND category = 'clinical'
ORDER BY generatedAt DESC
```

**UI:** Processos terapêuticos, padrões comportamentais, intervenções

### 5. Narrativa Afetiva ("Fases da Vida")

**Query:**
```sql
SELECT * FROM activities 
WHERE user_id = ? 
  AND type = 'biography'
  AND timePrecision IN ('month', 'range')
ORDER BY timestamp ASC
```

**UI:** Períodos da vida, fases emocionais, transições

## Princípios de Implementação de UI

### 1. Uma Fonte de Verdade

Todas as visualizações vêm de `activities`. Não duplique dados.

### 2. Agregação em Tempo Real

Calcule métricas quando necessário, não armazene duplicatas.

### 3. Filtros e Agrupamentos na UI

A UI decide como apresentar os dados, não o banco.

### 4. Performance com Índices

Use índices adequados para queries frequentes:

```sql
-- Para timeline
CREATE INDEX idx_user_timestamp ON activities (user_id, timestamp DESC);

-- Para filtros por tipo
CREATE INDEX idx_user_type ON activities (user_id, type);

-- Para busca por tags (se necessário)
CREATE INDEX idx_tags ON activities USING GIN (tags);
```

### 5. Lazy Loading

Carregue atividades conforme necessário:

- **Timeline**: Paginação ou scroll infinito
- **Stats**: Calcule apenas stats visíveis
- **Biografia**: Carregue eventos por período

## Exemplo Prático: Componente de Timeline

```typescript
function Timeline({ userId, filters }) {
  const { activities, loading } = useActivities({
    userId,
    filters,
    orderBy: 'timestamp',
    order: 'DESC',
    limit: 50
  });

  // Agrupar por período
  const grouped = groupByPeriod(activities);

  return (
    <div className="timeline">
      {grouped.map(period => (
        <TimelinePeriod 
          key={period.start}
          period={period}
          activities={period.activities}
        />
      ))}
    </div>
  );
}
```

## Frase-Síntese

> "PixelLife não é um app de hábitos ou diário. É uma infraestrutura pessoal de dados de vida, onde hábitos, mídia, finanças e narrativas coexistem como eventos, e o feedback emerge desses padrões — não o contrário."

