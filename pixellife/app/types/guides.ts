/**
 * Tipos TypeScript para Sistema de Guias
 * 
 * Guias representam CAMINHOS POSSÍVEIS DE VIDA
 * Não são ordens nem verdades absolutas, mas mapas exploráveis
 */

export type NodeState = 'locked' | 'available' | 'in_progress' | 'integrated' | 'abandoned';

export type NodeType = 'skill' | 'experience' | 'habit' | 'challenge' | 'reflection' | 'knowledge';

export interface GuideNode {
  id: string;
  guideId: string;
  parentNodeId: string | null; // null para nó inicial
  title: string;
  description: string;
  type: NodeType;
  state: NodeState;
  order: number; // ordem dentro do ramo
  branch?: string; // nome do ramo (ex: "Ramo A", "Ramo B")
  icon?: {
    active: string;    // caminho do ícone quando ativo/completo
    inactive: string;  // caminho do ícone quando inativo/bloqueado
    meaning?: string;  // significado simbólico do ícone (opcional)
  };
  createdAt: string;
  updatedAt: string;
}

export interface Guide {
  id: string;
  userId: string | null; // null para guias oficiais
  name: string;
  description: string;
  philosophicalNote?: string; // nota filosófica curta
  isOfficial: boolean; // true para guias curados pelo sistema
  initialNodeId: string; // ID do nó inicial
  createdAt: string;
  updatedAt: string;
}

export interface UserGuideProgress {
  id: string;
  userId: string;
  guideId: string;
  nodeId: string;
  state: NodeState;
  notes?: string; // notas pessoais do usuário
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Guias oficiais pré-definidos
export const OFFICIAL_GUIDES = {
  SOCIAL_SKILLS: 'social-skills',
  RELATIONSHIPS: 'relationships',
  FINANCIAL_STABILITY: 'financial-stability',
  DAO_PATH: 'dao-path',
  CREATING_MEANING: 'creating-meaning',
} as const;

export type OfficialGuideId = typeof OFFICIAL_GUIDES[keyof typeof OFFICIAL_GUIDES];

