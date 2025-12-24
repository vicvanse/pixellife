/**
 * Tipos TypeScript para Identidade Declarada e Observada
 * 
 * ⚠️ IMPORTANTE: Este arquivo NÃO vai no SQL Editor do Supabase!
 * Este é código TypeScript para tipagem no frontend/backend.
 */

// ============================================
// IDENTIDADE DECLARADA
// ============================================

export interface IdentityDeclared {
  id: string;
  user_id: string;
  bio_text: string;
  core_labels: string[]; // Pontos centrais declarados
  pinned_stats: Record<string, any>; // Preferências de exibição
  updated_at: string;
  created_at: string;
}

export interface IdentityDeclaredVersion {
  id: string;
  user_id: string;
  bio_text: string | null;
  core_labels: string[];
  pinned_stats: Record<string, any>;
  created_at: string;
}

// ============================================
// IDENTIDADE OBSERVADA
// ============================================

export type ObservedWindow = '30d' | '90d' | '365d' | 'all';

export interface ObservedAxis {
  axis: string; // ID do eixo (ex: "corpo_movimento")
  label: string; // Label amigável (ex: "Corpo & Movimento")
  score: number; // 0-1
  evidence: {
    habit_days?: number;
    journal_mentions?: number;
    finance_related?: number;
    biography_events?: number;
    months_active?: number;
  };
  trend: 'up' | 'stable' | 'down';
}

export interface IdentityObserved {
  id: string;
  user_id: string;
  time_window: ObservedWindow; // Renomeado de 'window' (palavra reservada)
  computed_at: string;
  axes: ObservedAxis[];
  signals: Record<string, any>; // Sinais usados (auditoria)
}

// ============================================
// FEEDBACK HISTORY
// ============================================

export type FeedbackGenerator = 'rules' | 'ai' | 'hybrid';

export interface FeedbackAchievement {
  id: string;
  title: string;
  description: string;
  icon?: string;
  unlocked_at: string;
}

export interface FeedbackHighlight {
  type: 'pattern' | 'milestone' | 'trend';
  description: string;
  confidence?: number;
}

export interface FeedbackRecommendation {
  type: 'suggestion' | 'tip';
  text: string;
  based_on?: string;
}

export interface FeedbackHistory {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  summary: string | null;
  highlights: FeedbackHighlight[];
  achievements: FeedbackAchievement[];
  recommendations: FeedbackRecommendation[];
  generator: FeedbackGenerator;
  based_on: Record<string, any>;
  created_at: string;
}

// ============================================
// COMPARAÇÃO (Declarada vs Observada)
// ============================================

export interface IdentityComparison {
  overlaps: Array<{
    declared: string;
    observed: string;
    match: number; // 0-1
  }>;
  divergences: Array<{
    declared: string;
    reason: 'not_in_data' | 'weak_in_data';
  }>;
  absences: Array<{
    observed: string;
    reason: 'not_declared';
  }>;
}

