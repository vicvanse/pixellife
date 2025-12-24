# 🔍 Verificar e Corrigir Políticas RLS para user_data

Se você está recebendo o erro `42501: new row violates row-level security policy`, significa que as políticas RLS não estão configuradas corretamente.

## ⚠️ Erro Comum

```
code: '42501'
message: 'new row violates row-level security policy for table "user_data"'
```

## ✅ Solução

Execute este SQL no **Supabase SQL Editor**:

```sql
-- ============================================
-- VERIFICAR E CORRIGIR POLÍTICAS RLS
-- ============================================

-- 1. Verificar se RLS está habilitado
ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Users can view their own data" ON public.user_data;
DROP POLICY IF EXISTS "Users can insert their own data" ON public.user_data;
DROP POLICY IF EXISTS "Users can update their own data" ON public.user_data;
DROP POLICY IF EXISTS "Users can delete their own data" ON public.user_data;

-- 3. Criar políticas corretas

-- SELECT: usuários só podem ver seus próprios dados
CREATE POLICY "Users can view their own data"
  ON public.user_data
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: usuários só podem inserir dados com seu próprio user_id
CREATE POLICY "Users can insert their own data"
  ON public.user_data
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: usuários só podem atualizar seus próprios dados
CREATE POLICY "Users can update their own data"
  ON public.user_data
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: usuários só podem deletar seus próprios dados
CREATE POLICY "Users can delete their own data"
  ON public.user_data
  FOR DELETE
  USING (auth.uid() = user_id);
```

## 🔍 Verificar se Funcionou

1. Execute o SQL acima no Supabase SQL Editor
2. Vá em **Authentication** → **Policies**
3. Procure por `user_data`
4. Você deve ver 4 políticas listadas acima
5. Recarregue a página do app
6. Tente salvar dados novamente

## 📝 Notas Importantes

- **`auth.uid()`**: Retorna o ID do usuário autenticado atual
- **`user_id`**: Coluna na tabela que armazena o ID do usuário
- **`WITH CHECK`**: Valida o valor ANTES de inserir/atualizar
- **`USING`**: Filtra quais linhas podem ser acessadas

## 🐛 Se Ainda Não Funcionar

1. Verifique se você está logado:
   - Abra o console do navegador (F12)
   - Digite: `localStorage.getItem('pixel-life-auth')`
   - Deve retornar um objeto JSON com a sessão

2. Verifique se o `user_id` está correto:
   - No console: `JSON.parse(localStorage.getItem('pixel-life-auth'))`
   - Verifique o `user.id` na sessão

3. Teste diretamente no Supabase:
   - Vá em **Table Editor** → **user_data**
   - Tente inserir manualmente uma linha
   - Se der erro, as políticas RLS estão bloqueando

4. Verifique se a tabela existe:
   - Vá em **Table Editor**
   - Você deve ver a tabela `user_data`
   - Se não existir, execute o SQL de `SUPABASE_DATABASE_SETUP.md` primeiro













