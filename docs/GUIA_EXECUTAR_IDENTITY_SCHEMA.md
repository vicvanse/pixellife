# Guia: Executar Schema de Identidade no Supabase

## ⚠️ IMPORTANTE

**Este arquivo SQL vai no SQL Editor do Supabase, NÃO no código TypeScript!**

## Passo a Passo

### 1. Acessar SQL Editor

1. Abra o Supabase Dashboard
2. Vá em **SQL Editor** (menu lateral)
3. Clique em **New Query**

### 2. Copiar e Colar o SQL

1. Abra o arquivo `supabase/identity_schema.sql`
2. Copie **TODO o conteúdo**
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (ou pressione Ctrl+Enter)

### 3. Verificar se Funcionou

Execute esta query para verificar:

```sql
-- Verificar se as tabelas foram criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'identity_declared',
    'identity_declared_versions',
    'identity_observed',
    'feedback_history'
  );
```

Você deve ver 4 tabelas listadas.

### 4. Verificar RLS (Row Level Security)

Execute:

```sql
-- Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN (
  'identity_declared',
  'identity_declared_versions',
  'identity_observed',
  'feedback_history'
);
```

Você deve ver políticas para cada tabela.

## Estrutura Criada

### Tabelas

1. **`identity_declared`** - Identidade declarada atual do usuário
2. **`identity_declared_versions`** - Histórico de versões
3. **`identity_observed`** - Cache de identidade observada (por janela temporal)
4. **`feedback_history`** - Histórico de feedback/insights

### Índices

- `idx_identity_declared_user` - Busca rápida por usuário
- `idx_identity_declared_versions_user_time` - Histórico ordenado
- `idx_identity_observed_user_window` - Cache por usuário e janela
- `idx_feedback_history_user_period` - Feedback por período

### RLS (Row Level Security)

Todas as tabelas têm políticas que garantem:
- Usuário só lê/escreve seus próprios dados
- `auth.uid() = user_id` em todas as operações

## Próximos Passos

Após executar o SQL:

1. ✅ Testar inserção via app (quando logado)
2. ✅ Verificar se RLS está funcionando
3. ✅ Implementar componentes de UI
4. ✅ Testar geração de identidade observada

## Troubleshooting

### Erro: "relation already exists"

Se você já executou o schema antes, as tabelas já existem. Isso é normal. O `CREATE TABLE IF NOT EXISTS` evita erro, mas se quiser recriar:

```sql
-- CUIDADO: Isso apaga todos os dados!
DROP TABLE IF EXISTS public.feedback_history CASCADE;
DROP TABLE IF EXISTS public.identity_observed CASCADE;
DROP TABLE IF EXISTS public.identity_declared_versions CASCADE;
DROP TABLE IF EXISTS public.identity_declared CASCADE;
```

Depois execute o schema novamente.

### Erro: "permission denied"

Verifique se você está usando o SQL Editor com permissões de admin, ou se as políticas RLS estão corretas.

### Erro: "check constraint violation"

Verifique se os valores de `window` estão corretos: `'30d'`, `'90d'`, `'365d'`, `'all'`

