# 🔴 ERRO: "Erro de permissão" ao salvar bio

## ⚡ SOLUÇÃO RÁPIDA

Você precisa executar este SQL no Supabase **AGORA**:

### 1. Abra o Supabase SQL Editor
- Vá em: https://supabase.com/dashboard
- Selecione seu projeto
- Clique em **"SQL Editor"** no menu lateral
- Clique em **"New query"**

### 2. Cole e execute este SQL:

```sql
-- Remover a política incorreta
DROP POLICY IF EXISTS "users_write_own_activities" ON public.activities;

-- Recriar com WITH CHECK correto
CREATE POLICY "users_write_own_activities"
  ON public.activities
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### 3. Clique em "Run" (ou Ctrl+Enter)

### 4. Verifique se funcionou:

Execute esta query para confirmar:

```sql
SELECT 
  policyname, 
  cmd, 
  qual, 
  with_check 
FROM pg_policies 
WHERE tablename = 'activities' 
  AND policyname = 'users_write_own_activities';
```

**Resultado esperado:**
- `with_check` deve mostrar: `(auth.uid() = user_id)` 
- **NÃO pode ser NULL!**

### 5. Teste no app
- Tente salvar a bio novamente
- Deve funcionar agora!

---

## 📁 Arquivos com SQL completo

Se precisar recriar todas as políticas:
- `EXECUTAR_AGORA_SUPABASE.sql` - SQL simplificado
- `CORRIGIR_POLITICA_INSERT.sql` - SQL com verificação
- `SUPABASE_SCHEMA_COMPLETO.md` - Schema completo (seção 5.2)

