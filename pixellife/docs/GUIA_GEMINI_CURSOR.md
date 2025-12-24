# 🚀 Usando Gemini no Cursor para Análise de Código

## 🎯 O Que Foi Criado

Uma ferramenta CLI que usa **Gemini Deep Research** para analisar seu código e gerar insights profundos, sugestões e documentação.

---

## 📦 Instalação

### 1. Instalar Dependências

```bash
npm install --save-dev tsx glob @types/glob
```

### 2. Configurar API Key

```bash
# No .env.local ou variáveis de ambiente
NEXT_PUBLIC_GEMINI_API_KEY=sua_chave_aqui
# OU
GEMINI_API_KEY=sua_chave_aqui
```

---

## 🚀 Como Usar

### Análise Básica

```bash
npm run analyze:code "analise a estrutura do projeto"
```

### Análise com Deep Research (Múltiplas Iterações)

```bash
npm run analyze:deep "sugira melhorias de performance"
```

### Análise e Salvar Resultado

```bash
npm run analyze:code "identifique possíveis bugs" --save
```

### Exemplos Práticos

```bash
# Análise geral
npm run analyze:code "analise a arquitetura do projeto"

# Foco em performance
npm run analyze:code "identifique problemas de performance"

# Foco em segurança
npm run analyze:code "analise vulnerabilidades de segurança"

# Foco em qualidade de código
npm run analyze:code "sugira refatorações e melhorias"

# Análise profunda com Deep Research
npm run analyze:deep "faça uma análise completa da estrutura financeira do projeto"
```

---

## 💡 Casos de Uso

### 1. **Análise de Arquitetura**

```bash
npm run analyze:code "analise a arquitetura do projeto e sugira melhorias estruturais"
```

**O que faz:**
- Analisa estrutura de pastas
- Identifica padrões de código
- Sugere melhorias arquiteturais
- Identifica acoplamento e coesão

---

### 2. **Análise de Performance**

```bash
npm run analyze:code "identifique problemas de performance e sugira otimizações"
```

**O que faz:**
- Analisa hooks e componentes
- Identifica re-renders desnecessários
- Sugere memoização
- Analisa tamanho de bundles

---

### 3. **Análise de Segurança**

```bash
npm run analyze:code "analise vulnerabilidades de segurança no código"
```

**O que faz:**
- Verifica exposição de API keys
- Analisa validação de inputs
- Verifica sanitização de dados
- Sugere melhorias de segurança

---

### 4. **Refatoração e Qualidade**

```bash
npm run analyze:code "sugira refatorações para melhorar qualidade do código"
```

**O que faz:**
- Identifica código duplicado
- Sugere extração de funções
- Analisa complexidade ciclomática
- Sugere melhorias de legibilidade

---

### 5. **Análise Profunda com Deep Research**

```bash
npm run analyze:deep "faça uma análise completa do sistema financeiro"
```

**O que faz:**
- Múltiplas iterações de análise
- Análise cada vez mais profunda
- Insights detalhados
- Sugestões específicas com exemplos

---

## 📊 Exemplo de Saída

```
🚀 Gemini Code Analyzer

📝 Pergunta: analise a estrutura do projeto e sugira melhorias gerais

📂 Lendo arquivos do projeto...
✅ 45 arquivos encontrados

📋 Criando resumo do código...
✅ Resumo criado

🔍 Analisando código com Gemini Deep Research...

================================================================================
📊 RESULTADO DA ANÁLISE
================================================================================

# Análise do Projeto Pixel Life

## Pontos Fortes
1. **Arquitetura bem organizada**: Separação clara entre components, hooks, e lib
2. **Hooks customizados**: Uso consistente de hooks para lógica reutilizável
3. **TypeScript**: Tipagem forte em todo o projeto

## Oportunidades de Melhoria

### 1. Refatoração de useExpenses
O hook `useExpenses.ts` tem mais de 1100 linhas, violando o princípio de responsabilidade única.

**Sugestão:**
- Extrair lógica financeira para `lib/finance-engine.ts` ✅ (já feito parcialmente)
- Separar em hooks menores: `useTransactions`, `useBudget`, `useLedger`
- Criar camada de serviço para cálculos

### 2. Performance
- Adicionar `React.memo` em componentes que não mudam frequentemente
- Usar `useMemo` para cálculos pesados em `ProfilePanel`
- Considerar code splitting para rotas

### 3. Testes
- Expandir cobertura de testes (atualmente apenas finance-engine)
- Adicionar testes de integração para hooks críticos
- Testes E2E para fluxos principais

[... mais insights ...]

================================================================================
```

---

## 🔧 Configurações Avançadas

### Limitar Arquivos Analisados

Edite `scripts/gemini-code-analyzer.ts`:

```typescript
const MAX_FILES_TO_ANALYZE = 20; // Ajuste conforme necessário
```

### Tamanho Máximo de Arquivo

```typescript
const MAX_FILE_SIZE = 50000; // ~50KB por arquivo
```

### Modelo Gemini

```typescript
model: 'gemini-1.5-pro', // ou 'gemini-pro'
```

---

## 🎨 Integração com Cursor

### Opção 1: Terminal Integrado

1. Abra o terminal no Cursor (`Ctrl+`` ` ou `View > Terminal`)
2. Execute os comandos diretamente
3. Resultados aparecem no terminal

### Opção 2: Task Runner

1. Cursor → `Tasks: Configure Task`
2. Adicione:

```json
{
  "label": "Analisar Código com Gemini",
  "type": "shell",
  "command": "npm run analyze:code",
  "args": ["${input:question}"]
}
```

### Opção 3: Atalho Personalizado

1. Cursor → `File > Preferences > Keyboard Shortcuts`
2. Adicione atalho para executar análise

---

## 📝 Workflow Sugerido

### Antes de Refatorar

```bash
npm run analyze:deep "analise este módulo e sugira refatorações"
```

### Antes de Adicionar Feature

```bash
npm run analyze:code "onde seria melhor lugar para adicionar funcionalidade X?"
```

### Após Mudanças Grandes

```bash
npm run analyze:code "analise as mudanças recentes e identifique problemas"
```

### Revisão de Código

```bash
npm run analyze:deep "faça uma revisão completa do código e sugira melhorias"
```

---

## 🚨 Limitações

1. **Tokens**: Gemini tem limites de tokens. Arquivos muito grandes são pulados.
2. **Velocidade**: Análise profunda pode levar alguns minutos.
3. **Custo**: Verificar limites gratuitos do Gemini.

---

## 💡 Dicas

1. **Seja Específico**: Perguntas específicas geram melhores respostas
2. **Use Deep Research**: Para análises complexas, use `--deep`
3. **Salve Resultados**: Use `--save` para documentar análises
4. **Itere**: Faça múltiplas análises focadas em diferentes aspectos

---

## 🔄 Próximos Passos

### Melhorias Futuras

1. **Análise Incremental**: Analisar apenas arquivos modificados
2. **Integração com Git**: Analisar apenas mudanças em commits
3. **Dashboard Web**: Interface visual para análises
4. **Comparação Temporal**: Comparar análises ao longo do tempo
5. **Sugestões Automáticas**: Gerar PRs com sugestões

---

## ✅ Checklist

- [x] Script de análise criado
- [x] Suporte a Deep Research
- [x] Integração com Gemini API
- [x] Documentação completa
- [ ] Configurar API key
- [ ] Testar primeira análise
- [ ] Integrar no workflow diário

---

**Agora você tem um assistente de IA poderoso para analisar seu código diretamente no Cursor!** 🎉

