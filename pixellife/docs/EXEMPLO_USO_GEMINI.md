# Exemplos Práticos de Uso do Gemini no Pixel Life

## 🎯 Casos de Uso Implementáveis

### 1. Assistente Financeiro no Expenses

**Local:** `app/expenses/page.tsx` ou `app/components/expenses/ExpensePlanningModal.tsx`

```typescript
import { FinanceInsights } from '../gemini/FinanceInsights';

// Adicionar na página de expenses
<FinanceInsights dateKey={formatDateKey(selectedDate)} />
```

**Funcionalidade:**
- Usuário pode perguntar: "Como posso economizar mais este mês?"
- Gemini analisa os dados financeiros e dá sugestões personalizadas

---

### 2. Chat Gemini no ProfilePanel

**Já implementado!** O botão já está no ProfilePanel.

**Como usar:**
1. Usuário clica no botão "💬 Gemini"
2. Abre chat onde pode fazer perguntas
3. Pode alternar entre Chat normal e Deep Research

---

### 3. Assistente de Diário

**Local:** `app/components/journal/JournalOverlay.tsx`

```typescript
import { useGemini } from '../../hooks/useGemini';

const { getJournalAssistant } = useGemini();

// Quando usuário está escrevendo
const handleGetSuggestions = async () => {
  const suggestions = await getJournalAssistant(
    currentMood,
    quickNotes,
    previousEntries
  );
  // Mostrar sugestões em um tooltip ou sidebar
};
```

---

### 4. Insights de Hábitos

**Local:** `app/habits/page.tsx`

```typescript
import { useGemini } from '../hooks/useGemini';

const { getHabitInsights } = useGemini();

const handleGetInsights = async () => {
  const habitsSummary = habits.map(h => 
    `${h.name}: ${h.checks.filter(Boolean).length}/${h.checks.length} dias`
  ).join('\n');
  
  const streaksSummary = habits.map(h => 
    `Streak de ${h.name}: ${calculateStreak(h)} dias`
  ).join('\n');
  
  const insights = await getHabitInsights(habitsSummary, streaksSummary);
  // Mostrar insights em um modal
};
```

---

### 5. Deep Research para Aprendizado

**Local:** Nova página ou seção

```typescript
import { GeminiChat } from '../components/gemini/GeminiChat';

// Página de aprendizado/pesquisa
<GeminiChat mode="deep-research" />
```

**Use cases:**
- "Como investir em ações?"
- "Melhores práticas de produtividade"
- "Como criar um orçamento pessoal"

---

## 🔧 Integração Rápida

### Passo 1: Configurar API Key

```bash
# Criar .env.local
echo "NEXT_PUBLIC_GEMINI_API_KEY=sua_chave" > .env.local
```

### Passo 2: Usar em qualquer componente

```typescript
'use client';

import { useGemini } from '@/app/hooks/useGemini';

export function MyComponent() {
  const { askGemini, loading } = useGemini();
  
  const handleAsk = async () => {
    const response = await askGemini('Sua pergunta aqui');
    console.log(response.text);
  };
  
  return (
    <button onClick={handleAsk} disabled={loading}>
      Perguntar
    </button>
  );
}
```

---

## 📱 Componentes Prontos

### GeminiButton
```typescript
import { GeminiButton } from '@/app/components/gemini/GeminiButton';

// Botão pequeno
<GeminiButton variant="small" />

// Botão com ícone
<GeminiButton variant="icon" />

// Botão completo
<GeminiButton variant="default" initialMode="deep-research" />
```

### GeminiChat
```typescript
import { GeminiChat } from '@/app/components/gemini/GeminiChat';

<GeminiChat
  mode="chat" // ou "deep-research"
  onClose={() => setShow(false)}
  initialPrompt="Explique economia pessoal"
/>
```

### FinanceInsights
```typescript
import { FinanceInsights } from '@/app/components/gemini/FinanceInsights';

<FinanceInsights dateKey="2025-01-15" />
```

---

## 🎨 Customização

### Personalizar Prompts

Edite `app/lib/gemini-client.ts` para ajustar os prompts:

```typescript
// Exemplo: Tornar análise financeira mais detalhada
export async function analyzeFinancialData(...) {
  const prompt = `Você é um consultor financeiro especializado...
    [seu prompt customizado aqui]
  `;
  // ...
}
```

### Adicionar Novas Funções

1. Adicione função em `gemini-client.ts`
2. Adicione case na API route (`app/api/gemini/route.ts`)
3. Adicione método no hook (`app/hooks/useGemini.ts`)
4. Use no componente!

---

## ✅ Checklist de Integração

- [x] Instalar `@google/generative-ai`
- [x] Criar estrutura de arquivos
- [x] Criar componentes de UI
- [ ] Configurar API key no `.env.local`
- [ ] Testar chat simples
- [ ] Testar Deep Research
- [ ] Integrar em Expenses (opcional)
- [ ] Integrar em Journal (opcional)
- [ ] Integrar em Habits (opcional)

---

**Status:** ✅ Estrutura completa, pronto para configurar API key e usar!

