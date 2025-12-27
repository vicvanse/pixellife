"use client";

import { useState, useEffect, useCallback } from "react";

export type CommitmentType = "recurring" | "installment";
export type PaymentMethod = "credit" | "debit" | "pix" | "cash";
export type RecurrenceFrequency = "monthly" | "weekly" | "annual";

export interface FinancialCommitment {
  id: string;
  title: string;
  type: CommitmentType;
  value: number; // Valor da parcela (para parcelado) ou valor recorrente
  totalValue?: number; // Valor total (apenas para parcelado)
  category?: string;
  paymentMethod: PaymentMethod;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD (opcional, para recorrente)
  // Para recorrente
  frequency?: RecurrenceFrequency; // Apenas para recurring
  // Para parcelado
  totalInstallments?: number; // Apenas para installment
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "pixel-life-financial-commitments-v1";

export function useFinancialCommitments() {
  const [commitments, setCommitments] = useState<FinancialCommitment[]>([]);

  // Carregar do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setCommitments(parsed);
      }
    } catch (error) {
      console.error("Erro ao carregar compromissos financeiros:", error);
    }
  }, []);

  // Salvar no localStorage
  const saveCommitments = useCallback((newCommitments: FinancialCommitment[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newCommitments));
      setCommitments(newCommitments);
    } catch (error) {
      console.error("Erro ao salvar compromissos financeiros:", error);
    }
  }, []);

  // Adicionar compromisso
  const addCommitment = useCallback(
    (commitment: Omit<FinancialCommitment, "id" | "createdAt" | "updatedAt">) => {
      const now = new Date().toISOString();
      const newCommitment: FinancialCommitment = {
        ...commitment,
        id: `commitment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
        updatedAt: now,
      };
      const newCommitments = [...commitments, newCommitment];
      saveCommitments(newCommitments);
      return newCommitment;
    },
    [commitments, saveCommitments]
  );

  // Atualizar compromisso
  const updateCommitment = useCallback(
    (id: string, updates: Partial<Omit<FinancialCommitment, "id" | "createdAt">>) => {
      const newCommitments = commitments.map((commitment) =>
        commitment.id === id
          ? { ...commitment, ...updates, updatedAt: new Date().toISOString() }
          : commitment
      );
      saveCommitments(newCommitments);
    },
    [commitments, saveCommitments]
  );

  // Remover compromisso
  const removeCommitment = useCallback(
    (id: string) => {
      const newCommitments = commitments.filter((commitment) => commitment.id !== id);
      saveCommitments(newCommitments);
    },
    [commitments, saveCommitments]
  );

  // Obter compromissos ativos
  const getActiveCommitments = useCallback(() => {
    return commitments.filter((c) => c.active);
  }, [commitments]);

  // Obter compromissos para uma data específica
  const getCommitmentsForDate = useCallback(
    (dateKey: string) => {
      const date = new Date(dateKey + "T00:00:00");
      const activeCommitments = getActiveCommitments();
      const result: Array<{ commitment: FinancialCommitment; installment?: number }> = [];

      activeCommitments.forEach((commitment) => {
        const startDate = new Date(commitment.startDate + "T00:00:00");
        if (date < startDate) return;

        // Verificar data de fim (se houver)
        if (commitment.endDate) {
          const endDate = new Date(commitment.endDate + "T00:00:00");
          if (date > endDate) return;
        }

        if (commitment.type === "recurring") {
          // Verificar se a data corresponde à frequência
          if (commitment.frequency === "monthly") {
            // Mensal: mesmo dia do mês
            if (date.getDate() === startDate.getDate()) {
              result.push({ commitment });
            }
          } else if (commitment.frequency === "weekly") {
            // Semanal: mesmo dia da semana
            if (date.getDay() === startDate.getDay()) {
              result.push({ commitment });
            }
          } else if (commitment.frequency === "annual") {
            // Anual: mesmo dia e mês
            if (
              date.getMonth() === startDate.getMonth() &&
              date.getDate() === startDate.getDate()
            ) {
              result.push({ commitment });
            }
          }
        } else if (commitment.type === "installment") {
          // Parcelado: calcular qual parcela corresponde a esta data
          if (commitment.totalInstallments) {
            const monthsDiff =
              (date.getFullYear() - startDate.getFullYear()) * 12 +
              (date.getMonth() - startDate.getMonth());
            
            if (monthsDiff >= 0 && monthsDiff < commitment.totalInstallments) {
              // Verificar se é o mesmo dia do mês (parcelas geralmente são no mesmo dia)
              if (date.getDate() === startDate.getDate()) {
                result.push({
                  commitment,
                  installment: monthsDiff + 1, // Parcela atual (1-indexed)
                });
              }
            }
          }
        }
      });

      return result;
    },
    [getActiveCommitments]
  );

  return {
    commitments,
    addCommitment,
    updateCommitment,
    removeCommitment,
    getActiveCommitments,
    getCommitmentsForDate,
  };
}


