# Como verificar se os webhooks do GitHub estão funcionando

## Passo 1: Verificar webhooks no GitHub

1. Acesse: https://github.com/vicvanse/pixellife/settings/hooks
2. Procure por um webhook do Vercel (deve ter a URL `https://api.vercel.com/v1/integrations/deploy/...`)
3. Verifique se está **ativo** (verde) e se tem eventos recentes

## Passo 2: Testar o webhook

Se o webhook existir mas não estiver funcionando:
1. Clique no webhook
2. Role até "Recent Deliveries"
3. Veja se há entregas recentes (devem aparecer quando você faz push)
4. Se houver erros, clique em uma entrega para ver os detalhes

## Passo 3: Se não houver webhook

Se não houver webhook do Vercel:
1. No Vercel, vá em Settings → Git
2. Clique em "Disconnect"
3. Depois clique em "Connect Git Repository" novamente
4. Isso deve recriar o webhook

## Passo 4: Deploy manual (solução imediata)

Enquanto isso, você pode fazer um deploy manual:
1. Acesse: https://vercel.com/vicvanses-projects/pixellife/deployments
2. Clique em "Create Deployment"
3. Selecione o branch `main`
4. Clique em "Deploy"

## Passo 5: Verificar configuração de branch

No Vercel, verifique se o branch `main` está configurado para produção:
1. Acesse: https://vercel.com/vicvanses-projects/pixellife/settings/git
2. Verifique se há uma seção "Production Branch"
3. Deve estar configurado para `main`

