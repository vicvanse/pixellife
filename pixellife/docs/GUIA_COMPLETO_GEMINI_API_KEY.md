# 🔑 Guia Completo: Como Obter API Key do Gemini

## 📋 Passo a Passo Detalhado

### 1. Acessar o Google AI Studio

1. **Abra seu navegador** e vá para:
   ```
   https://makersuite.google.com/app/apikey
   ```
   OU
   ```
   https://aistudio.google.com/app/apikey
   ```

2. **Faça login** com sua conta Google
   - Use a mesma conta que você usa para Gmail, Drive, etc.
   - Não precisa criar conta nova

### 2. Criar API Key

1. **Na página do Google AI Studio**, você verá:
   - Botão "Create API Key" ou "Criar chave de API"
   - Ou uma lista de projetos existentes

2. **Se for a primeira vez:**
   - Clique em "Create API Key"
   - Pode pedir para criar um projeto (escolha um nome qualquer, ex: "Pixel Life")
   - Clique em "Create API Key in new project" ou similar

3. **A API Key será gerada automaticamente**
   - Aparecerá uma chave tipo: `AIzaSyC...` (longa, com letras e números)
   - **COPIE IMEDIATAMENTE** - você só vê ela uma vez!

### 3. Configurar no Projeto

1. **Crie/edite o arquivo `.env.local`** na raiz do projeto:
   ```bash
   # Se não existir, crie:
   touch .env.local
   ```

2. **Adicione a chave:**
   ```bash
   NEXT_PUBLIC_GEMINI_API_KEY=AIzaSyC...sua_chave_aqui
   ```

3. **Salve o arquivo**

4. **Reinicie o servidor** (se estiver rodando):
   ```bash
   # Pare o servidor (Ctrl+C)
   # Inicie novamente
   npm run dev
   ```

---

## ✅ Verificar se Funcionou

### Teste Rápido no Terminal

```bash
# Verificar se a variável está carregada
echo $NEXT_PUBLIC_GEMINI_API_KEY
```

### Teste com Análise de Código

```bash
npm run analyze:code "teste simples"
```

Se funcionar, você verá a análise. Se não, verá erro sobre API key não configurada.

---

## 🔒 Segurança

### ⚠️ IMPORTANTE - Nunca Faça Isso:

- ❌ **NÃO** commite o `.env.local` no Git
- ❌ **NÃO** compartilhe a API key publicamente
- ❌ **NÃO** coloque a chave em código fonte

### ✅ O Que Está Seguro:

- ✅ `.env.local` já está no `.gitignore`
- ✅ A chave fica apenas no seu computador
- ✅ API Route protege a chave (não expõe ao cliente)

---

## 💰 Custos e Limites

### Plano Gratuito

- **Gemini Pro**: ~15 requisições por minuto (RPM)
- **Gemini 1.5 Pro**: Verificar limites atuais
- **Quota diária**: Geralmente generosa para uso pessoal

### Monitoramento

- Acesse: https://aistudio.google.com/
- Veja uso em "Usage" ou "Uso"
- Configure alertas se quiser

---

## 🐛 Troubleshooting

### Erro: "API key not found"

**Solução:**
1. Verifique se `.env.local` existe na raiz do projeto
2. Verifique se a variável está como `NEXT_PUBLIC_GEMINI_API_KEY`
3. Reinicie o servidor (`npm run dev`)

### Erro: "Invalid API key"

**Solução:**
1. Verifique se copiou a chave completa
2. Verifique se não há espaços extras
3. Gere uma nova chave se necessário

### Erro: "Quota exceeded"

**Solução:**
1. Aguarde alguns minutos (rate limit)
2. Verifique sua quota em https://aistudio.google.com/
3. Considere upgrade se necessário

---

## 📝 Checklist

- [ ] Acessei https://makersuite.google.com/app/apikey
- [ ] Fiz login com minha conta Google
- [ ] Criei uma API key
- [ ] Copiei a chave
- [ ] Criei/editei `.env.local`
- [ ] Adicionei `NEXT_PUBLIC_GEMINI_API_KEY=...`
- [ ] Salvei o arquivo
- [ ] Reiniciei o servidor
- [ ] Testei com `npm run analyze:code "teste"`

---

## 🎯 Próximo Passo

Depois de configurar, teste:

```bash
npm run analyze:code "analise a estrutura do projeto"
```

---

**Tempo estimado:** 5 minutos ⏱️

