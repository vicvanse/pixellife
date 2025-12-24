"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import type { IdentityDeclared, IdentityDeclaredVersion } from "../types/identity";

export function useIdentityDeclared() {
  const { user } = useAuth();
  const [identity, setIdentity] = useState<IdentityDeclared | null>(null);
  const [versions, setVersions] = useState<IdentityDeclaredVersion[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar identidade declarada
  const loadIdentity = useCallback(async () => {
    if (!user?.id) {
      setIdentity(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("identity_declared")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Erro ao carregar identidade declarada:", error);
        return;
      }

      if (data) {
        setIdentity(data);
      } else {
        // Criar registro vazio se não existir
        const { data: newData } = await supabase
          .from("identity_declared")
          .insert({
            user_id: user.id,
            bio_text: "",
            core_labels: [],
            pinned_stats: {},
          })
          .select()
          .single();

        if (newData) {
          setIdentity(newData);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar identidade declarada:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Carregar versões históricas
  const loadVersions = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("identity_declared_versions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Erro ao carregar versões:", error);
        return;
      }

      setVersions(data || []);
    } catch (err) {
      console.error("Erro ao carregar versões:", err);
    }
  }, [user?.id]);

  // Atualizar bio
  const updateBio = useCallback(
    async (bioText: string): Promise<{ success: boolean; error?: string }> => {
      if (!user?.id) {
        return { success: false, error: "Usuário não autenticado" };
      }

      try {
        // Salvar versão atual antes de atualizar
        if (identity) {
          await supabase.from("identity_declared_versions").insert({
            user_id: user.id,
            bio_text: identity.bio_text,
            core_labels: identity.core_labels,
            pinned_stats: identity.pinned_stats,
          });
        }

        // Atualizar registro atual
        const { error: updateError } = await supabase
          .from("identity_declared")
          .upsert({
            user_id: user.id,
            bio_text: bioText,
            core_labels: identity?.core_labels || [],
            pinned_stats: identity?.pinned_stats || {},
            updated_at: new Date().toISOString(),
          });

        if (updateError) {
          return { success: false, error: updateError.message };
        }

        await loadIdentity();
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: (err as Error).message,
        };
      }
    },
    [user?.id, identity, loadIdentity]
  );

  // Adicionar ponto central
  const addCoreLabel = useCallback(
    async (label: string): Promise<{ success: boolean; error?: string }> => {
      if (!user?.id) {
        return { success: false, error: "Usuário não autenticado" };
      }

      if (!label.trim()) {
        return { success: false, error: "Label não pode estar vazio" };
      }

      try {
        const currentLabels = identity?.core_labels || [];
        if (currentLabels.includes(label.trim())) {
          return { success: false, error: "Label já existe" };
        }

        const { error: updateError } = await supabase
          .from("identity_declared")
          .upsert({
            user_id: user.id,
            bio_text: identity?.bio_text || "",
            core_labels: [...currentLabels, label.trim()],
            pinned_stats: identity?.pinned_stats || {},
            updated_at: new Date().toISOString(),
          });

        if (updateError) {
          return { success: false, error: updateError.message };
        }

        await loadIdentity();
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: (err as Error).message,
        };
      }
    },
    [user?.id, identity, loadIdentity]
  );

  // Remover ponto central
  const removeCoreLabel = useCallback(
    async (label: string): Promise<{ success: boolean; error?: string }> => {
      if (!user?.id) {
        return { success: false, error: "Usuário não autenticado" };
      }

      try {
        const currentLabels = identity?.core_labels || [];
        const newLabels = currentLabels.filter(l => l !== label);

        const { error: updateError } = await supabase
          .from("identity_declared")
          .upsert({
            user_id: user.id,
            bio_text: identity?.bio_text || "",
            core_labels: newLabels,
            pinned_stats: identity?.pinned_stats || {},
            updated_at: new Date().toISOString(),
          });

        if (updateError) {
          return { success: false, error: updateError.message };
        }

        await loadIdentity();
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: (err as Error).message,
        };
      }
    },
    [user?.id, identity, loadIdentity]
  );

  // Atualizar pinned stats
  const updatePinnedStats = useCallback(
    async (stats: Record<string, any>): Promise<{ success: boolean; error?: string }> => {
      if (!user?.id) {
        return { success: false, error: "Usuário não autenticado" };
      }

      try {
        const { error: updateError } = await supabase
          .from("identity_declared")
          .upsert({
            user_id: user.id,
            bio_text: identity?.bio_text || "",
            core_labels: identity?.core_labels || [],
            pinned_stats: stats,
            updated_at: new Date().toISOString(),
          });

        if (updateError) {
          return { success: false, error: updateError.message };
        }

        await loadIdentity();
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: (err as Error).message,
        };
      }
    },
    [user?.id, identity, loadIdentity]
  );

  useEffect(() => {
    if (user) {
      loadIdentity();
      loadVersions();
    }
  }, [user?.id, loadIdentity, loadVersions]);

  return {
    identity,
    versions,
    loading,
    updateBio,
    addCoreLabel,
    removeCoreLabel,
    updatePinnedStats,
    refresh: loadIdentity,
  };
}

