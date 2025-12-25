"use client";

import { useCallback } from "react";

// ===============================
// TYPES
// ===============================

export interface AssetGoal {
  id: number;
  title: string; // Renomeado de "name" para "title"
  description?: string; // Novo campo opcional
  type: "house" | "vehicle" | "investment" | "education" | "custom";
  icon: string;
  targetValue: number;
  currentProgress: number;
  status: "locked" | "in-progress" | "completed" | "legal-issues";
  createdAt: string; // YYYY-MM-DD
}

// Prefixo para isolar as chaves do localStorage
const STORAGE_PREFIX = "pixel-life-possessions-v1";
const STORAGE_KEY = `${STORAGE_PREFIX}:goals`;

// Função de migração: converte dados antigos (com "name") para o novo formato (com "title")
function migratePossessionData(data: any): AssetGoal {
  // Se já tem title, usar title
  if (data.title && typeof data.title === "string") {
    const migrated: AssetGoal = {
      id: data.id,
      title: data.title,
      description: data.description || undefined,
      type: data.type || "custom",
      icon: data.icon || "/item1.png",
      targetValue: data.targetValue || 0,
      currentProgress: data.currentProgress || 0,
      status: data.status || "locked",
      createdAt: data.createdAt || new Date().toISOString().substring(0, 10),
    };
    return migrated;
  }
  
  // Se tem name mas não tem title, migrar name para title
  if (data.name && typeof data.name === "string") {
    const migrated: AssetGoal = {
      id: data.id,
      title: data.name, // Migrar name para title
      description: data.description || undefined,
      type: data.type || "custom",
      icon: data.icon || "/item1.png",
      targetValue: data.targetValue || 0,
      currentProgress: data.currentProgress || 0,
      status: data.status || "locked",
      createdAt: data.createdAt || new Date().toISOString().substring(0, 10),
    };
    return migrated;
  }
  
  // Se não tem nem title nem name, usar valor padrão
  return {
    id: data.id || Date.now(),
    title: "Objetivo sem nome",
    description: data.description || undefined,
    type: data.type || "custom",
    icon: data.icon || "/item1.png",
    targetValue: data.targetValue || 0,
    currentProgress: data.currentProgress || 0,
    status: data.status || "locked",
    createdAt: data.createdAt || new Date().toISOString().substring(0, 10),
  };
}

// Função para migrar array de possessions
function migratePossessionsArray(data: any[]): AssetGoal[] {
  if (!Array.isArray(data)) return [];
  return data.map(migratePossessionData);
}

// Helpers seguros de leitura/gravação
function readJSON<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return defaultValue;
    const parsed = JSON.parse(raw);
    
    // Se for array de possessions, aplicar migração
    if (key === STORAGE_KEY && Array.isArray(parsed)) {
      const migrated = migratePossessionsArray(parsed);
      // Se houve migração, salvar de volta
      if (migrated.some((item, index) => {
        const original = parsed[index];
        return original && original.name && !original.title;
      })) {
        writeJSON(key, migrated);
      }
      return migrated as T;
    }
    
    return parsed as T;
  } catch {
    return defaultValue;
  }
}

function writeJSON<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    // Se for possessions, garantir que todos os itens estão migrados antes de salvar
    if (key === STORAGE_KEY && Array.isArray(value)) {
      const migrated = migratePossessionsArray(value);
      window.localStorage.setItem(key, JSON.stringify(migrated));
      // Disparar evento customizado para notificar mudanças (mais eficiente que polling)
      window.dispatchEvent(new CustomEvent("pixel-life-possessions-changed"));
      return;
    }
    
    window.localStorage.setItem(key, JSON.stringify(value));
    // Disparar evento customizado para notificar mudanças (mais eficiente que polling)
    if (key === STORAGE_KEY) {
      window.dispatchEvent(new CustomEvent("pixel-life-possessions-changed"));
    }
  } catch {
    // se der erro de quota ou algo assim, apenas ignora
  }
}

// ===============================
// HOOK PRINCIPAL
// ===============================

export function usePossessions() {
  // ---------- CRUD BÁSICO ----------
  const getAllPossessions = useCallback((): AssetGoal[] => {
    return readJSON<AssetGoal[]>(STORAGE_KEY, []);
  }, []);

  const saveAllPossessions = useCallback((possessions: AssetGoal[]) => {
    writeJSON(STORAGE_KEY, possessions);
  }, []);

  const getPossession = useCallback(
    (id: number): AssetGoal | null => {
      const all = getAllPossessions();
      return all.find((p) => p.id === id) || null;
    },
    [getAllPossessions]
  );

  const addPossession = useCallback(
    (data: Omit<AssetGoal, "id" | "currentProgress" | "createdAt">, accountMoney?: number): AssetGoal => {
      const all = getAllPossessions();
      const today = new Date().toISOString().substring(0, 10);
      
      // Calcular progresso inicial
      let initialProgress = 0;
      if (data.status === "completed") {
        // Se está marcado como completed, usar targetValue
        initialProgress = data.targetValue;
      } else if (accountMoney !== undefined) {
        // Se accountMoney foi fornecido, calcular progresso baseado nele
        initialProgress = Math.min(accountMoney, data.targetValue);
      }
      // Caso contrário, começar com 0 (será atualizado pelo updateAllProgressFromAccountMoney)
      
      const newPossession: AssetGoal = {
        ...data,
        id: Date.now(),
        currentProgress: initialProgress,
        createdAt: today,
      };
      const updated = [...all, newPossession];
      saveAllPossessions(updated);
      return newPossession;
    },
    [getAllPossessions, saveAllPossessions]
  );

  const updatePossession = useCallback(
    (id: number, updates: Partial<AssetGoal>): AssetGoal | null => {
      const all = getAllPossessions();
      const index = all.findIndex((p) => p.id === id);
      if (index === -1) return null;

      const current = all[index];
      const updated = { ...current, ...updates };
      
      // Se o status atual é "completed" ou "legal-issues" e não está sendo alterado explicitamente, manter o status
      // e garantir que o progresso seja 100% (targetValue)
      if ((current.status === "completed" || current.status === "legal-issues") && updates.status === undefined) {
        updated.status = current.status;
        updated.currentProgress = updated.targetValue; // Sempre 100% se quitado ou problemas legais
      } else if (updates.status === "completed" || updates.status === "legal-issues") {
        // Se está sendo marcado como quitado ou problemas legais explicitamente, garantir 100%
        updated.status = updates.status;
        updated.currentProgress = updated.targetValue;
      } else {
        // Atualizar status baseado no progresso apenas se não estiver quitado
        // NÃO atualizar automaticamente para "completed" quando chegar a 100%
        // O usuário deve clicar em "Comprar" para marcar como quitado
        if (updates.currentProgress !== undefined || updates.targetValue !== undefined) {
          const progress = updated.currentProgress;
          const target = updated.targetValue;
          // Se já estava quitado ou problemas legais, manter o status
          if (current.status === "completed" || current.status === "legal-issues") {
            updated.status = current.status;
            updated.currentProgress = updated.targetValue; // Sempre 100% se quitado ou problemas legais
          } else if (progress >= target && target > 0) {
            // Se progresso >= target, manter como "in-progress" para mostrar botão "Comprar"
            updated.status = "in-progress";
            // Limitar progresso ao target (não pode ultrapassar)
            updated.currentProgress = Math.min(progress, target);
          } else if (progress > 0 && progress < target) {
            updated.status = "in-progress";
          } else if (progress <= 0) {
            updated.status = "locked";
          }
          // Se progress >= target mas não está quitado, manter como "in-progress"
          // para permitir que o usuário escolha se quer comprar
        }
      }

      all[index] = updated;
      saveAllPossessions(all);
      return updated;
    },
    [getAllPossessions, saveAllPossessions]
  );

  const deletePossession = useCallback(
    (id: number): boolean => {
      const all = getAllPossessions();
      const filtered = all.filter((p) => p.id !== id);
      if (filtered.length === all.length) return false;
      saveAllPossessions(filtered);
      return true;
    },
    [getAllPossessions, saveAllPossessions]
  );

  // ---------- CÁLCULO DE PROGRESSO ----------
  const calculateProgress = useCallback(
    (possessionId: number, expenses: Array<{ value: number; relatedGoalId?: number }>): number => {
      return expenses
        .filter((exp) => exp.relatedGoalId === possessionId)
        .reduce((sum, exp) => sum + Math.abs(exp.value), 0);
    },
    []
  );

  const updateProgressFromExpenses = useCallback(
    (possessionId: number, expenses: Array<{ value: number; relatedGoalId?: number }>) => {
      const progress = calculateProgress(possessionId, expenses);
      updatePossession(possessionId, { currentProgress: progress });
    },
    [calculateProgress, updatePossession]
  );

  // Atualizar status dos objetivos baseado no dinheiro em conta
  // O progresso é calculado dinamicamente nos cards, então apenas atualizamos o status (locked/in-progress)
  const updateAllProgressFromAccountMoney = useCallback(
    (accountMoney: number, reserve: number) => {
      const allPossessions = getAllPossessions();
      
      if (allPossessions.length === 0) return;
      
      // Usar APENAS o dinheiro em conta (não incluir reserva)
      const totalAvailable = accountMoney;
      
      // Atualizar status de cada objetivo baseado no dinheiro disponível
      allPossessions.forEach((possession) => {
        // Se já está quitada ou problemas legais, não fazer nada
        if (possession.status === "completed" || possession.status === "legal-issues") {
          return;
        }
        
        // Calcular progresso baseado no dinheiro em conta
        const calculatedProgress = Math.min(totalAvailable, possession.targetValue);
        
        // Atualizar status: se tem progresso > 0, deve ser "in-progress", senão "locked"
        if (calculatedProgress > 0 && possession.status === "locked") {
          updatePossession(possession.id, { status: "in-progress" });
        } else if (calculatedProgress <= 0 && possession.status === "in-progress") {
          updatePossession(possession.id, { status: "locked" });
        }
        // Se já está no status correto, não precisa atualizar
      });
    },
    [getAllPossessions, updatePossession]
  );

  // ---------- HELPERS ----------
  const getPossessionsByStatus = useCallback(
    (status: AssetGoal["status"]): AssetGoal[] => {
      return getAllPossessions().filter((p) => p.status === status);
    },
    [getAllPossessions]
  );

  const getPossessionsByType = useCallback(
    (type: AssetGoal["type"]): AssetGoal[] => {
      return getAllPossessions().filter((p) => p.type === type);
    },
    [getAllPossessions]
  );

  return {
    getAllPossessions,
    getPossession,
    addPossession,
    updatePossession,
    deletePossession,
    calculateProgress,
    updateProgressFromExpenses,
    updateAllProgressFromAccountMoney,
    getPossessionsByStatus,
    getPossessionsByType,
  };
}

