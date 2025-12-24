/**
 * Calcula sinais objetivos para eixos de identidade
 * 
 * Converte activities em sinais mensuráveis (activity_count, streak, etc.)
 */

import { Activity } from '../types/activity';
import { AxisSignal, SignalType, SignalPeriod } from '../types/identity_axes';
import { detectAxesForActivity } from './axis_map';

interface SignalCalculation {
  signal_type: SignalType;
  value: number;
  period: SignalPeriod;
  metadata: Record<string, any>;
}

/**
 * Calcula todos os sinais para um eixo em um período
 */
export function calculateAxisSignals(
  activities: Activity[],
  axisKey: string,
  period: SignalPeriod = '30d'
): SignalCalculation[] {
  // Filtrar atividades do eixo
  const axisActivities = activities.filter(activity => {
    const axes = detectAxesForActivity({
      type: activity.type,
      subtype: activity.subtype || null,
      tags: activity.tags || null,
      text: activity.text || null,
      metadata: activity.metadata || null,
    });
    return axes.includes(axisKey);
  });

  // Filtrar por período
  const filteredActivities = filterByPeriod(axisActivities, period);

  const signals: SignalCalculation[] = [];

  // 1. Activity Count
  signals.push({
    signal_type: 'activity_count',
    value: filteredActivities.length,
    period,
    metadata: {
      total_activities: filteredActivities.length,
      by_type: countByType(filteredActivities),
    },
  });

  // 2. Streak (dias consecutivos)
  const streak = calculateStreak(filteredActivities);
  signals.push({
    signal_type: 'streak',
    value: streak.days,
    period,
    metadata: {
      current_streak: streak.days,
      longest_streak: streak.longest,
      streak_start: streak.start,
      streak_end: streak.end,
    },
  });

  // 3. Diary Mentions (se aplicável)
  const diaryMentions = countDiaryMentions(filteredActivities);
  if (diaryMentions > 0) {
    signals.push({
      signal_type: 'diary_mentions',
      value: diaryMentions,
      period,
      metadata: {
        mentions: diaryMentions,
      },
    });
  }

  // 4. Time Span (dias entre primeira e última atividade)
  const timeSpan = calculateTimeSpan(filteredActivities);
  if (timeSpan > 0) {
    signals.push({
      signal_type: 'time_span',
      value: timeSpan,
      period,
      metadata: {
        days: timeSpan,
        first_activity: filteredActivities[0]?.timestamp,
        last_activity: filteredActivities[filteredActivities.length - 1]?.timestamp,
      },
    });
  }

  // 5. Frequency (frequência relativa no período)
  const frequency = calculateFrequency(filteredActivities, period);
  signals.push({
    signal_type: 'frequency',
    value: frequency,
    period,
    metadata: {
      frequency: frequency,
      days_with_activity: countUniqueDays(filteredActivities),
      total_days_in_period: getPeriodDays(period),
    },
  });

  return signals;
}

/**
 * Filtra atividades por período
 */
function filterByPeriod(activities: Activity[], period: SignalPeriod): Activity[] {
  if (period === 'all') {
    return activities;
  }

  const now = new Date();
  let cutoffDate: Date;

  switch (period) {
    case '7d':
      cutoffDate = new Date(now);
      cutoffDate.setDate(cutoffDate.getDate() - 7);
      break;
    case '30d':
      cutoffDate = new Date(now);
      cutoffDate.setDate(cutoffDate.getDate() - 30);
      break;
    case '90d':
      cutoffDate = new Date(now);
      cutoffDate.setDate(cutoffDate.getDate() - 90);
      break;
    case 'year':
      cutoffDate = new Date(now);
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
      break;
    default:
      return activities;
  }

  return activities.filter(activity => {
    const activityDate = new Date(activity.timestamp);
    return activityDate >= cutoffDate;
  });
}

/**
 * Calcula streak (dias consecutivos)
 */
function calculateStreak(activities: Activity[]): {
  days: number;
  longest: number;
  start: string | null;
  end: string | null;
} {
  if (activities.length === 0) {
    return { days: 0, longest: 0, start: null, end: null };
  }

  // Agrupar por dia
  const days = new Set<string>();
  activities.forEach(activity => {
    const date = new Date(activity.timestamp);
    const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    days.add(dayKey);
  });

  const sortedDays = Array.from(days).sort();
  if (sortedDays.length === 0) {
    return { days: 0, longest: 0, start: null, end: null };
  }

  // Calcular streak atual (do último dia para trás)
  let currentStreak = 1;
  let longestStreak = 1;
  let streakStart = sortedDays[sortedDays.length - 1];
  let streakEnd = sortedDays[sortedDays.length - 1];

  for (let i = sortedDays.length - 2; i >= 0; i--) {
    const current = new Date(sortedDays[i + 1]);
    const previous = new Date(sortedDays[i]);
    const diffDays = (current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      currentStreak++;
      streakStart = sortedDays[i];
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return {
    days: currentStreak,
    longest: longestStreak,
    start: streakStart,
    end: streakEnd,
  };
}

/**
 * Conta menções no diário
 */
function countDiaryMentions(activities: Activity[]): number {
  return activities.filter(a => a.type === 'journal' && a.text).length;
}

/**
 * Calcula time span (dias entre primeira e última)
 */
function calculateTimeSpan(activities: Activity[]): number {
  if (activities.length < 2) {
    return 0;
  }

  const sorted = [...activities].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const first = new Date(sorted[0].timestamp);
  const last = new Date(sorted[sorted.length - 1].timestamp);
  const diffTime = last.getTime() - first.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Calcula frequência (0-1)
 */
function calculateFrequency(activities: Activity[], period: SignalPeriod): number {
  const uniqueDays = countUniqueDays(activities);
  const totalDays = getPeriodDays(period);
  return Math.min(uniqueDays / totalDays, 1);
}

/**
 * Conta dias únicos com atividade
 */
function countUniqueDays(activities: Activity[]): number {
  const days = new Set<string>();
  activities.forEach(activity => {
    const date = new Date(activity.timestamp);
    const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    days.add(dayKey);
  });
  return days.size;
}

/**
 * Obtém número de dias no período
 */
function getPeriodDays(period: SignalPeriod): number {
  switch (period) {
    case '7d':
      return 7;
    case '30d':
      return 30;
    case '90d':
      return 90;
    case 'year':
      return 365;
    case 'all':
      return 1000; // Aproximação
    default:
      return 30;
  }
}

/**
 * Conta atividades por tipo
 */
function countByType(activities: Activity[]): Record<string, number> {
  const counts: Record<string, number> = {};
  activities.forEach(activity => {
    counts[activity.type] = (counts[activity.type] || 0) + 1;
  });
  return counts;
}

