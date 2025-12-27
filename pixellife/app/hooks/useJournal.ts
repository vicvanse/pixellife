"use client";

import { useCallback } from "react";
import { useApp } from "../context/AppContext";

export type Mood = "good" | "neutral" | "bad" | "none";

export interface QuickNote {
  id: string;
  time: string;
  text: string;
}

export interface JournalEntry {
  mood: Mood | null;
  moodNumber?: number; // Número opcional (0-10), só existe quando selecionado em modo numérico
  text: string;
  quickNotes: QuickNote[];
  touched: boolean;
}

export interface JournalData {
  [date: string]: JournalEntry;
}

// Gerar ID único
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback para ambientes sem crypto.randomUUID
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Migrar QuickNotes antigos (sem id) para ter id
function migrateQuickNotes(notes: any[]): QuickNote[] {
  return notes.map((note: any) => {
    if (note.id) {
      return note as QuickNote;
    }
    // Se não tem id, criar um
    return {
      id: generateId(),
      time: note.time || "",
      text: note.text || "",
    };
  });
}

// Função centralizada para normalizar entrada
function normalizeEntry(
  prev: JournalEntry | undefined,
  patch: Partial<JournalEntry>
): JournalEntry {
  const quickNotes = patch.quickNotes ?? prev?.quickNotes ?? [];
  // Garantir que todos os quickNotes tenham id
  const migratedQuickNotes = migrateQuickNotes(quickNotes);
  
  // Se moodNumber foi explicitamente passado como undefined ou null, remover a propriedade
  // Se foi passado um número válido, usar ele
  // Se não foi especificado, manter o anterior
  let moodNumber: number | undefined;
  if ('moodNumber' in patch) {
    // Se foi passado explicitamente, usar o valor (pode ser undefined ou null para remover)
    const patchValue = patch.moodNumber;
    moodNumber = (patchValue !== null && patchValue !== undefined) ? patchValue : undefined;
  } else {
    moodNumber = prev?.moodNumber;
  }
  
  // Converter "none" para null ao salvar (para compatibilidade com dados antigos)
  const moodValue = patch.mood;
  const normalizedMood = moodValue === "none" ? null : (moodValue ?? prev?.mood ?? null);
  
  return {
    mood: normalizedMood,
    // Só incluir moodNumber se for um número válido (não undefined e não null)
    ...(moodNumber !== undefined && moodNumber !== null && typeof moodNumber === 'number' && { moodNumber }),
    text: patch.text ?? prev?.text ?? "",
    quickNotes: migratedQuickNotes,
    touched: patch.touched ?? prev?.touched ?? true,
  };
}

export function useJournal() {
  const { journal, setJournal } = useApp();

  const getTodayDate = useCallback((): string => {
    // Usar data local para evitar problemas de timezone
    const today = new Date();
    // Ajustar para timezone local
    const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000));
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, "0");
    const day = String(localDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const getEntry = useCallback(
    (date: string): JournalEntry | null => {
      return journal[date] ?? null;
    },
    [journal]
  );

  const updateJournalEntry = useCallback(
    (date: string, patch: Partial<JournalEntry>) => {
      setJournal((prev: JournalData) => {
        const current = prev[date];
        const updated = normalizeEntry(current, patch);
        return {
          ...prev,
          [date]: updated,
        };
      });
    },
    [setJournal]
  );

  const addQuickNote = useCallback(
    (date: string, text: string) => {
      const now = new Date();
      const time = `${now.getHours().toString().padStart(2, "0")}:${now
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;
      
      const note: QuickNote = {
        id: generateId(),
        time,
        text,
      };

      setJournal((prev: JournalData) => {
        const current = prev[date];
        const base = current ?? {
          mood: null,
          text: "",
          quickNotes: [],
          touched: true,
        };

        return {
          ...prev,
          [date]: {
            ...base,
            quickNotes: [...base.quickNotes, note],
            touched: true,
          },
        };
      });
    },
    [setJournal]
  );

  const updateQuickNote = useCallback(
    (date: string, noteId: string, text: string) => {
      setJournal((prev: JournalData) => {
        const entry = prev[date];
        if (!entry) return prev;

        return {
          ...prev,
          [date]: {
            ...entry,
            quickNotes: entry.quickNotes.map((n: QuickNote) =>
              n.id === noteId ? { ...n, text } : n
            ),
          },
        };
      });
    },
    [setJournal]
  );

  const removeQuickNote = useCallback(
    (date: string, noteId: string) => {
      setJournal((prev: JournalData) => {
        const entry = prev[date];
        if (!entry) return prev;

        return {
          ...prev,
          [date]: {
            ...entry,
            quickNotes: entry.quickNotes.filter((n: QuickNote) => n.id !== noteId),
          },
        };
      });
    },
    [setJournal]
  );

  const getAllDates = useCallback((): string[] => {
    return Object.keys(journal).sort().reverse();
  }, [journal]);

  return {
    journal,
    getTodayDate,
    getEntry,
    updateJournalEntry,
    addQuickNote,
    updateQuickNote,
    removeQuickNote,
    getAllDates,
  };
}
