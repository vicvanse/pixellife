# Políticas RLS para Autenticação - Supabase

Execute este SQL no Supabase SQL Editor para configurar as políticas de segurança.

## 1. Criar tabela `user_profile`

```sql
-- Criar tabela de perfil do usuário
CREATE TABLE IF NOT EXISTS public.user_profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_profile_id ON public.user_profile(id);

-- Habilitar RLS
ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;
```

## 2. Políticas RLS para `user_profile`

```sql
-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "users_select_own_profile" ON public.user_profile;
DROP POLICY IF EXISTS "users_insert_own_profile" ON public.user_profile;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.user_profile;
DROP POLICY IF EXISTS "users_delete_own_profile" ON public.user_profile;

-- SELECT: usuários só podem ver seu próprio perfil
CREATE POLICY "users_select_own_profile"
  ON public.user_profile
  FOR SELECT
  USING (auth.uid() = id);

-- INSERT: usuários só podem inserir seu próprio perfil
CREATE POLICY "users_insert_own_profile"
  ON public.user_profile
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- UPDATE: usuários só podem atualizar seu próprio perfil
CREATE POLICY "users_update_own_profile"
  ON public.user_profile
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- DELETE: usuários só podem deletar seu próprio perfil
CREATE POLICY "users_delete_own_profile"
  ON public.user_profile
  FOR DELETE
  USING (auth.uid() = id);
```

## 3. Função para criar perfil automaticamente após registro

```sql
-- Função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profile (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para executar após inserção em auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

## 4. Atualizar políticas RLS para `user_data` (se ainda não existir)

```sql
-- Garantir que user_data tem RLS habilitado
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

## 5. Configuração do OAuth no Supabase Dashboard

### Google OAuth

1. Vá em **Authentication** → **Providers** → **Google**
2. Ative o provider Google
3. Configure:
   - **Client ID**: Seu Client ID do Google Cloud Console
   - **Client Secret**: Seu Client Secret do Google Cloud Console
4. Adicione a URL de callback:
   - `https://seu-dominio.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback` (para desenvolvimento)
5. No Google Cloud Console, adicione as URLs autorizadas:
   - **Authorized JavaScript origins**: `https://seu-dominio.vercel.app`, `http://localhost:3000`
   - **Authorized redirect URIs**: `https://seu-projeto.supabase.co/auth/v1/callback`

### Apple OAuth

1. Vá em **Authentication** → **Providers** → **Apple**
2. Ative o provider Apple
3. Configure:
   - **Service ID**: Seu Service ID da Apple Developer
   - **Team ID**: Seu Team ID da Apple Developer
   - **Key ID**: Seu Key ID
   - **Private Key**: Sua chave privada (.p8)
4. Adicione a URL de callback:
   - `https://seu-dominio.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback` (para desenvolvimento)

## 6. Configuração de Email no Supabase Dashboard

1. Vá em **Authentication** → **Email Templates**
2. Configure os templates:
   - **Magic Link**: Personalize a mensagem
   - **Password Reset**: Personalize a mensagem
   - **Email Confirmation**: Personalize a mensagem
3. Configure **Site URL**:
   - Produção: `https://seu-dominio.vercel.app`
   - Desenvolvimento: `http://localhost:3000`
4. Configure **Redirect URLs**:
   - `https://seu-dominio.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback`

## 7. Verificação

Execute estas queries para verificar:

```sql
-- Verificar se a tabela user_profile existe
SELECT * FROM public.user_profile LIMIT 1;

-- Verificar políticas RLS
SELECT * FROM pg_policies WHERE tablename = 'user_profile';

-- Verificar trigger
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

## Notas Importantes

- **Nunca** exponha a `service_role` key no frontend
- Use apenas `anon` key no cliente
- RLS garante que usuários só acessem seus próprios dados
- O trigger cria o perfil automaticamente após registro
- OAuth Apple requer configuração no Apple Developer Console

