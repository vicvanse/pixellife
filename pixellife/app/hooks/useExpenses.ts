"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { saveToSupabase } from "../lib/supabase-sync";
import { exportExpensesData } from "../lib/sync-helpers";
import { withRetry } from "../lib/retry";
import { useToastContext } from "../context/ToastContext";
import { useFinancialEntries } from "./useFinancialEntries";
// Não precisamos mais ler da tabela finances - tudo vem de user_data via syncToSupabase

// ===============================
// TYPES
// ===============================

export type DailyExpenseItem = {
  id: string;
  description: string;
  value: number;
  createdAt: string; // YYYY-MM-DD
  relatedGoalId?: number; // ID do objetivo relacionado (opcional)
  category?: string; // Categoria do gasto (opcional)
};

export type ReserveMovement = {
  id: string;
  description: string;
  value: number; // positivo = adiciona, negativo = retira
  createdAt: string; // YYYY-MM-DD
};

export type MonthlyRow = {
  day: number;          // 1..31
  description: string;  // descrição geral do dia
  totalDaily: number;   // soma dos itens do dia
  totalMonth: number;   // acumulado no mês até o dia
  reserve: number;      // reserva acumulada (reserva inicial + movimentações)
  budget: number;       // orçamento daquele dia (opcional)
  accountMoney: number; // dinheiro em conta acumulado
};

// Prefixo para isolar as chaves do localStorage
const STORAGE_PREFIX = "pixel-life-expenses-v1";

// Helper seguro para montar a chave
const k = (suffix: string) => `${STORAGE_PREFIX}:${suffix}`;

// Helpers seguros de leitura/gravação -------------------
function readJSON<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

// Função para limpar dados antigos de expenses (mais de 90 dias)
function clearOldExpensesData() {
  if (typeof window === "undefined") return;
  
  const prefix = "pixel-life-expenses-v1:";
  const today = new Date();
  const cutoffDate = new Date(today);
  cutoffDate.setDate(cutoffDate.getDate() - 90); // 90 dias atrás
  
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      // Extrair data da chave (ex: "daily:2025-01-01")
      const dateMatch = key.match(/(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        const keyDate = new Date(dateMatch[1]);
        if (keyDate < cutoffDate) {
          keysToRemove.push(key);
        }
      }
    }
  }
  
  keysToRemove.forEach(key => window.localStorage.removeItem(key));
  console.log(`🧹 Limpados ${keysToRemove.length} registros antigos de expenses`);
}

function writeJSON<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn("⚠️ localStorage cheio! Limpando dados antigos...");
      clearOldExpensesData();
      // Tentar novamente após limpeza
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
        console.log("✅ Dados salvos após limpeza");
      } catch (retryError) {
        console.error("❌ Ainda sem espaço após limpeza:", retryError);
        // Em último caso, tentar remover dados mais recentes também
        // (manter apenas últimos 30 dias)
        const prefix = "pixel-life-expenses-v1:";
        const today = new Date();
        const cutoffDate = new Date(today);
        cutoffDate.setDate(cutoffDate.getDate() - 30);
        
        for (let i = 0; i < window.localStorage.length; i++) {
          const storageKey = window.localStorage.key(i);
          if (storageKey && storageKey.startsWith(prefix) && storageKey !== key) {
            const dateMatch = storageKey.match(/(\d{4}-\d{2}-\d{2})/);
            if (dateMatch) {
              const keyDate = new Date(dateMatch[1]);
              if (keyDate < cutoffDate) {
                window.localStorage.removeItem(storageKey);
              }
            }
          }
        }
        
        // Última tentativa
        try {
          window.localStorage.setItem(key, JSON.stringify(value));
        } catch (finalError) {
          console.error("❌ Erro crítico: localStorage completamente cheio", finalError);
        }
      }
    } else {
      console.error("❌ Erro ao salvar no localStorage:", error);
    }
  }
}

// ===============================
// HOOK PRINCIPAL
// ===============================

export function useExpenses() {
  const { user } = useAuth();
  const { showToast } = useToastContext();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const getAccountMoneyRef = useRef<((dateKey: string) => number) | null>(null);
  const hasLoadedFinancesRef = useRef(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Obter getEntriesForDate do hook useFinancialEntries para uso interno
  const { getEntriesForDate: getEntriesForDateInternal } = useFinancialEntries();

  // Função helper para salvar expenses no Supabase (com debounce e retry)
  const syncToSupabase = useCallback(() => {
    if (!user?.id) {
      console.log("⏭️ Usuário não autenticado - pulando sincronização");
      return;
    }

    // Limpar timeout anterior
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Salvar após 1 segundo de inatividade (debounce)
    saveTimeoutRef.current = setTimeout(async () => {
      setIsSyncing(true);
      try {
        console.log("💾 Sincronizando expenses com Supabase...");
        const expensesData = exportExpensesData();
        
        // Usar retry logic para falhas de rede
        await withRetry(
          async () => {
            const { error } = await saveToSupabase(user.id, "expenses", expensesData);
            if (error) {
              throw error;
            }
          },
          {
            maxRetries: 3,
            initialDelay: 1000,
            onRetry: (attempt, error) => {
              console.warn(`⚠️ Tentativa ${attempt} de sincronização falhou:`, error);
            },
          }
        );
        
        console.log("✅ Expenses sincronizados com Supabase");
        // Toast removido - não mostrar mensagem de salvamento automático
      } catch (err) {
        console.error("❌ Erro ao sincronizar expenses:", err);
        showToast("Erro ao salvar dados. Tente novamente.", "error");
      } finally {
        setIsSyncing(false);
      }
    }, 1000);
  }, [user?.id, showToast]);

  // Limpar timeout ao desmontar
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // ---------- FORMATADORES BÁSICOS ----------
  const formatDateKey = useCallback((date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`; // ex: 2025-01-09
  }, []);

  const formatMonthKey = useCallback((date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`; // ex: 2025-01
  }, []);

  const getTodayDate = useCallback((): string => {
    return formatDateKey(new Date());
  }, [formatDateKey]);

  // ---------- ITENS DIÁRIOS ----------
  const getDailyExpenses = useCallback(
    (dateKey: string): DailyExpenseItem[] => {
      return readJSON<DailyExpenseItem[]>(k(`daily:${dateKey}`), []);
    },
    []
  );

  const saveDailyExpenses = useCallback((dateKey: string, items: DailyExpenseItem[]) => {
    writeJSON(k(`daily:${dateKey}`), items);
    syncToSupabase();
  }, [syncToSupabase]);

  const addDailyExpense = useCallback(
    (dateKey: string, description: string, value: number, relatedGoalId?: number, category?: string): DailyExpenseItem[] => {
      const current = getDailyExpenses(dateKey);
      const item: DailyExpenseItem = {
        id: `${dateKey}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        description,
        value,
        createdAt: dateKey,
        ...(relatedGoalId !== undefined && { relatedGoalId }),
        ...(category && { category }),
      };
      const updated = [...current, item];
      saveDailyExpenses(dateKey, updated);
      
      // syncToSupabase() já salva todos os expenses (incluindo saldos) via user_data
      // Não precisamos mais salvar na tabela finances separadamente
      
      return updated;
    },
    [getDailyExpenses, saveDailyExpenses, user?.id]
  );

  const removeDailyExpense = useCallback(
    (dateKey: string, id: string): DailyExpenseItem[] => {
      const current = getDailyExpenses(dateKey);
      const updated = current.filter((it) => it.id !== id);
      saveDailyExpenses(dateKey, updated);
      
      // syncToSupabase() já salva todos os expenses (incluindo saldos) via user_data
      // Não precisamos mais salvar na tabela finances separadamente
      
      return updated;
    },
    [getDailyExpenses, saveDailyExpenses, user?.id]
  );

  const calculateDailyTotal = useCallback(
    (dateKey: string, getFinancialEntriesForDate?: (dateKey: string) => any[]): number => {
      const items = getDailyExpenses(dateKey);
      const legacyTotal = items.reduce((sum, it) => sum + it.value, 0);
      
      // Incluir entradas do novo sistema - usar getEntriesForDate interno ou o parâmetro fornecido
      const getEntries = getFinancialEntriesForDate || getEntriesForDateInternal;
      const financialEntries = getEntries(dateKey);
      const financialEntriesTotal = financialEntries.reduce((sum, entry) => sum + entry.amount, 0);
      
      return legacyTotal + financialEntriesTotal;
    },
    [getDailyExpenses, getEntriesForDateInternal]
  );

  // Calcula apenas os gastos (valores negativos ou zero) do dia
  // Ganhos (valores positivos) não são incluídos
  const calculateDailyExpensesOnly = useCallback(
    (dateKey: string, getFinancialEntriesForDate?: (dateKey: string) => any[]): number => {
      const items = getDailyExpenses(dateKey);
      const legacyExpenses = items.reduce((sum, it) => {
        // Soma apenas valores negativos ou zero (gastos)
        // Valores positivos (ganhos) são ignorados
        return sum + Math.min(0, it.value);
      }, 0);
      
      // Incluir apenas gastos (valores negativos) do novo sistema - usar getEntriesForDate interno ou o parâmetro fornecido
      const getEntries = getFinancialEntriesForDate || getEntriesForDateInternal;
      const financialEntries = getEntries(dateKey);
      const financialEntriesExpenses = financialEntries.reduce((sum, entry) => sum + Math.min(0, entry.amount), 0);
      
      return legacyExpenses + financialEntriesExpenses;
    },
    [getDailyExpenses, getEntriesForDateInternal]
  );

  // Buscar todas as despesas relacionadas a um objetivo
  const getExpensesByGoalId = useCallback(
    (goalId: number): DailyExpenseItem[] => {
      const allExpenses: DailyExpenseItem[] = [];
      // Buscar em todas as datas (últimos 2 anos para performance)
      const today = new Date();
      for (let i = 0; i < 730; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateKey = formatDateKey(date);
        const expenses = getDailyExpenses(dateKey);
        allExpenses.push(...expenses.filter((exp) => exp.relatedGoalId === goalId));
      }
      return allExpenses;
    },
    [formatDateKey, getDailyExpenses]
  );

  // ---------- SALÁRIO / GASTO MENSAL / RESET / RESERVA ----------
  const getSalary = useCallback((monthKey: string): number | null => {
    return readJSON<number | null>(k(`salary:${monthKey}`), null);
  }, []);

  const saveSalary = useCallback((monthKey: string, value: number) => {
    writeJSON(k(`salary:${monthKey}`), value);
    syncToSupabase();
  }, [syncToSupabase]);

  // Gasto mensal desejado com herança do mês anterior
  const getDesiredMonthlyExpense = useCallback((monthKey: string): number => {
    const stored = readJSON<number | null>(k(`desiredMonthly:${monthKey}`), null);
    if (stored !== null) return stored;
    
    // Buscar do mês anterior recursivamente
    const parts = monthKey.split("-");
    if (parts.length === 2) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      
      if (!isNaN(year) && !isNaN(month) && month >= 1 && month <= 12) {
        let currentYear = year;
        let currentMonth = month;
        let attempts = 0;
        const maxAttempts = 24;
        
        while (attempts < maxAttempts) {
          currentMonth--;
          if (currentMonth < 1) {
            currentMonth = 12;
            currentYear--;
          }
          
          const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
          const prevMonthKey = formatMonthKey(prevMonthDate);
          const prevStored = readJSON<number | null>(k(`desiredMonthly:${prevMonthKey}`), null);
          
          if (prevStored !== null) {
            return prevStored;
          }
          
          attempts++;
        }
      }
    }
    
    return 0;
  }, [formatMonthKey]);

  const saveDesiredMonthlyExpense = useCallback((monthKey: string, value: number) => {
    writeJSON(k(`desiredMonthly:${monthKey}`), value);
    
    // Atualizar TODOS os meses seguintes (não apenas os que não foram editados)
    const parts = monthKey.split("-");
    if (parts.length === 2) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      
      if (!isNaN(year) && !isNaN(month) && month >= 1 && month <= 12) {
        let currentYear = year;
        let currentMonth = month;
        let attempts = 0;
        const maxAttempts = 24;
        
        while (attempts < maxAttempts) {
          currentMonth++;
          if (currentMonth > 12) {
            currentMonth = 1;
            currentYear++;
          }
          
          const nextMonthDate = new Date(currentYear, currentMonth - 1, 1);
          const nextMonthKey = formatMonthKey(nextMonthDate);
          
          // Atualizar TODOS os meses seguintes
          writeJSON(k(`desiredMonthly:${nextMonthKey}`), value);
          attempts++;
        }
      }
    }
    syncToSupabase();
  }, [formatMonthKey, syncToSupabase]);

  // Data de reset com herança do mês anterior
  const getResetDate = useCallback((monthKey: string): number => {
    const stored = readJSON<number | null>(k(`resetDate:${monthKey}`), null);
    if (stored !== null) return stored;
    
    // Buscar do mês anterior recursivamente
    const parts = monthKey.split("-");
    if (parts.length === 2) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      
      if (!isNaN(year) && !isNaN(month) && month >= 1 && month <= 12) {
        let currentYear = year;
        let currentMonth = month;
        let attempts = 0;
        const maxAttempts = 24;
        
        while (attempts < maxAttempts) {
          currentMonth--;
          if (currentMonth < 1) {
            currentMonth = 12;
            currentYear--;
          }
          
          const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
          const prevMonthKey = formatMonthKey(prevMonthDate);
          const prevStored = readJSON<number | null>(k(`resetDate:${prevMonthKey}`), null);
          
          if (prevStored !== null && prevStored >= 1 && prevStored <= 31) {
            return prevStored;
          }
          
          attempts++;
        }
      }
    }
    
    return 1; // Padrão: dia 1
  }, [formatMonthKey]);

  const saveResetDate = useCallback((monthKey: string, day: number) => {
    if (day < 1 || day > 31 || isNaN(day)) return;
    
    writeJSON(k(`resetDate:${monthKey}`), day);
    
    // Atualizar TODOS os meses seguintes (não apenas os que não foram editados)
    const parts = monthKey.split("-");
    if (parts.length === 2) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      
      if (!isNaN(year) && !isNaN(month) && month >= 1 && month <= 12) {
        let currentYear = year;
        let currentMonth = month;
        let attempts = 0;
        const maxAttempts = 24;
        
        while (attempts < maxAttempts) {
          currentMonth++;
          if (currentMonth > 12) {
            currentMonth = 1;
            currentYear++;
          }
          
          const nextMonthDate = new Date(currentYear, currentMonth - 1, 1);
          const nextMonthKey = formatMonthKey(nextMonthDate);
          
          // Atualizar TODOS os meses seguintes
          writeJSON(k(`resetDate:${nextMonthKey}`), day);
          attempts++;
        }
      }
    }
    syncToSupabase();
    
    // Disparar evento para atualizar componentes (Display, tabelas, etc)
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("pixel-life-storage-change"));
    }
  }, [formatMonthKey, syncToSupabase]);

  // ---------- MOVIMENTAÇÕES DE RESERVA ----------
  const getReserveMovements = useCallback(
    (dateKey: string): ReserveMovement[] => {
      return readJSON<ReserveMovement[]>(k(`reserveMovements:${dateKey}`), []);
    },
    []
  );

  const saveReserveMovements = useCallback((dateKey: string, movements: ReserveMovement[]) => {
    writeJSON(k(`reserveMovements:${dateKey}`), movements);
    syncToSupabase();
  }, [syncToSupabase]);

  const addReserveMovement = useCallback(
    (dateKey: string, description: string, value: number): ReserveMovement[] => {
      const current = getReserveMovements(dateKey);
      const movement: ReserveMovement = {
        id: `${dateKey}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        description,
        value,
        createdAt: dateKey,
      };
      const updated = [...current, movement];
      saveReserveMovements(dateKey, updated);
      
      // syncToSupabase() já salva todos os expenses (incluindo saldos) via user_data
      // Não precisamos mais salvar na tabela finances separadamente
      
      return updated;
    },
    [getReserveMovements, saveReserveMovements, user?.id]
  );

  const removeReserveMovement = useCallback(
    (dateKey: string, id: string): ReserveMovement[] => {
      const current = getReserveMovements(dateKey);
      const updated = current.filter((it) => it.id !== id);
      saveReserveMovements(dateKey, updated);
      
      // syncToSupabase() já salva todos os expenses (incluindo saldos) via user_data
      // Não precisamos mais salvar na tabela finances separadamente
      
      return updated;
    },
    [getReserveMovements, saveReserveMovements, user?.id]
  );

  const calculateDailyReserveDelta = useCallback(
    (dateKey: string): number => {
      const movements = getReserveMovements(dateKey);
      return movements.reduce((sum, it) => sum + it.value, 0);
    },
    [getReserveMovements]
  );

  // ---------- RESERVA INICIAL (POR MÊS) ----------
  // Função interna recursiva com limite para evitar stack overflow
  const getInitialReserveRecursive = useCallback((monthKey: string, depth: number = 0, visited: Set<string> = new Set()): number => {
    // Limite de profundidade para evitar recursão infinita
    if (depth > 24) {
      return 0; // Limite de 2 anos (24 meses)
    }
    
    // Verificar se já visitamos este mês (evita loops)
    if (visited.has(monthKey)) {
      return 0;
    }
    visited.add(monthKey);
    
    // Verificar se há valor salvo no localStorage
    if (typeof window !== "undefined") {
      const key = k(`initialReserve:${monthKey}`);
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        try {
          const value = parseFloat(JSON.parse(raw));
          if (!isNaN(value)) {
            return value;
          }
        } catch {
          // Se der erro ao parsear, continuar para calcular
        }
      }
    }
    
    // Se não encontrou valor salvo, calcular a reserva final do mês anterior
    const parts = monthKey.split("-");
    if (parts.length === 2) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      
      if (!isNaN(year) && !isNaN(month) && month >= 1 && month <= 12) {
        // Calcular mês anterior
        let prevMonth = month - 1;
        let prevYear = year;
        if (prevMonth < 1) {
          prevMonth = 12;
          prevYear--;
        }
        
        const prevMonthDate = new Date(prevYear, prevMonth - 1, 1);
        const prevMonthKey = formatMonthKey(prevMonthDate);
        
        // Obter reserva inicial do mês anterior (recursivo com limite)
        const prevMonthInitialReserve = getInitialReserveRecursive(prevMonthKey, depth + 1, visited);
        
        // Calcular a reserva final do mês anterior (reserva inicial + todas as movimentações)
        const prevMonthDays = new Date(prevYear, prevMonth, 0).getDate();
        let prevMonthFinalReserve = prevMonthInitialReserve;
        for (let prevDay = 1; prevDay <= prevMonthDays; prevDay++) {
          const prevDate = new Date(prevYear, prevMonth - 1, prevDay);
          const prevDateKey = formatDateKey(prevDate);
          const prevReserveDelta = calculateDailyReserveDelta(prevDateKey);
          prevMonthFinalReserve = prevMonthFinalReserve + prevReserveDelta;
        }
        
        // Salvar automaticamente a reserva final do mês anterior como reserva inicial do mês atual
        writeJSON(k(`initialReserve:${monthKey}`), prevMonthFinalReserve);
        
        return prevMonthFinalReserve;
      }
    }
    
    return 0;
  }, [formatMonthKey, formatDateKey, calculateDailyReserveDelta]);

  const getInitialReserve = useCallback((monthKey: string): number => {
    return getInitialReserveRecursive(monthKey, 0, new Set());
  }, [getInitialReserveRecursive]);

  // Obter reserva atual (do dia de hoje)
  // MODELO CORRETO: Reserva é contínua, não mensal - acumula desde sempre
  const getCurrentReserve = useCallback((dateKey?: string): number => {
    const targetDate = dateKey ? (() => {
      const [yearStr, monthStr, dayStr] = dateKey.split("-");
      return new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, parseInt(dayStr, 10));
    })() : new Date();
    const targetKey = dateKey || formatDateKey(targetDate);
    
    // Buscar retroativamente até encontrar uma reserva inicial salva (se houver)
    // Por enquanto, começamos do zero e acumulamos todas as movimentações até a data
    let totalReserve = 0;
    
    // Calcular todas as movimentações desde sempre até a data alvo
    // Limitar a busca a 2 anos atrás (proteção)
    const startDate = new Date(targetDate);
    startDate.setFullYear(Math.max(2020, targetDate.getFullYear() - 2));
    startDate.setMonth(0);
    startDate.setDate(1);
    
    let currentDate = new Date(startDate);
    while (currentDate <= targetDate) {
      const dayKey = formatDateKey(currentDate);
      const delta = calculateDailyReserveDelta(dayKey);
      totalReserve += delta;
      
      // Próximo dia
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return totalReserve;
  }, [formatDateKey, calculateDailyReserveDelta]);

  const saveInitialReserve = useCallback((monthKey: string, value: number) => {
    writeJSON(k(`initialReserve:${monthKey}`), value);
    syncToSupabase();
  }, [syncToSupabase]);

  // ---------- ORÇAMENTO E DESCRIÇÃO POR DIA ----------
  const getBudget = useCallback((dateKey: string): number => {
    return readJSON<number>(k(`budget:${dateKey}`), 0);
  }, []);

  const saveBudget = useCallback((dateKey: string, value: number) => {
    writeJSON(k(`budget:${dateKey}`), value);
    syncToSupabase();
  }, [syncToSupabase]);

  const getDescription = useCallback((dateKey: string): string => {
    return readJSON<string>(k(`description:${dateKey}`), "");
  }, []);

  const saveDescription = useCallback((dateKey: string, description: string) => {
    writeJSON(k(`description:${dateKey}`), description);
    syncToSupabase();
  }, [syncToSupabase]);

  // ---------- DINHEIRO EM CONTA (POR DATA) ----------
  // Busca o valor inicial de dinheiro em conta salvo manualmente para uma data específica
  // Este valor é o valor ANTES de aplicar os gastos e movimentações daquele dia
  const getAccountMoneyInitialByDate = useCallback((dateKey: string): number | null => {
    // Verifica se a chave existe no localStorage
    // Se existir, retorna o valor (mesmo que seja 0)
    // Se não existir, retorna null
    if (typeof window === "undefined") return null;
    try {
      const key = k(`accountMoneyInitial:${dateKey}`);
      const raw = window.localStorage.getItem(key);
      if (raw === null) return null; // Chave não existe = null
      const parsed = JSON.parse(raw);
      // Se o valor parseado é um número (incluindo 0), retorna ele
      if (typeof parsed === "number") return parsed;
      return null;
    } catch {
      return null;
    }
  }, []);

  // Busca o último valor inicial salvo antes ou na data especificada
  // VERSÃO CORRIGIDA: Retorna { value: number, day: number } mesmo quando não encontra (value = 0)
  const getLastAccountMoneyInitial = useCallback((dateKey: string): { value: number; day: number } | null => {
    const [yearStr, monthStr, dayStr] = dateKey.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const day = parseInt(dayStr, 10);
    
    // Busca do dia atual até o dia 1 do mês
    for (let d = day; d >= 1; d--) {
      const checkDate = new Date(year, month, d);
      const checkKey = formatDateKey(checkDate);
      const value = getAccountMoneyInitialByDate(checkKey);
      if (value !== null) {
        return { value, day: d };
      }
    }
    
    // Se não encontrou nenhum valor salvo, retorna null (o getAccountMoney tratará como 0)
    return null;
  }, [formatDateKey, getAccountMoneyInitialByDate]);

  // Não precisamos mais carregar da tabela finances
  // Todos os dados (incluindo saldos) são carregados via user_data pelo useSyncData
  // Os saldos são calculados a partir dos expenses salvos no localStorage

  // Helper para calcular o ciclo baseado em uma data e resetDay
  // Regra universal: ciclo é sempre de resetDay/mêsAtual → resetDay-1/mêsSeguinte
  // Se dia >= resetDay: ciclo começou neste mês
  // Se dia < resetDay: ciclo começou no mês anterior
  // Calcula as datas de início e fim do ciclo de orçamento para uma data específica
  // CORREÇÃO: O ciclo deve "fixar" o resetDay vigente quando começou, caminhando para trás no tempo
  // para encontrar o último reset efetivo que realmente ocorreu
  // INVARIANTE: resetDay afeta apenas orçamento, não saldo
  // O ciclo pode atravessar meses (ex: dia 5 de um mês até dia 4 do próximo)
  const getCycleDates = useCallback((dateKey: string, resetDay: number): { cycleStart: Date; cycleEnd: Date } => {
    const [yearStr, monthStr, dayStr] = dateKey.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1; // 0-indexed
    const day = parseInt(dayStr, 10);
    const targetDate = new Date(year, month, day);
    targetDate.setHours(0, 0, 0, 0);
    
    // Caminhar para trás no tempo para encontrar o último reset efetivo
    // Um reset efetivo é uma data onde day === resetDay vigente naquele mês
    let cycleStart: Date | null = null;
    let searchDate = new Date(targetDate);
    searchDate.setHours(0, 0, 0, 0);
    
    const maxSearchDays = 366; // ~1 ano (proteção)
    const minDate = new Date(2020, 0, 1);
    minDate.setHours(0, 0, 0, 0);
    let searchDays = 0;
    
    while (searchDays < maxSearchDays && searchDate >= minDate && cycleStart === null) {
      const searchYear = searchDate.getFullYear();
      const searchMonth = searchDate.getMonth();
      const searchDay = searchDate.getDate();
      
      // Obter o resetDay vigente neste mês
      const searchMonthKey = formatMonthKey(searchDate);
      const effectiveResetDay = getResetDate(searchMonthKey);
      
      // Ajustar resetDay se o mês não tiver esse dia (ex: dia 31 em fevereiro)
      const daysInMonth = new Date(searchYear, searchMonth + 1, 0).getDate();
      const adjustedResetDay = Math.min(effectiveResetDay, daysInMonth);
      
      // Verificar se este é um reset efetivo (dia === resetDay vigente)
      if (searchDay === adjustedResetDay) {
        cycleStart = new Date(searchDate);
        cycleStart.setHours(0, 0, 0, 0);
        break;
      }
      
      // Ir para o dia anterior
      searchDate.setDate(searchDate.getDate() - 1);
      searchDays++;
    }
    
    // Se não encontrou nenhum reset efetivo, usar a data mínima como fallback
    if (cycleStart === null) {
      cycleStart = new Date(minDate);
      cycleStart.setHours(0, 0, 0, 0);
    }
    
    // Calcular o fim do ciclo: dia anterior ao próximo reset efetivo
    // O próximo reset será quando day === resetDay vigente no mês futuro
    let cycleEnd: Date;
    let nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);
    nextDate.setHours(0, 0, 0, 0);
    
    const maxForwardDays = 366;
    let forwardDays = 0;
    let foundNextReset = false;
    
    while (forwardDays < maxForwardDays && !foundNextReset) {
      const nextYear = nextDate.getFullYear();
      const nextMonth = nextDate.getMonth();
      const nextDay = nextDate.getDate();
      
      const nextMonthKey = formatMonthKey(nextDate);
      const nextEffectiveResetDay = getResetDate(nextMonthKey);
      const nextDaysInMonth = new Date(nextYear, nextMonth + 1, 0).getDate();
      const nextAdjustedResetDay = Math.min(nextEffectiveResetDay, nextDaysInMonth);
      
      if (nextDay === nextAdjustedResetDay) {
        // Encontrou o próximo reset: o fim do ciclo é o dia anterior
        cycleEnd = new Date(nextDate);
        cycleEnd.setDate(cycleEnd.getDate() - 1);
        cycleEnd.setHours(0, 0, 0, 0);
        foundNextReset = true;
      } else {
        nextDate.setDate(nextDate.getDate() + 1);
        forwardDays++;
      }
    }
    
    // Se não encontrou próximo reset, usar o último dia do ano seguinte como fallback
    if (!foundNextReset) {
      cycleEnd = new Date(targetDate.getFullYear() + 1, 11, 31);
      cycleEnd.setHours(0, 0, 0, 0);
    }
    
    return { cycleStart, cycleEnd: cycleEnd! };
  }, [formatMonthKey, getResetDate]);

  // Busca retroativamente o último valor salvo antes ou na data especificada
  // Retorna { value: number, dateKey: string } ou null se não encontrar
  const getLastSavedAccountMoney = useCallback((dateKey: string): { value: number; dateKey: string } | null => {
    const [yearStr, monthStr, dayStr] = dateKey.split("-");
    let year = parseInt(yearStr, 10);
    let month = parseInt(monthStr, 10) - 1;
    let day = parseInt(dayStr, 10);
    
    const minYear = 2020;
    const maxSearchDays = 730; // ~2 anos (proteção)
    let searchDays = 0;
    
    // Buscar retroativamente até encontrar um valor salvo ou chegar ao limite
    while (searchDays < maxSearchDays && year >= minYear) {
      const checkDate = new Date(year, month, day);
      const checkKey = formatDateKey(checkDate);
      const savedValue = getAccountMoneyInitialByDate(checkKey);
      
      if (savedValue !== null && !isNaN(savedValue)) {
        return { value: savedValue, dateKey: checkKey };
      }
      
      // Ir para o dia anterior
      if (day > 1) {
        day--;
      } else {
        // Ir para o último dia do mês anterior
        month--;
        if (month < 0) {
          month = 11;
          year--;
        }
        day = new Date(year, month + 1, 0).getDate();
      }
      
      searchDays++;
    }
    
    return null;
  }, [formatDateKey, getAccountMoneyInitialByDate]);

  // Calcula o dinheiro em conta para uma data específica
  // MODELO CORRETO: série temporal incremental contínua
  // REGRA: saldo[d] = saldo[d-1] + totalDiário[d]
  // Valores salvos funcionam como ponto de base temporal:
  // - Se existe valor salvo no dia X, esse é o saldo FINAL do dia X
  // - Dias posteriores calculam: valorSalvo[X] + soma(totalDiário de X+1 até d)
  const getAccountMoney = useCallback((dateKey: string): number => {
    const [yearStr, monthStr, dayStr] = dateKey.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const day = parseInt(dayStr, 10);
    
    // Caso base: se a data for muito antiga (antes de 2020), retorna 0
    if (year < 2020) {
      return 0;
    }
    
    // Buscar retroativamente o último valor salvo
    const lastSaved = getLastSavedAccountMoney(dateKey);
    
    let baseValue = 0;
    let startDate: Date;
    
    if (lastSaved) {
      // Usar o valor salvo como base
      baseValue = lastSaved.value;
      const [savedYearStr, savedMonthStr, savedDayStr] = lastSaved.dateKey.split("-");
      const savedYear = parseInt(savedYearStr, 10);
      const savedMonth = parseInt(savedMonthStr, 10) - 1;
      const savedDay = parseInt(savedDayStr, 10);
      startDate = new Date(savedYear, savedMonth, savedDay);
      
      // Se o dia solicitado é exatamente o dia do valor salvo, retornar direto
      if (lastSaved.dateKey === dateKey) {
        return baseValue;
      }
      
      // Começar a acumular a partir do dia seguinte ao valor salvo
      startDate.setDate(startDate.getDate() + 1);
    } else {
      // Não há valor salvo: começar do zero desde 2020-01-01
      startDate = new Date(2020, 0, 1);
    }
    
    // Data alvo
    const targetDate = new Date(year, month, day);
    
    // Acumular totalDiário incrementalmente desde startDate até targetDate
    let currentDate = new Date(startDate);
    let accumulated = baseValue;
    
    while (currentDate <= targetDate) {
      const currentKey = formatDateKey(currentDate);
      const dailyTotal = calculateDailyTotal(currentKey);
      accumulated += dailyTotal;
      
      // Próximo dia
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return accumulated;
  }, [formatDateKey, getLastSavedAccountMoney, calculateDailyTotal]);

  // Salva o valor de dinheiro em conta para uma data específica
  // MODELO CORRETO: valor salvo é um ponto de base temporal
  // REGRAS:
  // 1. O valor salvo no dia X é o saldo FINAL do dia X
  // 2. Ao salvar no dia X, remove TODOS os valores salvos para dias posteriores a X
  // 3. Dias posteriores calculam incrementalmente: valorSalvo[X] + soma(totalDiário de X+1 até d)
  const saveAccountMoney = useCallback(async (dateKey: string, value: number) => {
    if (isNaN(value) || !isFinite(value)) {
      console.error("saveAccountMoney: valor inválido", value);
      return;
    }
    
    if (typeof window === "undefined") return;
    
    const [yearStr, monthStr, dayStr] = dateKey.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const day = parseInt(dayStr, 10);
    
    // Remover qualquer valor salvo anteriormente para esta data
    const key = k(`accountMoneyInitial:${dateKey}`);
    window.localStorage.removeItem(key);
    
    // Salvar o valor FINAL do dia (o que o usuário digitou)
    writeJSON(k(`accountMoneyInitial:${dateKey}`), value);
    
    // REMOVER TODOS os valores salvos para dias posteriores a X
    // Isso garante que apenas um único ponto de base válido exista
    const targetDate = new Date(year, month, day);
    const maxFutureDays = 730; // ~2 anos (proteção)
    let currentDate = new Date(targetDate);
    currentDate.setDate(currentDate.getDate() + 1); // Começar do dia seguinte
    
    let removedCount = 0;
    for (let i = 0; i < maxFutureDays; i++) {
      const futureKey = formatDateKey(currentDate);
      const futureStorageKey = k(`accountMoneyInitial:${futureKey}`);
      
      if (window.localStorage.getItem(futureStorageKey) !== null) {
        window.localStorage.removeItem(futureStorageKey);
        removedCount++;
      }
      
      // Próximo dia
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    if (removedCount > 0) {
      console.log(`🧹 Removidos ${removedCount} valores salvos posteriores a ${dateKey}`);
    }
    
    // Sincronizar com Supabase
    syncToSupabase();
    
    // Disparar evento para atualizar UI em outros componentes
    window.dispatchEvent(new Event("pixel-life-storage-change"));
  }, [formatDateKey, syncToSupabase]);

  // ---------- CÁLCULO DA TABELA MENSAL ----------
  /**
   * Calcula as linhas da tabela mensal com toda a lógica de herança entre meses.
   */
  const calculateMonthlyData = useCallback(
    (
      year: number,
      month: number,
      desiredMonthlyExpenseArg?: number,
      resetDayArg?: number,
      getFinancialEntriesForDate?: (dateKey: string) => any[]
    ): MonthlyRow[] => {
      const baseDate = new Date(year, month, 1);
      const monthKey = formatMonthKey(baseDate);
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      const desiredMonthlyExpense =
        typeof desiredMonthlyExpenseArg === "number"
          ? desiredMonthlyExpenseArg
          : getDesiredMonthlyExpense(monthKey);

      const resetDay =
        typeof resetDayArg === "number" ? resetDayArg : getResetDate(monthKey);

      // getInitialReserve já calcula e salva automaticamente a reserva final do mês anterior
      // A reserva inicial é independente dos gastos diários
      const initialReserve = getInitialReserve(monthKey);

      const rows: MonthlyRow[] = [];

      // Calcular o valor final do total mensal do mês anterior (último dia do mês anterior)
      // Este valor será usado nos dias antes da data de reset
      let previousMonthFinalValue = desiredMonthlyExpense;
      if (resetDay > 1) {
        const prevMonth = new Date(year, month - 1, 1);
        const prevMonthKey = formatMonthKey(prevMonth);
        const prevMonthDesiredExpense = getDesiredMonthlyExpense(prevMonthKey);
        const prevMonthDays = new Date(year, month, 0).getDate();
        const actualResetDate = Math.min(resetDay, prevMonthDays);
        
        // Começar com o gasto mensal desejado do mês anterior
        let prevMonthAccumulated = prevMonthDesiredExpense;
        
        // Acumular apenas gastos (valores negativos) do mês anterior a partir da data de reset até o fim do mês
        // Respeitando o teto do gasto mensal desejado
        for (let prevDay = actualResetDate; prevDay <= prevMonthDays; prevDay++) {
          const prevDate = new Date(year, month - 1, prevDay);
          const prevDateKey = formatDateKey(prevDate);
          const prevDailyExpenses = calculateDailyExpensesOnly(prevDateKey, getFinancialEntriesForDate);
          // Soma apenas se não ultrapassar o teto (gasto mensal desejado)
          const newValue = prevMonthAccumulated + prevDailyExpenses;
          prevMonthAccumulated = Math.min(prevMonthDesiredExpense, newValue);
        }
        
        previousMonthFinalValue = prevMonthAccumulated;
      } else {
        // Se resetDay é 1, não há dias antes da data de reset, então usa o gasto mensal desejado atual
        previousMonthFinalValue = desiredMonthlyExpense;
      }
      
      let totalMonthAccumulated = previousMonthFinalValue; // Começa com o valor final do mês anterior

      // Dinheiro em conta: calcular diretamente usando getAccountMoney (que já resolve continuidade)
      // Não depende de "mês anterior" - getAccountMoney calcula acumulativamente desde o último reset manual

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateKey = formatDateKey(date);
        
        // Calcular total diário dos itens (inclui ganhos e gastos)
        const totalDaily = calculateDailyTotal(dateKey, getFinancialEntriesForDate);
        
        // Calcular apenas gastos do dia (valores negativos, ganhos não são incluídos)
        const dailyExpensesOnly = calculateDailyExpensesOnly(dateKey, getFinancialEntriesForDate);
        
        // Total mensal acumulado: reseta na data de reset com o gasto mensal desejado
        // A partir da data de reset, acumula apenas os gastos (não ganhos)
        // O "Gasto mensal desejado" é um teto (limite máximo)
        if (day === resetDay) {
          // No dia da data de reset, reinicia com o gasto mensal desejado do mês atual
          totalMonthAccumulated = desiredMonthlyExpense;
        } else if (day > resetDay) {
          // Após a data de reset, acumula apenas os gastos (valores negativos)
          // Não ultrapassa o teto (gasto mensal desejado)
          const newValue = totalMonthAccumulated + dailyExpensesOnly;
          totalMonthAccumulated = Math.min(desiredMonthlyExpense, newValue);
        }
        // Se day < resetDay, mantém o valor final do mês anterior (já definido acima)
        
        // Dinheiro em conta: usar getAccountMoney diretamente (já calcula acumulativamente)
        // Não precisa de lógica manual de acumulação - getAccountMoney já resolve continuidade
        const accountMoneyAccumulated = getAccountMoney(dateKey);
        
        // Reserva acumulada: usar getCurrentReserve para a data (já calcula acumulativamente)
        // Não precisa de lógica mensal - getCurrentReserve já resolve continuidade
        const currentReserve = getCurrentReserve(dateKey);
        
        // Orçamento diário
        const budget = getBudget(dateKey);
        
        // Descrição geral
        const description = getDescription(dateKey);

        rows.push({
          day,
          description,
          totalDaily,
          totalMonth: totalMonthAccumulated,
          reserve: currentReserve, // Reserva acumulada (inicial + movimentações)
          budget,
          accountMoney: accountMoneyAccumulated, // Dinheiro em conta acumulado
        });
      }

      return rows;
    },
    [
      formatDateKey,
      formatMonthKey,
      getDesiredMonthlyExpense,
      getResetDate,
      getInitialReserve,
      calculateDailyReserveDelta,
      calculateDailyTotal,
      calculateDailyExpensesOnly,
      getDescription,
      getBudget,
      getAccountMoney,
      getCurrentReserve,
    ]
  );

  // ===============================
  // EXPORT DO HOOK
  // ===============================
  return {
    getTodayDate,
    formatDateKey,
    formatMonthKey,
    getDailyExpenses,
    addDailyExpense,
    removeDailyExpense,
    calculateDailyTotal,
    getSalary,
    saveSalary,
    getDesiredMonthlyExpense,
    saveDesiredMonthlyExpense,
    getResetDate,
    saveResetDate,
    getBudget,
    saveBudget,
    getReserveMovements,
    addReserveMovement,
    removeReserveMovement,
    calculateDailyReserveDelta,
    getInitialReserve,
    saveInitialReserve,
    getDescription,
    saveDescription,
    calculateMonthlyData,
    getExpensesByGoalId,
    getCurrentReserve,
    getAccountMoney,
    saveAccountMoney,
    getAccountMoneyInitialByDate,
    calculateDailyExpensesOnly,
    getCycleDates, // Exportar para uso no cálculo de ciclo
    isSyncing, // Indicador de sincronização em progresso
  };
}
