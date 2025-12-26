"use client";

import { useMemo } from "react";
import { useJournal } from "./useJournal";
import { useHabits } from "./useHabits";
import { useExpenses } from "./useExpenses";
import { useFinancialEntries } from "./useFinancialEntries";
import { useBiography } from "./useBiography";

export interface ScheduleEvent {
  id: string;
  date: string;
  type: 'journal' | 'habit' | 'expense' | 'financial' | 'biography' | 'custom';
  title: string;
  description?: string;
  color: string;
  icon: string;
  metadata?: Record<string, any>;
}

export interface DaySummary {
  date: string;
  mood?: string;
  journalEntry?: boolean;
  habitsCompleted: number;
  totalHabits: number;
  expensesTotal: number;
  financialEvents: number;
  biographyEvents: number;
  customEvents: number;
  events: ScheduleEvent[];
}

export function useSchedule() {
  const { journal, getAllDates: getJournalDates } = useJournal();
  const { habits } = useHabits();
  const { calculateDailyTotal, formatDateKey } = useExpenses();
  const { entries: financialEntries } = useFinancialEntries();
  const { entries: biographyEntries } = useBiography();

  // Agregar todos os eventos por data
  const getDaySummary = useMemo(() => {
    return (date: string): DaySummary => {
      const events: ScheduleEvent[] = [];
      
      // Journal entries
      const journalEntry = journal[date];
      if (journalEntry) {
        events.push({
          id: `journal-${date}`,
          date,
          type: 'journal',
          title: 'Entrada de Diário',
          description: journalEntry.text || 'Sem texto',
          color: getMoodColor(journalEntry.mood),
          icon: getMoodIcon(journalEntry.mood),
          metadata: { mood: journalEntry.mood, quickNotes: journalEntry.quickNotes }
        });
      }

      // Habits
      const habitsForDay = habits.filter(h => h.checks[date]);
      habitsForDay.forEach(habit => {
        events.push({
          id: `habit-${habit.id}-${date}`,
          date,
          type: 'habit',
          title: habit.name,
          description: 'Hábito completado',
          color: '#4ade80',
          icon: '✓',
          metadata: { habitId: habit.id }
        });
      });

      // Expenses
      const dailyTotal = calculateDailyTotal(date);
      if (dailyTotal !== 0) {
        events.push({
          id: `expense-${date}`,
          date,
          type: 'expense',
          title: dailyTotal < 0 ? 'Gastos do dia' : 'Ganhos do dia',
          description: `R$ ${Math.abs(dailyTotal).toFixed(2)}`,
          color: dailyTotal < 0 ? '#ef4444' : '#22c55e',
          icon: dailyTotal < 0 ? '↓' : '↑',
          metadata: { amount: dailyTotal }
        });
      }

      // Financial entries - verificar se a data está dentro do range de recorrência
      const dayFinancials = financialEntries.filter(entry => {
        if (entry.frequency === 'pontual' && entry.date) {
          return formatDateKey(new Date(entry.date)) === date;
        }
        
        if (entry.frequency === 'recorrente' && entry.startDate) {
          const startDate = new Date(entry.startDate);
          const checkDate = new Date(date);
          
          // Verificar se está dentro do range
          if (entry.endDate) {
            const endDate = new Date(entry.endDate);
            if (checkDate < startDate || checkDate > endDate) return false;
          } else {
            if (checkDate < startDate) return false;
          }
          
          // Verificar se a data está excluída
          if (entry.excludedDates?.includes(date)) return false;
          
          // Verificar recorrência
          if (entry.recurrence === 'mensal') {
            return checkDate.getDate() === startDate.getDate();
          } else if (entry.recurrence === 'quinzenal') {
            const daysDiff = Math.floor((checkDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            return daysDiff >= 0 && daysDiff % 15 === 0;
          } else if (entry.recurrence === 'anual') {
            return checkDate.getMonth() === startDate.getMonth() && checkDate.getDate() === startDate.getDate();
          }
        }
        
        return false;
      });

      dayFinancials.forEach(entry => {
        const status = entry.frequency === 'recorrente' 
          ? (entry.occurrenceStatuses?.[date] || entry.status)
          : entry.status;
        
        if (status === 'canceled') return;
        
        events.push({
          id: `financial-${entry.id}-${date}`,
          date,
          type: 'financial',
          title: entry.description,
          description: `${entry.nature === 'gasto' ? '-' : '+'} R$ ${Math.abs(entry.amount).toFixed(2)}`,
          color: entry.nature === 'gasto' ? '#f59e0b' : '#10b981',
          icon: entry.nature === 'gasto' ? '💸' : '💰',
          metadata: { entry, status }
        });
      });

      // Biography events
      const dayBiography = biographyEntries.filter(entry => {
        const entryDate = entry.date;
        const checkDate = new Date(date);
        
        // Verificar se o ano corresponde
        if (entryDate.year !== checkDate.getFullYear()) return false;
        
        // Se tem mês, verificar
        if (entryDate.month !== undefined) {
          if (entryDate.month !== checkDate.getMonth() + 1) return false;
          
          // Se tem dia, verificar
          if (entryDate.day !== undefined) {
            return entryDate.day === checkDate.getDate();
          }
        }
        
        return true;
      });

      dayBiography.forEach(entry => {
        events.push({
          id: `biography-${entry.id}`,
          date,
          type: 'biography',
          title: entry.title,
          description: entry.type === 'milestone' ? 'Marco' : 'História',
          color: '#8b5cf6',
          icon: entry.type === 'milestone' ? '⭐' : '📖',
          metadata: { entry }
        });
      });

      return {
        date,
        mood: journalEntry?.mood,
        journalEntry: !!journalEntry,
        habitsCompleted: habitsForDay.length,
        totalHabits: habits.length,
        expensesTotal: Math.abs(dailyTotal),
        financialEvents: dayFinancials.length,
        biographyEvents: dayBiography.length,
        customEvents: 0,
        events: events.sort((a, b) => a.type.localeCompare(b.type))
      };
    };
  }, [journal, habits, calculateDailyTotal, formatDateKey, financialEntries, biographyEntries]);

  const getAllDates = useMemo(() => {
    return (): string[] => {
      const dates = new Set<string>();
      
      // Datas do journal
      getJournalDates().forEach(date => dates.add(date));
      
      // Datas dos hábitos
      habits.forEach(habit => {
        Object.keys(habit.checks).forEach(date => dates.add(date));
      });
      
      // Datas das despesas (precisa buscar do hook de expenses)
      // Vamos adicionar as datas dos últimos 90 dias para garantir cobertura
      const today = new Date();
      for (let i = 0; i < 90; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateKey = formatDateKey(date);
        const dailyTotal = calculateDailyTotal(dateKey);
        if (dailyTotal !== 0) {
          dates.add(dateKey);
        }
      }
      
      // Datas dos compromissos financeiros
      financialEntries.forEach(entry => {
        if (entry.frequency === 'pontual' && entry.date) {
          dates.add(formatDateKey(new Date(entry.date)));
        } else if (entry.frequency === 'recorrente' && entry.startDate) {
          const startDate = new Date(entry.startDate);
          const endDate = entry.endDate ? new Date(entry.endDate) : new Date();
          endDate.setFullYear(endDate.getFullYear() + 1); // Próximo ano
          
          let currentDate = new Date(startDate);
          while (currentDate <= endDate) {
            dates.add(formatDateKey(currentDate));
            
            if (entry.recurrence === 'mensal') {
              currentDate.setMonth(currentDate.getMonth() + 1);
            } else if (entry.recurrence === 'quinzenal') {
              currentDate.setDate(currentDate.getDate() + 15);
            } else if (entry.recurrence === 'anual') {
              currentDate.setFullYear(currentDate.getFullYear() + 1);
            } else {
              break;
            }
          }
        }
      });
      
      // Datas da biografia
      biographyEntries.forEach(entry => {
        const entryDate = entry.date;
        if (entryDate.year) {
          const year = entryDate.year;
          const month = entryDate.month || 1;
          const day = entryDate.day || 1;
          dates.add(formatDateKey(new Date(year, month - 1, day)));
        }
      });
      
      return Array.from(dates).sort().reverse();
    };
  }, [getJournalDates, habits, formatDateKey, calculateDailyTotal, financialEntries, biographyEntries]);

  return {
    getDaySummary,
    getAllDates,
  };
}

function getMoodColor(mood?: string): string {
  switch (mood) {
    case 'good': return '#22c55e';
    case 'neutral': return '#eab308';
    case 'bad': return '#ef4444';
    default: return '#6b7280';
  }
}

function getMoodIcon(mood?: string): string {
  switch (mood) {
    case 'good': return '😊';
    case 'neutral': return '😐';
    case 'bad': return '😞';
    default: return '📝';
  }
}

