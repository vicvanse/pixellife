# Configuração do Supabase para Vercel

## ⚠️ IMPORTANTE: Configuração Obrigatória

Para que a autenticação funcione corretamente no Vercel, você **DEVE** configurar as URLs no dashboard do Supabase.

## Passo a Passo

### 1. Acesse o Dashboard do Supabase

1. Vá para: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **Authentication** → **URL Configuration**

### 2. Configure a Site URL

**Site URL:**
```
https://pixellife.vercel.app
```

⚠️ **NÃO use `http://localhost:3000` aqui!** Isso fará com que todos os emails redirecionem para localhost.

### 3. Configure as Redirect URLs

Na seção **Redirect URLs**, adicione estas URLs (uma por linha):

```
https://pixellife.vercel.app/auth/callback
https://pixellife.vercel.app/display
https://pixellife-*.vercel.app/auth/callback
https://pixellife-*.vercel.app/display
http://localhost:3000/auth/callback
http://localhost:3000/display
```

**Explicação:**
- `https://pixellife.vercel.app/*` - URLs da produção
- `https://pixellife-*.vercel.app/*` - URLs de preview deployments (o `*` permite qualquer subdomínio)
- `http://localhost:3000/*` - Para desenvolvimento local

### 4. Salvar e Aguardar

1. Clique em **Save**
2. Aguarde alguns segundos para a configuração ser aplicada
3. Teste fazendo login novamente

## Por que isso é necessário?

O Supabase usa a **Site URL** como fallback quando:
- O `emailRedirectTo` não é uma URL completa e absoluta
- A URL não está na lista de Redirect URLs permitidas
- Há algum problema com a URL fornecida

Mesmo que o código esteja correto, se a Site URL estiver como `localhost`, o Supabase vai redirecionar para localhost.

## Verificação

Após configurar:

1. Faça login na aplicação
2. Verifique o link do email
3. O link deve apontar para `https://pixellife.vercel.app/auth/callback` (ou sua URL do Vercel)
4. Não deve mais tentar acessar `localhost`

## Troubleshooting

Se ainda estiver redirecionando para localhost:

1. Verifique se a Site URL está correta no Supabase
2. Verifique se as Redirect URLs incluem a URL do Vercel
3. Aguarde alguns segundos após salvar (pode levar tempo para aplicar)
4. Tente fazer login novamente
5. Verifique o console do navegador (F12) para ver qual URL está sendo usada















