"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { Insight, createInsight, InsightKind, InsightCategory } from "../types/activity";
import type { PostgrestError } from "@supabase/supabase-js";

/**
 * Hook para gerenciar insights/feedback do usuário
 * 
 * Insights são interpretações derivadas das activities
 * Permitem comparação longitudinal e histórico de feedback
 */
export function useInsights() {
  const { user } = useAuth();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  // Carregar todos os insights
  const loadInsights = useCallback(async () => {
    if (!user) {
      setInsights([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("insights")
        .select("*")
        .eq("user_id", user.id)
        .order("generated_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setInsights(data || []);
    } catch (err) {
      console.error("Erro ao carregar insights:", err);
      setError(err as PostgrestError);
      setInsights([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Carregar insights por tipo
  const loadInsightsByKind = useCallback(
    async (kind: InsightKind) => {
      if (!user) {
        return [];
      }

      try {
        const { data, error: fetchError } = await supabase
          .from("insights")
          .select("*")
          .eq("user_id", user.id)
          .eq("kind", kind)
          .order("generated_at", { ascending: false });

        if (fetchError) {
          console.error("Erro ao carregar insights por tipo:", fetchError);
          return [];
        }

        return data || [];
      } catch (err) {
        console.error("Erro ao carregar insights por tipo:", err);
        return [];
      }
    },
    [user]
  );

  // Salvar novo insight
  const saveInsight = useCallback(
    async (
      description: string,
      options?: {
        kind?: InsightKind;
        category?: InsightCategory;
        pattern?: string;
        confidence?: number;
        basedOn?: Record<string, any>;
      }
    ): Promise<{ success: boolean; error?: string; insight?: Insight }> => {
      if (!user) {
        return { success: false, error: "Usuário não autenticado" };
      }

      if (!description.trim()) {
        return { success: false, error: "Descrição não pode estar vazia" };
      }

      try {
        const insightData = createInsight(user.id, description.trim(), options);

        const { data, error: insertError } = await supabase
          .from("insights")
          .insert({
            ...insightData,
            generated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) {
          console.error("Erro ao salvar insight:", insertError);
          return { success: false, error: insertError.message };
        }

        // Recarregar insights
        await loadInsights();

        return { success: true, insight: data };
      } catch (err) {
        console.error("Erro ao salvar insight:", err);
        return {
          success: false,
          error: (err as Error).message,
        };
      }
    },
    [user, loadInsights]
  );

  // Deletar insight
  const deleteInsight = useCallback(
    async (insightId: string): Promise<{ success: boolean; error?: string }> => {
      if (!user) {
        return { success: false, error: "Usuário não autenticado" };
      }

      try {
        const { error: deleteError } = await supabase
          .from("insights")
          .delete()
          .eq("id", insightId)
          .eq("user_id", user.id);

        if (deleteError) {
          console.error("Erro ao deletar insight:", deleteError);
          return { success: false, error: deleteError.message };
        }

        // Recarregar insights
        await loadInsights();

        return { success: true };
      } catch (err) {
        console.error("Erro ao deletar insight:", err);
        return {
          success: false,
          error: (err as Error).message,
        };
      }
    },
    [user, loadInsights]
  );

  // Carregar ao montar e quando usuário mudar
  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  return {
    insights,
    loading,
    error,
    saveInsight,
    deleteInsight,
    loadInsightsByKind,
    refreshInsights: loadInsights,
  };
}

