/**
 * Tipos TypeScript para Sistema Mapas
 * 
 * Pokédex da vida: registra experiências, não prescreve
 */

export type MapasState = 'not_done' | 'experienced' | 'satisfied' | 'complete';

export type MapasStateSource = 'manual' | 'habit' | 'diary' | 'biography' | 'auto';

export interface MapasCategory {
  id: string;
  key: string; // 'esportes', 'cozinhar', etc.
  name: string; // 'Esportes', 'Cozinhar', etc.
  icon: string | null;
  description: string | null;
  created_at: string;
}

export interface MapasElement {
  id: string;
  category_key: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface MapasUserElement {
  id: string;
  user_id: string;
  element_id: string;
  state: MapasState;
  first_experienced_at: string | null;
  last_updated_at: string;
  created_at: string;
  // Relacionamentos (quando carregado com JOIN)
  element?: MapasElement;
  category?: MapasCategory;
}

export interface MapasStateHistory {
  id: string;
  user_element_id: string;
  previous_state: MapasState | null;
  new_state: MapasState;
  changed_at: string;
  source: MapasStateSource;
  metadata: Record<string, any> | null;
}

// Helper para labels dos estados
export const STATE_LABELS: Record<MapasState, string> = {
  not_done: 'Não feito',
  experienced: 'Experimentado',
  satisfied: 'Satisfeito',
  complete: 'Completo',
};

// Helper para ícones/cores dos estados (opcional)
export const STATE_ICONS: Record<MapasState, string> = {
  not_done: '❔',
  experienced: '👣',
  satisfied: '⭐',
  complete: '✅',
};

