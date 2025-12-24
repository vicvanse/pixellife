# Variáveis de Ambiente - Pixel Life

## Configuração Necessária

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```bash
# Google Gemini API Key
# Obtenha em: https://makersuite.google.com/app/apikey
NEXT_PUBLIC_GEMINI_API_KEY=sua_chave_gemini_aqui

# Supabase (já configurado)
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_supabase
```

## Como Obter a API Key do Gemini

1. Acesse: https://makersuite.google.com/app/apikey
2. Faça login com sua conta Google
3. Clique em "Create API Key"
4. Copie a chave gerada
5. Cole no `.env.local`

## Importante

- **NUNCA** commite o arquivo `.env.local` no Git
- O arquivo já está no `.gitignore`
- Para produção (Vercel), configure as variáveis em Settings → Environment Variables

