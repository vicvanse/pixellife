# Guia de Testes - Pixel Life

## Estrutura de Testes

Este projeto está preparado para testes unitários e de integração. A estrutura básica foi criada em `app/lib/finance-engine.test.ts`.

## Instalação

Para executar os testes, instale o Vitest:

```bash
npm install --save-dev vitest @vitest/ui @vitest/coverage-v8
```

## Configuração

Crie um arquivo `vitest.config.ts` na raiz do projeto:

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test-setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './app'),
    },
  },
});
```

## Executar Testes

```bash
# Executar todos os testes
npm test

# Executar em modo watch
npm test -- --watch

# Executar com UI
npm test -- --ui

# Executar com coverage
npm test -- --coverage
```

## Prioridades de Testes

### Alta Prioridade
1. **Lógica Financeira Incremental** (`getAccountMoney`)
   - Busca retroativa de valores salvos
   - Cálculo incremental correto
   - Continuidade entre meses
   - Edição de transações passadas

2. **Cálculo de Limite Restante**
   - Ciclo de orçamento correto
   - Gastos acumulados desde início do ciclo
   - Limite do mês correto (não do mês atual)

### Média Prioridade
3. **Sincronização**
   - Exportação de dados
   - Importação de dados
   - Resolução de conflitos

4. **Hooks Customizados**
   - `useExpenses` (após refatoração)
   - `useHabits`
   - `useJournal`

## Estrutura Recomendada

```
app/
├── lib/
│   ├── finance-engine.ts      # Funções puras de cálculo
│   └── finance-engine.test.ts # Testes unitários
├── hooks/
│   └── __tests__/             # Testes de hooks
└── components/
    └── __tests__/              # Testes de componentes
```

## Exemplo de Teste

Veja `app/lib/finance-engine.test.ts` para exemplos de testes da lógica financeira.

