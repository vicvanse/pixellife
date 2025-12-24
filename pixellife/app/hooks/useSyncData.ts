/**
 * Hook para sincronizar todos os dados com Supabase
 * Carrega dados quando o usuário faz login e salva quando há mudanças
 */

import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { saveToSupabase, loadFromSupabase, testSupabaseConnection } from "../lib/supabase-sync";
import { exportExpensesData, exportTreeData, exportFinancialEntriesData, importFinancialEntriesData } from "../lib/sync-helpers";
import { withRetry } from "../lib/retry";
import { useToastContext } from "../context/ToastContext";

// Tipos de dados que precisam ser sincronizados
type SyncableData = {
  habits?: unknown;
  journal?: unknown;
  expenses?: unknown;
  possessions?: unknown;
  tree?: unknown;
  cosmetics?: { avatar?: unknown; background?: unknown };
};

/**
 * Hook para sincronizar todos os dados do usuário com Supabase
 */
export function useSyncData() {
  const { user, loading } = useAuth();
  const hasLoadedRef = useRef(false);
  const saveTimeoutsRef = useRef<Record<string, NodeJS.Timeout | null>>({});

  // Removido logs excessivos que causavam loop infinito

  // Carregar todos os dados do Supabase quando o usuário fizer login
  useEffect(() => {
    async function loadAllData() {
      if (loading) {
        console.log("⏳ Aguardando autenticação para sincronizar...");
        return;
      }

      if (!user?.id) {
        console.warn("⚠️ Usuário não logado - sincronização desabilitada");
        hasLoadedRef.current = false;
        return;
      }

      // Só carregar uma vez por sessão
      if (hasLoadedRef.current) return;

      console.log("🔄 Iniciando sincronização de dados do Supabase...");
      console.log("User ID:", user.id);

      // Testar conexão primeiro
      const testResult = await testSupabaseConnection(user.id);
      if (!testResult.success) {
        console.error("❌ Erro ao conectar com Supabase:", testResult.error);
        console.error("⚠️ Verifique se a tabela 'user_data' foi criada corretamente!");
        console.error("📖 Veja SUPABASE_DATABASE_SETUP.md para instruções");
        return;
      }

      try {
        // Carregar habits
        const { data: habitsData, error: habitsError } = await loadFromSupabase(user.id, "habits");
        if (!habitsError && habitsData && Array.isArray(habitsData) && habitsData.length > 0) {
          console.log("✅ Habits carregados:", habitsData.length);
          // Os dados serão aplicados pelo AppContext
        } else if (habitsError) {
          console.warn("⚠️ Erro ao carregar habits:", habitsError);
        }

        // Carregar journal
        const { data: journalData, error: journalError } = await loadFromSupabase(user.id, "journal");
        if (!journalError && journalData && typeof journalData === "object" && journalData !== null) {
          const journalObj = journalData as Record<string, unknown>;
          if (Object.keys(journalObj).length > 0) {
            console.log("✅ Journal carregado");
          }
        } else if (journalError) {
          console.warn("⚠️ Erro ao carregar journal:", journalError);
        }

        // Carregar expenses
        const { data: expensesData, error: expensesError } = await loadFromSupabase(user.id, "expenses");
        if (!expensesError && expensesData) {
          console.log("✅ Expenses carregados");
        } else if (expensesError && expensesError.code !== "PGRST116") {
          console.warn("⚠️ Erro ao carregar expenses:", expensesError);
        }

        // Carregar financial_entries
        const { data: financialEntriesData, error: financialEntriesError } = await loadFromSupabase(user.id, "financial_entries");
        if (!financialEntriesError && financialEntriesData && Array.isArray(financialEntriesData) && financialEntriesData.length > 0) {
          console.log("✅ Financial entries carregados:", financialEntriesData.length);
        } else if (financialEntriesError && financialEntriesError.code !== "PGRST116") {
          console.warn("⚠️ Erro ao carregar financial_entries:", financialEntriesError);
        }

        // Carregar possessions
        const { data: possessionsData, error: possessionsError } = await loadFromSupabase(user.id, "possessions");
        if (!possessionsError && possessionsData && Array.isArray(possessionsData) && possessionsData.length > 0) {
          console.log("✅ Possessions carregados:", possessionsData.length);
          // Migrar dados antigos (name -> title) antes de salvar
          const migratedData = possessionsData.map((item: any) => {
            // Se tem name mas não tem title, migrar
            if (item.name && !item.title) {
              return {
                ...item,
                title: item.name,
                description: item.description || undefined,
              };
            }
            // Se já tem title, garantir que description existe
            return {
              ...item,
              description: item.description || undefined,
            };
          });
          // Aplicar dados migrados ao localStorage
          if (typeof window !== "undefined") {
            window.localStorage.setItem("pixel-life-possessions-v1:goals", JSON.stringify(migratedData));
            // Se houve migração, salvar de volta no Supabase
            if (possessionsData.some((item: any) => item.name && !item.title)) {
              console.log("🔄 Migrando possessions (name -> title) e salvando no Supabase...");
              setTimeout(async () => {
                await saveToSupabase(user.id, "possessions", migratedData);
              }, 1000);
            }
          }
        } else if (possessionsError && possessionsError.code !== "PGRST116") {
          console.warn("⚠️ Erro ao carregar possessions:", possessionsError);
        }

        // Carregar tree
        const { data: treeData, error: treeError } = await loadFromSupabase(user.id, "tree");
        if (!treeError && treeData) {
          console.log("✅ Tree carregado");
        } else if (treeError && treeError.code !== "PGRST116") {
          console.warn("⚠️ Erro ao carregar tree:", treeError);
        }

        // Carregar cosmetics
        const { data: cosmeticsData, error: cosmeticsError } = await loadFromSupabase(user.id, "cosmetics");
        if (!cosmeticsError && cosmeticsData && typeof cosmeticsData === "object") {
          const cosmetics = cosmeticsData as { avatar?: unknown; background?: unknown };
          if (typeof window !== "undefined") {
            if (cosmetics.avatar) {
              window.localStorage.setItem("avatar", JSON.stringify(cosmetics.avatar));
            }
            if (cosmetics.background) {
              window.localStorage.setItem("background", JSON.stringify(cosmetics.background));
            }
          }
          console.log("✅ Cosmetics carregados");
        } else if (cosmeticsError && cosmeticsError.code !== "PGRST116") {
          console.warn("⚠️ Erro ao carregar cosmetics:", cosmeticsError);
        }

        // Carregar biography
        const { data: biographyData, error: biographyError } = await loadFromSupabase(user.id, "biography");
        if (!biographyError && biographyData && Array.isArray(biographyData) && biographyData.length > 0) {
          console.log("✅ Biography carregado:", biographyData.length);
          // Aplicar dados ao localStorage
          if (typeof window !== "undefined") {
            window.localStorage.setItem("pixel-life-biography-v1", JSON.stringify(biographyData));
          }
        } else if (biographyError && biographyError.code !== "PGRST116") {
          console.warn("⚠️ Erro ao carregar biography:", biographyError);
        }

        hasLoadedRef.current = true;
        console.log("✅ Sincronização completa!");
      } catch (error) {
        console.error("❌ Erro durante sincronização:", error);
      }
    }

    loadAllData();
  }, [user?.id]);

  // Função para salvar dados com debounce
  const saveData = (dataType: string, data: unknown) => {
    if (!user?.id || !hasLoadedRef.current) return;

    // Limpar timeout anterior
    if (saveTimeoutsRef.current[dataType]) {
      clearTimeout(saveTimeoutsRef.current[dataType]);
    }

    // Aguardar 2 segundos antes de salvar (debounce)
    saveTimeoutsRef.current[dataType] = setTimeout(async () => {
      console.log(`💾 Salvando ${dataType} no Supabase...`);
      await saveToSupabase(user.id, dataType as any, data);
    }, 2000);
  };

  return { saveData, hasLoaded: hasLoadedRef.current };
}

/**
 * Hook para monitorar mudanças em expenses e sincronizar
 */
export function useSyncExpenses() {
  const { user } = useAuth();
  const { showToast } = useToastContext();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDataRef = useRef<string>("");
  const lastSyncTimeRef = useRef<number>(0);
  const lastRemoteUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (!user?.id) return;

    // Função para carregar dados do Supabase (só se realmente mudou)
    const reloadExpenses = async () => {
      try {
        const { data, error } = await loadFromSupabase(user.id, "expenses");
        if (!error && data) {
          // Verificar se realmente mudou comparando timestamp
          // (assumindo que data tem updated_at ou podemos usar hash)
          const dataHash = JSON.stringify(data);
          const currentHash = JSON.stringify(exportExpensesData());
          
          // Só atualizar se os dados forem diferentes
          if (dataHash !== currentHash) {
            console.log("📥 Expenses recarregados do Supabase (dados atualizados)");
            // Os dados já são importados para localStorage automaticamente pelo loadFromSupabase
            // Forçar atualização da UI emitindo evento de storage
            if (typeof window !== "undefined") {
              window.dispatchEvent(new Event("storage"));
              window.dispatchEvent(new CustomEvent("expenses-updated"));
            }
          } else {
            console.log("ℹ️ Dados já estão sincronizados, pulando recarregamento");
          }
        }
      } catch (err) {
        console.error("❌ Erro ao recarregar expenses:", err);
      }
    };

    // Função para salvar dados (com debounce)
    const handleSave = () => {
      const currentData = JSON.stringify(exportExpensesData());
      if (currentData === lastDataRef.current) return; // Não mudou, não fazer nada
      
      lastDataRef.current = currentData;

      // Limpar timeout anterior
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Salvar após 500ms de inatividade (debounce reduzido para resposta mais rápida)
      saveTimeoutRef.current = setTimeout(async () => {
        console.log("💾 Salvando expenses no Supabase...");
        try {
          await withRetry(
            async () => {
              const { error } = await saveToSupabase(user.id, "expenses", exportExpensesData());
              if (error) throw error;
            },
            {
              maxRetries: 3,
              initialDelay: 1000,
              onRetry: (attempt) => {
                console.warn(`⚠️ Tentativa ${attempt} de salvamento falhou, tentando novamente...`);
              },
            }
          );
          lastSyncTimeRef.current = Date.now();
          console.log("✅ Expenses salvos com sucesso");
        } catch (err) {
          console.error("❌ Erro ao salvar expenses após múltiplas tentativas:", err);
          showToast("Erro ao salvar dados. Verifique sua conexão.", "error");
        }
      }, 500);
    };

    // Escutar eventos de mudança (abordagem híbrida)
    const handleStorageChange = (e: StorageEvent) => {
      // Evento de storage disparado por outras abas ou quando localStorage muda
      if (e.key && e.key.startsWith("pixel-life-expenses-v1:")) {
        console.log("🔄 Mudança em expenses detectada via storage event (outra aba), agendando salvamento...");
        handleSave();
      } else if (!e.key) {
        // Evento disparado sem key específica (mudança geral)
        handleSave();
      }
    };

    const handleCustomStorageChange = () => {
      // Evento customizado disparado quando há mudança na mesma aba
      console.log("🔄 Mudança em expenses detectada via custom event, agendando salvamento...");
      handleSave();
    };

    // Adicionar listeners de eventos
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("pixel-life-storage-change", handleCustomStorageChange);
    window.addEventListener("expenses-updated", handleCustomStorageChange);

    // Carregar dados do Supabase a cada 30 segundos (polling apenas para carregar mudanças remotas)
    const loadInterval = setInterval(() => {
      reloadExpenses();
    }, 30000);

    // Polling como fallback (verificar mudanças a cada 5 segundos - menos frequente já que eventos são primários)
    const saveInterval = setInterval(() => {
      handleSave();
    }, 5000);

    // Carregar dados imediatamente ao montar
    reloadExpenses();

    return () => {
      clearInterval(loadInterval);
      clearInterval(saveInterval);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("pixel-life-storage-change", handleCustomStorageChange);
      window.removeEventListener("expenses-updated", handleCustomStorageChange);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [user?.id]);
}

/**
 * Hook para monitorar mudanças em possessions e sincronizar
 */
export function useSyncPossessions() {
  const { user } = useAuth();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDataRef = useRef<string>("");

  useEffect(() => {
    if (!user?.id) {
      console.log("⚠️ useSyncPossessions: Usuário não logado, sincronização desabilitada");
      return;
    }

    const storageKey = "pixel-life-possessions-v1:goals";

    // Função para salvar no Supabase
    const saveToSupabaseDebounced = async () => {
      if (typeof window === "undefined") return;

      const currentData = window.localStorage.getItem(storageKey) || "";
      
      // Se não mudou, não fazer nada
      if (currentData === lastDataRef.current) return;

      // Limpar timeout anterior
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Salvar após 2 segundos de inatividade
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const data = currentData ? JSON.parse(currentData) : [];
          
          // Migrar dados antes de salvar (garantir que não há "name", apenas "title")
          const migratedData = Array.isArray(data) ? data.map((item: any) => {
            // Se tem name mas não tem title, migrar
            if (item.name && !item.title) {
              const migrated = {
                ...item,
                title: item.name,
                description: item.description || undefined,
              };
              delete migrated.name; // Remover name antigo
              return migrated;
            }
            // Se já tem title, garantir que name não existe e description está correto
            const cleaned = { ...item };
            if (cleaned.name) delete cleaned.name; // Remover name se existir
            cleaned.description = cleaned.description || undefined;
            return cleaned;
          }) : [];
          
          console.log("💾 Salvando possessions no Supabase...", { count: migratedData.length });
          
          const { error } = await saveToSupabase(user.id, "possessions", migratedData);
          
          if (error) {
            console.error("❌ Erro ao salvar possessions no Supabase:", error);
          } else {
            console.log("✅ Possessions salvos com sucesso no Supabase");
            // Se houve migração, atualizar localStorage também
            if (migratedData.length > 0 && typeof window !== "undefined") {
              const storageKey = "pixel-life-possessions-v1:goals";
              window.localStorage.setItem(storageKey, JSON.stringify(migratedData));
            }
            lastDataRef.current = currentData; // Atualizar apenas após sucesso
          }
        } catch (error) {
          console.error("❌ Erro ao salvar possessions:", error);
        }
      }, 2000);
    };

    // Escutar eventos de storage (para mudanças de outras abas)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue !== lastDataRef.current) {
        console.log("🔄 Mudança em possessions detectada via storage event (outra aba), agendando salvamento...");
        lastDataRef.current = e.newValue || "";
        saveToSupabaseDebounced();
      }
    };

    // Escutar eventos customizados de mudança de storage (mudanças na mesma aba)
    const handleCustomStorageChange = () => {
      if (typeof window === "undefined") return;
      const currentData = window.localStorage.getItem(storageKey) || "";
      if (currentData !== lastDataRef.current) {
        console.log("🔄 Mudança em possessions detectada via custom event, agendando salvamento...");
        saveToSupabaseDebounced();
      }
    };

    // Interceptar mudanças diretas no localStorage usando Proxy (mais eficiente)
    // Mas como não podemos interceptar localStorage diretamente, usamos eventos
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("pixel-life-storage-change", handleCustomStorageChange);
    window.addEventListener("pixel-life-possessions-changed", handleCustomStorageChange);

    // Carregar dados iniciais do Supabase
    const loadInitialData = async () => {
      try {
        const { data, error } = await loadFromSupabase(user.id, "possessions");
        if (!error && data && Array.isArray(data) && data.length > 0) {
          console.log("📥 Possessions carregados do Supabase:", data.length);
          
          // Migrar dados antigos (name -> title) antes de salvar
          const migratedData = data.map((item: any) => {
            // Se tem name mas não tem title, migrar
            if (item.name && !item.title) {
              return {
                ...item,
                title: item.name,
                description: item.description || undefined,
              };
            }
            // Se já tem title, garantir que description existe
            return {
              ...item,
              description: item.description || undefined,
            };
          });
          
          const dataString = JSON.stringify(migratedData);
          if (dataString !== lastDataRef.current) {
            if (typeof window !== "undefined") {
              window.localStorage.setItem(storageKey, dataString);
              lastDataRef.current = dataString;
              
              // Se houve migração, salvar de volta no Supabase
              if (data.some((item: any) => item.name && !item.title)) {
                console.log("🔄 Migrando possessions (name -> title) e salvando no Supabase...");
                setTimeout(async () => {
                  await saveToSupabase(user.id, "possessions", migratedData);
                }, 1000);
              }
            }
          }
        } else if (error && error.code !== "PGRST116") {
          console.warn("⚠️ Erro ao carregar possessions do Supabase:", error);
        }
      } catch (error) {
        console.error("❌ Erro ao carregar possessions iniciais:", error);
      }
    };

    loadInitialData();

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("pixel-life-storage-change", handleCustomStorageChange);
      window.removeEventListener("pixel-life-possessions-changed", handleCustomStorageChange);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [user?.id]);
}

/**
 * Hook para monitorar mudanças em tree e sincronizar
 */
export function useSyncTree() {
  const { user } = useAuth();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    let lastData = "";

    // Verificar mudanças a cada 2 segundos
    const interval = setInterval(() => {
      const currentData = JSON.stringify(exportTreeData());
      if (currentData !== lastData) {
        lastData = currentData;

        // Limpar timeout anterior
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }

        // Salvar após 2 segundos de inatividade
        saveTimeoutRef.current = setTimeout(async () => {
          console.log("💾 Salvando tree no Supabase...");
          await saveToSupabase(user.id, "tree", exportTreeData());
        }, 2000);
      }
    }, 2000);

    return () => {
      clearInterval(interval);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [user?.id]);
}

/**
 * Hook para monitorar mudanças em biography e sincronizar
 */
export function useSyncBiography() {
  const { user } = useAuth();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDataRef = useRef<string>("");

  useEffect(() => {
    if (!user?.id) {
      console.log("⚠️ useSyncBiography: Usuário não logado, sincronização desabilitada");
      return;
    }

    const storageKey = "pixel-life-biography-v1";

    // Função para salvar no Supabase
    const saveToSupabaseDebounced = async () => {
      if (typeof window === "undefined") return;

      const currentData = window.localStorage.getItem(storageKey) || "";
      
      // Se não mudou, não fazer nada
      if (currentData === lastDataRef.current) return;

      // Limpar timeout anterior
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Salvar após 2 segundos de inatividade
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const data = currentData ? JSON.parse(currentData) : [];
          console.log("💾 Salvando biography no Supabase...", { count: Array.isArray(data) ? data.length : 0 });
          
          const { error } = await saveToSupabase(user.id, "biography", data);
          
          if (error) {
            console.error("❌ Erro ao salvar biography no Supabase:", error);
          } else {
            console.log("✅ Biography salvo com sucesso no Supabase");
            lastDataRef.current = currentData; // Atualizar apenas após sucesso
          }
        } catch (error) {
          console.error("❌ Erro ao salvar biography:", error);
        }
      }, 2000);
    };

    // Escutar eventos de storage (para mudanças de outras abas)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue !== lastDataRef.current) {
        console.log("🔄 Mudança em biography detectada via storage event (outra aba), agendando salvamento...");
        lastDataRef.current = e.newValue || "";
        saveToSupabaseDebounced();
      }
    };

    // Escutar eventos customizados de mudança de storage (mudanças na mesma aba)
    const handleCustomStorageChange = () => {
      if (typeof window === "undefined") return;
      const currentData = window.localStorage.getItem(storageKey) || "";
      if (currentData !== lastDataRef.current) {
        console.log("🔄 Mudança em biography detectada via custom event, agendando salvamento...");
        saveToSupabaseDebounced();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("pixel-life-storage-change", handleCustomStorageChange);
    window.addEventListener("pixel-life-biography-changed", handleCustomStorageChange);

    // Carregar dados iniciais do Supabase
    const loadInitialData = async () => {
      try {
        const { data, error } = await loadFromSupabase(user.id, "biography");
        if (!error && data && Array.isArray(data) && data.length > 0) {
          console.log("📥 Biography carregado do Supabase:", data.length);
          const dataString = JSON.stringify(data);
          if (dataString !== lastDataRef.current) {
            if (typeof window !== "undefined") {
              window.localStorage.setItem(storageKey, dataString);
              lastDataRef.current = dataString;
            }
          }
        } else if (error && error.code !== "PGRST116") {
          console.warn("⚠️ Erro ao carregar biography do Supabase:", error);
        }
      } catch (error) {
        console.error("❌ Erro ao carregar biography iniciais:", error);
      }
    };

    loadInitialData();

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("pixel-life-storage-change", handleCustomStorageChange);
      window.removeEventListener("pixel-life-biography-changed", handleCustomStorageChange);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [user?.id]);
}

/**
 * Hook para monitorar mudanças em cosmetics e sincronizar
 */
export function useSyncCosmetics() {
  const { user } = useAuth();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    let lastAvatar = "";
    let lastBackground = "";

    // Verificar mudanças a cada 2 segundos
    const interval = setInterval(() => {
      if (typeof window === "undefined") return;

      const currentAvatar = window.localStorage.getItem("avatar") || "";
      const currentBackground = window.localStorage.getItem("background") || "";

      if (currentAvatar !== lastAvatar || currentBackground !== lastBackground) {
        lastAvatar = currentAvatar;
        lastBackground = currentBackground;

        // Limpar timeout anterior
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }

        // Salvar após 2 segundos de inatividade
        saveTimeoutRef.current = setTimeout(async () => {
          try {
            const avatar = currentAvatar ? JSON.parse(currentAvatar) : null;
            const background = currentBackground ? JSON.parse(currentBackground) : null;
            console.log("💾 Salvando cosmetics no Supabase...");
            await saveToSupabase(user.id, "cosmetics", { avatar, background });
          } catch (error) {
            console.error("Erro ao salvar cosmetics:", error);
          }
        }, 2000);
      }
    }, 2000);

    return () => {
      clearInterval(interval);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [user?.id]);
}

/**
 * Hook para monitorar mudanças em financial entries e sincronizar
 */
export function useSyncFinancialEntries() {
  const { user } = useAuth();
  const { showToast } = useToastContext();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDataRef = useRef<string>("");
  const lastSyncTimeRef = useRef<number>(0);
  const lastRemoteUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (!user?.id) return;

    // Função para carregar dados do Supabase (só se realmente mudou)
    const reloadFinancialEntries = async () => {
      try {
        // Não recarregar se há um salvamento pendente (evitar sobrescrever dados locais)
        if (saveTimeoutRef.current) {
          console.log("⏸️ Salvamento pendente, pulando recarregamento para evitar conflito");
          return;
        }

        const { data, error } = await loadFromSupabase(user.id, "financial_entries");
        if (!error && data && Array.isArray(data)) {
          // Verificar se realmente mudou comparando hash
          const dataHash = JSON.stringify(data);
          const currentHash = JSON.stringify(exportFinancialEntriesData());
          
          // Só atualizar se os dados forem diferentes E se não houver salvamento pendente
          if (dataHash !== currentHash && !saveTimeoutRef.current) {
            // Verificar se os dados locais são mais recentes (comparar timestamps)
            const localEntries = exportFinancialEntriesData();
            const localLatest = localEntries.length > 0 
              ? Math.max(...localEntries.map((e: any) => new Date(e.updatedAt || e.createdAt || 0).getTime()))
              : 0;
            const remoteLatest = data.length > 0
              ? Math.max(...data.map((e: any) => new Date(e.updatedAt || e.createdAt || 0).getTime()))
              : 0;

            // Só sobrescrever se os dados remotos forem mais recentes
            if (remoteLatest > localLatest) {
              console.log("📥 Financial entries recarregados do Supabase (dados atualizados)");
              // Os dados já são importados para localStorage automaticamente pelo loadFromSupabase
              // Forçar atualização da UI emitindo evento de storage
              if (typeof window !== "undefined") {
                window.dispatchEvent(new Event("storage"));
                window.dispatchEvent(new CustomEvent("financial-entries-updated"));
                window.dispatchEvent(new Event("pixel-life-storage-change"));
              }
            } else {
              console.log("ℹ️ Dados locais são mais recentes, mantendo dados locais");
            }
          } else {
            console.log("ℹ️ Dados já estão sincronizados, pulando recarregamento");
          }
        }
      } catch (err) {
        console.error("❌ Erro ao recarregar financial entries:", err);
      }
    };

    // Função para salvar dados (com debounce)
    const handleSave = () => {
      const currentData = JSON.stringify(exportFinancialEntriesData());
      if (currentData === lastDataRef.current) return; // Não mudou, não fazer nada
      
      lastDataRef.current = currentData;

      // Limpar timeout anterior
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Salvar após 500ms de inatividade (debounce reduzido para resposta mais rápida)
      saveTimeoutRef.current = setTimeout(async () => {
        console.log("💾 Salvando financial entries no Supabase...");
        try {
          await withRetry(
            async () => {
              const { error } = await saveToSupabase(user.id, "financial_entries", exportFinancialEntriesData());
              if (error) throw error;
            },
            {
              maxRetries: 3,
              initialDelay: 1000,
              onRetry: (attempt) => {
                console.warn(`⚠️ Tentativa ${attempt} de salvamento falhou, tentando novamente...`);
              },
            }
          );
          lastSyncTimeRef.current = Date.now();
          console.log("✅ Financial entries salvos com sucesso");
        } catch (err) {
          console.error("❌ Erro ao salvar financial entries após múltiplas tentativas:", err);
          showToast("Erro ao salvar dados. Verifique sua conexão.", "error");
        }
      }, 500);
    };

    // Escutar eventos de mudança (abordagem híbrida)
    const handleStorageChange = (e: StorageEvent) => {
      // Evento de storage disparado por outras abas ou quando localStorage muda
      if (e.key === "pixel-life-financial-entries-v1" || !e.key) {
        console.log("🔄 Mudança em financial entries detectada via storage event (outra aba), agendando salvamento...");
        handleSave();
      }
    };

    const handleCustomStorageChange = () => {
      // Evento customizado disparado quando há mudança na mesma aba
      console.log("🔄 Mudança em financial entries detectada via custom event, agendando salvamento...");
      handleSave();
    };

    // Adicionar listeners de eventos
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("pixel-life-storage-change", handleCustomStorageChange);
    window.addEventListener("financial-entries-updated", handleCustomStorageChange);

    // Carregar dados do Supabase a cada 30 segundos (polling apenas para carregar mudanças remotas)
    const loadInterval = setInterval(() => {
      reloadFinancialEntries();
    }, 30000);

    // Polling como fallback (verificar mudanças a cada 5 segundos - menos frequente já que eventos são primários)
    const saveInterval = setInterval(() => {
      handleSave();
    }, 5000);

    // Carregar dados imediatamente ao montar
    reloadFinancialEntries();

    return () => {
      clearInterval(loadInterval);
      clearInterval(saveInterval);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("pixel-life-storage-change", handleCustomStorageChange);
      window.removeEventListener("financial-entries-updated", handleCustomStorageChange);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [user?.id]);
}

