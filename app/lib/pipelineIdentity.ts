/**
 * Pipeline Completo: Activities → Signals → Axes → Achievements → Snapshots → Feedback
 * 
 * Esta função orquestra todo o processo de cálculo de identidade observada
 */

import { Activity } from "../types/activity";
import { ObservedWindow } from "../types/identity";
import { calculateAxisSignals } from "./calculateAxisSignals";
import { calculateObservedIdentity } from "./calculateObservedIdentity";
import { calculateAxisRelevance, aggregateSignals } from "./calculateIdentityAxes";
import { evaluateAchievement } from "./evaluateAchievements";
import { getAxisLabel } from "./axis_map";
import type { IdentityAxis, AxisStatus, SignalPeriod } from "../types/identity_axes";
import type { AxisSignalsAggregate } from "../types/identity_axes";

/**
 * Converte ObservedWindow para SignalPeriod
 */
function windowToPeriod(window: ObservedWindow): SignalPeriod {
  const mapping: Record<ObservedWindow, SignalPeriod> = {
    '30d': '30d',
    '90d': '90d',
    '365d': 'year',
    'all': 'all',
  };
  return mapping[window];
}

interface PipelineResult {
  signals: Record<string, any[]>;
  axes: IdentityAxis[];
  achievements: Array<{
    achievement_id: string;
    progress: number;
    completed: boolean;
  }>;
}

/**
 * Executa o pipeline completo para um usuário
 */
export async function runIdentityPipeline(
  activities: Activity[],
  window: ObservedWindow = "90d",
  userId: string
): Promise<PipelineResult> {
  // 1. Calcular eixos observados (usando função existente)
  const observedAxesData = calculateObservedIdentity(activities, window);

  // 2. Para cada eixo, calcular sinais e criar identity_axis
  const allSignals: Record<string, any[]> = {};
  const identityAxes: IdentityAxis[] = [];

  for (const axisData of observedAxesData) {
    // Calcular sinais para este eixo (converter window para period)
    const period = windowToPeriod(window);
    const signals = calculateAxisSignals(activities, axisData.axis, period);
    allSignals[axisData.axis] = signals;

    // 3. Agregar sinais e calcular relevance
    const aggregated = aggregateSignals(signals);
    aggregated.axis_key = axisData.axis;

    const relevance = calculateAxisRelevance(aggregated);

    // 4. Criar identity_axis
    const identityAxis: IdentityAxis = {
      id: "", // Será gerado pelo banco
      user_id: userId,
      axis_key: axisData.axis,
      label: axisData.label,
      description: null,
      status: relevance.status,
      relevance_score: relevance.relevance_score,
      first_detected_at: relevance.first_detected_at,
      last_active_at: relevance.last_active_at,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    identityAxes.push(identityAxis);
  }

  // 5. Avaliar conquistas (será feito pelo hook useAchievements.evaluateAchievements)
  // Por enquanto, retornamos estrutura vazia
  const achievements: Array<{
    achievement_id: string;
    progress: number;
    completed: boolean;
  }> = [];

  return {
    signals: allSignals,
    axes: identityAxes,
    achievements,
  };
}

/**
 * Gera texto de feedback baseado em eixos e sinais
 */
export function generateFeedbackText(
  axes: IdentityAxis[],
  signals: Record<string, any[]>
): string {
  const centralAxes = axes.filter((a) => a.status === "central");

  if (centralAxes.length === 0) {
    return "Continue registrando atividades para ver seus eixos centrais emergirem.";
  }

  const parts: string[] = [];

  // Adicionar resumo dos eixos centrais
  if (centralAxes.length === 1) {
    parts.push(
      `${centralAxes[0].label} é seu eixo mais consistente neste período.`
    );
  } else {
    const labels = centralAxes.map((a) => a.label).join(", ");
    parts.push(`Seus eixos centrais são: ${labels}.`);
  }

  // Adicionar detalhes de sinais
  centralAxes.forEach((axis) => {
    const axisSignals = signals[axis.axis_key] || [];
    const activityCount = axisSignals.find((s) => s.signal_type === "activity_count");

    if (activityCount) {
      parts.push(
        `${axis.label} aparece em ${activityCount.value} atividades registradas.`
      );
    }
  });

  return parts.join(" ");
}

