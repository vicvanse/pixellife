# 📋 Guia Rápido - Executar Schema Mapas no Supabase

## Passo a Passo

### 1. Acesse o Supabase Dashboard
- Vá para: https://supabase.com/dashboard
- Selecione seu projeto

### 2. Abra o SQL Editor
- No menu lateral, clique em **"SQL Editor"**
- Clique em **"New query"**

### 3. Copie e Cole o Schema
- Abra o arquivo `supabase/mapas_schema.sql` no seu editor
- **Copie TODO o conteúdo** (Ctrl+A, Ctrl+C)
- Cole no SQL Editor do Supabase

### 4. Execute
- Clique no botão **"Run"** (ou pressione Ctrl+Enter)

### 5. Verifique se Funcionou
Execute esta query para verificar:

```sql
-- Verificar categorias criadas
SELECT * FROM mapas_categories;

-- Verificar quantos elementos foram criados
SELECT 
  c.name as categoria,
  COUNT(e.id) as total_elementos
FROM mapas_categories c
LEFT JOIN mapas_elements e ON e.category_key = c.key
GROUP BY c.id, c.name
ORDER BY c.name;
```

**Resultado esperado**:
- 6 categorias
- ~125 elementos distribuídos

---

## ⚠️ Se Der Erro

### Erro: "relation already exists"
**Solução**: As tabelas já existem. Você pode:
- Deletar as tabelas antigas e executar novamente, OU
- Usar `DROP TABLE IF EXISTS` antes de criar

### Erro: "duplicate key value"
**Solução**: Os dados já foram inseridos. Isso é normal, o `ON CONFLICT DO NOTHING` evita duplicatas.

### Erro de permissão
**Solução**: Verifique se está logado no Supabase e tem permissão de administrador.

---

## ✅ Pronto!

Depois de executar, você pode:
1. Testar a página `/mapas` no app
2. Ver os elementos aparecendo na UI
3. Começar a marcar experiências

