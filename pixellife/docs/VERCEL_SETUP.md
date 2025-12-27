# Configuração do Vercel

## Variáveis de Ambiente Necessárias

Para que a aplicação funcione corretamente no Vercel, você precisa configurar as seguintes variáveis de ambiente:

### 1. Acesse as configurações do projeto no Vercel

1. Vá para o dashboard do Vercel: https://vercel.com/dashboard
2. Selecione seu projeto `pixellife`
3. Vá em **Settings** → **Environment Variables**

### 2. Adicione as seguintes variáveis:

#### `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: `https://aosesxqksxtrkdnkzbew.supabase.co`
- **Environment**: Production, Preview, Development (todas)

#### `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvc2V4c3FreHN0cmRrbmJ6eGV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MzQ0MTgsImV4cCI6MjA3OTUxMDQxOH0.MoVj0HJSxna2tjbG2KwOM2Dr4aTTWb7FjPY4Hg2rHmA`
- **Environment**: Production, Preview, Development (todas)

### 3. Após adicionar as variáveis:

1. Vá em **Deployments**
2. Clique nos três pontos (...) do último deployment
3. Selecione **Redeploy**
4. Ou faça um novo commit para trigger um novo build

## Verificação

Após configurar as variáveis e fazer o redeploy, verifique:

1. O build deve completar com sucesso
2. A aplicação deve carregar sem erros
3. O login deve funcionar corretamente

## Notas Importantes

- As variáveis que começam com `NEXT_PUBLIC_` são expostas ao cliente
- Certifique-se de usar a chave **anon public** do Supabase, não a chave service_role
- Nunca commite as variáveis de ambiente no código















