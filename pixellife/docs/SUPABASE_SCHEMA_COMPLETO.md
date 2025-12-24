# Schema Completo do Banco de Dados - PixelLife

## Visão Geral

Este documento contém o schema completo do banco de dados baseado no modelo de **Activities** como entidade central, conforme descrito em `MODELO_DE_DADOS.md`.

## ⚠️ IMPORTANTE: Execute na Ordem

1. Primeiro: Criar tabelas
2. Segundo: Criar índices
3. Terceiro: Habilitar RLS
4. Quarto: Criar políticas RLS

---

## 1. Tabela `activities` (Núcleo do Sistema)

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

-- Comentários para documentação
COMMENT ON TABLE public.activities IS 'Tabela central: todas as atividades da vida do usuário';
COMMENT ON COLUMN public.activities.type IS 'Tipo estrutural: habit, journal, finance, media, biography, goal, health, social';
COMMENT ON COLUMN public.activities.subtype IS 'Especialização livre do tipo (ex: workout, book, expense)';
COMMENT ON COLUMN public.activities.time_precision IS 'Precisão temporal: exact, day, month, range';
COMMENT ON COLUMN public.activities.source IS 'Origem: manual, api, imported, derived';
COMMENT ON COLUMN public.activities.metadata IS 'Dados variáveis por integração (ex: goodreadsId, letterboxdRating)';
```

## 2. Tabela `insights` (Interpretações Derivadas)

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

-- Comentários
COMMENT ON TABLE public.insights IS 'Interpretações derivadas das activities (cache semântico)';
COMMENT ON COLUMN public.insights.based_on IS 'Metadados sobre quais activities geraram este insight';
COMMENT ON COLUMN public.insights.confidence IS 'Confiança do insight (0-1)';
```

## 3. Tabela `user_data` (Compatibilidade com Sistema Atual)

```sql
-- Manter tabela user_data para compatibilidade com código existente
CREATE TABLE IF NOT EXISTS public.user_data (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, data_type)
);

COMMENT ON TABLE public.user_data IS 'Tabela de compatibilidade: dados serializados por tipo';
```

## 4. Índices Críticos (Performance)

### 4.1 Índice Mais Importante (Obrigatório)

```sql
-- Índice para timeline, feed, consultas temporais
CREATE INDEX IF NOT EXISTS idx_activities_user_timestamp 
ON public.activities (user_id, timestamp DESC);
```

**Por quê?**
- Timeline
- Feed
- Mês atual
- Últimas atividades
- "O que eu fiz ontem?"

### 4.2 Índice para Filtro por Tipo

```sql
-- Índice para filtrar por tipo (hábitos, livros, gastos)
CREATE INDEX IF NOT EXISTS idx_activities_user_type_timestamp 
ON public.activities (user_id, type, timestamp DESC);
```

**Serve para:**
- "todos os treinos do mês"
- "todos os livros lidos"
- "todos os gastos"

### 4.3 Índice para Subtype (Opcional)

```sql
-- Só criar se você realmente usa subtype em queries frequentes
CREATE INDEX IF NOT EXISTS idx_activities_user_subtype 
ON public.activities (user_id, subtype) 
WHERE subtype IS NOT NULL;
```

**Quando usar:**
- Queries tipo: "todos os habit: workout"
- Se não usar frequentemente, não crie (índice demais custa)

### 4.4 Índice Parcial para Gastos

```sql
-- Índice parcial para gastos (value < 0)
CREATE INDEX IF NOT EXISTS idx_expenses_only 
ON public.activities (user_id, timestamp DESC) 
WHERE value < 0 AND type = 'finance';
```

**Deixa mais rápido:**
- Cálculo de gastos
- Estatísticas financeiras

### 4.5 Índice para Insights

```sql
-- Índice para insights por usuário
CREATE INDEX IF NOT EXISTS idx_insights_user_generated 
ON public.insights (user_id, generated_at DESC);
```

### 4.6 Índice para Tags (Opcional)

```sql
-- Índice GIN para busca por tags (se usar frequentemente)
CREATE INDEX IF NOT EXISTS idx_activities_tags 
ON public.activities USING GIN (tags) 
WHERE tags IS NOT NULL AND array_length(tags, 1) > 0;
```

### 4.7 Índice para Metadata (Opcional - Cuidado!)

```sql
-- Só criar se você realmente precisa buscar dentro do JSONB frequentemente
-- Exemplo: buscar por goodreadsId
CREATE INDEX IF NOT EXISTS idx_activities_metadata_goodreads 
ON public.activities ((metadata->>'goodreadsId')) 
WHERE metadata->>'goodreadsId' IS NOT NULL;
```

**⚠️ Cuidado:** Índices em JSONB podem ser lentos. Use apenas se realmente necessário.

## 5. Row Level Security (RLS) - OBRIGATÓRIO

### 5.1 Habilitar RLS

```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;
```

### 5.2 Políticas RLS para `activities`

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

### 5.3 Políticas RLS para `insights`

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

### 5.4 Políticas RLS para `user_data` (Já existe, mas garantindo)

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

## 6. Funções Úteis

### 6.1 Trigger para `updated_at`

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

## 7. Verificação

Execute estas queries para verificar:

```sql
-- Verificar se as tabelas existem
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('activities', 'insights', 'user_data');

-- Verificar índices
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('activities', 'insights')
ORDER BY tablename, indexname;

-- Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('activities', 'insights', 'user_data')
ORDER BY tablename, policyname;

-- Verificar se RLS está habilitado
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('activities', 'insights', 'user_data');
```

## 8. Checklist de Segurança

- [ ] RLS habilitado em todas as tabelas
- [ ] Políticas RLS criadas para SELECT, INSERT, UPDATE, DELETE
- [ ] Todas as políticas verificam `auth.uid() = user_id`
- [ ] Índices críticos criados
- [ ] Triggers de `updated_at` funcionando
- [ ] Testado inserção/leitura/atualização/deleção

## 9. Próximos Passos

1. **Migrar dados existentes** de `user_data` para `activities` (se necessário)
2. **Criar funções de agregação** para stats, timeline, biografia
3. **Implementar sincronização** de activities no código
4. **Adicionar integrações** (Goodreads, Letterboxd) usando `source: 'api'`

## 10. Notas Importantes

### Segurança

- ✅ **Nunca** exponha a `service_role` key no frontend
- ✅ Use apenas `anon` key no cliente
- ✅ RLS garante que usuários só acessem seus próprios dados
- ✅ Mesmo com bug no frontend, RLS protege os dados

### Performance

- ✅ Índices são críticos para performance
- ✅ `idx_activities_user_timestamp` é o mais importante
- ✅ Use índices parciais quando possível
- ✅ Cuidado com índices em JSONB (só se realmente necessário)

### Escalabilidade

- ✅ Este modelo aguenta 100k+ atividades por usuário
- ✅ Dezenas de usuários ativos simultaneamente
- ✅ Milhares de atividades por dia

### JSONB

- ✅ **Coluna** → filtros frequentes, ordenação, agregações
- ✅ **JSONB** → identificadores externos, detalhes contextuais, texto livre

---

## Referências

- `MODELO_DE_DADOS.md` - Modelo conceitual completo
- `ARQUITETURA_GERAL.md` - Arquitetura geral do sistema
- `PRINCIPIOS_DESIGN.md` - Princípios de design
- `IMPLEMENTACAO_UI.md` - Como implementar UI baseada neste schema

