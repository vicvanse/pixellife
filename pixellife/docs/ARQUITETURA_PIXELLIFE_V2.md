# 🏗️ Arquitetura PixelLife v2

## Princípio Fundamental

> **Fato → pode ir pro banco**  
> **Interpretação → não agora**

## Estrutura em 3 Blocos

### 🔹 BLOCO A — ATIVIDADES (imutável)

**Tabela**: `activities`

**Propósito**: Verdade factual do que aconteceu

**Características**:
- Imutável
- Tudo nasce aqui
- Fonte única de verdade
- Não interpreta, apenas registra

**Uso**: Base para todos os outros sistemas

---

### 🔹 BLOCO B — MAPAS (experiência / pokédex)

**Tabelas**:
- `mapas_categories` (6 categorias fixas)
- `mapas_elements` (experiências dentro de cada categoria)
- `mapas_user_elements` (estados do usuário)
- `mapas_state_history` (histórico de mudanças)

**Propósito**: Sistema expressivo do app

**Categorias**:
- 🏃 Esportes
- 🍳 Cozinhar
- 🎨 Criar
- 🎬 Consumir
- 🌍 Explorar
- 🌱 Geral

**Estados**:
- Não feito
- Experimentado
- Satisfeito
- Completo

**Características**:
- Não normativo
- Não julgador
- Apenas registra experiências
- Cria identidade sem rotular

---

### 🔹 BLOCO C — CONQUISTAS (Habbo-style)

**Tabelas**:
- `achievements` (conquistas pré-definidas)
- `user_achievements` (progresso do usuário)

**Propósito**: Conquistas simples, visuais, não psicológicas

**Características**:
- Simples
- Visuais
- Baseadas em experiência vivida
- Nada de eixo psicológico

---

## ❌ O que NÃO fazer agora

- `identity_axes` (congelado)
- `identity_observed` (congelado)
- `identity_declared` (congelado)
- Snapshots automáticos
- Cálculo de identidade
- Pesos complexos
- Inferência cruzada

**Status**: Congelado, não apagado. É o PixelLife v2, não mexer agora.

---

## ✅ O que fazer agora

### Frases factuais simples:
- "Você começou X"
- "Você experimentou Y"
- "Você voltou a Z"

### Contagens simples:
- Quantas vezes apareceu
- Quando começou
- Quando parou

### Sem interpretação:
- Não dizer "isso é central"
- Não dizer "você deveria"
- Apenas mostrar o que aconteceu

---

## 🧩 Regra de Ouro para o Banco

**Sempre se pergunte**:

> Essa tabela representa um **fato** ou uma **interpretação**?

- **Fato** → pode ir pro banco ✅
- **Interpretação** → não agora ❌

**Exemplos**:

✅ Fato: "Usuário criou hábito 'Treinar' em 15/01/2025"
✅ Fato: "Usuário mudou estado de 'Skate' para 'Experimentado'"
❌ Interpretação: "Esportes é central na sua vida"
❌ Interpretação: "Você é uma pessoa criativa"

---

## 📐 Decisões Arquiteturais

### "É ok deixar assim?"
**Agora**: Não. Está grande demais para o estágio.

### "Deveria deixar tudo em uma só?"
**Definitivamente não**. Isso destruiria clareza.

### "O que fazer?"
**Consolidar em poucos sistemas fortes**:
1. Activities (fatos)
2. Mapas (experiências)
3. Conquistas (celebrações)

---

## 🎯 Próximos Passos

1. ✅ Schema Mapas criado
2. ⏳ Executar schema no Supabase
3. ⏳ Criar UI do Mapas
4. ⏳ Simplificar Conquistas
5. ⏳ Conectar Activities → Mapas (detecção automática)

