# Como Editar e Publicar no Vercel

## 📝 Fluxo de Trabalho

### 1. Editar Arquivos
- Abra qualquer arquivo no Cursor e edite normalmente
- Os arquivos estão em `pixellife/app/` para páginas
- Componentes estão em `pixellife/app/components/`

### 2. Ver o que mudou
```bash
git status
```

### 3. Adicionar mudanças
```bash
git add .
# ou para arquivos específicos:
git add caminho/do/arquivo.tsx
```

### 4. Fazer commit
```bash
git commit -m "Descrição das mudanças"
```

### 5. Enviar para o GitHub
```bash
git push origin main
```

### 6. Vercel faz deploy automaticamente
- O Vercel detecta o push e faz deploy automaticamente
- Você verá as mudanças no site em alguns minutos

## ⚙️ Configuração Inicial (só uma vez)

Se ainda não configurou seu nome e email no Git:

```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"
```

## 📂 Estrutura de Páginas

- `/` → `app/page.tsx` (redireciona para /display)
- `/display` → `app/display/page.tsx`
- `/habits` → `app/habits/page.tsx`
- `/journal` → `app/journal/page.tsx`
- `/daily` → `app/daily/page.tsx`
- E assim por diante...

## 🔍 Comandos Úteis

```bash
# Ver status das mudanças
git status

# Ver diferenças
git diff

# Ver histórico
git log --oneline

# Desfazer mudanças não commitadas
git checkout -- arquivo.tsx

# Criar uma nova branch
git checkout -b nome-da-branch
```

