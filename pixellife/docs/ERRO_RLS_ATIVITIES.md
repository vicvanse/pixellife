# Erro RLS: "new row violates row-level security policy for table 'activities'"

## Problema

Ao tentar salvar uma bio ou informações do perfil, você está recebendo o erro:
```
new row violates row-level security policy for table "activities"
```

## Causa

As políticas de Row Level Security (RLS) não estão configuradas na tabela `activities` do Supabase.

## Solução

Você precisa executar o SQL das políticas RLS no Supabase SQL Editor.

### Passo a Passo

1. **Acesse o Supabase Dashboard**
   - Vá em: https://supabase.com/dashboard
   - Selecione seu projeto

2. **Abra o SQL Editor**
   - No menu lateral, clique em "SQL Editor"
   - Clique em "New query"

3. **Execute o SQL das Políticas RLS**

   Copie e cole o seguinte SQL:

```sql
-- Habilitar RLS na tabela activities
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

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

4. **Clique em "Run"** (ou pressione Ctrl+Enter)

5. **Verifique se funcionou**
   - Você deve ver uma mensagem de sucesso
   - Tente salvar uma bio novamente no app

## Verificação

Para verificar se as políticas foram criadas:

```sql
-- Ver todas as políticas da tabela activities
SELECT * FROM pg_policies WHERE tablename = 'activities';
```

Você deve ver 4 políticas:
- `users_read_own_activities`
- `users_write_own_activities`
- `users_update_own_activities`
- `users_delete_own_activities`

### ⚠️ IMPORTANTE: Verificar a política INSERT

A política `users_write_own_activities` DEVE ter `with_check` preenchido:

```sql
SELECT 
  policyname, 
  cmd, 
  qual, 
  with_check 
FROM pg_policies 
WHERE tablename = 'activities' 
  AND policyname = 'users_write_own_activities';
```

**Resultado esperado:**
- `with_check` deve ser: `(auth.uid() = user_id)` (NÃO pode ser NULL!)
- Se estiver NULL, a política está incorreta e precisa ser recriada

### 🔧 Se a política INSERT estiver incorreta:

Execute este SQL para corrigir:

```sql
-- Remover a política incorreta
DROP POLICY IF EXISTS "users_write_own_activities" ON public.activities;

-- Recriar com WITH CHECK correto
CREATE POLICY "users_write_own_activities"
  ON public.activities
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

## Nota

Este SQL está também disponível no arquivo `SUPABASE_SCHEMA_COMPLETO.md` na seção "5.2 Políticas RLS para `activities`".

