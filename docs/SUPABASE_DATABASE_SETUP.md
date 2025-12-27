# Configuração do Banco de Dados no Supabase

## ⚠️ IMPORTANTE: Criar Tabela para Sincronização

Para que os dados sejam sincronizados entre dispositivos, você precisa criar uma tabela no Supabase.

## Passo a Passo

### 1. Acesse o SQL Editor no Supabase

1. Vá para: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** (no menu lateral)

### 2. Execute este SQL

Cole e execute o seguinte SQL:

```sql
-- Remover tabela existente se quiser recriar do zero (CUIDADO: isso apaga todos os dados!)
-- DROP TABLE IF EXISTS user_data CASCADE;

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

-- Criar índice para melhor performance
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

### 3. Verificar se foi criado

1. Vá em **Table Editor**
2. Você deve ver a tabela `user_data`
3. Verifique se as políticas RLS estão ativas

## O que esta tabela faz:

- **Armazena dados por usuário**: Cada usuário tem seus próprios dados
- **Suporta múltiplos tipos**: habits, journal, expenses, etc.
- **Segurança**: RLS garante que usuários só vejam seus próprios dados
- **Sincronização**: Dados são salvos automaticamente quando você faz alterações

## Após criar a tabela:

1. Os dados serão salvos automaticamente no Supabase quando você fizer alterações
2. Quando você acessar de outro computador, os dados serão carregados automaticamente
3. Os dados ficam sincronizados entre todos os seus dispositivos

## Verificação

### 1. Verificar se a tabela foi criada

1. Vá em **Table Editor** no Supabase
2. Você deve ver a tabela `user_data`
3. Clique na tabela para ver sua estrutura:
   - `id` (UUID, Primary Key)
   - `user_id` (UUID, Foreign Key para auth.users)
   - `data_type` (TEXT)
   - `data` (JSONB)
   - `created_at` (Timestamp)
   - `updated_at` (Timestamp)

### 2. Verificar políticas RLS

1. Vá em **Authentication** → **Policies**
2. Procure por `user_data`
3. Você deve ver 4 políticas:
   - Users can view their own data (SELECT)
   - Users can insert their own data (INSERT)
   - Users can update their own data (UPDATE)
   - Users can delete their own data (DELETE)

### 3. Testar a sincronização

1. Faça login na aplicação
2. Abra o console do navegador (F12)
3. Adicione alguns dados (hábitos, despesas, etc.)
4. Você deve ver logs como:
   - `💾 Salvando habits no Supabase...`
   - `✅ habits salvo no Supabase`
5. Aguarde alguns segundos
6. Acesse de outro computador (ou limpe o localStorage e recarregue)
7. Você deve ver logs como:
   - `🔄 Carregando dados do Supabase...`
   - `✅ Habits carregados do Supabase: X`
8. Os dados devem aparecer automaticamente

### 4. Verificar dados no Supabase

1. Vá em **Table Editor** → `user_data`
2. Você deve ver registros com:
   - `user_id`: Seu ID de usuário
   - `data_type`: "habits", "journal", "expenses", etc.
   - `data`: JSON com seus dados

## Troubleshooting

### Erro: "relation 'user_data' does not exist"

**Solução**: A tabela não foi criada. Execute o SQL novamente no SQL Editor.

### Erro: "new row violates row-level security policy"

**Solução**: As políticas RLS não foram criadas. Execute o SQL novamente, especialmente a parte das políticas.

### Dados não aparecem em outro computador

**Verifique**:
1. Você está logado com a mesma conta?
2. A tabela `user_data` tem registros no Supabase?
3. Os logs do console mostram erros?
4. As variáveis de ambiente estão configuradas no Vercel?

### Dados não são salvos

**Verifique**:
1. Você está logado?
2. O console mostra erros ao salvar?
3. A tabela `user_data` existe?
4. As políticas RLS estão ativas?

