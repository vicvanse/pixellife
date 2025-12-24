"use client";

import { useCallback } from "react";
import { useApp } from "../context/AppContext";

export type Mood = "good" | "neutral" | "bad";

export interface QuickNote {
  id: string;
  time: string;
  text: string;
}

export interface JournalEntry {
  mood: Mood | null;
  moodNumber?: number;
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
  
  return {
    mood: patch.mood ?? prev?.mood ?? null,
    moodNumber:
      patch.moodNumber !== undefined
        ? patch.moodNumber
        : prev?.moodNumber,
    text: patch.text ?? prev?.text ?? "",
    quickNotes: migratedQuickNotes,
    touched: patch.touched ?? prev?.touched ?? true,
  };
}

export function useJournal() {
  const { journal, setJournal } = useApp();

  const getTodayDate = useCallback((): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
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
