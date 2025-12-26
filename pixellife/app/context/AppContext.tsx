"use client";

import { createContext, useContext, ReactNode, useEffect, useCallback, useRef } from "react";
import { usePersistentState } from "../hooks/usePersistentState";
import { useAuth } from "../context/AuthContext";
import { saveToSupabase, loadFromSupabase } from "../lib/supabase-sync";
import type { PostgrestError } from "@supabase/supabase-js";
import type { Habit } from "../hooks/useHabits";
import type { JournalData, JournalEntry, QuickNote } from "../hooks/useJournal";
import { withRetry } from "../lib/retry";
import { useToastContext } from "./ToastContext";

interface AppContextType {
  habits: Habit[];
  setHabits: (habits: Habit[] | ((prev: Habit[]) => Habit[])) => void;
  journal: JournalData;
  setJournal: (journal: JournalData | ((prev: JournalData) => JournalData)) => void;
  saveJournalImmediately: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Gerar ID único
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback para ambientes sem crypto.randomUUID
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Normalizar journal completo ao carregar do Supabase
// Garante que todos os quickNotes tenham IDs únicos
function normalizeJournalData(journalData: JournalData): JournalData {
  const normalized: JournalData = {};
  
  for (const [date, entry] of Object.entries(journalData)) {
    if (entry && typeof entry === 'object') {
      // Normalizar quickNotes - garantir que todos tenham IDs únicos
      const quickNotes = entry.quickNotes || [];
      const normalizedQuickNotes: QuickNote[] = quickNotes.map((note: any) => {
        if (note.id && typeof note.id === 'string' && note.id.trim() !== '') {
          return {
            id: note.id,
            time: note.time || "",
            text: note.text || "",
          } as QuickNote;
        }
        // Se não tem id válido, criar um novo
        return {
          id: generateId(),
          time: note.time || "",
          text: note.text || "",
        } as QuickNote;
      });
      
      // Remover duplicatas por ID (manter o primeiro)
      const uniqueQuickNotes = normalizedQuickNotes.filter((note, index, self) =>
        index === self.findIndex((n) => n.id === note.id)
      );
      
      // Só incluir moodNumber se for um número válido (não null, não undefined)
      const moodNumberValue = entry.moodNumber;
      const hasValidMoodNumber = moodNumberValue !== null && 
                                  moodNumberValue !== undefined && 
                                  typeof moodNumberValue === 'number';
      
      normalized[date] = {
        mood: entry.mood ?? null,
        ...(hasValidMoodNumber && { moodNumber: moodNumberValue }),
        text: entry.text ?? "",
        quickNotes: uniqueQuickNotes,
        touched: entry.touched ?? true,
      } as JournalEntry;
    }
  }
  
  return normalized;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { showToast } = useToastContext();
  const [habits, setHabitsLocal] = usePersistentState<Habit[]>("habits", []);
  const [journal, setJournalLocal] = usePersistentState<JournalData>("journal", {});
  const hasLoadedFromSupabaseRef = useRef(false);
  const isLoadingRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);
  const saveTimeoutRef = useRef<{ habits: NodeJS.Timeout | null; journal: NodeJS.Timeout | null }>({
    habits: null,
    journal: null,
  });

  // Carregar dados do Supabase quando o usuário fizer login
  useEffect(() => {
    async function loadDataFromSupabase() {
      if (!user?.id) {
        console.log("🔍 AppContext: Usuário não logado, aguardando...");
        hasLoadedFromSupabaseRef.current = false;
        lastUserIdRef.current = null;
        return;
      }
      
      // Se já está carregando, não fazer nada
      if (isLoadingRef.current) {
        console.log("🔍 AppContext: Já está carregando, aguardando...");
        return;
      }
      
      // Se já carregou para este usuário, não recarregar
      if (hasLoadedFromSupabaseRef.current && lastUserIdRef.current === user.id) {
        console.log("🔍 AppContext: Já carregou para este usuário, ignorando...");
        return;
      }

      // Se mudou o usuário, resetar flags
      if (lastUserIdRef.current !== null && lastUserIdRef.current !== user.id) {
        console.log("🔄 AppContext: Usuário mudou, resetando flags");
        hasLoadedFromSupabaseRef.current = false;
      }

      isLoadingRef.current = true;
      lastUserIdRef.current = user.id;

      try {
        console.log("🔄 AppContext: Carregando dados do Supabase para usuário:", user.id);
        
        // Carregar habits
        const { data: habitsData, error: habitsError } = await loadFromSupabase(user.id, "habits");
        if (!habitsError && habitsData && Array.isArray(habitsData) && habitsData.length > 0) {
          console.log("✅ AppContext: Habits carregados do Supabase:", habitsData.length);
          setHabitsLocal(habitsData);
        } else if (habitsError && (habitsError as PostgrestError).code !== "PGRST116") {
          console.warn("⚠️ AppContext: Erro ao carregar habits do Supabase:", habitsError);
        } else {
          console.log("ℹ️ AppContext: Nenhum hábito encontrado no Supabase (primeira vez?)");
        }

        // Carregar journal
        const { data: journalData, error: journalError } = await loadFromSupabase(user.id, "journal");
        if (!journalError && journalData && typeof journalData === "object" && journalData !== null) {
          const journalObj = journalData as JournalData;
          if (Object.keys(journalObj).length > 0) {
            console.log("✅ AppContext: Journal carregado do Supabase");
            // Normalizar dados ao carregar para garantir IDs únicos nos quickNotes
            const normalizedJournal = normalizeJournalData(journalObj);
            setJournalLocal(normalizedJournal);
            
            // Se houve normalização (dados mudaram), salvar de volta para persistir IDs
            const originalStr = JSON.stringify(journalObj);
            const normalizedStr = JSON.stringify(normalizedJournal);
            if (originalStr !== normalizedStr) {
              console.log("🔄 AppContext: Normalizando quickNotes e salvando de volta no Supabase...");
              // Aguardar um pouco antes de salvar para não interferir com outros processos
              setTimeout(async () => {
                try {
                  await saveToSupabase(user.id, "journal", normalizedJournal);
                  console.log("✅ AppContext: Journal normalizado salvo com sucesso");
                } catch (err) {
                  console.error("⚠️ AppContext: Erro ao salvar journal normalizado:", err);
                }
              }, 1000);
            }
          } else {
            console.log("ℹ️ AppContext: Journal vazio no Supabase");
          }
        } else if (journalError && (journalError as PostgrestError).code !== "PGRST116") {
          console.warn("⚠️ AppContext: Erro ao carregar journal do Supabase:", journalError);
        } else {
          console.log("ℹ️ AppContext: Nenhum journal encontrado no Supabase (primeira vez?)");
        }

        // IMPORTANTE: Sempre marcar como carregado, mesmo se não houver dados
        // Isso permite que os saves funcionem mesmo na primeira vez
        hasLoadedFromSupabaseRef.current = true;
        console.log("✅ AppContext: Carregamento completo - saves agora estão habilitados");
      } catch (error) {
        console.error("❌ AppContext: Erro ao carregar dados do Supabase:", error);
        // Mesmo em erro, marcar como carregado para não bloquear saves
        hasLoadedFromSupabaseRef.current = true;
      } finally {
        isLoadingRef.current = false;
      }
    }

    loadDataFromSupabase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Remover setHabitsLocal e setJournalLocal das dependências para evitar loop

  // Salvar no Supabase quando há mudanças (debounced)
  useEffect(() => {
    if (!user?.id) {
      console.log("🔍 AppContext: Usuário não logado - não salvando habits");
      return;
    }
    if (!hasLoadedFromSupabaseRef.current) {
      console.log("🔍 AppContext: Ainda não carregou dados - aguardando antes de salvar habits");
      return; // Não salvar antes de carregar
    }

    // Limpar timeout anterior
    if (saveTimeoutRef.current.habits) {
      clearTimeout(saveTimeoutRef.current.habits);
    }

    // Aguardar 2 segundos antes de salvar (debounce)
    saveTimeoutRef.current.habits = setTimeout(async () => {
      console.log("💾 AppContext: Salvando habits no Supabase...", { userId: user.id, habitsCount: habits.length });
      try {
        await withRetry(
          async () => {
            const { error } = await saveToSupabase(user.id, "habits", habits);
            if (error) throw error;
          },
          {
            maxRetries: 3,
            initialDelay: 1000,
            onRetry: (attempt) => {
              console.warn(`⚠️ Tentativa ${attempt} de salvar habits falhou, tentando novamente...`);
            },
          }
        );
        console.log("✅ AppContext: Habits salvos com sucesso!");
      } catch (err) {
        console.error("❌ AppContext: Erro ao salvar habits após múltiplas tentativas:", err);
        showToast("Erro ao salvar hábitos. Verifique sua conexão.", "error");
      }
    }, 2000);

    return () => {
      if (saveTimeoutRef.current.habits) {
        clearTimeout(saveTimeoutRef.current.habits);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habits, user?.id, showToast]); // showToast é estável, mas adicionar para evitar warnings

  // Função para salvar journal imediatamente (sem debounce)
  const saveJournalImmediately = useCallback(async () => {
    if (!user?.id || !hasLoadedFromSupabaseRef.current) return;
    
    const journalKeys = Object.keys(journal);
    console.log("💾 AppContext: Salvando journal no Supabase (imediato)...", { userId: user.id, journalEntries: journalKeys.length });
    try {
      await withRetry(
        async () => {
          const { error } = await saveToSupabase(user.id, "journal", journal);
          if (error) throw error;
        },
        {
          maxRetries: 3,
          initialDelay: 1000,
          onRetry: (attempt) => {
            console.warn(`⚠️ Tentativa ${attempt} de salvar journal falhou, tentando novamente...`);
          },
        }
      );
      console.log("✅ AppContext: Journal salvo com sucesso!");
    } catch (err) {
      console.error("❌ AppContext: Erro ao salvar journal após múltiplas tentativas:", err);
      showToast("Erro ao salvar diário. Verifique sua conexão.", "error");
    }
  }, [journal, user?.id, showToast]);

  useEffect(() => {
    if (!user?.id) {
      console.log("🔍 AppContext: Usuário não logado - não salvando journal");
      return;
    }
    if (!hasLoadedFromSupabaseRef.current) {
      console.log("🔍 AppContext: Ainda não carregou dados - aguardando antes de salvar journal");
      return; // Não salvar antes de carregar
    }

    // Limpar timeout anterior
    if (saveTimeoutRef.current.journal) {
      clearTimeout(saveTimeoutRef.current.journal);
    }

    // Debounce apenas para texto (800ms) - mudanças em mood/quick notes salvam imediatamente
    saveTimeoutRef.current.journal = setTimeout(() => {
      saveJournalImmediately();
    }, 800);

    return () => {
      if (saveTimeoutRef.current.journal) {
        clearTimeout(saveTimeoutRef.current.journal);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journal, user?.id, saveJournalImmediately]);

  // Forçar salvamento no beforeunload
  useEffect(() => {
    if (!user?.id || !hasLoadedFromSupabaseRef.current) return;
    
    const handleBeforeUnload = () => {
      // Forçar salvamento síncrono no localStorage (já feito pelo usePersistentState)
      // Tentar salvar no Supabase também (pode não completar, mas tenta)
      saveJournalImmediately();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
    };
  }, [user?.id, saveJournalImmediately]);

  return (
    <AppContext.Provider value={{ habits: habits, setHabits: setHabitsLocal, journal: journal, setJournal: setJournalLocal, saveJournalImmediately }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp must be used inside an AppProvider");
  }
  return ctx;
}
