'use client';

import { useState, useCallback } from 'react';
import { useToastContext } from '../context/ToastContext';

export interface UseGeminiOptions {
  onSuccess?: (response: any) => void;
  onError?: (error: Error) => void;
}

export function useGemini() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { showToast } = useToastContext();

  /**
   * Chamada simples ao Gemini
   */
  const askGemini = useCallback(
    async (prompt: string, config?: any) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'simple',
            prompt,
            config,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro ao chamar Gemini');
        }

        const data = await response.json();
        return data.data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erro desconhecido');
        setError(error);
        showToast('Erro ao chamar Gemini: ' + error.message, 'error');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  /**
   * Deep Research - Pesquisa profunda
   */
  const doDeepResearch = useCallback(
    async (topic: string, config?: any) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'deep-research',
            topic,
            config,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro no Deep Research');
        }

        const data = await response.json();
        return data.data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erro desconhecido');
        setError(error);
        showToast('Erro no Deep Research: ' + error.message, 'error');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  /**
   * Análise de dados financeiros
   */
  const analyzeFinance = useCallback(
    async (dataSummary: string, question: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'analyze-financial',
            dataSummary,
            question,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro na análise financeira');
        }

        const data = await response.json();
        return data.data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erro desconhecido');
        setError(error);
        showToast('Erro na análise: ' + error.message, 'error');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  /**
   * Insights sobre hábitos
   */
  const getHabitInsights = useCallback(
    async (habitsData: string, streakData: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'habit-insights',
            habitsData,
            streakData,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro ao gerar insights');
        }

        const data = await response.json();
        return data.data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erro desconhecido');
        setError(error);
        showToast('Erro ao gerar insights: ' + error.message, 'error');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  /**
   * Assistente de escrita para diário
   */
  const getJournalAssistant = useCallback(
    async (mood: string, quickNotes: string[], previousEntries?: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'journal-assistant',
            mood,
            quickNotes,
            previousEntries,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro no assistente de diário');
        }

        const data = await response.json();
        return data.data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erro desconhecido');
        setError(error);
        showToast('Erro no assistente: ' + error.message, 'error');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  return {
    loading,
    error,
    askGemini,
    doDeepResearch,
    analyzeFinance,
    getHabitInsights,
    getJournalAssistant,
  };
}

