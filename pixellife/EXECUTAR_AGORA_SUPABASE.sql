-- ============================================
-- EXECUTE ESTE SQL NO SUPABASE SQL EDITOR
-- ============================================
-- Este SQL corrige a política RLS para permitir salvar bio
-- Copie TODO este código e cole no SQL Editor do Supabase

-- 1. Remover a política incorreta (se existir)
DROP POLICY IF EXISTS "users_write_own_activities" ON public.activities;

-- 2. Recriar a política INSERT com WITH CHECK correto
CREATE POLICY "users_write_own_activities"
  ON public.activities
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Verificar se foi criada corretamente
-- Execute esta query para confirmar:
SELECT 
  policyname, 
  cmd, 
  qual, 
  with_check 
FROM pg_policies 
WHERE tablename = 'activities' 
  AND policyname = 'users_write_own_activities';

-- RESULTADO ESPERADO:
-- policyname: users_write_own_activities
-- cmd: INSERT
-- qual: NULL (correto para INSERT)
-- with_check: (auth.uid() = user_id) ← DEVE estar preenchido, NÃO pode ser NULL!

