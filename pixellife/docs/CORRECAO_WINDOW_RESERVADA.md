# ✅ Correção: Palavra Reservada "window"

## Problema

O PostgreSQL não permite usar `window` como nome de coluna porque é uma palavra reservada.

**Erro:**
```
ERROR: 42601: syntax error at or near "window"
```

## Solução Aplicada

Renomeei `window` para `time_window` em todos os lugares:

### 1. SQL Schema (`supabase/identity_schema.sql`)
- ✅ Coluna renomeada: `window` → `time_window`
- ✅ Índice atualizado: `idx_identity_observed_user_time_window`

### 2. TypeScript Types (`app/types/identity.ts`)
- ✅ Interface atualizada: `window` → `time_window`

### 3. React Hooks (`app/hooks/useIdentityObserved.ts`)
- ✅ Queries atualizadas para usar `time_window`

## O Que Fazer Agora

1. ✅ **Execute novamente o SQL corrigido:**
   - Abra `supabase/identity_schema.sql`
   - Copie TODO o conteúdo
   - Cole no SQL Editor do Supabase
   - Execute

2. ✅ **Se a tabela já foi criada com erro:**
   - Execute primeiro:
   ```sql
   DROP TABLE IF EXISTS public.identity_observed CASCADE;
   ```
   - Depois execute o schema corrigido novamente

## Arquivos Corrigidos

- ✅ `supabase/identity_schema.sql`
- ✅ `app/types/identity.ts`
- ✅ `app/hooks/useIdentityObserved.ts`

Agora deve funcionar! 🎉

