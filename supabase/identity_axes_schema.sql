-- ============================================
-- SISTEMA DE IDENTIDADE, EIXOS E CONQUISTAS
-- PixelLife - Etapa 3
-- ============================================

-- 2️⃣ Identity Axes (núcleo da identidade)
CREATE TABLE IF NOT EXISTS public.identity_axes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  axis_key TEXT NOT NULL,        -- 'body_movement', 'learning_study', etc.
  label TEXT NOT NULL,           -- 'Corpo & Movimento'
  description TEXT,
  status TEXT NOT NULL DEFAULT 'latent' CHECK (status IN ('latent', 'emerging', 'central', 'fading')),
  
  relevance_score NUMERIC,       -- calculado (0–1)
  first_detected_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE (user_id, axis_key)
);

CREATE INDEX IF NOT EXISTS idx_identity_axes_user ON public.identity_axes (user_id);
CREATE INDEX IF NOT EXISTS idx_identity_axes_user_status ON public.identity_axes (user_id, status);
CREATE INDEX IF NOT EXISTS idx_identity_axes_relevance ON public.identity_axes (user_id, relevance_score DESC);

-- 3️⃣ Axis Signals (provas objetivas)
CREATE TABLE IF NOT EXISTS public.axis_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  axis_key TEXT NOT NULL,
  
  signal_type TEXT NOT NULL CHECK (signal_type IN ('activity_count', 'streak', 'diary_mentions', 'time_span', 'frequency')),
  value NUMERIC NOT NULL,
  period TEXT,                  -- '7d', '30d', '90d', 'year', 'all'
  calculated_at TIMESTAMPTZ DEFAULT now(),
  
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_axis_signals_user_axis ON public.axis_signals (user_id, axis_key);
CREATE INDEX IF NOT EXISTS idx_axis_signals_user_type ON public.axis_signals (user_id, signal_type);
CREATE INDEX IF NOT EXISTS idx_axis_signals_calculated ON public.axis_signals (user_id, calculated_at DESC);

-- 4️⃣ Achievements (modelo Habbo-like)
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  axis_key TEXT NOT NULL,     -- 'body_movement'
  achievement_key TEXT NOT NULL,
  level INTEGER NOT NULL,
  
  title TEXT NOT NULL,
  description TEXT,
  icon_key TEXT,              -- referencia pixel-art
  
  condition JSONB NOT NULL,   -- regra declarativa
  -- ex: { "signal": "activity_count", "period": "30d", "threshold": 18 }
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE (axis_key, achievement_key, level)
);

CREATE INDEX IF NOT EXISTS idx_achievements_axis ON public.achievements (axis_key);

-- 5️⃣ User Achievements (progressão infinita)
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  
  progress NUMERIC DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  
  last_evaluated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements (user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_completed ON public.user_achievements (user_id, completed);
CREATE INDEX IF NOT EXISTS idx_user_achievements_progress ON public.user_achievements (user_id, progress DESC);

-- 6️⃣ Identity Snapshots (quem eu fui)
CREATE TABLE IF NOT EXISTS public.identity_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  period_start DATE,
  period_end DATE,
  
  central_axes TEXT[],          -- ['body_movement', 'learning_study']
  summary TEXT,                 -- texto gerado
  
  generated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_identity_snapshots_user ON public.identity_snapshots (user_id);
CREATE INDEX IF NOT EXISTS idx_identity_snapshots_period ON public.identity_snapshots (user_id, period_start DESC);

-- 7️⃣ Feedback History (histórico narrativo)
-- Nota: Esta tabela já existe em identity_schema.sql com estrutura diferente
-- Vamos apenas adicionar colunas que faltam se necessário

-- Adicionar coluna 'context' se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'feedback_history' 
    AND column_name = 'context'
  ) THEN
    ALTER TABLE public.feedback_history ADD COLUMN context TEXT;
  END IF;
END $$;

-- Adicionar coluna 'content' se não existir (pode usar 'summary' como fallback)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'feedback_history' 
    AND column_name = 'content'
  ) THEN
    ALTER TABLE public.feedback_history ADD COLUMN content TEXT;
    -- Copiar dados de 'summary' para 'content' se summary existir
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'feedback_history' 
      AND column_name = 'summary'
    ) THEN
      UPDATE public.feedback_history SET content = summary WHERE content IS NULL AND summary IS NOT NULL;
    END IF;
  END IF;
END $$;

-- Adicionar coluna 'confidence' se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'feedback_history' 
    AND column_name = 'confidence'
  ) THEN
    ALTER TABLE public.feedback_history ADD COLUMN confidence NUMERIC;
  END IF;
END $$;

-- Criar índices (se não existirem)
CREATE INDEX IF NOT EXISTS idx_feedback_history_user ON public.feedback_history (user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_history_user_time ON public.feedback_history (user_id, created_at DESC);
-- Só criar índice de context se a coluna existir
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'feedback_history' 
    AND column_name = 'context'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_feedback_history_context ON public.feedback_history (user_id, context);
  END IF;
END $$;

-- ============================================
-- RLS (Row Level Security)
-- ============================================

-- Identity Axes
ALTER TABLE public.identity_axes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_identity_axes"
  ON public.identity_axes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_write_own_identity_axes"
  ON public.identity_axes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_identity_axes"
  ON public.identity_axes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Axis Signals
ALTER TABLE public.axis_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_axis_signals"
  ON public.axis_signals
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_write_own_axis_signals"
  ON public.axis_signals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_axis_signals"
  ON public.axis_signals
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Achievements (público - todos podem ler)
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "everyone_read_achievements"
  ON public.achievements
  FOR SELECT
  USING (true);

-- User Achievements
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_user_achievements"
  ON public.user_achievements
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_write_own_user_achievements"
  ON public.user_achievements
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_user_achievements"
  ON public.user_achievements
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Identity Snapshots
ALTER TABLE public.identity_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_identity_snapshots"
  ON public.identity_snapshots
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_write_own_identity_snapshots"
  ON public.identity_snapshots
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Feedback History (RLS já deve estar configurado no primeiro schema, mas vamos garantir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'feedback_history' 
    AND policyname = 'users_read_own_feedback_history'
  ) THEN
    ALTER TABLE public.feedback_history ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "users_read_own_feedback_history"
      ON public.feedback_history
      FOR SELECT
      USING (auth.uid() = user_id);
    
    CREATE POLICY "users_write_own_feedback_history"
      ON public.feedback_history
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

