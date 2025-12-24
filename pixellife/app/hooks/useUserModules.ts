'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { saveToSupabase, loadFromSupabase } from '../lib/supabase-sync';
import { withRetry } from '../lib/retry';

export type ModuleId = 
  | 'biography'
  | 'habits'
  | 'journal'
  | 'finances'
  | 'objectives'
  | 'maps'
  | 'cosmetics'
  | 'statistics';

export interface Module {
  id: ModuleId;
  name: string;
  description: string;
}

export interface UserModule {
  moduleId: ModuleId;
  active: boolean;
}

const STORAGE_KEY = 'pixel-life-user-modules-v1';

// Módulos disponíveis
export const AVAILABLE_MODULES: Module[] = [
  { id: 'biography', name: 'Biografia', description: 'Linha do tempo e dossiês' },
  { id: 'habits', name: 'Hábitos', description: 'Rastreamento de hábitos' },
  { id: 'journal', name: 'Diário', description: 'Escrita e reflexões diárias' },
  { id: 'finances', name: 'Finanças', description: 'Gastos, planejamento e reservas' },
  { id: 'objectives', name: 'Objetivos', description: 'Metas e progresso' },
  { id: 'maps', name: 'Mapas', description: 'Habilidades e competências' },
  { id: 'cosmetics', name: 'Cosméticos', description: 'Avatar e personalização' },
  { id: 'statistics', name: 'Estatísticas', description: 'Indicadores selecionados pelo usuário' },
];

// Valores padrão (todos ativos)
const DEFAULT_MODULES: Record<ModuleId, boolean> = {
  biography: true,
  habits: true,
  journal: true,
  finances: true,
  objectives: true,
  maps: true,
  cosmetics: true,
  statistics: true,
};

export function useUserModules() {
  const { user } = useAuth();
  const [modules, setModules] = useState<Record<ModuleId, boolean>>(DEFAULT_MODULES);
  const [loading, setLoading] = useState(true);

  // Carregar módulos do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setModules({ ...DEFAULT_MODULES, ...parsed });
      }
    } catch (error) {
      console.error('Erro ao carregar módulos:', error);
    }
    setLoading(false);
  }, []);

  // Sincronizar com Supabase quando houver usuário (apenas uma vez)
  const hasLoadedFromSupabaseRef = useRef(false);
  useEffect(() => {
    if (user && !loading && !hasLoadedFromSupabaseRef.current) {
      hasLoadedFromSupabaseRef.current = true;
      loadFromSupabase(user.id, 'user_modules')
        .then((result) => {
          if (result.data && !result.error) {
            const userModules = result.data as UserModule[];
            const modulesMap: Record<ModuleId, boolean> = { ...DEFAULT_MODULES };
            userModules.forEach((um) => {
              modulesMap[um.moduleId] = um.active;
            });
            setModules(modulesMap);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(modulesMap));
          }
        })
        .catch((error) => {
          console.error('Erro ao carregar módulos do Supabase:', error);
          hasLoadedFromSupabaseRef.current = false; // Permite retry em caso de erro
        });
    }
  }, [user, loading]);

  // Salvar módulos
  const saveModules = useCallback(async (newModules: Record<ModuleId, boolean>) => {
    try {
      // Salvar no localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newModules));
      setModules(newModules);

      // Salvar no Supabase
      if (user) {
        const userModules: UserModule[] = Object.entries(newModules).map(([moduleId, active]) => ({
          moduleId: moduleId as ModuleId,
          active,
        }));

        await withRetry(
          async () => {
            const { error } = await saveToSupabase(user.id, 'user_modules', userModules);
            if (error) throw error;
          },
          {
            maxRetries: 3,
            initialDelay: 1000,
          }
        );
      }
    } catch (error) {
      console.error('Erro ao salvar módulos:', error);
    }
  }, [user]);

  // Alternar módulo
  const toggleModule = useCallback(async (moduleId: ModuleId) => {
    const newModules = { ...modules, [moduleId]: !modules[moduleId] };
    await saveModules(newModules);
  }, [modules, saveModules]);

  // Verificar se módulo está ativo
  const isModuleActive = useCallback((moduleId: ModuleId) => {
    return modules[moduleId] ?? true; // Por padrão, todos estão ativos
  }, [modules]);

  // Restaurar padrão
  const restoreDefaults = useCallback(async () => {
    await saveModules(DEFAULT_MODULES);
  }, [saveModules]);

  return {
    modules,
    toggleModule,
    isModuleActive,
    restoreDefaults,
    saveModules,
    loading,
  };
}

