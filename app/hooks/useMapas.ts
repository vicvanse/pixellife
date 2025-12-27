"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import type { MapasCategory, MapasElement, MapasUserElement, MapasState } from "../types/mapas";

export function useMapas() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<MapasCategory[]>([]);
  const [elements, setElements] = useState<MapasElement[]>([]);
  const [userElements, setUserElements] = useState<MapasUserElement[]>([]);
  const [loading, setLoading] = useState(false);

  // Carregar todas as categorias
  const loadCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("mapas_categories")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.error("Erro ao carregar categorias:", error);
        return;
      }

      setCategories(data || []);
    } catch (err) {
      console.error("Erro ao carregar categorias:", err);
    }
  }, []);

  // Carregar elementos de uma categoria
  const loadElements = useCallback(async (categoryKey?: string) => {
    try {
      let query = supabase
        .from("mapas_elements")
        .select("*")
        .order("name", { ascending: true });

      if (categoryKey) {
        query = query.eq("category_key", categoryKey);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Erro ao carregar elementos:", error);
        return;
      }

      setElements(data || []);
    } catch (err) {
      console.error("Erro ao carregar elementos:", err);
    }
  }, []);

  // Carregar estados do usuário
  const loadUserElements = useCallback(async () => {
    if (!user?.id) {
      setUserElements([]);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("mapas_user_elements")
        .select(`
          *,
          element:mapas_elements(*)
        `)
        .eq("user_id", user.id)
        .order("last_updated_at", { ascending: false });

      if (error) {
        console.error("Erro ao carregar elementos do usuário:", error);
        return;
      }

      setUserElements(data || []);
    } catch (err) {
      console.error("Erro ao carregar elementos do usuário:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Atualizar estado de um elemento
  const updateElementState = useCallback(
    async (
      elementId: string,
      newState: MapasState,
      source: 'manual' | 'habit' | 'diary' | 'biography' | 'auto' = 'manual'
    ): Promise<{ success: boolean; error?: string }> => {
      if (!user?.id) {
        return { success: false, error: "Usuário não autenticado" };
      }

      try {
        // Buscar estado atual (se existir)
        const { data: existing } = await supabase
          .from("mapas_user_elements")
          .select("*")
          .eq("user_id", user.id)
          .eq("element_id", elementId)
          .single();

        const previousState = existing?.state || null;
        const firstExperienced = existing?.first_experienced_at || 
          (newState !== 'not_done' ? new Date().toISOString() : null);

        // Upsert do estado - usar a constraint UNIQUE(user_id, element_id)
        // Primeiro tenta atualizar, se não existir, insere
        const { data: updated, error: upsertError } = await supabase
          .from("mapas_user_elements")
          .upsert({
            user_id: user.id,
            element_id: elementId,
            state: newState,
            first_experienced_at: firstExperienced,
            last_updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,element_id'
          })
          .select()
          .single();

        if (upsertError) {
          console.error("Erro no upsert:", upsertError);
          return { success: false, error: upsertError.message };
        }

        if (!updated) {
          console.error("Upsert não retornou dados atualizados");
          return { success: false, error: "Falha ao atualizar estado" };
        }

        // Registrar no histórico (se mudou)
        if (previousState !== newState && updated) {
          await supabase
            .from("mapas_state_history")
            .insert({
              user_element_id: updated.id,
              previous_state: previousState,
              new_state: newState,
              source,
              changed_at: new Date().toISOString(),
            });
        }

        // Recarregar elementos do usuário para atualizar a UI
        await loadUserElements();
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: (err as Error).message,
        };
      }
    },
    [user?.id, loadUserElements]
  );

  // Obter estado atual de um elemento
  const getElementState = useCallback(
    (elementId: string): MapasState | null => {
      const userElement = userElements.find((ue) => ue.element_id === elementId);
      return userElement?.state || null;
    },
    [userElements]
  );

  useEffect(() => {
    loadCategories();
    loadElements();
    if (user) {
      loadUserElements();
    }
  }, [loadCategories, loadElements, loadUserElements, user?.id]);

  return {
    categories,
    elements,
    userElements,
    loading,
    loadCategories,
    loadElements,
    loadUserElements,
    updateElementState,
    getElementState,
    refresh: loadUserElements,
  };
}

