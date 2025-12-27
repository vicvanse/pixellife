"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import type { IdentityAxis, AxisStatus } from "../types/identity_axes";

export function useIdentityAxes() {
  const { user } = useAuth();
  const [axes, setAxes] = useState<IdentityAxis[]>([]);
  const [loading, setLoading] = useState(false);

  // Carregar todos os eixos do usuário
  const loadAxes = useCallback(async () => {
    if (!user?.id) {
      setAxes([]);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("identity_axes")
        .select("*")
        .eq("user_id", user.id)
        .order("relevance_score", { ascending: false, nullsFirst: false });

      if (error) {
        console.error("Erro ao carregar eixos:", error);
        return;
      }

      setAxes(data || []);
    } catch (err) {
      console.error("Erro ao carregar eixos:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Carregar eixos por status
  const loadAxesByStatus = useCallback(
    async (status: AxisStatus) => {
      if (!user?.id) {
        return [];
      }

      try {
        const { data, error } = await supabase
          .from("identity_axes")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", status)
          .order("relevance_score", { ascending: false });

        if (error) {
          console.error("Erro ao carregar eixos por status:", error);
          return [];
        }

        return data || [];
      } catch (err) {
        console.error("Erro ao carregar eixos por status:", err);
        return [];
      }
    },
    [user?.id]
  );

  // Criar ou atualizar eixo
  const upsertAxis = useCallback(
    async (
      axisKey: string,
      data: {
        label: string;
        description?: string;
        status?: AxisStatus;
        relevance_score?: number;
        first_detected_at?: string;
        last_active_at?: string;
      }
    ): Promise<{ success: boolean; error?: string; axis?: IdentityAxis }> => {
      if (!user?.id) {
        return { success: false, error: "Usuário não autenticado" };
      }

      try {
        const { data: result, error: upsertError } = await supabase
          .from("identity_axes")
          .upsert({
            user_id: user.id,
            axis_key: axisKey,
            label: data.label,
            description: data.description || null,
            status: data.status || "latent",
            relevance_score: data.relevance_score || null,
            first_detected_at: data.first_detected_at || null,
            last_active_at: data.last_active_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (upsertError) {
          return { success: false, error: upsertError.message };
        }

        await loadAxes();
        return { success: true, axis: result };
      } catch (err) {
        return {
          success: false,
          error: (err as Error).message,
        };
      }
    },
    [user?.id, loadAxes]
  );

  // Atualizar status de um eixo
  const updateAxisStatus = useCallback(
    async (
      axisKey: string,
      status: AxisStatus
    ): Promise<{ success: boolean; error?: string }> => {
      if (!user?.id) {
        return { success: false, error: "Usuário não autenticado" };
      }

      try {
        const { error: updateError } = await supabase
          .from("identity_axes")
          .update({
            status,
            last_active_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("axis_key", axisKey);

        if (updateError) {
          return { success: false, error: updateError.message };
        }

        await loadAxes();
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: (err as Error).message,
        };
      }
    },
    [user?.id, loadAxes]
  );

  // Deletar eixo
  const deleteAxis = useCallback(
    async (axisKey: string): Promise<{ success: boolean; error?: string }> => {
      if (!user?.id) {
        return { success: false, error: "Usuário não autenticado" };
      }

      try {
        const { error: deleteError } = await supabase
          .from("identity_axes")
          .delete()
          .eq("user_id", user.id)
          .eq("axis_key", axisKey);

        if (deleteError) {
          return { success: false, error: deleteError.message };
        }

        await loadAxes();
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: (err as Error).message,
        };
      }
    },
    [user?.id, loadAxes]
  );

  useEffect(() => {
    if (user) {
      loadAxes();
    }
  }, [user?.id, loadAxes]);

  return {
    axes,
    loading,
    loadAxes,
    loadAxesByStatus,
    upsertAxis,
    updateAxisStatus,
    deleteAxis,
    refresh: loadAxes,
  };
}

