# ⚡ Configuração Rápida - API Key Gemini

## 🚨 Erro que você está vendo:

```
❌ Erro: GEMINI_API_KEY não configurada
```

## ✅ Solução Rápida (3 passos):

### 1. Obter API Key (2 minutos)

1. Acesse: **https://makersuite.google.com/app/apikey**
2. Faça login com sua conta Google
3. Clique em **"Create API Key"**
4. **COPIE a chave** (tipo: `AIzaSyC...`)

### 2. Criar arquivo `.env.local` (1 minuto)

**No PowerShell:**
```powershell
# Criar arquivo
New-Item -Path .env.local -ItemType File -Force

# Adicionar chave (substitua SUA_CHAVE_AQUI pela chave que você copiou)
Add-Content -Path .env.local -Value "NEXT_PUBLIC_GEMINI_API_KEY=SUA_CHAVE_AQUI"
```

**OU manualmente:**
1. Crie arquivo `.env.local` na raiz do projeto
2. Adicione esta linha:
   ```
   NEXT_PUBLIC_GEMINI_API_KEY=sua_chave_aqui
   ```

### 3. Testar (30 segundos)

```powershell
npm run analyze:code "teste"
```

**Se funcionar, você verá a análise!** ✅

---

## 🔍 Verificar se está configurado:

```powershell
# Ver conteúdo do arquivo (sem mostrar a chave completa)
Get-Content .env.local | Select-String "GEMINI"
```

**Deve mostrar:** `NEXT_PUBLIC_GEMINI_API_KEY=AIzaSy...`

---

## ❓ Problemas Comuns:

### "Arquivo não encontrado"
→ Certifique-se que `.env.local` está na **raiz** do projeto (mesmo nível que `package.json`)

### "Ainda dá erro"
→ Verifique se:
1. A chave está completa (sem espaços extras)
2. O arquivo está salvo
3. Reinicie o terminal

### "Como saber se a chave está certa?"
→ A chave do Gemini começa com `AIzaSy` e é bem longa (tipo 39 caracteres)

---

## ✅ Pronto!

Depois de configurar, teste:

```powershell
npm run analyze:code "analise a estrutura do projeto"
```

**Tempo total:** ~3 minutos ⏱️

