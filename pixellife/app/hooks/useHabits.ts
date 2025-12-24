"use client";

import { useCallback } from "react";
import { useApp } from "../context/AppContext";

export type Habit = {
  id: number;
  name: string;
  checks: Record<string, boolean>;
  createdAt?: string;
};

export function useHabits() {
  const { habits, setHabits } = useApp();

  const addHabit = useCallback((name: string) => {
    const newHabit: Habit = {
      id: Date.now(),
      name,
      checks: {},
      createdAt: new Date().toISOString().substring(0, 10),
    };
    setHabits((prev) => [...prev, newHabit]);
  }, [setHabits]);

  const updateHabit = useCallback((id: number, updates: Partial<Habit>) => {
    setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, ...updates } : h)));
  }, [setHabits]);

  const deleteHabit = useCallback((id: number) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
  }, [setHabits]);

  const toggleCheck = useCallback((habitId: number, day: string) => {
    setHabits((prev) =>
      prev.map((h) =>
        h.id === habitId
          ? {
              ...h,
              checks: {
                ...h.checks,
                [day]: !h.checks[day],
              },
            }
          : h
      )
    );
  }, [setHabits]);

  const reorderHabits = useCallback((newHabits: Habit[]) => {
    setHabits(newHabits);
  }, [setHabits]);

  return {
    habits,
    setHabits,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleCheck,
    reorderHabits,
  };
}

