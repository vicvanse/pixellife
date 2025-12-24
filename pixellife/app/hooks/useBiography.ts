import { useState, useEffect, useCallback } from 'react';

export type BiographyEntryType = 'milestone' | 'story';

export type DatePrecision = 'exact' | 'approximate' | 'range';

export type BiographyCategory = 
  | 'fundacao'
  | 'aprendizados'
  | 'evolucao'
  | 'conquistas'
  | 'mudancas'
  | 'carreira'
  | 'fases';

export interface BiographyDate {
  year: number;
  month?: number;
  day?: number;
  precision: DatePrecision;
  endYear?: number;
  endMonth?: number;
}

export interface BiographyMilestone {
  id: string;
  type: 'milestone';
  title: string;
  date: BiographyDate;
  category: BiographyCategory;
  emoji: string;
  tag?: string;
  createdAt: string;
}

export interface BiographyStory {
  id: string;
  type: 'story';
  title: string;
  text: string;
  date: BiographyDate;
  category: BiographyCategory;
  photo?: string;
  connectedMilestones?: string[];
  createdAt: string;
}

export type BiographyEntry = BiographyMilestone | BiographyStory;

const STORAGE_KEY = 'pixel-life-biography-v1';

export function useBiography() {
  const [entries, setEntries] = useState<BiographyEntry[]>([]);

  // Carregar do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setEntries(parsed);
      }
    } catch (error) {
      console.error('Erro ao carregar biografia:', error);
    }
  }, []);

  // Salvar no localStorage
  const saveEntries = useCallback((newEntries: BiographyEntry[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
      setEntries(newEntries);
      // Disparar evento customizado para notificar mudanças (para sincronização com Supabase)
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("pixel-life-biography-changed"));
      }
    } catch (error) {
      console.error('Erro ao salvar biografia:', error);
    }
  }, []);

  // Adicionar entrada
  const addEntry = useCallback((entry: Omit<BiographyMilestone, 'id' | 'createdAt'> | Omit<BiographyStory, 'id' | 'createdAt'>) => {
    const newEntry: BiographyEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    } as BiographyEntry;
    const newEntries = [...entries, newEntry];
    // Ordenar por data (mais antigo primeiro)
    newEntries.sort((a, b) => {
      const dateA = getSortDate(a.date);
      const dateB = getSortDate(b.date);
      return dateA - dateB;
    });
    saveEntries(newEntries);
  }, [entries, saveEntries]);

  // Atualizar entrada
  const updateEntry = useCallback((id: string, updates: Partial<BiographyMilestone> | Partial<BiographyStory>) => {
    const newEntries = entries.map(entry => 
      entry.id === id ? { ...entry, ...updates } as BiographyEntry : entry
    );
    // Reordenar após atualização
    newEntries.sort((a, b) => {
      const dateA = getSortDate(a.date);
      const dateB = getSortDate(b.date);
      return dateA - dateB;
    });
    saveEntries(newEntries);
  }, [entries, saveEntries]);

  // Remover entrada
  const removeEntry = useCallback((id: string) => {
    const newEntries = entries.filter(entry => entry.id !== id);
    saveEntries(newEntries);
  }, [entries, saveEntries]);

  // Obter todas as entradas agrupadas por ano
  const getEntriesByYear = useCallback(() => {
    const grouped: Record<number, BiographyEntry[]> = {};
    entries.forEach(entry => {
      const year = entry.date.year;
      if (!grouped[year]) {
        grouped[year] = [];
      }
      grouped[year].push(entry);
    });
    // Ordenar anos
    const sortedYears = Object.keys(grouped).map(Number).sort((a, b) => a - b);
    return sortedYears.map(year => ({
      year,
      entries: grouped[year].sort((a, b) => {
        const dateA = getSortDate(a.date);
        const dateB = getSortDate(b.date);
        return dateA - dateB;
      }),
    }));
  }, [entries]);

  // Obter todas as entradas
  const getAllEntries = useCallback(() => entries, [entries]);

  return {
    entries,
    addEntry,
    updateEntry,
    removeEntry,
    getEntriesByYear,
    getAllEntries,
  };
}

// Função auxiliar para obter data para ordenação
function getSortDate(date: BiographyDate): number {
  if (date.precision === 'range' && date.endYear) {
    // Para intervalos, usar o meio do intervalo
    return (date.year + date.endYear) / 2;
  }
  // Para datas exatas ou aproximadas, usar o início
  const year = date.year;
  const month = date.month || 6; // Meio do ano se não especificado
  const day = date.day || 15; // Meio do mês se não especificado
  return year * 10000 + month * 100 + day;
}

// Função para formatar data para exibição
export function formatBiographyDate(date: BiographyDate): string {
  if (date.precision === 'exact') {
    if (date.day && date.month) {
      return `${date.day.toString().padStart(2, '0')}/${date.month.toString().padStart(2, '0')}/${date.year}`;
    }
    if (date.month) {
      return `${date.month.toString().padStart(2, '0')}/${date.year}`;
    }
    return date.year.toString();
  }
  
  if (date.precision === 'approximate') {
    if (date.month) {
      return `~${date.month.toString().padStart(2, '0')}/${date.year}`;
    }
    return `~${date.year}`;
  }
  
  if (date.precision === 'range') {
    if (date.endYear) {
      return `${date.year}–${date.endYear}`;
    }
    return `~${date.year}`;
  }
  
  return date.year.toString();
}

// Mapeamento de categorias para emojis e labels
export const CATEGORIES: Record<BiographyCategory, { label: string; emoji: string }> = {
  fundacao: { label: 'Fundação', emoji: '🧱' },
  aprendizados: { label: 'Aprendizados', emoji: '📚' },
  evolucao: { label: 'Evolução', emoji: '💪' },
  conquistas: { label: 'Conquistas', emoji: '🎖️' },
  mudancas: { label: 'Mudanças', emoji: '🔄' },
  carreira: { label: 'Carreira & Projetos', emoji: '💼' },
  fases: { label: 'Fases da Vida', emoji: '💭' },
};

