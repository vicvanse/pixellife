# 🔧 Troubleshooting - Gemini API

## ❌ Problema: "models/gemini-pro is not found for API version v1beta"

### Possíveis Causas:

1. **API Key sem permissões**
2. **API não habilitada no Google Cloud**
3. **Versão da API incorreta**

---

## ✅ Soluções

### 1. Verificar API Key no Google AI Studio

1. Acesse: https://aistudio.google.com/app/apikey
2. Verifique se a chave está ativa
3. **IMPORTANTE:** Certifique-se de que a API está habilitada

### 2. Habilitar API no Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Selecione seu projeto (ou crie um)
3. Vá em **APIs & Services** > **Library**
4. Procure por **"Generative Language API"**
5. Clique em **Enable**

### 3. Verificar Permissões da API Key

1. No Google Cloud Console
2. Vá em **APIs & Services** > **Credentials**
3. Clique na sua API key
4. Verifique **API restrictions**:
   - Deve estar **"Don't restrict key"** OU
   - Deve incluir **"Generative Language API"**

### 4. Criar Nova API Key (se necessário)

1. Acesse: https://aistudio.google.com/app/apikey
2. Delete a chave antiga (se quiser)
3. Crie uma nova
4. **IMPORTANTE:** Ao criar, certifique-se de que a API está habilitada

---

## 🔍 Verificar se API Key Está Funcionando

### Teste Manual no Browser:

1. Abra: https://aistudio.google.com/
2. Faça login
3. Tente usar o chat do Gemini
4. Se funcionar lá, a API key deve funcionar no código

### Teste via cURL:

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=SUA_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

---

## 💡 Alternativa: Usar API Key do Google AI Studio

Se a API key do Google Cloud não funcionar, tente:

1. Acesse: https://aistudio.google.com/
2. Use a API key gerada lá (pode ser diferente)
3. Certifique-se de que está usando a mesma conta

---

## 🎯 Próximos Passos

1. **Verifique se a API está habilitada** no Google Cloud Console
2. **Teste a API key** no Google AI Studio
3. **Crie uma nova API key** se necessário
4. **Atualize o `.env.local`** com a nova chave

---

## 📝 Nota

A API do Gemini pode ter mudanças recentes. Se nada funcionar:

1. Verifique a documentação oficial: https://ai.google.dev/docs
2. Verifique se sua conta tem acesso aos modelos
3. Alguns modelos podem estar em preview/beta e requerer acesso especial

---

**Status atual:** API key está configurada, mas modelos não estão disponíveis. Provavelmente precisa habilitar a API no Google Cloud Console.

