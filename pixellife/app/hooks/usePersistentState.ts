"use client";

import { useState, useEffect, useRef } from "react";

export function usePersistentState<T>(key: string, defaultValue: T) {
  // Verifica se há dados válidos no storage antes de inicializar
  const checkStorageHasData = (): boolean => {
    if (typeof window === "undefined") return false;
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Para arrays, verificar se não está vazio
        if (Array.isArray(parsed)) {
          return parsed.length > 0;
        }
        // Para objetos, verificar se não está vazio
        if (typeof parsed === "object" && parsed !== null) {
          return Object.keys(parsed).length > 0;
        }
        return true; // Outros tipos sempre retornam true se existem
      }
      return false;
    } catch {
      return false;
    }
  };

  const hasLoadedFromStorage = useRef(checkStorageHasData());

  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return defaultValue;
    
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Para arrays, garantir que seja um array válido
        if (Array.isArray(defaultValue) && !Array.isArray(parsed)) {
          console.warn(`Valor armazenado para ${key} não é um array, usando defaultValue`);
          return defaultValue;
        }
        // Debug temporário para habits
        if (key === "habits") {
          console.log(`[${key}] Carregando:`, Array.isArray(parsed) ? `${parsed.length} hábitos` : parsed);
        }
        hasLoadedFromStorage.current = true;
        return parsed;
      }
      // Debug temporário para habits
      if (key === "habits") {
        console.log(`[${key}] Nenhum valor armazenado, usando defaultValue`);
      }
      return defaultValue;
    } catch (error) {
      console.error(`Erro ao carregar ${key}:`, error);
      return defaultValue;
    }
  });

  const isInitialMount = useRef(true);
  const hasInitialized = useRef(false);

  // Marca como inicializado após o primeiro render
  useEffect(() => {
    hasInitialized.current = true;
    isInitialMount.current = false;
  }, []);

  // Salva automaticamente (apenas depois do carregamento inicial)
  useEffect(() => {
    if (!hasInitialized.current || typeof window === "undefined") return;
    if (isInitialMount.current) return;
    
    // Para arrays, não salvar array vazio se ainda não carregamos do storage
    // Isso evita sobrescrever dados existentes com array vazio
    if (Array.isArray(value) && value.length === 0 && !hasLoadedFromStorage.current) {
      // Debug temporário para habits
      if (key === "habits") {
        console.log(`[${key}] Pulando salvamento de array vazio (ainda não carregou do storage)`);
      }
      return;
    }

    try {
      // Sempre salva, mesmo se for array vazio ou objeto vazio
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      // Debug temporário para habits
      if (key === "habits") {
        console.log(`[${key}] Salvando:`, Array.isArray(value) ? `${value.length} hábitos` : value);
      }
    } catch (error) {
      console.error(`Erro ao salvar ${key}:`, error);
    }
  }, [key, value]);

  // Salva antes de sair da página
  useEffect(() => {
    if (!hasInitialized.current || typeof window === "undefined") return;

    const handleBeforeUnload = () => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error(`Erro ao salvar ${key}:`, error);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
          console.error(`Erro ao salvar ${key}:`, error);
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      // Salva uma última vez ao desmontar
      if (hasInitialized.current) {
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
          console.error(`Erro ao salvar ${key}:`, error);
        }
      }
    };
  }, [key, value]);

  // Função setValue melhorada que salva imediatamente
  const setValueWithSave = (newValue: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const updated = typeof newValue === "function" 
        ? (newValue as (prev: T) => T)(prev)
        : newValue;
      
      // Salva imediatamente de forma síncrona
      if (typeof window !== "undefined" && hasInitialized.current) {
        try {
          const serialized = JSON.stringify(updated);
          localStorage.setItem(key, serialized);
          // Debug temporário para habits
          if (key === "habits") {
            console.log(`[${key}] Salvando (síncrono):`, Array.isArray(updated) ? `${updated.length} hábitos` : updated);
          }
        } catch (error) {
          console.error(`Erro ao salvar ${key}:`, error);
        }
      }
      
      return updated;
    });
  };

  return [value, setValueWithSave] as const;
}

