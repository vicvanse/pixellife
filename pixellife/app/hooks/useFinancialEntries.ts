"use client";

import { useState, useCallback, useEffect } from "react";

export type EntryFrequency = "pontual" | "recorrente";
export type EntryNature = "gasto" | "ganho";
export type RecurrenceType = "mensal" | "quinzenal" | "anual";
export type PaymentMethod = "dinheiro" | "pix" | "credito" | "debito" | "transferencia" | "outro";
export type EntryStatus = "received" | "pending" | "expected" | "canceled";

export interface FinancialEntry {
  id: string;
  description: string;
  nature: EntryNature; // gasto | ganho
  frequency: EntryFrequency; // pontual | recorrente
  amount: number;
  status: EntryStatus; // received | pending | expected | canceled
  date?: string; // YYYY-MM-DD para pontual
  startDate?: string; // YYYY-MM-DD para recorrente
  endDate?: string | null;
  excludedDates?: string[]; // YYYY-MM-DD[] - datas excluídas da recorrência (para quando algo atrasa ou não cobra)
  recurrence?: RecurrenceType; // mensal | quinzenal | anual
  paymentMethod?: PaymentMethod; // dinheiro | pix | credito | debito | transferencia | outro
  category?: string;
  installments?: {
    total: number;
    current: number;
  };
  // Para entradas recorrentes, armazena o status de cada ocorrência específica
  occurrenceStatuses?: Record<string, EntryStatus>; // { "YYYY-MM-DD": "received" | "pending" | "expected" | "canceled" }
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "pixel-life-financial-entries-v1";

export function useFinancialEntries() {
  const [entries, setEntries] = useState<FinancialEntry[]>([]);

  // Carregar do localStorage
  useEffect(() => {
    const loadEntries = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setEntries(parsed);
        }
      } catch (error) {
        console.error("Erro ao carregar entradas financeiras:", error);
      }
    };

    // Carregar imediatamente
    loadEntries();

    // Escutar mudanças no storage (incluindo de outras abas ou sincronização)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        loadEntries();
      }
    };

    const handleCustomChange = () => {
      loadEntries();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("pixel-life-storage-change", handleCustomChange);
    window.addEventListener("financial-entries-updated", handleCustomChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("pixel-life-storage-change", handleCustomChange);
      window.removeEventListener("financial-entries-updated", handleCustomChange);
    };
  }, []);

  // Salvar no localStorage
  const saveEntries = useCallback((newEntries: FinancialEntry[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
      setEntries(newEntries);
      
      // Emitir eventos para sincronização imediata
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new CustomEvent("financial-entries-updated"));
        window.dispatchEvent(new Event("pixel-life-storage-change"));
      }
    } catch (error) {
      console.error("Erro ao salvar entradas financeiras:", error);
    }
  }, []);

  // Adicionar entrada
  const addEntry = useCallback(
    (entry: Omit<FinancialEntry, "id" | "createdAt" | "updatedAt">) => {
      const now = new Date().toISOString();
      const newEntry: FinancialEntry = {
        ...entry,
        status: entry.status || (entry.frequency === "pontual" ? "received" : "expected"), // Default: received para pontuais, expected para recorrentes
        id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
        updatedAt: now,
      };
      
      // Se for recorrente, inicializar occurrenceStatuses se ainda não existir
      if (newEntry.frequency === "recorrente" && !newEntry.occurrenceStatuses) {
        newEntry.occurrenceStatuses = {};
      }
      
      const newEntries = [...entries, newEntry];
      saveEntries(newEntries);
      return newEntry;
    },
    [entries, saveEntries]
  );

  // Atualizar entrada
  const updateEntry = useCallback(
    (id: string, updates: Partial<Omit<FinancialEntry, "id" | "createdAt">>) => {
      const newEntries = entries.map((entry) =>
        entry.id === id
          ? { ...entry, ...updates, updatedAt: new Date().toISOString() }
          : entry
      );
      saveEntries(newEntries);
    },
    [entries, saveEntries]
  );

  // Remover entrada
  const removeEntry = useCallback(
    (id: string) => {
      const newEntries = entries.filter((entry) => entry.id !== id);
      saveEntries(newEntries);
    },
    [entries, saveEntries]
  );

  // Verificar se um recorrente é válido para uma data específica (DIÁRIO)
  const isRecurringValidForDate = useCallback(
    (entry: FinancialEntry, dateKey: string): boolean => {
      if (entry.frequency !== "recorrente" || !entry.startDate) return false;

      const date = new Date(dateKey + "T00:00:00");
      const startDate = new Date(entry.startDate + "T00:00:00");

      // 1. isSameOrAfter(day, start_date)
      if (date < startDate) return false;

      // 2. Verificar se a data está na lista de excluídas
      if (entry.excludedDates && entry.excludedDates.includes(dateKey)) {
        return false;
      }

      // 3. end_date is null OR day <= end_date
      if (entry.endDate) {
        const endDate = new Date(entry.endDate + "T00:00:00");
        if (date > endDate) return false;
      }

      // Verificar se é parcelado e se já passou o número de parcelas
      if (entry.installments && entry.installments.total) {
        const monthsDiff = (date.getFullYear() - startDate.getFullYear()) * 12 +
          (date.getMonth() - startDate.getMonth());
        // Se já passou o número total de parcelas, não é válido
        if (monthsDiff >= entry.installments.total) {
          return false;
        }
        // Para parcelado mensal, verificar se é o dia correto do mês
        // Parcelado sempre usa recorrência mensal
        if (entry.recurrence === "mensal") {
          return date.getDate() === startDate.getDate();
        }
        return false; // Parcelado só funciona com recorrência mensal
      }

      // Não parcelado, verificar recorrência normalmente
      // 3. sameDayOfMonth(day, start_date) - para mensal
      if (entry.recurrence === "mensal") {
        return date.getDate() === startDate.getDate();
      }

      // Quinzenal: a cada 15 dias a partir da data de início
      if (entry.recurrence === "quinzenal") {
        const diffDays = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays % 15 === 0;
      }

      // Anual: mesmo dia e mês
      if (entry.recurrence === "anual") {
        return date.getMonth() === startDate.getMonth() && date.getDate() === startDate.getDate();
      }

      return false;
    },
    []
  );

  // Verificar se um recorrente impacta um mês específico (MENSAL)
  const isRecurringValidForMonth = useCallback(
    (entry: FinancialEntry, year: number, month: number): boolean => {
      if (entry.frequency !== "recorrente" || !entry.startDate) return false;

      const startDate = new Date(entry.startDate + "T00:00:00");
      const startYear = startDate.getFullYear();
      const startMonth = startDate.getMonth();

      // month >= month(start_date)
      if (year < startYear || (year === startYear && month < startMonth)) return false;

      // end_date is null OR month <= month(end_date)
      if (entry.endDate) {
        const endDate = new Date(entry.endDate + "T00:00:00");
        const endYear = endDate.getFullYear();
        const endMonth = endDate.getMonth();
        if (year > endYear || (year === endYear && month > endMonth)) return false;
      }

      return true;
    },
    []
  );

  // Obter entradas para uma data específica (DIÁRIO)
  // Retorna entradas com status específico para aquela ocorrência
  const getEntriesForDate = useCallback(
    (dateKey: string) => {
      const result: FinancialEntry[] = [];
      const today = new Date().toISOString().substring(0, 10);

      entries.forEach((entry) => {
        if (entry.frequency === "pontual") {
          // Entrada pontual: verificar se a data corresponde
          if (entry.date === dateKey) {
            result.push(entry);
          }
        } else if (entry.frequency === "recorrente") {
          // Entrada recorrente: verificar se é válida para esta data
          if (isRecurringValidForDate(entry, dateKey)) {
            // Para recorrentes, criar uma cópia com status específico da ocorrência
            const occurrenceEntry: FinancialEntry = { ...entry };
            
            // Verificar se há status específico para esta ocorrência
            if (entry.occurrenceStatuses && entry.occurrenceStatuses[dateKey]) {
              occurrenceEntry.status = entry.occurrenceStatuses[dateKey];
            } else {
              // Se não há status específico, determinar automaticamente:
              // - Se a data já passou: pending
              // - Se a data é futura: expected
              if (dateKey <= today) {
                occurrenceEntry.status = "pending";
              } else {
                occurrenceEntry.status = "expected";
              }
            }
            
            result.push(occurrenceEntry);
          }
        }
      });

      return result;
    },
    [entries, isRecurringValidForDate]
  );

  // Obter entradas recorrentes que impactam um mês específico (MENSAL)
  const getRecurringEntriesForMonth = useCallback(
    (year: number, month: number) => {
      return entries.filter((entry) => 
        entry.frequency === "recorrente" && isRecurringValidForMonth(entry, year, month)
      );
    },
    [entries, isRecurringValidForMonth]
  );

  // Obter todas as entradas
  const getAllEntries = useCallback(() => entries, [entries]);

  // Obter apenas recorrentes ativos (inclui futuros, mas verifica se não foram encerrados)
  const getActiveRecurringEntries = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return entries.filter((entry) => {
      if (entry.frequency !== "recorrente" || !entry.startDate) return false;
      
      const startDate = new Date(entry.startDate + "T00:00:00");
      startDate.setHours(0, 0, 0, 0);
      
      // Incluir recorrentes futuros também (removido: if (startDate > today) return false;)
      
      // end_date é null ou end_date >= hoje (se tiver end_date no passado, não mostrar)
      if (entry.endDate) {
        const endDate = new Date(entry.endDate + "T00:00:00");
        endDate.setHours(0, 0, 0, 0);
        if (endDate < today) return false;
      }
      
      return true;
    });
  }, [entries]);

  // Excluir uma data específica da recorrência (mantém a recorrência ativa)
  const excludeRecurrenceDate = useCallback(
    (id: string, dateToExclude: string) => {
      const entry = entries.find((e) => e.id === id);
      if (!entry || entry.frequency !== "recorrente") return;

      const currentExcluded = entry.excludedDates || [];
      // Adicionar a data se ainda não estiver na lista
      if (!currentExcluded.includes(dateToExclude)) {
        updateEntry(id, { excludedDates: [...currentExcluded, dateToExclude] });
      }
    },
    [entries, updateEntry]
  );

  // Atualizar status de uma ocorrência específica de uma entrada recorrente
  const updateOccurrenceStatus = useCallback(
    (id: string, dateKey: string, status: EntryStatus) => {
      const entry = entries.find((e) => e.id === id);
      if (!entry || entry.frequency !== "recorrente") return;

      const currentStatuses = entry.occurrenceStatuses || {};
      updateEntry(id, { 
        occurrenceStatuses: { ...currentStatuses, [dateKey]: status }
      });
    },
    [entries, updateEntry]
  );

  // Encerrar recorrência (definir end_date = data anterior para que não apareça mais)
  const endRecurrence = useCallback(
    (id: string, endDate?: string) => {
      // Se não fornecer uma data, usar ontem para que não apareça mais na lista de ativos
      let targetDate: string;
      if (endDate) {
        // Se fornecer uma data, usar o dia anterior a ela
        const date = new Date(endDate + "T00:00:00");
        date.setDate(date.getDate() - 1);
        targetDate = date.toISOString().substring(0, 10);
      } else {
        // Usar ontem
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        targetDate = yesterday.toISOString().substring(0, 10);
      }
      updateEntry(id, { endDate: targetDate });
    },
    [updateEntry]
  );

  // Verificar se uma entrada deve ser incluída nos cálculos baseado no status
  const shouldIncludeInTotals = useCallback(
    (entry: FinancialEntry, includePending: boolean = true): boolean => {
      if (entry.status === "received") return true;
      if (entry.status === "pending" && includePending) return true;
      return false; // expected e canceled nunca entram
    },
    []
  );

  // Análise por status (breakdown de ganhos e gastos por status)
  const getStatusAnalysis = useCallback(
    (startDate?: string, endDate?: string) => {
      const today = new Date().toISOString().substring(0, 10);
      const analysis = {
        ganhos: {
          received: 0,
          pending: 0,
          expected: 0,
          canceled: 0,
        },
        gastos: {
          received: 0,
          pending: 0,
          expected: 0,
          canceled: 0,
        },
      };

      entries.forEach((entry) => {
        // Determinar o status da entrada para cada ocorrência no período
        if (entry.frequency === "pontual" && entry.date) {
          if (startDate && entry.date < startDate) return;
          if (endDate && entry.date > endDate) return;
          
          const status = entry.status || "received";
          if (entry.nature === "ganho") {
            analysis.ganhos[status] += entry.amount;
          } else {
            analysis.gastos[status] += Math.abs(entry.amount);
          }
        } else if (entry.frequency === "recorrente" && entry.startDate) {
          const entryStart = new Date(entry.startDate + "T00:00:00");
          const entryEnd = entry.endDate ? new Date(entry.endDate + "T00:00:00") : null;
          const periodStart = startDate ? new Date(startDate + "T00:00:00") : null;
          const periodEnd = endDate ? new Date(endDate + "T00:00:00") : null;
          
          // Verificar se há sobreposição
          if (periodStart && entryEnd && entryEnd < periodStart) return;
          if (periodEnd && entryStart > periodEnd) return;
          
          // Calcular ocorrências mensais no período
          if (entry.recurrence === "mensal") {
            let currentDate = new Date(Math.max(entryStart.getTime(), periodStart?.getTime() || entryStart.getTime()));
            const maxDate = periodEnd || new Date();
            
            while (currentDate <= maxDate) {
              if (currentDate >= entryStart && (!entryEnd || currentDate <= entryEnd)) {
                if (currentDate.getDate() === entryStart.getDate()) {
                  const dateKey = currentDate.toISOString().substring(0, 10);
                  // Verificar se a data está excluída
                  if (entry.excludedDates && entry.excludedDates.includes(dateKey)) {
                    currentDate.setMonth(currentDate.getMonth() + 1);
                    continue;
                  }
                  
                  // Determinar status da ocorrência
                  let status: EntryStatus;
                  if (entry.occurrenceStatuses && entry.occurrenceStatuses[dateKey]) {
                    status = entry.occurrenceStatuses[dateKey];
                  } else {
                    // Auto-determinar: se já passou -> pending, senão -> expected
                    status = dateKey <= today ? "pending" : "expected";
                  }
                  
                  if (entry.nature === "ganho") {
                    analysis.ganhos[status] += entry.amount;
                  } else {
                    analysis.gastos[status] += Math.abs(entry.amount);
                  }
                }
              }
              currentDate.setMonth(currentDate.getMonth() + 1);
            }
          }
        }
      });

      return analysis;
    },
    [entries]
  );

  // Análise por categoria (agregação de ganhos e gastos)
  const getCategoryAnalysis = useCallback(
    (startDate?: string, endDate?: string) => {
      const categoryMap = new Map<string, number>();
      
      // Processar todas as entradas no período
      entries.forEach((entry) => {
        // Se for pontual, verificar se está no período
        if (entry.frequency === "pontual" && entry.date) {
          if (startDate && entry.date < startDate) return;
          if (endDate && entry.date > endDate) return;
          
          const category = entry.category || "Sem categoria";
          const current = categoryMap.get(category) || 0;
          categoryMap.set(category, current + entry.amount);
        }
        
        // Se for recorrente, verificar se impacta o período
        if (entry.frequency === "recorrente" && entry.startDate) {
          const entryStart = new Date(entry.startDate + "T00:00:00");
          const entryEnd = entry.endDate ? new Date(entry.endDate + "T00:00:00") : null;
          const periodStart = startDate ? new Date(startDate + "T00:00:00") : null;
          const periodEnd = endDate ? new Date(endDate + "T00:00:00") : null;
          
          // Verificar se há sobreposição
          if (periodStart && entryEnd && entryEnd < periodStart) return;
          if (periodEnd && entryStart > periodEnd) return;
          
          // Calcular quantas ocorrências no período
          if (entry.recurrence === "mensal") {
            let count = 0;
            let currentDate = new Date(Math.max(entryStart.getTime(), periodStart?.getTime() || entryStart.getTime()));
            const maxDate = periodEnd || new Date();
            
            while (currentDate <= maxDate) {
              if (currentDate >= entryStart && (!entryEnd || currentDate <= entryEnd)) {
                if (currentDate.getDate() === entryStart.getDate()) {
                  count++;
                }
              }
              // Próximo mês
              currentDate.setMonth(currentDate.getMonth() + 1);
            }
            
            const category = entry.category || "Sem categoria";
            const current = categoryMap.get(category) || 0;
            categoryMap.set(category, current + (entry.amount * count));
          }
        }
      });
      
      // Converter para array e ordenar
      const result = Array.from(categoryMap.entries())
        .map(([category, total]) => ({ category, total }))
        .sort((a, b) => a.total - b.total); // Ordenar do menor (mais negativo) para o maior
      
      return result;
    },
    [entries]
  );

  return {
    entries,
    addEntry,
    updateEntry,
    removeEntry,
    getEntriesForDate,
    getRecurringEntriesForMonth,
    getAllEntries,
    getActiveRecurringEntries,
    excludeRecurrenceDate,
    endRecurrence,
    getCategoryAnalysis,
    updateOccurrenceStatus,
    shouldIncludeInTotals,
    getStatusAnalysis,
  };
}

