# 🔒 Políticas RLS (Row Level Security) para Tabela `finances`

## ⚠️ IMPORTANTE: Segurança da Tabela `finances`

A tabela `finances` precisa ter RLS (Row Level Security) habilitado e políticas configuradas para garantir que:
- Cada usuário só vê seus próprios dados
- Cada usuário só pode inserir/atualizar/deletar seus próprios dados
- O `user_id` sempre corresponde ao usuário autenticado (`auth.uid()`)

## 📋 Passo a Passo

### 1. Acesse o SQL Editor no Supabase

1. Vá para: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** (no menu lateral)

### 2. Execute este SQL

Cole e execute o seguinte SQL:

```sql
-- ============================================
-- POLÍTICAS RLS PARA TABELA finances
-- ============================================

-- Habilitar Row Level Security (RLS) na tabela finances
ALTER TABLE finances ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes (se houver) antes de criar novas
DROP POLICY IF EXISTS "users_select_own_finances" ON finances;
DROP POLICY IF EXISTS "users_insert_own_finances" ON finances;
DROP POLICY IF EXISTS "users_update_own_finances" ON finances;
DROP POLICY IF EXISTS "users_delete_own_finances" ON finances;

-- Política para SELECT: usuários só podem ver seus próprios dados
CREATE POLICY "users_select_own_finances"
  ON finances
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política para INSERT: usuários só podem inserir dados com seu próprio user_id
CREATE POLICY "users_insert_own_finances"
  ON finances
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE: usuários só podem atualizar seus próprios dados
CREATE POLICY "users_update_own_finances"
  ON finances
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política para DELETE: usuários só podem deletar seus próprios dados
CREATE POLICY "users_delete_own_finances"
  ON finances
  FOR DELETE
  USING (auth.uid() = user_id);
```

### 3. Garantir que user_id não seja NULL

Execute este SQL para garantir que registros futuros sempre tenham `user_id`:

```sql
-- Garantir que user_id seja NOT NULL (se ainda não for)
ALTER TABLE finances 
  ALTER COLUMN user_id SET NOT NULL;

-- Adicionar constraint para garantir que user_id sempre referencia auth.users
ALTER TABLE finances
  DROP CONSTRAINT IF EXISTS finances_user_id_fkey;

ALTER TABLE finances
  ADD CONSTRAINT finances_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;
```

### 4. Limpar registros órfãos (opcional, mas recomendado)

Se você tem registros com `user_id = NULL`, você pode deletá-los:

```sql
-- ⚠️ CUIDADO: Isso apaga todos os registros sem user_id
-- Execute apenas se você tem certeza que esses registros não são importantes
DELETE FROM finances WHERE user_id IS NULL;
```

## ✅ Verificação

### 1. Verificar se RLS está habilitado

1. Vá em **Table Editor** → `finances`
2. Clique no botão **"RLS policies"** (ou vá em **Authentication** → **Policies**)
3. Você deve ver 4 políticas:
   - `users_select_own_finances` (SELECT)
   - `users_insert_own_finances` (INSERT)
   - `users_update_own_finances` (UPDATE)
   - `users_delete_own_finances` (DELETE)

### 2. Testar a segurança

1. Faça login na aplicação
2. Tente adicionar uma despesa
3. No Supabase, verifique que o registro tem `user_id` preenchido (não NULL)
4. Tente acessar de outro navegador (sem login) - não deve conseguir ver dados

## 🔍 Como o Código Funciona Agora

O código em `app/lib/finances.ts` agora:

1. **Sempre obtém o usuário autenticado** usando `supabase.auth.getUser()`
2. **Sempre usa `user.id`** ao inserir/atualizar
3. **A RLS garante segurança adicional** mesmo se o código tiver bugs

### Exemplo de uso seguro:

```typescript
// O código agora faz isso automaticamente:
const user = await getCurrentUser(); // Obtém auth.uid()
await supabase.from("finances").insert({
  date: "2025-12-04",
  balance: 100.50,
  user_id: user.id, // Sempre o ID do usuário autenticado
});
```

A RLS garante que:
- Se você tentar inserir com `user_id` diferente do seu `auth.uid()`, será bloqueado
- Se você tentar ver dados de outro usuário, não verá nada
- Mesmo que o código tenha bugs, a RLS protege os dados

## 🛡️ Segurança em Camadas

Agora você tem **dupla proteção**:

1. **Código**: Sempre usa `auth.uid()` do usuário autenticado
2. **RLS**: Garante no banco que só acessa seus próprios dados

Mesmo se alguém conseguir modificar o código do cliente, a RLS no Supabase ainda protege seus dados!

## 📝 Nota sobre a Tabela `finances`

A tabela `finances` está sendo **gradualmente substituída** pela tabela `user_data` para sincronização completa. 

- **Tabela `finances`**: Usada apenas para compatibilidade com código legado
- **Tabela `user_data`**: Sistema principal de sincronização (habits, journal, expenses, etc.)

Ambas as tabelas agora têm RLS configurado corretamente!














