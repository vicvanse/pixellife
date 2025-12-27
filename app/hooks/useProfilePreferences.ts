'use client';

import { useCallback } from 'react';

const STORAGE_PREFIX = 'pixel-life-profile-v1';

function readJSON<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

function writeJSON<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Erro ao salvar no localStorage:', error);
  }
}

export type DisplayMode = 'dinheiro-disponivel' | 'limite-restante';

export function useProfilePreferences() {
  const getHideAvailableMoney = useCallback((): boolean => {
    return readJSON<boolean>(`${STORAGE_PREFIX}:hideAvailableMoney`, false);
  }, []);

  const setHideAvailableMoney = useCallback((hide: boolean) => {
    writeJSON(`${STORAGE_PREFIX}:hideAvailableMoney`, hide);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('pixel-life-storage-change'));
    }
  }, []);

  const getHideReserve = useCallback((): boolean => {
    return readJSON<boolean>(`${STORAGE_PREFIX}:hideReserve`, false);
  }, []);

  const setHideReserve = useCallback((hide: boolean) => {
    writeJSON(`${STORAGE_PREFIX}:hideReserve`, hide);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('pixel-life-storage-change'));
    }
  }, []);

  const getDisplayMode = useCallback((): DisplayMode => {
    return readJSON<DisplayMode>(`${STORAGE_PREFIX}:displayMode`, 'dinheiro-disponivel');
  }, []);

  const setDisplayMode = useCallback((mode: DisplayMode) => {
    writeJSON(`${STORAGE_PREFIX}:displayMode`, mode);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('pixel-life-storage-change'));
    }
  }, []);

  return {
    getHideAvailableMoney,
    setHideAvailableMoney,
    getHideReserve,
    setHideReserve,
    getDisplayMode,
    setDisplayMode,
  };
}

