"use client";

import { useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import { createBioActivity } from "../types/activity";

/**
 * Hook para salvar informações do perfil como Activities
 * Idade, cidade e título são salvos como biography activities
 */
export function useProfileInfo() {
  const { user } = useAuth();

  const saveBirthDate = useCallback(
    async (birthDate: string): Promise<{ success: boolean; error?: string }> => {
      if (!user || !birthDate) {
        return { success: false, error: "Usuário não autenticado ou data inválida" };
      }

      try {
        // Verificar sessão antes de inserir
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          console.error("Erro de sessão:", sessionError);
          return { success: false, error: "Sessão expirada. Por favor, faça login novamente." };
        }

        const activity = {
          user_id: user.id,
          type: "profile_info" as const,
          subtype: "birth_date",
          text: birthDate,
          timestamp: new Date().toISOString(),
          time_precision: "exact" as const,
          source: "manual" as const,
        };

        const { error: insertError } = await supabase.from("activities").insert(activity);

        if (insertError) {
          console.error("Erro ao salvar birthDate:", insertError);
          if (insertError.code === "42501" || insertError.message.includes("row-level security")) {
            return { 
              success: false, 
              error: "Erro de permissão. Verifique se as políticas RLS estão configuradas no Supabase." 
            };
          }
          return { success: false, error: insertError.message };
        }

        return { success: true };
      } catch (err) {
        console.error("Erro ao salvar birthDate:", err);
        return {
          success: false,
          error: (err as Error).message,
        };
      }
    },
    [user]
  );

  const saveCity = useCallback(
    async (city: string): Promise<{ success: boolean; error?: string }> => {
      if (!user) {
        return { success: false, error: "Usuário não autenticado" };
      }

      if (!city.trim()) {
        return { success: false, error: "Cidade não pode estar vazia" };
      }

      try {
        // Verificar sessão antes de inserir
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          console.error("Erro de sessão:", sessionError);
          return { success: false, error: "Sessão expirada. Por favor, faça login novamente." };
        }

        const activity = {
          user_id: user.id,
          type: "profile_info" as const,
          subtype: "city",
          text: city.trim(),
          timestamp: new Date().toISOString(),
          time_precision: "exact" as const,
          source: "manual" as const,
        };

        const { error: insertError } = await supabase.from("activities").insert(activity);

        if (insertError) {
          console.error("Erro ao salvar city:", insertError);
          if (insertError.code === "42501" || insertError.message.includes("row-level security")) {
            return { 
              success: false, 
              error: "Erro de permissão. Verifique se as políticas RLS estão configuradas no Supabase." 
            };
          }
          return { success: false, error: insertError.message };
        }

        return { success: true };
      } catch (err) {
        console.error("Erro ao salvar city:", err);
        return {
          success: false,
          error: (err as Error).message,
        };
      }
    },
    [user]
  );

  const saveTitle = useCallback(
    async (title: string): Promise<{ success: boolean; error?: string }> => {
      if (!user) {
        return { success: false, error: "Usuário não autenticado" };
      }

      if (!title.trim()) {
        return { success: false, error: "Título não pode estar vazio" };
      }

      try {
        // Verificar sessão antes de inserir
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          console.error("Erro de sessão:", sessionError);
          return { success: false, error: "Sessão expirada. Por favor, faça login novamente." };
        }

        const activity = {
          user_id: user.id,
          type: "profile_info" as const,
          subtype: "title",
          text: title.trim(),
          timestamp: new Date().toISOString(),
          time_precision: "exact" as const,
          source: "manual" as const,
        };

        const { error: insertError } = await supabase.from("activities").insert(activity);

        if (insertError) {
          console.error("Erro ao salvar title:", insertError);
          if (insertError.code === "42501" || insertError.message.includes("row-level security")) {
            return { 
              success: false, 
              error: "Erro de permissão. Verifique se as políticas RLS estão configuradas no Supabase." 
            };
          }
          return { success: false, error: insertError.message };
        }

        return { success: true };
      } catch (err) {
        console.error("Erro ao salvar title:", err);
        return {
          success: false,
          error: (err as Error).message,
        };
      }
    },
    [user]
  );

  return {
    saveBirthDate,
    saveCity,
    saveTitle,
  };
}

