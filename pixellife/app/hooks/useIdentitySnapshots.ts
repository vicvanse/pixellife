"use client";

import { useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import type { IdentitySnapshot } from "../types/identity_axes";

export function useIdentitySnapshots() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Carregar snapshots do usuário
  const loadSnapshots = useCallback(async (): Promise<IdentitySnapshot[]> => {
    if (!user?.id) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from("identity_snapshots")
        .select("*")
        .eq("user_id", user.id)
        .order("period_start", { ascending: false });

      if (error) {
        console.error("Erro ao carregar snapshots:", error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error("Erro ao carregar snapshots:", err);
      return [];
    }
  }, [user?.id]);

  // Criar snapshot
  const createSnapshot = useCallback(
    async (
      periodStart: string,
      periodEnd: string,
      centralAxes: string[],
      summary: string
    ): Promise<{ success: boolean; error?: string; snapshot?: IdentitySnapshot }> => {
      if (!user?.id) {
        return { success: false, error: "Usuário não autenticado" };
      }

      try {
        setLoading(true);

        const { data, error: insertError } = await supabase
          .from("identity_snapshots")
          .insert({
            user_id: user.id,
            period_start: periodStart,
            period_end: periodEnd,
            central_axes: centralAxes,
            summary: summary,
            generated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) {
          return { success: false, error: insertError.message };
        }

        return { success: true, snapshot: data };
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

  // Gerar snapshot mensal automático
  const generateMonthlySnapshot = useCallback(
    async (month: Date): Promise<{ success: boolean; error?: string }> => {
      if (!user?.id) {
        return { success: false, error: "Usuário não autenticado" };
      }

      try {
        setLoading(true);

        // Calcular início e fim do mês
        const year = month.getFullYear();
        const monthIndex = month.getMonth();
        const periodStart = new Date(year, monthIndex, 1).toISOString().split("T")[0];
        const lastDay = new Date(year, monthIndex + 1, 0).getDate();
        const periodEnd = new Date(year, monthIndex, lastDay).toISOString().split("T")[0];

        // Buscar eixos centrais do mês
        const { data: axes, error: axesError } = await supabase
          .from("identity_axes")
          .select("axis_key, label")
          .eq("user_id", user.id)
          .eq("status", "central")
          .order("relevance_score", { ascending: false })
          .limit(5);

        if (axesError) {
          return { success: false, error: axesError.message };
        }

        const centralAxes = axes?.map((a) => a.axis_key) || [];
        const axisLabels = axes?.map((a) => a.label).join(", ") || "Nenhum eixo central";

        // Gerar summary simples
        const summary = `Entre ${new Date(periodStart).toLocaleDateString("pt-BR", {
          month: "long",
          year: "numeric",
        })} e ${new Date(periodEnd).toLocaleDateString("pt-BR", {
          month: "long",
          year: "numeric",
        })}, os eixos centrais foram: ${axisLabels}.`;

        const result = await createSnapshot(periodStart, periodEnd, centralAxes, summary);
        return result;
      } catch (err) {
        return {
          success: false,
          error: (err as Error).message,
        };
      } finally {
        setLoading(false);
      }
    },
    [user?.id, createSnapshot]
  );

  return {
    loading,
    loadSnapshots,
    createSnapshot,
    generateMonthlySnapshot,
  };
}

