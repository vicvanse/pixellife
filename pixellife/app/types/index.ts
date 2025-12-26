/**
 * Tipos compartilhados da aplicação
 */

// Tipos de humor
export type Mood = "good" | "neutral" | "bad" | "none";

// Tipos de status de objetivo
export type PossessionStatus = "locked" | "in-progress" | "completed";

// Tipos de objetivo
export type PossessionType = "house" | "vehicle" | "investment" | "education" | "custom";

// Tipos de skill
export type SkillType = "leisure" | "personal";

// Tipos de overlay
export type OverlayType = "habits" | "journal" | "expenses" | "cosmetics" | "possessions";

// Entrada do diário
export interface JournalEntry {
  mood: Mood;
  text: string;
  quickNotes: QuickNote[];
}

// Nota rápida
export interface QuickNote {
  text: string;
  time: string;
}

// Item de despesa diária
export interface DailyExpenseItem {
  id: string;
  description: string;
  value: number;
  relatedGoalId?: number;
}

// Movimentação de reserva
export interface ReserveMovement {
  id: string;
  description: string;
  value: number;
  date: string;
}

// Meta de objetivo
export interface AssetGoal {
  id: number;
  name: string;
  type: PossessionType;
  icon: string;
  targetValue: number;
  currentProgress: number;
  status: PossessionStatus;
  createdAt: string;
}

// Ação de skill
export interface SkillAction {
  id: string;
  name: string;
  description?: string;
  completed: boolean;
}

// Skill da árvore
export interface TreeSkill {
  id: string;
  name: string;
  icon: string;
  description: string;
  type: SkillType;
  categories?: string[];
  actions: SkillAction[];
  progress: number;
}

// Linha de dados mensais
export interface MonthlyRow {
  day: number;
  description: string;
  totalDaily: number;
  totalMonth: number;
  reserve: number;
  budget: number;
  accountMoney: number;
}

// Hábito
export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  completed: boolean;
  streak: number;
}





