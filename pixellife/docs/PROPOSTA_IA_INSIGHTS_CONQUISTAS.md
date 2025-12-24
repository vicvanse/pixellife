# Proposta Técnica: IA de Insights e Conquistas Automáticas

## Visão Geral

Implementar um sistema de análise automática que:
1. **Coleta dados** de hábitos, diário, finanças, objetivos
2. **Gera insights** descritivos (não-prescritivos)
3. **Sugere conquistas** baseadas em padrões reais
4. **Mantém neutralidade** - apenas observa e descreve

## Princípios Fundamentais

✅ **Não-prescritivo**: "Você treinou 20 dias" não "Você deveria treinar mais"  
✅ **Transparente**: Mostra claramente em quais dados se baseia  
✅ **Opcional**: Usuário pode ativar/desativar  
✅ **Progressivo**: Funciona com poucos dados, melhora com mais dados  
✅ **Privacidade**: Envia apenas métricas agregadas, não textos completos do diário

## Arquitetura Técnica

### Camada 1: Coleta de Dados (Data Aggregation)

**Hook: `useDataForInsights`**

Coleta e agrega dados de todas as fontes:

```typescript
// app/hooks/useDataForInsights.ts
export interface UserDataSummary {
  habitsSummary: {
    streaks: Record<string, number>; // { "Treinar": 14, "Estudar": 5 }
    completionRate: number; // 0.72 (72%)
    totalDaysTracked: number;
    habitsByDay: Record<string, number>; // { "monday": 5, "sunday": 2 }
  };
  journalSummary: {
    totalEntries: number;
    moodDistribution: Record<string, number>; // { "Bom": 12, "Ruim": 3 }
    averageMood: number; // 0-10
    keywords: string[]; // palavras mais frequentes (sem texto completo)
    themes: string[]; // temas detectados
    streakDays: number;
  };
  financesSummary: {
    totalSaved: number;
    totalSpent: number;
    positiveDays: number; // dias com saldo positivo
    averageDailySpending: number;
    trackingStreak: number; // dias seguidos registrando
  };
  goalsSummary: {
    totalGoals: number;
    completedGoals: number;
    inProgressGoals: Array<{
      name: string;
      progress: number; // 0-1
      targetValue: number;
      currentProgress: number;
    }>;
  };
  period: {
    start: string; // ISO date
    end: string; // ISO date
    type: 'week' | 'month' | 'quarter' | 'all';
  };
}
```

### Camada 2: Geração de Insights (AI Processing)

**API Route: `/api/insights/generate`**

```typescript
// app/api/insights/generate/route.ts
export async function POST(request: NextRequest) {
  const { dataSummary } = await request.json();
  
  // Prompt estruturado para Gemini
  const prompt = `
Você é uma IA de análise de comportamento e rotina digital.

Com base nos dados estruturados abaixo, gere:

1. **Resumo do período** (máx. 5 linhas)
   - Descrição neutra e objetiva do que aconteceu
   - Sem julgamentos ou prescrições

2. **Três conquistas alcançadas** (se houver)
   - Formato: "🏃 Treino 20 dias: completou hábitos por 20 dias"
   - Baseado em dados reais, não suposições

3. **Três conquistas em potencial** (quase alcançadas)
   - Formato: "📚 Mês de leitura: faltam 2 dias para alcançar"
   - Mostra progresso real

4. **Três insights comportamentais** (padrões detectados)
   - Formato: "Você teve maior consistência de treino quando registrou humor 'Bom'"
   - Baseado em correlações reais nos dados
   - Sem interpretações psicológicas profundas

5. **Uma sugestão prática** (opcional, apenas se fizer sentido)
   - Formato: "Experimente bloquear 15 minutos após acordar para manter consistência"
   - Baseado em padrões detectados
   - Sempre como sugestão, nunca como prescrição

**Dados:**
${JSON.stringify(dataSummary, null, 2)}

**Regras importantes:**
- Use linguagem simples e direta
- Responda sempre em português
- Seja neutro e descritivo
- Não invente dados que não existem
- Se não houver dados suficientes, diga isso claramente
`;

  // Chamar Gemini
  const response = await callGemini(prompt);
  
  // Parsear resposta estruturada
  return NextResponse.json({
    summary: response.summary,
    achievements: response.achievements,
    potentialAchievements: response.potentialAchievements,
    insights: response.insights,
    suggestion: response.suggestion,
  });
}
```

### Camada 3: Sistema de Conquistas (Achievements)

**Tabela no Supabase: `achievements`**

```sql
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type VARCHAR(50) NOT NULL, -- 'habit_streak', 'journal_streak', 'goal_completed', etc.
  achievement_key VARCHAR(100) NOT NULL, -- 'habit_streak_7', 'journal_streak_30', etc.
  title VARCHAR(200) NOT NULL,
  description TEXT,
  icon VARCHAR(50), -- emoji ou código de ícone
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB, -- dados extras (quantos dias, qual hábito, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, achievement_key)
);

CREATE INDEX idx_achievements_user ON achievements(user_id, unlocked_at DESC);
```

**Tipos de Conquistas:**

```typescript
// app/types/achievements.ts
export type AchievementType =
  | 'habit_streak' // Streak de hábitos
  | 'journal_streak' // Streak de diário
  | 'finance_tracking' // Dias registrando finanças
  | 'goal_completed' // Objetivo concluído
  | 'consistency' // Consistência geral
  | 'milestone' // Marcos (ex: 100 dias de treino)
  | 'pattern' // Padrão detectado (ex: "Treinou em dias chuvosos")
  | 'custom'; // Conquista personalizada pela IA

export interface Achievement {
  id: string;
  user_id: string;
  achievement_type: AchievementType;
  achievement_key: string; // identificador único
  title: string;
  description?: string;
  icon?: string;
  unlocked_at: string;
  metadata?: Record<string, any>;
  created_at: string;
}
```

**Hook: `useAchievements`**

```typescript
// app/hooks/useAchievements.ts
export function useAchievements() {
  const { user } = useAuth();
  
  const checkAchievements = async (dataSummary: UserDataSummary) => {
    // Verificar conquistas baseadas em regras simples
    const newAchievements: Achievement[] = [];
    
    // Exemplo: Streak de hábitos
    const maxStreak = Math.max(...Object.values(dataSummary.habitsSummary.streaks));
    if (maxStreak >= 7 && !hasAchievement('habit_streak_7')) {
      newAchievements.push({
        achievement_type: 'habit_streak',
        achievement_key: 'habit_streak_7',
        title: '🔥 Consistency Beginner',
        description: 'Completou hábitos por 7 dias seguidos',
        icon: '🔥',
      });
    }
    
    // Exemplo: Streak de diário
    if (dataSummary.journalSummary.streakDays >= 30 && !hasAchievement('journal_streak_30')) {
      newAchievements.push({
        achievement_type: 'journal_streak',
        achievement_key: 'journal_streak_30',
        title: '📖 Journal Writer',
        description: 'Escreveu no diário por 30 dias seguidos',
        icon: '📖',
      });
    }
    
    // Salvar conquistas desbloqueadas
    await saveAchievements(newAchievements);
  };
  
  return { checkAchievements, achievements, loading };
}
```

### Camada 4: Componentes de UI

**Componente: `InsightsPanel`**

```typescript
// app/components/feedback/InsightsPanel.tsx
export function InsightsPanel() {
  const { generateInsights, insights, loading } = useGenerateInsights();
  const { achievements } = useAchievements();
  
  return (
    <div className="space-y-4">
      {/* Resumo do período */}
      <div className="p-4 rounded" style={{ backgroundColor: '#f8f8f8' }}>
        <h3 className="font-pixel-bold mb-2">Resumo do Período</h3>
        <p className="font-pixel text-sm">{insights?.summary}</p>
      </div>
      
      {/* Conquistas */}
      <div>
        <h3 className="font-pixel-bold mb-2">🎉 Conquistas</h3>
        <div className="grid grid-cols-2 gap-2">
          {achievements.map(achievement => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </div>
      </div>
      
      {/* Insights */}
      <div>
        <h3 className="font-pixel-bold mb-2">💡 Insights</h3>
        <div className="space-y-2">
          {insights?.insights.map((insight, idx) => (
            <div key={idx} className="p-3 rounded" style={{ backgroundColor: '#f0f8ff' }}>
              <p className="font-pixel text-sm">{insight}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Botão para gerar */}
      <button onClick={generateInsights} disabled={loading}>
        {loading ? 'Gerando...' : '🔄 Gerar Novos Insights'}
      </button>
    </div>
  );
}
```

**Componente: `AchievementCard`**

```typescript
// app/components/feedback/AchievementCard.tsx
export function AchievementCard({ achievement }: { achievement: Achievement }) {
  return (
    <div className="p-3 rounded border" style={{ backgroundColor: '#FFFFFF', borderColor: '#e0e0e0' }}>
      <div className="flex items-center gap-2">
        <span className="text-2xl">{achievement.icon || '⭐'}</span>
        <div>
          <h4 className="font-pixel-bold text-sm">{achievement.title}</h4>
          {achievement.description && (
            <p className="font-pixel text-xs" style={{ color: '#666' }}>
              {achievement.description}
            </p>
          )}
        </div>
      </div>
      <p className="font-pixel text-xs mt-2" style={{ color: '#999' }}>
        {formatDate(achievement.unlocked_at)}
      </p>
    </div>
  );
}
```

## Fluxo de Implementação

### Fase 1: MVP (Sem IA)

1. **Coleta de dados básica**
   - Implementar `useDataForInsights`
   - Agregar dados de hábitos, diário, finanças

2. **Sistema de conquistas simples**
   - Criar tabela `achievements` no Supabase
   - Implementar `useAchievements`
   - Verificar conquistas baseadas em regras fixas:
     - Streak de 7 dias
     - Streak de 30 dias
     - 100 dias de treino
     - Objetivo concluído

3. **UI básica**
   - Componente `InsightsPanel` simples
   - Mostrar conquistas desbloqueadas
   - Mostrar estatísticas básicas

### Fase 2: IA Básica

1. **API Route para insights**
   - Criar `/api/insights/generate`
   - Integrar com Gemini
   - Prompt estruturado para gerar insights

2. **Hook `useGenerateInsights`**
   - Coletar dados via `useDataForInsights`
   - Chamar API
   - Salvar insights na tabela `insights`

3. **UI melhorada**
   - Mostrar insights gerados
   - Botão "Gerar Insights"
   - Loading states

### Fase 3: IA Avançada

1. **Análise de padrões**
   - Correlações entre hábitos e humor
   - Padrões temporais (dias da semana, horários)
   - Tendências ao longo do tempo

2. **Conquistas dinâmicas**
   - IA sugere conquistas personalizadas
   - Baseadas em padrões únicos do usuário

3. **Visualizações**
   - Gráficos simples de tendências
   - Comparação temporal

## Exemplo de Dados Enviados para IA

```json
{
  "habitsSummary": {
    "streaks": { "Treinar": 14, "Estudar": 5 },
    "completionRate": 0.72,
    "totalDaysTracked": 30,
    "habitsByDay": {
      "monday": 5,
      "tuesday": 6,
      "wednesday": 5,
      "thursday": 4,
      "friday": 3,
      "saturday": 2,
      "sunday": 1
    }
  },
  "journalSummary": {
    "totalEntries": 18,
    "moodDistribution": { "Bom": 12, "Médio": 4, "Ruim": 2 },
    "averageMood": 7.2,
    "keywords": ["treino", "projeto", "faculdade"],
    "themes": ["rotina", "estudos"],
    "streakDays": 9
  },
  "financesSummary": {
    "totalSaved": 230,
    "totalSpent": 480,
    "positiveDays": 20,
    "averageDailySpending": 16.0,
    "trackingStreak": 15
  },
  "goalsSummary": {
    "totalGoals": 3,
    "completedGoals": 1,
    "inProgressGoals": [
      {
        "name": "Juntar 5 mil",
        "progress": 0.30,
        "targetValue": 5000,
        "currentProgress": 1500
      }
    ]
  },
  "period": {
    "start": "2025-01-01",
    "end": "2025-01-31",
    "type": "month"
  }
}
```

## Exemplo de Resposta da IA

```json
{
  "summary": "Janeiro foi um mês de consistência moderada. Você manteve uma boa frequência de treinos (14 dias seguidos) e escreveu no diário regularmente (18 entradas). Seus gastos foram controlados, com 20 dias de saldo positivo.",
  "achievements": [
    {
      "title": "🔥 Consistency Beginner",
      "description": "Completou hábitos por 14 dias seguidos",
      "icon": "🔥"
    },
    {
      "title": "📖 Journal Writer",
      "description": "Escreveu 18 entradas no diário",
      "icon": "📖"
    },
    {
      "title": "💼 Money Tracker",
      "description": "Registrou gastos por 15 dias seguidos",
      "icon": "💼"
    }
  ],
  "potentialAchievements": [
    {
      "title": "🏃 Treino 20 dias",
      "description": "Faltam 6 dias para alcançar",
      "icon": "🏃"
    },
    {
      "title": "📚 Mês de leitura",
      "description": "Mencionou livros 5 vezes, faltam 7 para alcançar",
      "icon": "📚"
    }
  ],
  "insights": [
    "Você teve maior consistência de treino quando registrou humor 'Bom'.",
    "Domingo aparece como o dia mais difícil para manter hábitos.",
    "Seu diário mostra aumento de estresse ligado à faculdade."
  ],
  "suggestion": "Experimente bloquear 15 minutos após acordar para manter consistência nos hábitos difíceis."
}
```

## Segurança e Privacidade

✅ **Não envia textos completos do diário** - apenas métricas agregadas  
✅ **Não envia dados financeiros detalhados** - apenas totais e médias  
✅ **Usuário pode desativar** - toggle nas configurações  
✅ **Dados agregados apenas** - não identifica padrões pessoais sensíveis  

## Custo Estimado

- **Gemini API**: ~$0.01 por análise mensal (1 chamada/mês)
- **Supabase**: Incluído no plano atual (tabelas `insights` e `achievements`)
- **Total**: Praticamente gratuito para uso pessoal

## Próximos Passos

1. ✅ Criar proposta técnica (este documento)
2. ⏳ Implementar `useDataForInsights`
3. ⏳ Criar tabela `achievements` no Supabase
4. ⏳ Implementar `useAchievements` com regras básicas
5. ⏳ Criar componente `InsightsPanel` básico
6. ⏳ Implementar API route `/api/insights/generate`
7. ⏳ Integrar com Gemini
8. ⏳ Testar e iterar

