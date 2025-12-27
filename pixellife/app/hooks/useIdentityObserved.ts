"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import type { IdentityObserved, ObservedWindow } from "../types/identity";
import { calculateObservedIdentity } from "../lib/calculateObservedIdentity";
import type { Activity } from "../types/activity";

export function useIdentityObserved() {
  const { user } = useAuth();
  const [observed, setObserved] = useState<IdentityObserved | null>(null);
  const [loading, setLoading] = useState(false);

  // Carregar identidade observada (cache)
  const loadObserved = useCallback(
    async (window: ObservedWindow = '90d') => {
      if (!user?.id) {
        setObserved(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("identity_observed")
          .select("*")
          .eq("user_id", user.id)
          .eq("time_window", window)
          .maybeSingle();

        if (error) {
          console.error("Erro ao carregar identidade observada:", error);
          return;
        }

        if (data) {
          setObserved(data);
        }
      } catch (err) {
        console.error("Erro ao carregar identidade observada:", err);
      }
    },
    [user?.id]
  );

  // Gerar/atualizar identidade observada
  const generateObservedIdentity = useCallback(
    async (window: ObservedWindow = '90d'): Promise<{ success: boolean; error?: string }> => {
      if (!user?.id) {
        return { success: false, error: "Usuário não autenticado" };
      }

      try {
        setLoading(true);

        // 1. Buscar todas as activities do usuário
        const { data: activities, error: activitiesError } = await supabase
          .from("activities")
          .select("*")
          .eq("user_id", user.id)
          .order("timestamp", { ascending: true });

        if (activitiesError) {
          return { success: false, error: activitiesError.message };
        }

        // 2. Calcular eixos
        const axes = calculateObservedIdentity(activities as Activity[] || [], window);

        // 3. Preparar sinais (auditoria)
        const signals = {
          total_activities: activities?.length || 0,
          window,
          computed_at: new Date().toISOString(),
        };

        // 4. Salvar no cache
        const { error: upsertError } = await supabase
          .from("identity_observed")
          .upsert({
            user_id: user.id,
            time_window: window,
            axes,
            signals,
            computed_at: new Date().toISOString(),
          });

        if (upsertError) {
          return { success: false, error: upsertError.message };
        }

        // 5. Recarregar
        await loadObserved(window);

        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: (err as Error).message,
        };
      } finally {
        setLoading(false);
      }
    },
    [user?.id, loadObserved]
  );

  useEffect(() => {
    if (user) {
      loadObserved('90d'); // Carregar janela padrão
    }
  }, [user?.id, loadObserved]);

  return {
    observed,
    loading,
    generateObservedIdentity,
    refresh: loadObserved,
  };
}

