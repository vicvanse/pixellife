# 🧪 Como Testar o Sistema de Identidade

## ✅ O Que Foi Criado

1. **Página de Teste**: `/test-identity` - Testa todos os hooks e componentes
2. **Seção Feedback**: Integrada no `/board` - Sistema completo funcionando

---

## 🚀 Como Testar

### Opção 1: Página de Teste Dedicada (Recomendado)

1. **Acesse**: `http://localhost:3000/test-identity`
2. **O que você verá**:
   - Status de todos os hooks (quantos eixos, conquistas, etc.)
   - Todos os componentes renderizados
   - Debug info (dados brutos) colapsável

3. **O que testar**:
   - ✅ Verificar se hooks carregam dados
   - ✅ Ver se componentes renderizam sem erros
   - ✅ Ver dados brutos no debug info

---

### Opção 2: Seção Feedback no Board

1. **Acesse**: `http://localhost:3000/board#feedback`
2. **O que você verá**:
   - 4 tabs: Eixos, Conquistas, Comparação, Histórico
   - Botão "🔄 Calcular Identidade"

3. **Como testar**:
   - Clique em "🔄 Calcular Identidade"
   - Aguarde o cálculo (pode demorar alguns segundos)
   - Navegue pelas tabs para ver os resultados

---

## 📋 Checklist de Teste

### Teste Básico (Página de Teste)

- [ ] Página `/test-identity` carrega sem erros
- [ ] Status dos hooks mostra números (não apenas "⏳")
- [ ] Componentes renderizam (mesmo que vazios)
- [ ] Debug info mostra dados JSON

### Teste Funcional (Seção Feedback)

- [ ] Seção Feedback aparece no `/board`
- [ ] Tabs funcionam (Eixos, Conquistas, Comparação, Histórico)
- [ ] Botão "Calcular Identidade" funciona
- [ ] Após calcular, eixos aparecem na tab "Eixos"
- [ ] Sem erros no console do navegador

### Teste de Dados (Supabase)

Execute no Supabase SQL Editor:

```sql
-- Verificar se eixos foram criados
SELECT * FROM identity_axes WHERE user_id = auth.uid();

-- Verificar sinais
SELECT * FROM axis_signals WHERE user_id = auth.uid();

-- Verificar conquistas
SELECT * FROM user_achievements WHERE user_id = auth.uid();
```

---

## 🐛 Troubleshooting

### "Nenhum eixo detectado"

**Causa**: Não há activities suficientes ou pipeline não foi executado.

**Solução**:
1. Registre algumas atividades (hábitos, diário, finanças)
2. Clique em "🔄 Calcular Identidade"
3. Aguarde alguns segundos

### "Erro ao calcular identidade"

**Causa**: Pode ser erro de permissão RLS ou dados faltando.

**Solução**:
1. Verifique o console do navegador (F12)
2. Verifique se executou os schemas SQL no Supabase
3. Verifique se RLS está configurado

### Componentes não aparecem

**Causa**: Hooks não estão retornando dados.

**Solução**:
1. Verifique se está logado
2. Verifique se há dados no Supabase
3. Veja o debug info na página de teste

---

## 🎯 Próximos Passos Após Teste

1. **Se tudo funcionar**: Comece a usar normalmente!
2. **Se houver erros**: Me avise qual erro apareceu
3. **Se quiser melhorar**: Podemos adicionar mais features

---

## 📝 Notas

- A primeira vez pode demorar mais (criação de índices)
- Eixos só aparecem se houver activities suficientes
- Conquistas precisam ser criadas manualmente no Supabase (por enquanto)

