# Proposta: Seção de Feedback

## Princípios Fundamentais

Baseado na arquitetura do PixelLife, a seção de Feedback deve:

1. **Ser opcional e não-prescritiva** - Não diz "você deveria fazer X", apenas descreve padrões
2. **Ser transparente** - Mostra claramente em quais dados o insight se baseia
3. **Permitir comparação temporal** - Histórico de insights para ver evolução
4. **Ser progressiva** - Funciona com poucos dados e melhora com mais dados

## Estrutura da Seção

### 1. Visão Geral (Topo)
```
┌─────────────────────────────────────┐
│  📊 Feedback                        │
│                                      │
│  [Card: Resumo]                     │
│  • Total de insights: 12            │
│  • Último insight: Jan 2025         │
│  • Padrões detectados: 3            │
└─────────────────────────────────────┘
```

### 2. Insights Recentes (Cards)
```
┌─────────────────────────────────────┐
│  📅 Jan 2025                        │
│  Padrão: Instabilidade Temporal    │
│                                      │
│  Você manteve maior regularidade    │
│  de treino durante períodos com     │
│  menos eventos sociais registrados.  │
│                                      │
│  [Ver detalhes] [Comparar]          │
│  Baseado em: 42 hábitos, 18 eventos │
└─────────────────────────────────────┘
```

### 3. Padrões Detectados (Aba)
- Lista de padrões identificados
- Cada padrão pode ter múltiplos insights ao longo do tempo
- Permite ver evolução: "Este padrão apareceu 3 vezes nos últimos 6 meses"

### 4. Comparação Temporal (Aba)
- Compara insights de períodos diferentes
- Exemplo: "Em Nov/2024 você tinha padrão X, agora tem padrão Y"

## Tipos de Insights Simples (Fase 1)

### 1. Padrões Temporais
- **Detecção**: Variação de horários em hábitos
- **Exemplo**: "Seus treinos têm alta variância de horário (desvio padrão de 3.2h)"
- **Baseado em**: Activities do tipo `habit` com timestamps

### 2. Correlações Simples
- **Detecção**: Frequência de hábito A vs frequência de hábito B
- **Exemplo**: "Quando você treina mais, escreve menos no diário"
- **Baseado em**: Contagem de activities por tipo em períodos

### 3. Tendências Temporais
- **Detecção**: Aumento/diminuição de frequência
- **Exemplo**: "Sua frequência de treino aumentou 30% nos últimos 2 meses"
- **Baseado em**: Comparação de períodos

### 4. Padrões Financeiros
- **Detecção**: Relação entre gastos e outros eventos
- **Exemplo**: "Gastos noturnos são 40% maiores em dias sem treino"
- **Baseado em**: Activities do tipo `finance` + `habit`

## Implementação Técnica Sugerida

### Componente Principal: `FeedbackSection`

```typescript
// app/components/feedback/FeedbackSection.tsx
"use client";

import { useState } from "react";
import { useInsights } from "../../hooks/useInsights";
import { InsightCard } from "./InsightCard";
import { PatternList } from "./PatternList";
import { TemporalComparison } from "./TemporalComparison";
import { GenerateInsightButton } from "./GenerateInsightButton";

export function FeedbackSection() {
  const { insights, loading } = useInsights();
  const [activeTab, setActiveTab] = useState<'recent' | 'patterns' | 'compare'>('recent');

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button onClick={() => setActiveTab('recent')}>Recentes</button>
        <button onClick={() => setActiveTab('patterns')}>Padrões</button>
        <button onClick={() => setActiveTab('compare')}>Comparar</button>
      </div>

      {/* Conteúdo por tab */}
      {activeTab === 'recent' && <InsightCard insights={insights} />}
      {activeTab === 'patterns' && <PatternList insights={insights} />}
      {activeTab === 'compare' && <TemporalComparison insights={insights} />}

      {/* Botão para gerar novo insight */}
      <GenerateInsightButton />
    </div>
  );
}
```

### Hook para Gerar Insights: `useGenerateInsights`

```typescript
// app/hooks/useGenerateInsights.ts
export function useGenerateInsights() {
  const { user } = useAuth();
  const { saveInsight } = useInsights();

  const generateTemporalPattern = async () => {
    // 1. Buscar activities dos últimos 30 dias
    // 2. Calcular variância de horários em hábitos
    // 3. Se variância > threshold, gerar insight
    // 4. Salvar via saveInsight()
  };

  const generateCorrelation = async () => {
    // 1. Buscar activities de tipos diferentes
    // 2. Comparar frequências em períodos
    // 3. Se correlação significativa, gerar insight
  };

  return { generateTemporalPattern, generateCorrelation };
}
```

## Visual Sugerido

### Cards de Insight
- Fundo branco com borda `#e0e0e0`
- Badge com data no topo
- Badge com padrão (se houver)
- Barra de confiança (se houver)
- Botão "Ver detalhes" que expande `based_on`

### Comparação Temporal
- Dois cards lado a lado (antes/depois)
- Destaque visual nas diferenças
- Timeline mostrando quando cada insight foi gerado

## Fase 1: MVP (Implementação Simples)

1. **Mostrar insights existentes** - Usar `InsightHistory` já existente
2. **Botão "Gerar Insight"** - Análise básica:
   - Variância temporal de hábitos
   - Frequência por período
   - Comparação mês atual vs mês anterior
3. **Visualização simples** - Cards com data, padrão, descrição

## Fase 2: Melhorias Futuras

1. **Análise mais sofisticada** - Correlações cruzadas
2. **IA opcional** - Gemini para insights mais complexos (opt-in)
3. **Visualizações** - Gráficos simples de tendências
4. **Exportação** - PDF com histórico de insights

## Exemplo de Query para Gerar Insight

```typescript
// Detectar variância temporal em hábitos
async function detectTemporalVariance(userId: string) {
  const { data: habits } = await supabase
    .from('activities')
    .select('timestamp, subtype')
    .eq('user_id', userId)
    .eq('type', 'habit')
    .gte('timestamp', thirtyDaysAgo)
    .order('timestamp');

  // Calcular variância de horários
  const hours = habits.map(h => new Date(h.timestamp).getHours());
  const variance = calculateVariance(hours);

  if (variance > threshold) {
    await saveInsight(
      "Seus hábitos têm alta variância de horário ao longo da semana.",
      {
        kind: 'pattern',
        category: 'temporal',
        pattern: 'instabilidade_temporal',
        confidence: 0.7,
        based_on: { variance, sampleSize: habits.length }
      }
    );
  }
}
```

## Recomendação Final

**Começar simples:**
1. Integrar `InsightHistory` na seção Feedback
2. Adicionar botão "Gerar Insight Simples" que detecta padrões básicos
3. Mostrar insights em cards organizados por data
4. Adicionar comparação temporal simples (último vs penúltimo)

**Evoluir gradualmente:**
- Adicionar mais tipos de análise conforme necessário
- Integrar IA apenas quando houver dados suficientes
- Manter sempre o princípio de neutralidade

