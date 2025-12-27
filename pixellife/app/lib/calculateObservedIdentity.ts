/**
 * Pipeline de cálculo de Identidade Observada
 * 
 * Calcula eixos centrais baseado em:
 * - Frequência (quantos dias apareceu)
 * - Persistência (quantos meses diferentes)
 * - Integração (quantos tipos diferentes apontam pro mesmo eixo)
 */

import { Activity } from '../types/activity';
import { ObservedWindow, ObservedAxis } from '../types/identity';
import { detectAxesForActivity, getAxisLabel, meetsMinimumSignals } from './axis_map';

interface AxisSignals {
  habit_days: number;
  journal_mentions: number;
  finance_related: number;
  biography_events: number;
  months_active: Set<string>; // Set de "YYYY-MM"
  first_seen: string;
  last_seen: string;
}

/**
 * Calcula identidade observada para uma janela temporal
 */
export function calculateObservedIdentity(
  activities: Activity[],
  window: ObservedWindow
): ObservedAxis[] {
  // 1. Filtrar atividades pela janela temporal
  const filteredActivities = filterByWindow(activities, window);

  // 2. Agrupar sinais por eixo
  const axisSignals = new Map<string, AxisSignals>();

  filteredActivities.forEach(activity => {
    // Detectar quais eixos esta atividade pertence
    const axes = detectAxesForActivity({
      type: activity.type,
      subtype: activity.subtype || null,
      tags: activity.tags || null,
      text: activity.text || null,
      metadata: activity.metadata || null,
    });

    axes.forEach(axis => {
      if (!axisSignals.has(axis)) {
        axisSignals.set(axis, {
          habit_days: 0,
          journal_mentions: 0,
          finance_related: 0,
          biography_events: 0,
          months_active: new Set(),
          first_seen: activity.timestamp,
          last_seen: activity.timestamp,
        });
      }

      const signals = axisSignals.get(axis)!;
      const activityDate = new Date(activity.timestamp);
      const monthKey = `${activityDate.getFullYear()}-${String(activityDate.getMonth() + 1).padStart(2, '0')}`;

      // Contar por tipo
      if (activity.type === 'habit') {
        signals.habit_days++;
      } else if (activity.type === 'journal') {
        signals.journal_mentions++;
      } else if (activity.type === 'finance') {
        signals.finance_related++;
      } else if (activity.type === 'biography') {
        signals.biography_events++;
      }

      // Adicionar mês ativo
      signals.months_active.add(monthKey);

      // Atualizar first_seen e last_seen
      if (activity.timestamp < signals.first_seen) {
        signals.first_seen = activity.timestamp;
      }
      if (activity.timestamp > signals.last_seen) {
        signals.last_seen = activity.timestamp;
      }
    });
  });

  // 3. Calcular scores e gerar eixos
  const axes: ObservedAxis[] = [];

  axisSignals.forEach((signals, axisId) => {
    // Verificar se atende aos sinais mínimos do eixo
    const evidence = {
      habit_days: signals.habit_days,
      journal_mentions: signals.journal_mentions,
      finance_related: signals.finance_related,
      biography_events: signals.biography_events,
      months_active: signals.months_active.size,
    };

    if (!meetsMinimumSignals(axisId, evidence)) {
      return; // Pular eixos que não atendem aos sinais mínimos
    }

    const score = calculateAxisScore(signals, window);
    const trend = calculateTrend(signals);

    // Só incluir eixos com score mínimo (ex: 0.3)
    if (score >= 0.3) {
      axes.push({
        axis: axisId,
        label: getAxisLabel(axisId),
        score,
        evidence,
        trend,
      });
    }
  });

  // 4. Ordenar por score (maior primeiro)
  return axes.sort((a, b) => b.score - a.score);
}

/**
 * Filtra atividades pela janela temporal
 */
function filterByWindow(activities: Activity[], window: ObservedWindow): Activity[] {
  const now = new Date();
  let cutoffDate: Date;

  switch (window) {
    case '30d':
      cutoffDate = new Date(now);
      cutoffDate.setDate(cutoffDate.getDate() - 30);
      break;
    case '90d':
      cutoffDate = new Date(now);
      cutoffDate.setDate(cutoffDate.getDate() - 90);
      break;
    case '365d':
      cutoffDate = new Date(now);
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
      break;
    case 'all':
      return activities; // Sem filtro
    default:
      return activities;
  }

  return activities.filter(activity => {
    const activityDate = new Date(activity.timestamp);
    return activityDate >= cutoffDate;
  });
}

/**
 * Calcula score do eixo (0-1)
 * 
 * Fórmula: 0.45*consistency + 0.35*recency + 0.20*cross_source
 */
function calculateAxisScore(signals: AxisSignals, window: ObservedWindow): number {
  // Consistency: quantos dias/meses apareceu (normalizado)
  const totalDays = getWindowDays(window);
  const consistency = Math.min(
    (signals.habit_days + signals.journal_mentions + signals.finance_related + signals.biography_events) / totalDays,
    1.0
  );

  // Recency: quão recente é a última aparição (normalizado)
  const now = new Date();
  const lastSeen = new Date(signals.last_seen);
  const daysSinceLastSeen = (now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60 * 24);
  const recency = Math.max(0, 1 - daysSinceLastSeen / 90); // Decai em 90 dias

  // Cross-source: quantos tipos diferentes apontam pro eixo (normalizado)
  const sources = [
    signals.habit_days > 0,
    signals.journal_mentions > 0,
    signals.finance_related > 0,
    signals.biography_events > 0,
  ].filter(Boolean).length;
  const crossSource = sources / 4; // Máximo 4 fontes

  // Score final
  const score = 0.45 * consistency + 0.35 * recency + 0.20 * crossSource;
  return Math.min(Math.max(score, 0), 1); // Clamp entre 0 e 1
}

/**
 * Calcula tendência do eixo
 */
function calculateTrend(signals: AxisSignals): 'up' | 'stable' | 'down' {
  // Simplificado: comparar primeira metade vs segunda metade dos meses
  const months = Array.from(signals.months_active).sort();
  if (months.length < 2) {
    return 'stable';
  }

  const midpoint = Math.floor(months.length / 2);
  const firstHalf = months.slice(0, midpoint);
  const secondHalf = months.slice(midpoint);

  // Contar atividades por metade (aproximado)
  // Por simplicidade, assumimos distribuição uniforme
  const firstHalfCount = firstHalf.length;
  const secondHalfCount = secondHalf.length;

  if (secondHalfCount > firstHalfCount * 1.2) {
    return 'up';
  } else if (secondHalfCount < firstHalfCount * 0.8) {
    return 'down';
  } else {
    return 'stable';
  }
}

/**
 * Obtém número de dias na janela
 */
function getWindowDays(window: ObservedWindow): number {
  switch (window) {
    case '30d':
      return 30;
    case '90d':
      return 90;
    case '365d':
      return 365;
    case 'all':
      return 1000; // Aproximação para "all time"
    default:
      return 90;
  }
}

