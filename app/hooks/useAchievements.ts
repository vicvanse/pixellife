"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import type { Achievement, UserAchievement, AchievementProgress } from "../types/identity_axes";
import { evaluateAchievement, formatAchievementProgress } from "../lib/evaluateAchievements";
import type { AxisSignalsAggregate } from "../types/identity_axes";

export function useAchievements() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(false);

  // Carregar todas as conquistas disponíveis (públicas)
  const loadAchievements = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .order("axis_key", { ascending: true })
        .order("level", { ascending: true });

      if (error) {
        console.error("Erro ao carregar conquistas:", error);
        return;
      }

      setAchievements(data || []);
    } catch (err) {
      console.error("Erro ao carregar conquistas:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar conquistas do usuário
  const loadUserAchievements = useCallback(async () => {
    if (!user?.id) {
      setUserAchievements([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_achievements")
        .select("*, achievement:achievements(*)")
        .eq("user_id", user.id)
        .order("completed", { ascending: false })
        .order("progress", { ascending: false });

      if (error) {
        console.error("Erro ao carregar conquistas do usuário:", error);
        return;
      }

      setUserAchievements(data || []);
    } catch (err) {
      console.error("Erro ao carregar conquistas do usuário:", err);
    }
  }, [user?.id]);

  // Avaliar e atualizar progresso de conquistas
  const evaluateAchievements = useCallback(
    async (signals: AxisSignalsAggregate[]): Promise<{
      success: boolean;
      error?: string;
      updated: number;
    }> => {
      if (!user?.id) {
        return { success: false, error: "Usuário não autenticado", updated: 0 };
      }

      try {
        setLoading(true);

        // Carregar todas as conquistas
        const { data: allAchievements, error: achievementsError } = await supabase
          .from("achievements")
          .select("*")
          .order("axis_key", { ascending: true })
          .order("level", { ascending: true });

        if (achievementsError) {
          return { success: false, error: achievementsError.message, updated: 0 };
        }

        // Carregar conquistas do usuário
        const { data: userAchs, error: userAchsError } = await supabase
          .from("user_achievements")
          .select("*")
          .eq("user_id", user.id);

        if (userAchsError) {
          return { success: false, error: userAchsError.message, updated: 0 };
        }

        let updatedCount = 0;

        // Para cada conquista, avaliar progresso
        for (const achievement of allAchievements || []) {
          const evaluation = evaluateAchievement(achievement, signals);
          const userAchievement = (userAchs || []).find(
            (ua) => ua.achievement_id === achievement.id
          );

          // Se já existe, atualizar
          if (userAchievement) {
            const { error: updateError } = await supabase
              .from("user_achievements")
              .update({
                progress: evaluation.progress,
                completed: evaluation.completed,
                completed_at: evaluation.completed
                  ? userAchievement.completed_at || new Date().toISOString()
                  : null,
                last_evaluated_at: new Date().toISOString(),
              })
              .eq("id", userAchievement.id);

            if (!updateError) {
              updatedCount++;
            }
          } else {
            // Se não existe, criar
            const { error: insertError } = await supabase
              .from("user_achievements")
              .insert({
                user_id: user.id,
                achievement_id: achievement.id,
                progress: evaluation.progress,
                completed: evaluation.completed,
                completed_at: evaluation.completed ? new Date().toISOString() : null,
                last_evaluated_at: new Date().toISOString(),
              });

            if (!insertError) {
              updatedCount++;
            }
          }
        }

        await loadUserAchievements();
        return { success: true, updated: updatedCount };
      } catch (err) {
        return {
          success: false,
          error: (err as Error).message,
          updated: 0,
        };
      } finally {
        setLoading(false);
      }
    },
    [user?.id, achievements, userAchievements, loadAchievements, loadUserAchievements]
  );

  // Obter progresso formatado de uma conquista
  const getAchievementProgress = useCallback(
    (
      achievement: Achievement,
      signals: AxisSignalsAggregate[]
    ): AchievementProgress => {
      const userAchievement = userAchievements.find(
        (ua) => ua.achievement_id === achievement.id
      );

      const formatted = formatAchievementProgress(achievement, userAchievement || null, signals);

      return {
        achievement,
        userAchievement: userAchievement || null,
        progressPercent: formatted.progressPercent,
        remaining: formatted.remaining,
        canComplete: formatted.canComplete,
      };
    },
    [userAchievements]
  );

  useEffect(() => {
    loadAchievements();
    if (user) {
      loadUserAchievements();
    }
  }, [loadAchievements, loadUserAchievements, user?.id]);

  return {
    achievements,
    userAchievements,
    loading,
    loadAchievements,
    loadUserAchievements,
    evaluateAchievements,
    getAchievementProgress,
    refresh: loadUserAchievements,
  };
}

