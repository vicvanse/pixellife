# Configuração do Supabase Storage para Upload de Ícones

Este guia explica como configurar o Supabase Storage para permitir que usuários façam upload de ícones personalizados para os nós dos guias.

## Passo 1: Criar o Bucket no Supabase

1. Acesse o painel do Supabase: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **Storage** no menu lateral
4. Clique em **New bucket**
5. Configure:
   - **Name**: `user-icons`
   - **Public bucket**: ✅ Marque como público (para facilitar o acesso às imagens)
6. Clique em **Create bucket**

## Passo 2: Configurar Políticas (RLS) do Storage

Para permitir que usuários autenticados façam upload:

1. No bucket `user-icons`, vá em **Policies**
2. Clique em **New Policy**
3. Selecione **For full customization**, clique em **Use this template**
4. Configure a política:

**Policy name**: `Permitir upload para usuários logados`

**Allowed operation**: `INSERT`

**Target roles**: `authenticated`

**Policy definition**:
```sql
bucket_id = 'user-icons' AND auth.uid()::text = (storage.foldername(name))[1]
```

Isso permite que usuários façam upload apenas em suas próprias pastas (organizadas por `user_id`).

**Alternativa mais simples** (se quiser permitir upload de qualquer usuário autenticado):
```sql
bucket_id = 'user-icons'
```

5. Clique em **Review** e depois **Save policy**

## Passo 3: Política para Leitura (SELECT)

Crie outra política para permitir leitura:

**Policy name**: `Permitir leitura de ícones`

**Allowed operation**: `SELECT`

**Target roles**: `authenticated` (ou `anon` se quiser público)

**Policy definition**:
```sql
bucket_id = 'user-icons'
```

## Passo 4: Verificar Variáveis de Ambiente

Certifique-se de que as seguintes variáveis estão configuradas:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

No Vercel:
1. Vá em **Settings** → **Environment Variables**
2. Adicione as variáveis se não existirem
3. Faça um novo deployment

## Como Funciona

1. **Upload**: Quando o usuário seleciona um arquivo, ele é enviado para `user-icons/{userId}/{filename}`
2. **URL Pública**: O Supabase retorna uma URL pública da imagem
3. **Salvamento**: A URL é salva no banco de dados (não o arquivo)
4. **Exibição**: A imagem é carregada usando a URL salva

## Troubleshooting

### Erro 400 ou 403 no upload
- Verifique se as políticas RLS estão configuradas corretamente
- Verifique se o bucket está marcado como público (se necessário)
- Verifique se o usuário está autenticado

### Imagens não aparecem
- Verifique se o bucket está público
- Verifique se a URL retornada está correta
- Verifique o console do navegador para erros CORS

### Erro "Bucket not found"
- Verifique se o nome do bucket está exatamente como `user-icons`
- Verifique se você está usando o projeto correto do Supabase

