/**
 * Tipos TypeScript para Activities
 * 
 * ⚠️ IMPORTANTE: Este arquivo NÃO vai no SQL Editor do Supabase!
 * Este é código TypeScript para tipagem no frontend/backend.
 * 
 * Ele serve para:
 * - Tipar respostas do Supabase
 * - Evitar bugs no frontend
 * - Ter autocomplete
 * - Garantir consistência com o schema SQL
 */

export type ActivityType =
  | "habit"
  | "journal"
  | "finance"
  | "media"
  | "biography"
  | "goal"
  | "health"
  | "social"
  | "profile_info";

export type TimePrecision = "exact" | "day" | "month" | "range";

export type ActivitySource = "manual" | "api" | "imported" | "derived";

export interface Activity {
  id: string;
  user_id: string;
  type: ActivityType;
  subtype?: string | null;
  timestamp: string; // ISO string
  time_precision: TimePrecision;
  value?: number | null;
  unit?: string | null;
  text?: string | null;
  tags?: string[] | null;
  source: ActivitySource;
  metadata?: Record<string, any> | null;
  created_at: string; // ISO string
  updated_at: string; // ISO string
}

/**
 * Tipos específicos para diferentes atividades
 */

// Bio (self-description)
export interface BioActivity extends Activity {
  type: "biography";
  subtype: "self_description";
  text: string; // A bio em si
  timestamp: string;
}

// Insight/Feedback
export type InsightKind = 
  | "process_feedback"
  | "motivational"
  | "risk"
  | "pattern"
  | "identity";

export type InsightCategory =
  | "self_regulation"
  | "emotional"
  | "behavioral"
  | "social"
  | "identity"
  | "temporal";

export interface Insight {
  id: string;
  user_id: string;
  kind: InsightKind;
  category?: InsightCategory | null;
  pattern?: string | null;
  description: string;
  confidence?: number | null; // 0-1
  based_on?: Record<string, any> | null;
  generated_at: string; // ISO string
  created_at: string; // ISO string
  updated_at: string; // ISO string
}

/**
 * Helpers para criar activities
 */

export function createBioActivity(
  userId: string,
  bioText: string,
  timestamp?: Date
): Omit<BioActivity, "id" | "created_at" | "updated_at"> {
  return {
    user_id: userId,
    type: "biography",
    subtype: "self_description",
    text: bioText,
    timestamp: timestamp ? timestamp.toISOString() : new Date().toISOString(),
    time_precision: "exact",
    source: "manual",
  };
}

export function createInsight(
  userId: string,
  description: string,
  options?: {
    kind?: InsightKind;
    category?: InsightCategory;
    pattern?: string;
    confidence?: number;
    basedOn?: Record<string, any>;
  }
): Omit<Insight, "id" | "created_at" | "updated_at" | "generated_at"> {
  return {
    user_id: userId,
    kind: options?.kind || "process_feedback",
    category: options?.category || null,
    pattern: options?.pattern || null,
    description,
    confidence: options?.confidence ?? null,
    based_on: options?.basedOn || null,
  };
}

