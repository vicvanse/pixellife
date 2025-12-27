"use client";

import { useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import type { AxisSignal, SignalType, SignalPeriod } from "../types/identity_axes";
import { calculateAxisSignals } from "../lib/calculateAxisSignals";
import type { Activity } from "../types/activity";

export function useAxisSignals() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Calcular e salvar sinais para um eixo
  const calculateAndSaveSignals = useCallback(
    async (
      axisKey: string,
      activities: Activity[],
      period: SignalPeriod = "30d"
    ): Promise<{ success: boolean; error?: string; signals?: AxisSignal[] }> => {
      if (!user?.id) {
        return { success: false, error: "Usuário não autenticado" };
      }

      try {
        setLoading(true);

        // Calcular sinais
        const calculatedSignals = calculateAxisSignals(activities, axisKey, period);

        // Salvar cada sinal
        const savedSignals: AxisSignal[] = [];

        for (const signal of calculatedSignals) {
          const { data, error: insertError } = await supabase
            .from("axis_signals")
            .upsert({
              user_id: user.id,
              axis_key: axisKey,
              signal_type: signal.signal_type,
              value: signal.value,
              period: signal.period,
              metadata: signal.metadata,
              calculated_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (insertError) {
            console.error(`Erro ao salvar sinal ${signal.signal_type}:`, insertError);
            continue;
          }

          if (data) {
            savedSignals.push(data);
          }
        }

        return { success: true, signals: savedSignals };
      } catch (err) {
        return {
          success: false,
          error: (err as Error).message,
        };
      } finally {
        setLoading(false);
      }
    },
    [user?.id]
  );

  // Carregar sinais de um eixo
  const loadSignals = useCallback(
    async (
      axisKey: string,
      period?: SignalPeriod
    ): Promise<AxisSignal[]> => {
      if (!user?.id) {
        return [];
      }

      try {
        let query = supabase
          .from("axis_signals")
          .select("*")
          .eq("user_id", user.id)
          .eq("axis_key", axisKey)
          .order("calculated_at", { ascending: false });

        if (period) {
          query = query.eq("period", period);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Erro ao carregar sinais:", error);
          return [];
        }

        return data || [];
      } catch (err) {
        console.error("Erro ao carregar sinais:", err);
        return [];
      }
    },
    [user?.id]
  );

  // Carregar todos os sinais do usuário (agregados por eixo)
  const loadAllSignals = useCallback(async (): Promise<Record<string, AxisSignal[]>> => {
    if (!user?.id) {
      return {};
    }

    try {
      const { data, error } = await supabase
        .from("axis_signals")
        .select("*")
        .eq("user_id", user.id)
        .order("calculated_at", { ascending: false });

      if (error) {
        console.error("Erro ao carregar todos os sinais:", error);
        return {};
      }

      // Agrupar por axis_key
      const grouped: Record<string, AxisSignal[]> = {};
      (data || []).forEach((signal) => {
        if (!grouped[signal.axis_key]) {
          grouped[signal.axis_key] = [];
        }
        grouped[signal.axis_key].push(signal);
      });

      return grouped;
    } catch (err) {
      console.error("Erro ao carregar todos os sinais:", err);
      return {};
    }
  }, [user?.id]);

  return {
    loading,
    calculateAndSaveSignals,
    loadSignals,
    loadAllSignals,
  };
}

