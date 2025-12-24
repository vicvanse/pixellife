-- CORREÇÃO: Recriar a política INSERT com WITH CHECK correto
-- A política atual está sem WITH CHECK, causando o erro de RLS

-- Remover a política incorreta
DROP POLICY IF EXISTS "users_write_own_activities" ON public.activities;

-- Recriar a política INSERT com WITH CHECK correto
CREATE POLICY "users_write_own_activities"
  ON public.activities
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Verificar se foi criada corretamente
SELECT 
  policyname, 
  cmd, 
  qual, 
  with_check 
FROM pg_policies 
WHERE tablename = 'activities' 
  AND policyname = 'users_write_own_activities';

-- O resultado deve mostrar:
-- policyname: users_write_own_activities
-- cmd: INSERT
-- qual: NULL (correto para INSERT)
-- with_check: (auth.uid() = user_id) (DEVE estar preenchido!)

