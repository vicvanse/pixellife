# 🔍 Supabase vs localStorage: Status Atual

## 📊 Resumo

A aplicação usa uma **arquitetura híbrida**:
- **localStorage**: Cache local para performance e offline
- **Supabase**: Sincronização entre dispositivos e backup

## ✅ O que está usando Supabase

### 1. **Habits (Hábitos)**
- ✅ **Salvando**: `AppContext` → `saveToSupabase(userId, "habits", habits)`
- ✅ **Carregando**: `AppContext` → `loadFromSupabase(userId, "habits")`
- 📦 **Tabela**: `user_data` com `data_type = "habits"`
- 🔄 **Sincronização**: Automática via `useSyncData` hook

### 2. **Journal (Diário)**
- ✅ **Salvando**: `AppContext` → `saveToSupabase(userId, "journal", journal)`
- ✅ **Carregando**: `AppContext` → `loadFromSupabase(userId, "journal")`
- 📦 **Tabela**: `user_data` com `data_type = "journal"`
- 🔄 **Sincronização**: Automática via `useSyncData` hook

### 3. **Expenses (Despesas)**
- ✅ **Salvando**: `useSyncExpenses` → `saveToSupabase(userId, "expenses", data)`
- ✅ **Carregando**: `useSyncExpenses` → `loadFromSupenses(userId, "expenses")`
- 📦 **Tabela**: `user_data` com `data_type = "expenses"`
- 🔄 **Sincronização**: Automática via `useSyncExpenses` hook
- ⚠️ **Nota**: Ainda usa `localStorage` como cache, mas sincroniza com Supabase

### 4. **Possessions (Objetivos)**
- ✅ **Salvando**: `useSyncPossessions` → `saveToSupabase(userId, "possessions", data)`
- ✅ **Carregando**: `useSyncPossessions` → `loadFromSupabase(userId, "possessions")`
- 📦 **Tabela**: `user_data` com `data_type = "possessions"`
- 🔄 **Sincronização**: Automática via `useSyncPossessions` hook

### 5. **Tree (Árvore de Habilidades)**
- ✅ **Salvando**: `useSyncTree` → `saveToSupabase(userId, "tree", data)`
- ✅ **Carregando**: `useSyncTree` → `loadFromSupabase(userId, "tree")`
- 📦 **Tabela**: `user_data` com `data_type = "tree"`
- 🔄 **Sincronização**: Automática via `useSyncTree` hook

### 6. **Cosmetics (Cosméticos)**
- ✅ **Salvando**: `useSyncCosmetics` → `saveToSupabase(userId, "cosmetics", data)`
- ✅ **Carregando**: `useSyncCosmetics` → `loadFromSupabase(userId, "cosmetics")`
- 📦 **Tabela**: `user_data` com `data_type = "cosmetics"`
- 🔄 **Sincronização**: Automática via `useSyncCosmetics` hook

### 7. **Finances (Legado)**
- ⚠️ **Status**: Código legado, sendo substituído por `user_data`
- ✅ **Salvando**: `saveFinance()` → tabela `finances` (com RLS)
- ✅ **Carregando**: `getFinanceByDate()` → tabela `finances` (com RLS)
- 📦 **Tabela**: `finances` (separada, com RLS configurado)
- 🔄 **Sincronização**: Manual (código legado)

## 🔄 Como Funciona a Sincronização

### Fluxo Típico:

1. **Usuário faz alteração** → Dados salvos no `localStorage` (rápido, offline)
2. **Hook de sincronização detecta mudança** → Aguarda 2 segundos (debounce)
3. **Salva no Supabase** → `saveToSupabase(userId, dataType, data)`
4. **Em outro dispositivo** → `loadFromSupabase(userId, dataType)` carrega dados
5. **Dados aplicados ao localStorage** → Interface atualizada

### Vantagens desta Arquitetura:

- ✅ **Performance**: localStorage é instantâneo
- ✅ **Offline**: Funciona sem internet
- ✅ **Sincronização**: Dados disponíveis em todos os dispositivos
- ✅ **Backup**: Dados seguros no Supabase

## 📁 Arquivos Importantes

### Sincronização:
- `app/lib/supabase-sync.ts` - Funções de salvar/carregar do Supabase
- `app/hooks/useSyncData.ts` - Hooks de sincronização automática
- `app/context/AppContext.tsx` - Contexto que sincroniza habits e journal

### Código Legado (finances):
- `app/lib/finances.ts` - Funções para tabela `finances` (com RLS)
- `app/components/ExpensesOverlay.tsx` - Usa `finances` (legado)

## 🔍 Como Verificar se Está Usando Supabase

### 1. No Console do Navegador:

Procure por logs como:
```
💾 Salvando habits no Supabase...
✅ habits salvo no Supabase
🔄 Carregando habits do Supabase...
✅ Habits carregados do Supabase: 5
```

### 2. No Supabase Dashboard:

1. Vá em **Table Editor** → `user_data`
2. Você deve ver registros com:
   - `user_id`: Seu ID de usuário
   - `data_type`: "habits", "journal", "expenses", etc.
   - `data`: JSON com seus dados

### 3. No Código:

Procure por:
- `saveToSupabase(` - Salva no Supabase
- `loadFromSupabase(` - Carrega do Supabase
- `supabase.from("user_data")` - Acesso direto à tabela

## ⚠️ Código Híbrido (localStorage + Supabase)

Alguns módulos ainda usam `localStorage` como cache principal:

### Expenses (`app/hooks/useExpenses.ts`):
- ✅ **Lê de**: `localStorage` (cache local)
- ✅ **Escreve em**: `localStorage` (cache local)
- ✅ **Sincroniza com**: Supabase via `useSyncExpenses` hook

**Por quê?**
- Expenses tem muitos dados (diários, mensais, reservas)
- localStorage é mais rápido para cálculos
- Supabase sincroniza em background

### Tree (`app/hooks/useTree.ts`):
- ✅ **Lê de**: `localStorage` (cache local)
- ✅ **Escreve em**: `localStorage` (cache local)
- ✅ **Sincroniza com**: Supabase via `useSyncTree` hook

## 🎯 Conclusão

**A aplicação ESTÁ usando Supabase** para sincronização! 

O `localStorage` é usado como:
- ✅ Cache local para performance
- ✅ Suporte offline
- ✅ Redução de chamadas ao Supabase

Mas **todos os dados importantes são sincronizados** com Supabase via:
- ✅ `user_data` table (habits, journal, expenses, possessions, tree, cosmetics)
- ✅ `finances` table (legado, com RLS)

## 🔒 Segurança

- ✅ **RLS habilitado** em `user_data` e `finances`
- ✅ **Código usa `auth.uid()`** para garantir user_id correto
- ✅ **Políticas RLS** garantem que usuários só vejam seus próprios dados














