"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import type { FeedbackHistory, FeedbackContext } from "../types/identity_axes";

export function useFeedbackHistory() {
  const { user } = useAuth();
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackHistory[]>([]);
  const [loading, setLoading] = useState(false);

  // Carregar histórico de feedback
  const loadFeedbackHistory = useCallback(
    async (context?: FeedbackContext): Promise<FeedbackHistory[]> => {
      if (!user?.id) {
        setFeedbackHistory([]);
        return [];
      }

      try {
        setLoading(true);

        let query = supabase
          .from("feedback_history")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50);

        if (context) {
          query = query.eq("context", context);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Erro ao carregar histórico de feedback:", error);
          return [];
        }

        const history = data || [];
        setFeedbackHistory(history);
        return history;
      } catch (err) {
        console.error("Erro ao carregar histórico de feedback:", err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [user?.id]
  );

  // Adicionar feedback ao histórico
  const addFeedback = useCallback(
    async (
      content: string,
      context?: FeedbackContext,
      basedOn?: Record<string, any>,
      confidence?: number
    ): Promise<{ success: boolean; error?: string; feedback?: FeedbackHistory }> => {
      if (!user?.id) {
        return { success: false, error: "Usuário não autenticado" };
      }

      if (!content.trim()) {
        return { success: false, error: "Conteúdo não pode estar vazio" };
      }

      try {
        setLoading(true);

        const { data, error: insertError } = await supabase
          .from("feedback_history")
          .insert({
            user_id: user.id,
            context: context || null,
            content: content.trim(),
            based_on: basedOn || null,
            confidence: confidence || null,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) {
          return { success: false, error: insertError.message };
        }

        await loadFeedbackHistory();
        return { success: true, feedback: data };
      } catch (err) {
        return {
          success: false,
          error: (err as Error).message,
        };
      } finally {
        setLoading(false);
      }
    },
    [user?.id, loadFeedbackHistory]
  );

  // Comparar dois feedbacks (útil para ver evolução)
  const compareFeedbacks = useCallback(
    (feedback1: FeedbackHistory, feedback2: FeedbackHistory): {
      similarities: string[];
      differences: string[];
    } => {
      // Implementação simples - pode ser melhorada
      const similarities: string[] = [];
      const differences: string[] = [];

      // Comparar context
      if (feedback1.context === feedback2.context) {
        similarities.push(`Mesmo contexto: ${feedback1.context}`);
      } else {
        differences.push(
          `Contexto mudou de "${feedback1.context}" para "${feedback2.context}"`
        );
      }

      // Comparar confidence
      if (feedback1.confidence && feedback2.confidence) {
        const diff = Math.abs(feedback1.confidence - feedback2.confidence);
        if (diff < 0.1) {
          similarities.push("Confiança similar");
        } else {
          differences.push(
            `Confiança mudou de ${(feedback1.confidence * 100).toFixed(0)}% para ${(feedback2.confidence * 100).toFixed(0)}%`
          );
        }
      }

      return { similarities, differences };
    },
    []
  );

  useEffect(() => {
    if (user) {
      loadFeedbackHistory();
    }
  }, [user?.id, loadFeedbackHistory]);

  return {
    feedbackHistory,
    loading,
    loadFeedbackHistory,
    addFeedback,
    compareFeedbacks,
    refresh: loadFeedbackHistory,
  };
}

