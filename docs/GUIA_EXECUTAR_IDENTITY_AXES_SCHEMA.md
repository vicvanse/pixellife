# Guia: Executar Schema de Identity Axes no Supabase

## ⚠️ IMPORTANTE

**Este arquivo SQL vai no SQL Editor do Supabase, NÃO no código TypeScript!**

## Passo a Passo

### 1. Acessar SQL Editor

1. Abra o Supabase Dashboard
2. Vá em **SQL Editor** (menu lateral)
3. Clique em **New Query**

### 2. Copiar e Colar o SQL

1. Abra o arquivo `supabase/identity_axes_schema.sql`
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
    'identity_axes',
    'axis_signals',
    'achievements',
    'user_achievements',
    'identity_snapshots',
    'feedback_history'
  )
ORDER BY table_name;
```

Você deve ver 6 tabelas listadas.

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
  'identity_axes',
  'axis_signals',
  'achievements',
  'user_achievements',
  'identity_snapshots',
  'feedback_history'
)
ORDER BY tablename, policyname;
```

Você deve ver políticas para cada tabela.

### 5. Verificar Índices

Execute:

```sql
-- Verificar índices criados
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'identity_axes',
    'axis_signals',
    'achievements',
    'user_achievements',
    'identity_snapshots',
    'feedback_history'
  )
ORDER BY tablename, indexname;
```

## Estrutura Criada

### Tabelas

1. **`identity_axes`** - Eixos de identidade detectados
   - Status: latent, emerging, central, fading
   - Relevance score calculado

2. **`axis_signals`** - Sinais objetivos (provas)
   - activity_count, streak, diary_mentions, time_span, frequency

3. **`achievements`** - Conquistas pré-definidas
   - Condições declarativas (não hardcoded)

4. **`user_achievements`** - Progresso do usuário
   - Progresso infinito, não apenas completo/incompleto

5. **`identity_snapshots`** - Fotografias temporais
   - "Quem eu fui" em períodos específicos

6. **`feedback_history`** - Histórico narrativo
   - Feedback comparável ao longo do tempo

### Índices

- Índices otimizados para queries por usuário
- Índices para ordenação por relevance_score
- Índices para filtros por status, período, etc.

### RLS (Row Level Security)

Todas as tabelas têm políticas que garantem:
- Usuário só lê/escreve seus próprios dados
- `auth.uid() = user_id` em todas as operações
- Achievements são públicos (todos podem ler)

## Fluxo de Dados

```
activities
   ↓
axis_signals (contagens, padrões)
   ↓
identity_axes (relevância calculada)
   ↓
achievements (progressão)
   ↓
identity_snapshots (memória)
   ↓
feedback_history (narrativa)
```

## Próximos Passos

Após executar o SQL:

1. ✅ Testar inserção via app (quando logado)
2. ✅ Verificar se RLS está funcionando
3. ✅ Implementar funções de cálculo
4. ✅ Criar hooks React
5. ✅ Testar geração de eixos e conquistas

## Troubleshooting

### Erro: "relation already exists"

Se você já executou o schema antes, as tabelas já existem. Isso é normal. O `CREATE TABLE IF NOT EXISTS` evita erro.

### Erro: "permission denied"

Verifique se você está usando o SQL Editor com permissões de admin, ou se as políticas RLS estão corretas.

### Erro: "check constraint violation"

Verifique se os valores de `status` estão corretos: `'latent'`, `'emerging'`, `'central'`, `'fading'`

Verifique se os valores de `signal_type` estão corretos: `'activity_count'`, `'streak'`, `'diary_mentions'`, `'time_span'`, `'frequency'`

