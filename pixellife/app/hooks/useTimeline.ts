import { useState, useEffect, useCallback } from 'react';

export interface TimelineEvent {
  id: string;
  date: string; // YYYY-MM-DD format (para períodos, usar primeiro dia do mês de início)
  title: string;
  type?: 'event' | 'chapter'; // Tipo: evento normal ou capítulo (marco temporal)
  scope?: 'period' | 'event'; // Escopo: período (total) ou evento (momentâneo)
  summary?: string; // Resumo (apenas para capítulos, limitado a 280 caracteres)
  startDate?: string; // Data de início (apenas para capítulos, formato YYYY-MM)
  endDate?: string; // Data de fim (apenas para capítulos, formato YYYY-MM, pode ser vazio)
  parentPeriodId?: string; // ID do período pai (se este evento está dentro de um período)
}

const STORAGE_KEY = 'pixel-life-timeline-v1';

export function useTimeline() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  // Carregar do localStorage
  useEffect(() => {
    const loadEvents = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setEvents(parsed);
        }
      } catch (error) {
        console.error('Erro ao carregar timeline:', error);
      }
    };

    // Carregar inicialmente
    loadEvents();

    // Escutar mudanças no localStorage (para sincronização entre abas)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setEvents(parsed);
        } catch (error) {
          console.error('Erro ao carregar timeline do storage event:', error);
        }
      }
    };

    // Escutar eventos customizados (mudanças na mesma aba)
    const handleCustomChange = () => {
      loadEvents();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('pixel-life-timeline-changed', handleCustomChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('pixel-life-timeline-changed', handleCustomChange);
    };
  }, []);

  // Salvar no localStorage
  const saveEvents = useCallback((newEvents: TimelineEvent[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newEvents));
      setEvents(newEvents);
      // Disparar evento customizado para notificar mudanças (para sincronização e atualização de UI)
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("pixel-life-timeline-changed"));
      }
    } catch (error) {
      console.error('Erro ao salvar timeline:', error);
    }
  }, []);

  // Adicionar evento
  const addEvent = useCallback((event: Omit<TimelineEvent, 'id'>) => {
    const newEvent: TimelineEvent = {
      ...event,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    const newEvents = [...events, newEvent];
    // Ordenar por data (mais antigo primeiro)
    newEvents.sort((a, b) => a.date.localeCompare(b.date));
    saveEvents(newEvents);
  }, [events, saveEvents]);

  // Atualizar evento
  const updateEvent = useCallback((id: string, updates: Partial<TimelineEvent>) => {
    const newEvents = events.map(event => 
      event.id === id ? { ...event, ...updates } : event
    );
    // Reordenar após atualização
    newEvents.sort((a, b) => a.date.localeCompare(b.date));
    saveEvents(newEvents);
  }, [events, saveEvents]);

  // Remover evento
  const removeEvent = useCallback((id: string) => {
    const newEvents = events.filter(event => event.id !== id);
    saveEvents(newEvents);
  }, [events, saveEvents]);

  // Obter eventos agrupados por ano
  const getEventsByYear = useCallback(() => {
    const grouped: Record<number, TimelineEvent[]> = {};
    events.forEach(event => {
      const year = parseInt(event.date.substring(0, 4));
      if (!grouped[year]) {
        grouped[year] = [];
      }
      grouped[year].push(event);
    });
    // Ordenar anos
    const sortedYears = Object.keys(grouped).map(Number).sort((a, b) => b - a);
    return sortedYears.map(year => ({
      year,
      events: grouped[year],
    }));
  }, [events]);

  // Obter todos os eventos
  const getAllEvents = useCallback(() => events, [events]);

  return {
    events,
    addEvent,
    updateEvent,
    removeEvent,
    getEventsByYear,
    getAllEvents,
  };
}

