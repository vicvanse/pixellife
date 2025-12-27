/**
 * Tipos TypeScript para Sistema de Identidade, Eixos e Conquistas
 * 
 * ⚠️ IMPORTANTE: Este arquivo NÃO vai no SQL Editor do Supabase!
 * Este é código TypeScript para tipagem no frontend/backend.
 */

// ============================================
// 2️⃣ IDENTITY AXES
// ============================================

export type AxisStatus = 'latent' | 'emerging' | 'central' | 'fading';

export interface IdentityAxis {
  id: string;
  user_id: string;
  axis_key: string; // 'body_movement', 'learning_study', etc.
  label: string; // 'Corpo & Movimento'
  description: string | null;
  status: AxisStatus;
  relevance_score: number | null; // 0-1
  first_detected_at: string | null;
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// 3️⃣ AXIS SIGNALS
// ============================================

export type SignalType = 'activity_count' | 'streak' | 'diary_mentions' | 'time_span' | 'frequency';
export type SignalPeriod = '7d' | '30d' | '90d' | 'year' | 'all';

export interface AxisSignal {
  id: string;
  user_id: string;
  axis_key: string;
  signal_type: SignalType;
  value: number;
  period: SignalPeriod | null;
  calculated_at: string;
  metadata: Record<string, any>;
}

// ============================================
// 4️⃣ ACHIEVEMENTS
// ============================================

export interface AchievementCondition {
  signal: SignalType;
  period?: SignalPeriod;
  threshold: number;
  axis_key?: string; // Opcional: se for específico de um eixo
}

export interface Achievement {
  id: string;
  axis_key: string;
  achievement_key: string;
  level: number;
  title: string;
  description: string | null;
  icon_key: string | null;
  condition: AchievementCondition;
  created_at: string;
}

// ============================================
// 5️⃣ USER ACHIEVEMENTS
// ============================================

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  progress: number; // 0-1 ou valor absoluto
  completed: boolean;
  completed_at: string | null;
  last_evaluated_at: string;
  // Relação com Achievement (opcional, para joins)
  achievement?: Achievement;
}

// ============================================
// 6️⃣ IDENTITY SNAPSHOTS
// ============================================

export interface IdentitySnapshot {
  id: string;
  user_id: string;
  period_start: string | null; // DATE format
  period_end: string | null; // DATE format
  central_axes: string[]; // ['body_movement', 'learning_study']
  summary: string | null; // texto gerado
  generated_at: string;
}

// ============================================
// 7️⃣ FEEDBACK HISTORY
// ============================================

export type FeedbackContext = 'monthly_review' | 'axis_summary' | 'achievement_unlock' | 'pattern_detected';

export interface FeedbackHistory {
  id: string;
  user_id: string;
  context: FeedbackContext | null;
  content: string;
  based_on: Record<string, any> | null;
  confidence: number | null; // 0-1
  created_at: string;
}

// ============================================
// HELPERS E UTILITIES
// ============================================

/**
 * Agregação de sinais para um eixo
 */
export interface AxisSignalsAggregate {
  axis_key: string;
  activity_count: number;
  streak: number;
  diary_mentions: number;
  time_span_days: number;
  frequency: number; // 0-1
  last_calculated: string;
}

/**
 * Progresso de conquista formatado
 */
export interface AchievementProgress {
  achievement: Achievement;
  userAchievement: UserAchievement | null;
  progressPercent: number; // 0-100
  remaining?: string; // "faltam 2 dias"
  canComplete: boolean;
}

