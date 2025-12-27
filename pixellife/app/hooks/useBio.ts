"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import { BioActivity, createBioActivity } from "../types/activity";
import type { PostgrestError } from "@supabase/supabase-js";

export interface Bio {
  id: string;
  text: string;
  timestamp: string;
  updated_at: string;
}

/**
 * Hook para gerenciar bio do usuário
 * 
 * A bio é armazenada como uma Activity do tipo biography/subtype=self_description
 * Sempre mostra a mais recente abaixo do avatar
 */
export function useBio() {
  const { user } = useAuth();
  const [currentBio, setCurrentBio] = useState<Bio | null>(null);
  const [bioHistory, setBioHistory] = useState<Bio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  // Carregar bio atual (mais recente)
  const loadCurrentBio = useCallback(async () => {
    if (!user) {
      setCurrentBio(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("activities")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", "biography")
        .eq("subtype", "self_description")
        .order("timestamp", { ascending: false })
        .limit(1)
        .single();

      if (fetchError) {
        // Se não encontrar, não é erro (pode ser primeira vez)
        if (fetchError.code === "PGRST116") {
          setCurrentBio(null);
          setLoading(false);
          return;
        }
        throw fetchError;
      }

      if (data && data.text) {
        setCurrentBio({
          id: data.id,
          text: data.text,
          timestamp: data.timestamp,
          updated_at: data.updated_at,
        });
      } else {
        setCurrentBio(null);
      }
    } catch (err) {
      console.error("Erro ao carregar bio:", err);
      setError(err as PostgrestError);
      setCurrentBio(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Carregar histórico de bios
  const loadBioHistory = useCallback(async () => {
    if (!user) {
      setBioHistory([]);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from("activities")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", "biography")
        .eq("subtype", "self_description")
        .order("timestamp", { ascending: false });

      if (fetchError) {
        console.error("Erro ao carregar histórico de bio:", fetchError);
        return;
      }

      if (data) {
        const bios: Bio[] = data
          .filter((item) => item.text)
          .map((item) => ({
            id: item.id,
            text: item.text!,
            timestamp: item.timestamp,
            updated_at: item.updated_at,
          }));
        setBioHistory(bios);
      }
    } catch (err) {
      console.error("Erro ao carregar histórico de bio:", err);
    }
  }, [user]);

  // Salvar nova bio
  const saveBio = useCallback(
    async (bioText: string): Promise<{ success: boolean; error?: string }> => {
      if (!user) {
        return { success: false, error: "Usuário não autenticado" };
      }

      if (!bioText.trim()) {
        return { success: false, error: "Bio não pode estar vazia" };
      }

      try {
        const bioActivity = createBioActivity(user.id, bioText.trim());

        const { data, error: insertError } = await supabase
          .from("activities")
          .insert(bioActivity)
          .select()
          .single();

        if (insertError) {
          console.error("Erro ao salvar bio:", insertError);
          // Mensagem mais amigável para erro de RLS
          if (insertError.code === "42501" || insertError.message.includes("row-level security")) {
            return { 
              success: false, 
              error: "Erro de permissão. Verifique se as políticas RLS estão configuradas no Supabase." 
            };
          }
          return { success: false, error: insertError.message };
        }

        // Atualizar estado local imediatamente (otimização)
        if (data && data.text) {
          setCurrentBio({
            id: data.id,
            text: data.text,
            timestamp: data.timestamp,
            updated_at: data.updated_at,
          });
        }

        // Recarregar histórico em background (não bloqueia)
        loadBioHistory().catch(err => console.error("Erro ao recarregar histórico:", err));

        return { success: true };
      } catch (err) {
        console.error("Erro ao salvar bio:", err);
        return {
          success: false,
          error: (err as Error).message,
        };
      }
    },
    [user, loadCurrentBio, loadBioHistory]
  );

  // Carregar ao montar e quando usuário mudar (apenas uma vez)
  useEffect(() => {
    if (user) {
      loadCurrentBio();
      loadBioHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Apenas quando user.id mudar, não quando callbacks mudarem

  return {
    currentBio,
    bioHistory,
    loading,
    error,
    saveBio,
    refreshBio: loadCurrentBio,
    refreshHistory: loadBioHistory,
  };
}

