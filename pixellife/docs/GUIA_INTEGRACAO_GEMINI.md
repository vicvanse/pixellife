# Guia de Integração - Google Gemini e Deep Research

## 📋 Visão Geral

Este guia explica como integrar o Google Gemini e Deep Research no Pixel Life para adicionar funcionalidades de IA.

---

## 🔑 1. Configuração Inicial

### Obter API Key do Gemini

1. Acesse: https://makersuite.google.com/app/apikey
2. Faça login com sua conta Google
3. Crie uma nova API key
4. Copie a chave gerada

### Configurar Variáveis de Ambiente

1. Crie um arquivo `.env.local` na raiz do projeto:
```bash
NEXT_PUBLIC_GEMINI_API_KEY=sua_chave_aqui
```

2. **IMPORTANTE:** Adicione `.env.local` ao `.gitignore` (já está)

3. Na Vercel (ou seu provedor de deploy):
   - Vá em Settings → Environment Variables
   - Adicione `NEXT_PUBLIC_GEMINI_API_KEY` com sua chave

---

## 📦 2. Estrutura Criada

### Arquivos Principais

- **`app/lib/gemini-client.ts`** - Cliente Gemini (server-side)
  - `callGemini()` - Chamada simples
  - `deepResearch()` - Pesquisa profunda iterativa
  - `analyzeFinancialData()` - Análise financeira
  - `generateHabitInsights()` - Insights de hábitos
  - `journalWritingAssistant()` - Assistente de diário

- **`app/api/gemini/route.ts`** - API Route (protege API key)
  - Endpoint: `/api/gemini`
  - Ações: `simple`, `deep-research`, `analyze-financial`, etc.

- **`app/hooks/useGemini.ts`** - Hook React para usar Gemini
  - `askGemini()` - Chat simples
  - `doDeepResearch()` - Deep Research
  - `analyzeFinance()` - Análise financeira
  - `getHabitInsights()` - Insights de hábitos
  - `getJournalAssistant()` - Assistente de diário

- **`app/components/gemini/GeminiChat.tsx`** - Componente de chat
- **`app/components/gemini/FinanceInsights.tsx`** - Insights financeiros

---

## 🚀 3. Como Usar

### Exemplo 1: Chat Simples

```typescript
import { useGemini } from '@/app/hooks/useGemini';

function MyComponent() {
  const { askGemini, loading } = useGemini();

  const handleAsk = async () => {
    const response = await askGemini('Explique o que é economia pessoal');
    console.log(response.text);
  };

  return (
    <button onClick={handleAsk} disabled={loading}>
      Perguntar ao Gemini
    </button>
  );
}
```

### Exemplo 2: Deep Research

```typescript
const { doDeepResearch, loading } = useGemini();

const handleResearch = async () => {
  const result = await doDeepResearch('Como investir em ações para iniciantes', {
    maxIterations: 5, // 5 iterações de pesquisa
    researchDepth: 'deep',
  });
  
  console.log(result.finalAnswer);
  console.log(result.researchSteps); // Ver etapas da pesquisa
};
```

### Exemplo 3: Análise Financeira

```typescript
const { analyzeFinance } = useGemini();

const handleAnalyze = async () => {
  const dataSummary = `
    Gasto mensal: R$ 2000
    Receita: R$ 5000
    Reserva: R$ 10000
  `;
  
  const result = await analyzeFinance(
    dataSummary,
    'Como posso economizar mais?'
  );
  
  console.log(result.text);
};
```

### Exemplo 4: Usar Componente de Chat

```typescript
import { GeminiChat } from '@/app/components/gemini/GeminiChat';

function MyPage() {
  const [showChat, setShowChat] = useState(false);

  return (
    <>
      <button onClick={() => setShowChat(true)}>
        Abrir Gemini Chat
      </button>
      
      {showChat && (
        <GeminiChat
          mode="deep-research" // ou "chat"
          onClose={() => setShowChat(false)}
        />
      )}
    </>
  );
}
```

---

## 🎯 4. Casos de Uso no Pixel Life

### A. Insights Financeiros Automáticos

**Onde:** Na página de Expenses ou Display

```typescript
// Em ExpensesPage ou ProfilePanel
import { FinanceInsights } from '@/app/components/gemini/FinanceInsights';

<FinanceInsights dateKey={todayKey} />
```

**Funcionalidade:**
- Analisa situação financeira atual
- Sugere melhorias
- Responde perguntas sobre finanças

### B. Assistente de Diário

**Onde:** Na página de Journal

```typescript
import { useGemini } from '@/app/hooks/useGemini';

const { getJournalAssistant } = useGemini();

// Quando usuário está escrevendo
const suggestions = await getJournalAssistant(
  currentMood,
  quickNotes,
  previousEntries
);
```

**Funcionalidade:**
- Sugere tópicos de reflexão
- Perguntas para auto-exploração
- Estrutura sugerida para entrada

### C. Insights de Hábitos

**Onde:** Na página de Habits

```typescript
const { getHabitInsights } = useGemini();

const insights = await getHabitInsights(
  JSON.stringify(habits),
  JSON.stringify(streaks)
);
```

**Funcionalidade:**
- Análise de padrões
- Sugestões de melhoria
- Motivação personalizada

### D. Deep Research para Aprendizado

**Onde:** Nova seção ou modal

```typescript
<GeminiChat mode="deep-research" />
```

**Funcionalidade:**
- Pesquisa profunda sobre qualquer tópico
- Múltiplas iterações
- Resposta detalhada e contextualizada

---

## ⚙️ 5. Configurações Avançadas

### Ajustar Parâmetros do Modelo

```typescript
await askGemini('Sua pergunta', {
  temperature: 0.7,        // Criatividade (0-1)
  topP: 0.95,             // Diversidade
  topK: 40,                // Top-K sampling
  maxOutputTokens: 8192,   // Tamanho máximo
  model: 'gemini-1.5-pro', // Modelo a usar
});
```

### Deep Research Customizado

```typescript
await doDeepResearch('Tópico', {
  maxIterations: 5,        // Número de iterações
  researchDepth: 'deep',   // 'shallow' | 'medium' | 'deep'
  temperature: 0.5,        // Mais determinístico
});
```

---

## 🔒 6. Segurança

### ✅ Boas Práticas Implementadas

1. **API Key no Server-Side**
   - API Route (`/api/gemini`) protege a chave
   - Cliente nunca vê a chave diretamente

2. **Rate Limiting** (recomendado adicionar)
   - Limitar requisições por usuário
   - Evitar abuso da API

3. **Validação de Input**
   - Sanitizar prompts do usuário
   - Limitar tamanho de prompts

### ⚠️ Recomendações Adicionais

1. **Rate Limiting:**
```typescript
// Adicionar em app/api/gemini/route.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 req/min
});
```

2. **Validação de Conteúdo:**
   - Filtrar conteúdo sensível
   - Validar respostas antes de mostrar

---

## 📊 7. Custos e Limites

### Modelos Disponíveis

- **gemini-1.5-pro**: Mais capaz, mais caro
- **gemini-pro**: Balanceado
- **gemini-pro-vision**: Com suporte a imagens

### Limites Gratuitos (verificar atualizações)

- Gemini Pro: ~15 RPM (requests per minute)
- Gemini 1.5 Pro: Verificar limites atuais

### Monitoramento

Adicione logging para monitorar uso:
```typescript
console.log('Tokens usados:', result.usage?.totalTokens);
```

---

## 🧪 8. Testes

### Testar Integração

```bash
# 1. Configure a API key
echo "NEXT_PUBLIC_GEMINI_API_KEY=sua_chave" > .env.local

# 2. Inicie o servidor
npm run dev

# 3. Teste via componente
# Abra /display e use o GeminiChat
```

### Testar API Route Diretamente

```bash
curl -X POST http://localhost:3000/api/gemini \
  -H "Content-Type: application/json" \
  -d '{
    "action": "simple",
    "prompt": "Olá, Gemini!"
  }'
```

---

## 🎨 9. Integração com UI Existente

### Adicionar Botão no ProfilePanel

```typescript
// Em app/components/display/ProfilePanel.tsx
import { GeminiChat } from '../gemini/GeminiChat';

const [showGemini, setShowGemini] = useState(false);

// Adicionar botão
<button onClick={() => setShowGemini(true)}>
  💬 Perguntar ao Gemini
</button>

{showGemini && (
  <GeminiChat onClose={() => setShowGemini(false)} />
)}
```

### Adicionar em Expenses

```typescript
// Em app/expenses/page.tsx ou ExpensesOverlay
import { FinanceInsights } from '../components/gemini/FinanceInsights';

<FinanceInsights dateKey={selectedDateKey} />
```

---

## 🐛 10. Troubleshooting

### Erro: "GEMINI_API_KEY não configurada"

**Solução:**
1. Verifique `.env.local` existe
2. Verifique variável está como `NEXT_PUBLIC_GEMINI_API_KEY`
3. Reinicie o servidor (`npm run dev`)

### Erro: "API key inválida"

**Solução:**
1. Verifique se copiou a chave completa
2. Verifique se a chave não expirou
3. Gere uma nova chave se necessário

### Erro: Rate Limit

**Solução:**
1. Aguarde alguns minutos
2. Implemente rate limiting (ver seção 6)
3. Use cache para respostas frequentes

---

## 📚 11. Recursos Adicionais

- [Documentação Gemini](https://ai.google.dev/docs)
- [Gemini API Reference](https://ai.google.dev/api)
- [Deep Research (quando disponível)](https://deepmind.google/technologies/gemini/)

---

## ✅ Checklist de Implementação

- [x] Instalar `@google/generative-ai`
- [x] Criar `gemini-client.ts`
- [x] Criar API Route `/api/gemini`
- [x] Criar hook `useGemini`
- [x] Criar componentes de UI
- [ ] Configurar API key no `.env.local`
- [ ] Configurar API key na Vercel
- [ ] Testar integração
- [ ] Adicionar rate limiting (opcional)
- [ ] Adicionar validação de conteúdo (opcional)

---

**Status:** ✅ Estrutura completa criada, aguardando configuração da API key

