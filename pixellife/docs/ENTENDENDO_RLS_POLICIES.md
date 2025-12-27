# Entendendo Políticas RLS no Supabase

## Campos das Políticas RLS

Quando você consulta `pg_policies`, você vê estes campos:

- **`policyname`**: Nome da política
- **`cmd`**: Comando SQL (SELECT, INSERT, UPDATE, DELETE)
- **`qual`**: Cláusula `USING` (quais linhas a política se aplica)
- **`with_check`**: Cláusula `WITH CHECK` (validação ao inserir/atualizar)

## Diferença entre `qual` e `with_check`

### Para políticas SELECT, UPDATE, DELETE:
- **`qual` (USING)**: Define quais linhas podem ser lidas/atualizadas/deletadas
- **`with_check`**: Para UPDATE, valida os novos valores

### Para políticas INSERT:
- **`qual` (USING)**: **SEMPRE NULL** (não se aplica a INSERT)
- **`with_check`**: **OBRIGATÓRIO** - valida os dados antes de inserir

## Por que `qual` é NULL para INSERT?

Quando você faz um `INSERT`, você está **criando uma nova linha**, não consultando linhas existentes. Por isso:

- `qual` (USING) não faz sentido para INSERT → **NULL** ✅
- `with_check` valida se os dados são permitidos → **DEVE estar preenchido** ✅

## Exemplo da sua política

```sql
CREATE POLICY "users_write_own_activities"
  ON public.activities
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**Resultado esperado:**
- `qual`: `NULL` ✅ (correto para INSERT)
- `with_check`: `(auth.uid() = user_id)` ✅ (obrigatório para INSERT)

## Resumo

| Campo | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `qual` (USING) | ✅ Usado | ❌ NULL | ✅ Usado | ✅ Usado |
| `with_check` | ❌ NULL | ✅ **OBRIGATÓRIO** | ✅ Usado | ❌ NULL |

## Conclusão

**Sua política está CORRETA!** 

- `qual` = NULL ✅ (correto para INSERT)
- `with_check` = `(auth.uid() = user_id)` ✅ (correto e obrigatório)

Se ainda está dando erro de permissão, pode ser:
1. A sessão do Supabase não está sendo passada corretamente
2. O `user_id` não está sendo enviado no insert
3. Há algum problema com a autenticação

