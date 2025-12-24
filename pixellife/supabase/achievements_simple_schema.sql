-- ============================================
-- CONQUISTAS SIMPLES (Habbo-style)
-- ============================================
-- Conquistas visuais, não psicológicas
-- Baseadas em experiência vivida, não em interpretação

-- Tabela de conquistas (simples, pré-definidas)
CREATE TABLE IF NOT EXISTS achievements_simple (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL, -- 'first_habit', 'first_travel', etc.
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- emoji ou código de ícone
  category TEXT, -- 'habits', 'mapas', 'diary', etc.
  condition_type TEXT NOT NULL, -- 'count', 'streak', 'first', 'state'
  condition_value JSONB, -- { "count": 10 }, { "days": 7 }, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de progresso do usuário
CREATE TABLE IF NOT EXISTS user_achievements_simple (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements_simple(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0, -- 0-100
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  unlocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_achievements_simple_user ON user_achievements_simple(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_simple_completed ON user_achievements_simple(completed);

-- RLS Policies
ALTER TABLE achievements_simple ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements_simple ENABLE ROW LEVEL SECURITY;

-- Conquistas são públicas (todos podem ler)
CREATE POLICY "achievements_simple_read" ON achievements_simple
  FOR SELECT USING (true);

-- Usuários só veem suas próprias conquistas
CREATE POLICY "user_achievements_simple_own" ON user_achievements_simple
  FOR ALL USING (auth.uid() = user_id);

-- Inserir algumas conquistas simples de exemplo
INSERT INTO achievements_simple (key, title, description, icon, category, condition_type, condition_value) VALUES
  -- Hábitos
  ('first_habit', 'Primeiro Hábito', 'Criou seu primeiro hábito', '🌱', 'habits', 'first', '{}'),
  ('habit_streak_7', 'Semana Consistente', 'Manteve um hábito por 7 dias seguidos', '🔥', 'habits', 'streak', '{"days": 7}'),
  ('habit_streak_30', 'Mês Consistente', 'Manteve um hábito por 30 dias seguidos', '⭐', 'habits', 'streak', '{"days": 30}'),
  
  -- Mapas
  ('first_experience', 'Primeira Experiência', 'Experimentou algo novo no Mapas', '👣', 'mapas', 'first', '{}'),
  ('satisfied_5', 'Explorador', 'Marcou 5 experiências como Satisfeitas', '🌟', 'mapas', 'count', '{"state": "satisfied", "count": 5}'),
  
  -- Diário
  ('first_entry', 'Primeira Entrada', 'Escreveu sua primeira entrada no diário', '📝', 'diary', 'first', '{}'),
  ('diary_week', 'Semana de Reflexão', 'Escreveu no diário por 7 dias', '📖', 'diary', 'streak', '{"days": 7}'),
  
  -- Finanças
  ('first_expense', 'Primeiro Registro', 'Registrou seu primeiro gasto', '💰', 'finance', 'first', '{}'),
  ('savings_goal', 'Meta Alcançada', 'Alcançou uma meta financeira', '🎯', 'finance', 'goal', '{}')
ON CONFLICT (key) DO NOTHING;

