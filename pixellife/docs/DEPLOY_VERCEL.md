# Como fazer deploy manual no Vercel

Se o deploy automático não estiver funcionando, você pode fazer um deploy manual:

## Opção 1: Via Dashboard do Vercel

1. Acesse: https://vercel.com/vicvanses-projects/pixellife/deployments
2. Clique em "Create Deployment"
3. Selecione o branch `main`
4. Clique em "Deploy"

## Opção 2: Via Vercel CLI

```bash
# Instalar Vercel CLI (se ainda não tiver)
npm i -g vercel

# Fazer login
vercel login

# Fazer deploy
vercel --prod
```

## Opção 3: Verificar e reconectar GitHub

1. Acesse: https://vercel.com/vicvanses-projects/pixellife/settings/git
2. Se o repositório não estiver conectado, clique em "Connect Git Repository"
3. Selecione o repositório `vicvanse/pixellife`
4. Autorize a conexão

## Verificar se o deploy está funcionando

Após fazer o deploy, verifique:
- A rota `/daily` deve estar acessível
- O menu lateral deve ter o link "DIÁRIO" apontando para `/daily`
- A página deve carregar com os cards de Journal e Habits

