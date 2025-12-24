# ❄️ Sistema de Identidade - CONGELADO

## Status: Congelado (não apagado)

Este sistema representa o **PixelLife v2** e está **congelado** por decisão arquitetural.

**Não mexer agora.**

---

## Tabelas Congeladas

- `identity_declared`
- `identity_declared_versions`
- `identity_observed`
- `identity_axes`
- `axis_signals`
- `achievements` (versão complexa)
- `user_achievements` (versão complexa)
- `identity_snapshots`
- `feedback_history` (versão interpretativa)

---

## Por que foi congelado?

1. **Muito complexo para o estágio atual**
2. **Cria interpretações, não apenas fatos**
3. **Pode ser normativo/julgador**
4. **Não alinha com a nova proposta de Mapas**

---

## O que fazer?

### ✅ Pode fazer:
- Manter as tabelas no banco
- Não apagar código
- Documentar como "v2"

### ❌ Não fazer:
- Usar no frontend
- Criar lógica em cima
- Desenvolver features baseadas nisso

---

## Quando reativar?

Apenas quando:
- Mapas estiver consolidado
- Houver necessidade real de identidade calculada
- Com muito cuidado para não ser normativo

---

## Arquitetura Atual (v3)

Foco em:
- **Activities** (fatos)
- **Mapas** (experiências)
- **Conquistas simples** (Habbo-style)

Sem interpretação psicológica.

