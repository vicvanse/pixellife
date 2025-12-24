# Proposta: Identidade Declarada vs Identidade Observada

## Princípio Fundamental

**Duas sessões separadas que dialogam, mas não se fundem:**

🧭 **Sessão A - Identidade Declarada** (Manual, Subjetiva)  
🪞 **Sessão B - Identidade Observada** (Automática, Derivada de Dados)

## Arquitetura Técnica

### Sessão A: Identidade Declarada (Narrativa)

#### Estrutura de Dados

```typescript
// app/types/identity.ts
export interface DeclaredIdentity {
  id: string;
  user_id: string;
  
  // Bloco 1: Bio viva
  bio?: {
    text: string;
    updated_at: string;
  };
  
  // Bloco 2: Pontos centrais declarados
  central_points: string[]; // ["Treinar", "Faculdade", "Criar algo meu"]
  
  // Bloco 3: Reflexões periódicas
  reflections: Array<{
    id: string;
    prompt: string; // "O que você sente que mudou em você nos últimos meses?"
    text: string;
    created_at: string;
  }>;
  
  created_at: string;
  updated_at: string;
}
```

#### Tabela no Supabase

```sql
CREATE TABLE declared_identity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Bio viva (curta, 1-3 frases)
  bio_text TEXT,
  bio_updated_at TIMESTAMPTZ,
  
  -- Pontos centrais (array de strings)
  central_points JSONB DEFAULT '[]'::jsonb,
  
  -- Reflexões periódicas
  reflections JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id)
);

CREATE INDEX idx_declared_identity_user ON declared_identity(user_id);
```

#### Hook: `useDeclaredIdentity`

```typescript
// app/hooks/useDeclaredIdentity.ts
export function useDeclaredIdentity() {
  const { user } = useAuth();
  const [identity, setIdentity] = useState<DeclaredIdentity | null>(null);
  
  const updateBio = async (text: string) => {
    // Atualizar bio (substitui, não versiona)
    await supabase
      .from('declared_identity')
      .upsert({
        user_id: user.id,
        bio_text: text,
        bio_updated_at: new Date().toISOString(),
      });
  };
  
  const addCentralPoint = async (point: string) => {
    // Adicionar ponto central
    const current = identity?.central_points || [];
    await supabase
      .from('declared_identity')
      .upsert({
        user_id: user.id,
        central_points: [...current, point],
      });
  };
  
  const addReflection = async (prompt: string, text: string) => {
    // Adicionar reflexão periódica
    const reflection = {
      id: crypto.randomUUID(),
      prompt,
      text,
      created_at: new Date().toISOString(),
    };
    
    const current = identity?.reflections || [];
    await supabase
      .from('declared_identity')
      .upsert({
        user_id: user.id,
        reflections: [...current, reflection],
      });
  };
  
  return {
    identity,
    updateBio,
    addCentralPoint,
    removeCentralPoint,
    addReflection,
    loading,
  };
}
```

### Sessão B: Identidade Observada (Dados)

#### Conceito: Eixos de Identidade

Um **eixo** é um tema que:
- Aparece com recorrência
- Atravessa meses
- Surge em múltiplos tipos de atividades
- Organiza outras atividades ao redor

#### Estrutura de Dados

```typescript
// app/types/identity.ts
export interface ObservedIdentity {
  user_id: string;
  
  // Eixos detectados
  axes: Array<{
    id: string;
    name: string; // "Corpo & Movimento", "Estudo & Conhecimento"
    icon?: string;
    
    // Quando apareceu
    first_seen: string; // ISO date
    last_seen: string;
    
    // Onde aparece
    appears_in: {
      habits: boolean;
      journal: boolean;
      finances: boolean;
      biography: boolean;
    };
    
    // Intensidade (frequência relativa)
    intensity: number; // 0-1
    
    // Variação temporal
    trend: 'increasing' | 'stable' | 'decreasing';
    
    // Atividades relacionadas
    related_activities: string[]; // IDs de activities
  }>;
  
  // Padrões detectados
  patterns: Array<{
    id: string;
    description: string;
    confidence: number; // 0-1
    based_on: Record<string, any>;
  }>;
  
  generated_at: string;
  updated_at: string;
}
```

#### Tabela no Supabase

```sql
CREATE TABLE observed_identity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Eixos detectados
  axes JSONB DEFAULT '[]'::jsonb,
  
  -- Padrões detectados
  patterns JSONB DEFAULT '[]'::jsonb,
  
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id)
);

CREATE INDEX idx_observed_identity_user ON observed_identity(user_id);
```

#### Algoritmo de Detecção de Eixos

```typescript
// app/lib/detectIdentityAxes.ts

interface Activity {
  type: string;
  subtype?: string;
  text?: string;
  tags?: string[];
  timestamp: string;
}

export function detectIdentityAxes(activities: Activity[]): Axis[] {
  // 1. Agrupar atividades por tema (via tags, subtype, texto)
  const themes = groupByTheme(activities);
  
  // 2. Filtrar temas que aparecem com recorrência mínima
  const recurringThemes = themes.filter(theme => 
    theme.frequency >= MIN_FREQUENCY && 
    theme.duration >= MIN_DURATION_DAYS
  );
  
  // 3. Verificar integração (aparece em múltiplos tipos)
  const integratedThemes = recurringThemes.filter(theme =>
    theme.appearsIn.habits || 
    theme.appearsIn.journal || 
    theme.appearsIn.finances ||
    theme.appearsIn.biography
  );
  
  // 4. Mapear para eixos
  return integratedThemes.map(theme => ({
    id: theme.id,
    name: theme.name,
    first_seen: theme.firstOccurrence,
    last_seen: theme.lastOccurrence,
    appears_in: theme.appearsIn,
    intensity: theme.frequency / MAX_FREQUENCY,
    trend: calculateTrend(theme),
    related_activities: theme.activityIds,
  }));
}

function groupByTheme(activities: Activity[]): Theme[] {
  // Agrupar por:
  // - Tags comuns
  // - Subtypes relacionados
  // - Palavras-chave no texto (semântica simples)
  
  const themeMap = new Map<string, Theme>();
  
  activities.forEach(activity => {
    // Extrair temas do activity
    const themes = extractThemes(activity);
    
    themes.forEach(themeName => {
      if (!themeMap.has(themeName)) {
        themeMap.set(themeName, {
          id: crypto.randomUUID(),
          name: themeName,
          frequency: 0,
          duration: 0,
          appearsIn: {
            habits: false,
            journal: false,
            finances: false,
            biography: false,
          },
          activityIds: [],
        });
      }
      
      const theme = themeMap.get(themeName)!;
      theme.frequency++;
      theme.activityIds.push(activity.id);
      
      // Marcar onde aparece
      if (activity.type === 'habit') theme.appearsIn.habits = true;
      if (activity.type === 'journal') theme.appearsIn.journal = true;
      if (activity.type === 'finance') theme.appearsIn.finances = true;
      if (activity.type === 'biography') theme.appearsIn.biography = true;
    });
  });
  
  return Array.from(themeMap.values());
}

function extractThemes(activity: Activity): string[] {
  const themes: string[] = [];
  
  // 1. Tags diretas
  if (activity.tags) {
    themes.push(...activity.tags);
  }
  
  // 2. Subtype como tema
  if (activity.subtype) {
    themes.push(activity.subtype);
  }
  
  // 3. Palavras-chave no texto (análise simples)
  if (activity.text) {
    const keywords = extractKeywords(activity.text);
    themes.push(...keywords);
  }
  
  return themes;
}

function extractKeywords(text: string): string[] {
  // Análise simples de palavras-chave
  // (sem IA, apenas frequência de palavras relevantes)
  
  const relevantWords = [
    'treino', 'exercício', 'corpo', 'físico',
    'estudo', 'faculdade', 'aprender', 'conhecimento',
    'criar', 'projeto', 'trabalho',
    'dinheiro', 'finanças', 'economia',
    'saúde', 'mental', 'bem-estar',
    // ... mais palavras relevantes
  ];
  
  const words = text.toLowerCase().split(/\s+/);
  const found = relevantWords.filter(word => 
    words.some(w => w.includes(word))
  );
  
  return found;
}
```

#### Hook: `useObservedIdentity`

```typescript
// app/hooks/useObservedIdentity.ts
export function useObservedIdentity() {
  const { user } = useAuth();
  const [observed, setObserved] = useState<ObservedIdentity | null>(null);
  const [loading, setLoading] = useState(true);
  
  const generateObservedIdentity = async () => {
    // 1. Buscar todas as activities do usuário
    const { data: activities } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: true });
    
    // 2. Detectar eixos
    const axes = detectIdentityAxes(activities || []);
    
    // 3. Detectar padrões (usando análise determinística)
    const patterns = detectPatterns(activities || []);
    
    // 4. Salvar
    const observedIdentity: ObservedIdentity = {
      user_id: user.id,
      axes,
      patterns,
      generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    await supabase
      .from('observed_identity')
      .upsert(observedIdentity);
    
    setObserved(observedIdentity);
  };
  
  return {
    observed,
    generateObservedIdentity,
    loading,
  };
}
```

### Diálogo entre as Duas Sessões

#### Comparação Explícita (Opt-in)

```typescript
// app/lib/compareIdentities.ts
export interface IdentityComparison {
  overlaps: Array<{
    declared: string;
    observed: string;
    match: number; // 0-1
  }>;
  
  divergences: Array<{
    declared: string;
    reason: 'not_in_data' | 'weak_in_data';
  }>;
  
  absences: Array<{
    observed: string;
    reason: 'not_declared';
  }>;
}

export function compareIdentities(
  declared: DeclaredIdentity,
  observed: ObservedIdentity
): IdentityComparison {
  const comparison: IdentityComparison = {
    overlaps: [],
    divergences: [],
    absences: [],
  };
  
  // Comparar pontos centrais declarados com eixos observados
  declared.central_points.forEach(declaredPoint => {
    const matchingAxis = observed.axes.find(axis =>
      fuzzyMatch(declaredPoint, axis.name)
    );
    
    if (matchingAxis) {
      comparison.overlaps.push({
        declared: declaredPoint,
        observed: matchingAxis.name,
        match: matchingAxis.intensity,
      });
    } else {
      comparison.divergences.push({
        declared: declaredPoint,
        reason: 'not_in_data',
      });
    }
  });
  
  // Eixos observados não declarados
  observed.axes.forEach(axis => {
    const isDeclared = declared.central_points.some(point =>
      fuzzyMatch(point, axis.name)
    );
    
    if (!isDeclared) {
      comparison.absences.push({
        observed: axis.name,
        reason: 'not_declared',
      });
    }
  });
  
  return comparison;
}
```

## Componentes de UI

### Componente: `DeclaredIdentitySection`

```typescript
// app/components/identity/DeclaredIdentitySection.tsx
export function DeclaredIdentitySection() {
  const { identity, updateBio, addCentralPoint, addReflection } = useDeclaredIdentity();
  
  return (
    <div className="space-y-6">
      <h2 className="font-pixel-bold text-xl">🧭 Identidade Declarada</h2>
      
      {/* Bloco 1: Bio */}
      <div>
        <label className="font-pixel-bold text-sm mb-2 block">
          Bio viva
        </label>
        <textarea
          value={identity?.bio?.text || ''}
          onChange={(e) => updateBio(e.target.value)}
          placeholder="Um resumo livre de como você se vê neste momento."
          className="w-full px-3 py-2 rounded font-pixel text-sm"
          rows={3}
        />
      </div>
      
      {/* Bloco 2: Pontos centrais */}
      <div>
        <label className="font-pixel-bold text-sm mb-2 block">
          Pontos centrais
        </label>
        <p className="font-pixel text-xs mb-2" style={{ color: '#666' }}>
          Quais temas, práticas ou valores você sente que atravessam sua vida atualmente?
        </p>
        <div className="flex flex-wrap gap-2 mb-2">
          {identity?.central_points.map((point, idx) => (
            <span
              key={idx}
              className="px-3 py-1 rounded font-pixel text-sm"
              style={{ backgroundColor: '#f0f0f0' }}
            >
              {point} ×
            </span>
          ))}
        </div>
        <input
          type="text"
          placeholder="Adicionar ponto central..."
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              addCentralPoint(e.currentTarget.value);
              e.currentTarget.value = '';
            }
          }}
          className="w-full px-3 py-2 rounded font-pixel text-sm"
        />
      </div>
      
      {/* Bloco 3: Reflexões */}
      <div>
        <label className="font-pixel-bold text-sm mb-2 block">
          Reflexões periódicas
        </label>
        <button
          onClick={() => {
            const prompt = "O que você sente que mudou em você nos últimos meses?";
            // Abrir modal para reflexão
          }}
          className="px-3 py-2 rounded font-pixel text-sm"
          style={{ backgroundColor: '#f0f0f0' }}
        >
          + Adicionar reflexão
        </button>
        {/* Lista de reflexões */}
      </div>
    </div>
  );
}
```

### Componente: `ObservedIdentitySection`

```typescript
// app/components/identity/ObservedIdentitySection.tsx
export function ObservedIdentitySection() {
  const { observed, generateObservedIdentity, loading } = useObservedIdentity();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-pixel-bold text-xl">🪞 Identidade Observada</h2>
        <button
          onClick={generateObservedIdentity}
          disabled={loading}
          className="px-3 py-1 rounded font-pixel text-xs"
        >
          {loading ? 'Analisando...' : '🔄 Atualizar análise'}
        </button>
      </div>
      
      <p className="font-pixel text-sm" style={{ color: '#666' }}>
        Com base no que você registra, estes são temas que aparecem de forma consistente na sua vida.
      </p>
      
      {/* Eixos detectados */}
      <div className="space-y-4">
        {observed?.axes.map(axis => (
          <AxisCard key={axis.id} axis={axis} />
        ))}
      </div>
      
      {/* Padrões detectados */}
      <div>
        <h3 className="font-pixel-bold text-sm mb-2">Padrões observados</h3>
        {observed?.patterns.map(pattern => (
          <PatternCard key={pattern.id} pattern={pattern} />
        ))}
      </div>
    </div>
  );
}
```

### Componente: `IdentityComparison` (Opt-in)

```typescript
// app/components/identity/IdentityComparison.tsx
export function IdentityComparison() {
  const { identity: declared } = useDeclaredIdentity();
  const { observed } = useObservedIdentity();
  const [enabled, setEnabled] = useState(false);
  
  if (!enabled) {
    return (
      <div className="p-4 rounded text-center" style={{ backgroundColor: '#f8f8f8' }}>
        <p className="font-pixel text-sm mb-2">
          Compare sua identidade declarada com o que os dados mostram
        </p>
        <button
          onClick={() => setEnabled(true)}
          className="px-3 py-2 rounded font-pixel text-sm"
        >
          Ativar comparação
        </button>
      </div>
    );
  }
  
  const comparison = compareIdentities(declared, observed);
  
  return (
    <div className="space-y-4">
      <h3 className="font-pixel-bold text-lg">Comparação</h3>
      
      {/* Sobreposições */}
      {comparison.overlaps.length > 0 && (
        <div>
          <h4 className="font-pixel-bold text-sm mb-2">Sobreposições</h4>
          {comparison.overlaps.map((overlap, idx) => (
            <div key={idx} className="p-2 rounded" style={{ backgroundColor: '#e8f5e9' }}>
              <p className="font-pixel text-sm">
                "{overlap.declared}" aparece tanto para você quanto nos dados.
              </p>
            </div>
          ))}
        </div>
      )}
      
      {/* Divergências */}
      {comparison.divergences.length > 0 && (
        <div>
          <h4 className="font-pixel-bold text-sm mb-2">Divergências</h4>
          {comparison.divergences.map((divergence, idx) => (
            <div key={idx} className="p-2 rounded" style={{ backgroundColor: '#fff3e0' }}>
              <p className="font-pixel text-sm">
                "{divergence.declared}" é importante para você, mas aparece pouco nos registros.
              </p>
            </div>
          ))}
        </div>
      )}
      
      {/* Ausências */}
      {comparison.absences.length > 0 && (
        <div>
          <h4 className="font-pixel-bold text-sm mb-2">Ausências</h4>
          {comparison.absences.map((absence, idx) => (
            <div key={idx} className="p-2 rounded" style={{ backgroundColor: '#e3f2fd' }}>
              <p className="font-pixel text-sm">
                "{absence.observed}" aparece forte nos dados, mas não é mencionado por você.
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Integração na Seção Feedback

A seção de Feedback agora teria três partes:

1. **Identidade Declarada** (Manual)
2. **Identidade Observada** (Automática)
3. **Comparação** (Opt-in)

Tudo isso **sem custo**, usando análise determinística.

## Próximos Passos

1. ✅ Criar tabelas `declared_identity` e `observed_identity`
2. ⏳ Implementar `useDeclaredIdentity`
3. ⏳ Implementar algoritmo de detecção de eixos
4. ⏳ Implementar `useObservedIdentity`
5. ⏳ Criar componentes de UI
6. ⏳ Integrar na seção Feedback

Quer que eu comece a implementar?

