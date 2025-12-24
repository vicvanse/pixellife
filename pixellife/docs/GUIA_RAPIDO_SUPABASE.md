# 🚀 Guia Rápido: Criar Tabelas no Supabase

## ⚡ Passo a Passo (5 minutos)

### 1️⃣ Abra o SQL Editor no Supabase

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto: **vicvanse's Project**
3. No menu lateral esquerdo, clique em **SQL Editor** (ícone de código `</>`)

### 2️⃣ Cole e Execute o SQL

1. Clique no botão **"New query"** (ou use o editor que já está aberto)
2. **COPIE TODO O CÓDIGO ABAIXO** e cole no editor:

```sql
-- Criar tabela para armazenar dados do usuário
CREATE TABLE IF NOT EXISTS user_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, data_type)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_data_user_id ON user_data(user_id);
CREATE INDEX IF NOT EXISTS idx_user_data_type ON user_data(data_type);

-- Habilitar Row Level Security (RLS)
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes (se houver) antes de criar novas
DROP POLICY IF EXISTS "Users can view their own data" ON user_data;
DROP POLICY IF EXISTS "Users can insert their own data" ON user_data;
DROP POLICY IF EXISTS "Users can update their own data" ON user_data;
DROP POLICY IF EXISTS "Users can delete their own data" ON user_data;

-- Criar política para usuários só verem seus próprios dados
CREATE POLICY "Users can view their own data"
  ON user_data
  FOR SELECT
  USING (auth.uid() = user_id);

-- Criar política para usuários só inserirem seus próprios dados
CREATE POLICY "Users can insert their own data"
  ON user_data
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Criar política para usuários só atualizarem seus próprios dados
CREATE POLICY "Users can update their own data"
  ON user_data
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Criar política para usuários só deletarem seus próprios dados
CREATE POLICY "Users can delete their own data"
  ON user_data
  FOR DELETE
  USING (auth.uid() = user_id);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger existente (se houver) antes de criar novo
DROP TRIGGER IF EXISTS update_user_data_updated_at ON user_data;

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_user_data_updated_at
  BEFORE UPDATE ON user_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

3. Clique no botão **"Run"** (ou pressione `Ctrl+Enter`)
4. Você deve ver uma mensagem de sucesso: **"Success. No rows returned"**

### 3️⃣ Verificar se Funcionou

1. No menu lateral, clique em **Table Editor** (ícone de tabela)
2. Você deve ver a tabela **`user_data`** na lista
3. Clique na tabela `user_data`
4. A tabela deve estar vazia (isso é normal, os dados serão criados quando você usar a aplicação)

### 4️⃣ Testar na Aplicação

1. Volte para a aplicação: https://pixellife.vercel.app
2. **Faça login** (se ainda não estiver logado)
3. Abra o console do navegador (F12)
4. Você deve ver logs como:
   - `🔧 GlobalLayout: Componente montado`
   - `🔍 useSyncData: Verificando autenticação...`
   - `✅ Usuário logado: [seu-id]`
   - `🧪 Testando conexão com Supabase...`
   - `✅ Tabela 'user_data' existe e está acessível.`

5. Adicione um hábito ou faça alguma alteração
6. Você deve ver logs como:
   - `💾 Salvando habits no Supabase...`
   - `✅ habits salvo no Supabase`

## ✅ Pronto!

Agora os dados serão salvos no Supabase e sincronizados entre todos os seus dispositivos!

## 🔍 Acessar a Página de Hábitos

Para acessar a página de hábitos:
1. Clique no menu no canto superior esquerdo (três linhas horizontais)
2. Clique em **"Habits"**
3. Ou acesse diretamente: https://pixellife.vercel.app/habits

## ❌ Se Algo Der Errado

### Erro: "relation 'user_data' already exists"
- **Solução**: Isso significa que a tabela já existe. Tudo certo! Pule para o passo 3.

### Erro: "policy already exists"
- **Solução**: As políticas já existem. Tudo certo! Pule para o passo 3.

### Erro: "permission denied"
- **Solução**: Certifique-se de estar logado no Supabase e ter permissões no projeto.

### Não vejo a tabela no Table Editor
- **Solução**: 
  1. Recarregue a página do Table Editor (F5)
  2. Verifique se está no schema correto (`public`)
  3. Procure na lista de tabelas (pode estar mais abaixo)














