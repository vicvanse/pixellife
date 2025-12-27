# Guia de Execução - Supabase SQL

## ⚠️ IMPORTANTE: Leia Antes de Executar

Este guia te ajuda a executar o SQL do `SUPABASE_SCHEMA_COMPLETO.md` de forma segura e organizada.

## Pré-requisitos

1. ✅ Você tem acesso ao Supabase Dashboard
2. ✅ Você tem um projeto criado
3. ✅ Você está logado no Supabase

## Estratégia: Executar por Seções

**Não copie tudo de uma vez!** Execute por seções e verifique cada passo.

---

## Passo 1: Verificar o que já existe

Primeiro, vamos ver o que você já tem:

```sql
-- Execute isso primeiro para ver o que já existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('activities', 'insights', 'user_data', 'user_profile')
ORDER BY table_name;
```

**O que fazer:**
- Se aparecer `user_data` → você já tem dados, não apague!
- Se aparecer `user_profile` → já está configurado
- Se não aparecer `activities` → precisa criar
- Se não aparecer `insights` → precisa criar

---

## Passo 2: Criar Tabelas (Se não existirem)

### 2.1 Criar `activities` (NOVO - se não existir)

```sql
-- Criar tabela activities (entidade central)
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  subtype TEXT,
  timestamp TIMESTAMPTZ NOT NULL,
  time_precision TEXT NOT NULL DEFAULT 'exact' CHECK (time_precision IN ('exact', 'day', 'month', 'range')),
  value NUMERIC,
  unit TEXT,
  text TEXT,
  tags TEXT[],
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'api', 'imported', 'derived')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**✅ Execute e verifique:** Deve aparecer "CREATE TABLE" sem erros.

### 2.2 Criar `insights` (NOVO - se não existir)

```sql
-- Criar tabela insights (interpretações sobre activities)
CREATE TABLE IF NOT EXISTS public.insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  category TEXT,
  pattern TEXT,
  description TEXT NOT NULL,
  confidence NUMERIC CHECK (confidence >= 0 AND confidence <= 1),
  based_on JSONB DEFAULT '{}'::jsonb,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**✅ Execute e verifique:** Deve aparecer "CREATE TABLE" sem erros.

### 2.3 Verificar `user_data` (JÁ DEVE EXISTIR)

```sql
-- Verificar se user_data existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'user_data'
);
```

**Se retornar `false`:** Execute o SQL de `SUPABASE_DATABASE_SETUP.md` primeiro.

**Se retornar `true`:** Continue para o próximo passo.

---

## Passo 3: Criar Índices Críticos

### 3.1 Índice Mais Importante (OBRIGATÓRIO)

```sql
-- Índice para timeline, feed, consultas temporais
CREATE INDEX IF NOT EXISTS idx_activities_user_timestamp 
ON public.activities (user_id, timestamp DESC);
```

**✅ Execute:** Deve aparecer "CREATE INDEX" sem erros.

### 3.2 Índice para Filtro por Tipo

```sql
-- Índice para filtrar por tipo (hábitos, livros, gastos)
CREATE INDEX IF NOT EXISTS idx_activities_user_type_timestamp 
ON public.activities (user_id, type, timestamp DESC);
```

**✅ Execute:** Deve aparecer "CREATE INDEX" sem erros.

### 3.3 Índice para Insights

```sql
-- Índice para insights por usuário
CREATE INDEX IF NOT EXISTS idx_insights_user_generated 
ON public.insights (user_id, generated_at DESC);
```

**✅ Execute:** Deve aparecer "CREATE INDEX" sem erros.

### 3.4 Índices Opcionais (Só se você usar)

**Índice para subtype (só se usar frequentemente):**
```sql
CREATE INDEX IF NOT EXISTS idx_activities_user_subtype 
ON public.activities (user_id, subtype) 
WHERE subtype IS NOT NULL;
```

**Índice parcial para gastos:**
```sql
CREATE INDEX IF NOT EXISTS idx_expenses_only 
ON public.activities (user_id, timestamp DESC) 
WHERE value < 0 AND type = 'finance';
```

**Índice para tags (só se buscar por tags frequentemente):**
```sql
CREATE INDEX IF NOT EXISTS idx_activities_tags 
ON public.activities USING GIN (tags) 
WHERE tags IS NOT NULL AND array_length(tags, 1) > 0;
```

---

## Passo 4: Habilitar Row Level Security (RLS)

### 4.1 Habilitar RLS nas Tabelas

```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;
```

**✅ Execute:** Deve aparecer "ALTER TABLE" sem erros.

---

## Passo 5: Criar Políticas RLS

### 5.1 Políticas para `activities` (NOVO)

```sql
-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "users_read_own_activities" ON public.activities;
DROP POLICY IF EXISTS "users_write_own_activities" ON public.activities;
DROP POLICY IF EXISTS "users_update_own_activities" ON public.activities;
DROP POLICY IF EXISTS "users_delete_own_activities" ON public.activities;

-- SELECT: usuários só podem ver suas próprias activities
CREATE POLICY "users_read_own_activities"
  ON public.activities
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: usuários só podem inserir activities com seu próprio user_id
CREATE POLICY "users_write_own_activities"
  ON public.activities
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: usuários só podem atualizar suas próprias activities
CREATE POLICY "users_update_own_activities"
  ON public.activities
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: usuários só podem deletar suas próprias activities
CREATE POLICY "users_delete_own_activities"
  ON public.activities
  FOR DELETE
  USING (auth.uid() = user_id);
```

**✅ Execute:** Deve aparecer "CREATE POLICY" 4 vezes sem erros.

### 5.2 Políticas para `insights` (NOVO)

```sql
-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "users_read_own_insights" ON public.insights;
DROP POLICY IF EXISTS "users_write_own_insights" ON public.insights;
DROP POLICY IF EXISTS "users_update_own_insights" ON public.insights;
DROP POLICY IF EXISTS "users_delete_own_insights" ON public.insights;

-- SELECT: usuários só podem ver seus próprios insights
CREATE POLICY "users_read_own_insights"
  ON public.insights
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: usuários só podem inserir insights com seu próprio user_id
CREATE POLICY "users_write_own_insights"
  ON public.insights
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: usuários só podem atualizar seus próprios insights
CREATE POLICY "users_update_own_insights"
  ON public.insights
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: usuários só podem deletar seus próprios insights
CREATE POLICY "users_delete_own_insights"
  ON public.insights
  FOR DELETE
  USING (auth.uid() = user_id);
```

**✅ Execute:** Deve aparecer "CREATE POLICY" 4 vezes sem erros.

### 5.3 Políticas para `user_data` (VERIFICAR/ATUALIZAR)

```sql
-- Garantir que RLS está habilitado
ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "users_select_own_data" ON public.user_data;
DROP POLICY IF EXISTS "users_insert_own_data" ON public.user_data;
DROP POLICY IF EXISTS "users_update_own_data" ON public.user_data;
DROP POLICY IF EXISTS "users_delete_own_data" ON public.user_data;

-- SELECT: usuários só podem ver seus próprios dados
CREATE POLICY "users_select_own_data"
  ON public.user_data
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: usuários só podem inserir dados com seu próprio user_id
CREATE POLICY "users_insert_own_data"
  ON public.user_data
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: usuários só podem atualizar seus próprios dados
CREATE POLICY "users_update_own_data"
  ON public.user_data
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: usuários só podem deletar seus próprios dados
CREATE POLICY "users_delete_own_data"
  ON public.user_data
  FOR DELETE
  USING (auth.uid() = user_id);
```

**✅ Execute:** Deve aparecer "CREATE POLICY" 4 vezes sem erros.

---

## Passo 6: Criar Triggers (Opcional mas Recomendado)

```sql
-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em activities
DROP TRIGGER IF EXISTS update_activities_updated_at ON public.activities;
CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Aplicar trigger em insights
DROP TRIGGER IF EXISTS update_insights_updated_at ON public.insights;
CREATE TRIGGER update_insights_updated_at
  BEFORE UPDATE ON public.insights
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**✅ Execute:** Deve aparecer "CREATE FUNCTION" e "CREATE TRIGGER" sem erros.

---

## Passo 7: Verificação Final

Execute estas queries para verificar se tudo está correto:

```sql
-- 1. Verificar se as tabelas existem
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('activities', 'insights', 'user_data')
ORDER BY table_name;

-- 2. Verificar índices
SELECT 
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('activities', 'insights')
ORDER BY tablename, indexname;

-- 3. Verificar políticas RLS
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('activities', 'insights', 'user_data')
ORDER BY tablename, policyname;

-- 4. Verificar se RLS está habilitado
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('activities', 'insights', 'user_data');
```

**✅ Resultado esperado:**
- 3 tabelas listadas
- Índices criados
- 12 políticas (4 por tabela)
- `rowsecurity = true` para todas

---

## Checklist Final

- [ ] Tabela `activities` criada
- [ ] Tabela `insights` criada
- [ ] Tabela `user_data` existe (ou foi criada)
- [ ] Índice `idx_activities_user_timestamp` criado
- [ ] Índice `idx_activities_user_type_timestamp` criado
- [ ] Índice `idx_insights_user_generated` criado
- [ ] RLS habilitado em todas as tabelas
- [ ] Políticas RLS criadas para `activities` (4 políticas)
- [ ] Políticas RLS criadas para `insights` (4 políticas)
- [ ] Políticas RLS criadas/verificadas para `user_data` (4 políticas)
- [ ] Triggers de `updated_at` criados
- [ ] Verificação final executada sem erros

---

## Próximos Passos

Após executar tudo:

1. ✅ **Testar inserção:** Tente inserir uma activity via código ou SQL Editor
2. ✅ **Testar segurança:** Tente acessar dados de outro usuário (deve falhar)
3. ✅ **Verificar logs:** Veja se há erros no console da aplicação
4. ✅ **Migrar dados:** Quando estiver pronto, migre dados de `user_data` para `activities`

---

## Troubleshooting

### Erro: "relation already exists"

**Solução:** Use `CREATE TABLE IF NOT EXISTS` (já está no código acima). Se ainda der erro, a tabela já existe e está tudo certo.

### Erro: "policy already exists"

**Solução:** O código usa `DROP POLICY IF EXISTS` antes de criar. Se ainda der erro, a política já existe e está tudo certo.

### Erro: "index already exists"

**Solução:** O código usa `CREATE INDEX IF NOT EXISTS`. Se ainda der erro, o índice já existe e está tudo certo.

### Erro: "permission denied"

**Solução:** Verifique se você está usando a conta correta no Supabase Dashboard.

---

## Resumo: Ordem de Execução

1. ✅ **Passo 1:** Verificar o que já existe
2. ✅ **Passo 2:** Criar tabelas (se não existirem)
3. ✅ **Passo 3:** Criar índices críticos
4. ✅ **Passo 4:** Habilitar RLS
5. ✅ **Passo 5:** Criar políticas RLS
6. ✅ **Passo 6:** Criar triggers (opcional)
7. ✅ **Passo 7:** Verificação final

**Tempo estimado:** 5-10 minutos

**Dificuldade:** Fácil (só copiar e colar)

