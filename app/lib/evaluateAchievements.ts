/**
 * Avalia progresso de conquistas baseado em sinais
 * 
 * Verifica se condições de achievements foram atendidas
 */

import { Achievement, AchievementCondition, UserAchievement } from '../types/identity_axes';
import { AxisSignalsAggregate } from '../types/identity_axes';

/**
 * Avalia se uma conquista foi completada
 */
export function evaluateAchievement(
  achievement: Achievement,
  signals: AxisSignalsAggregate[]
): {
  progress: number;
  completed: boolean;
} {
  const condition = achievement.condition;
  const axisSignals = signals.find(s => s.axis_key === condition.axis_key || !condition.axis_key);

  if (!axisSignals) {
    return { progress: 0, completed: false };
  }

  let currentValue = 0;

  // Obter valor atual baseado no tipo de sinal
  switch (condition.signal) {
    case 'activity_count':
      currentValue = axisSignals.activity_count;
      break;
    case 'streak':
      currentValue = axisSignals.streak;
      break;
    case 'diary_mentions':
      currentValue = axisSignals.diary_mentions;
      break;
    case 'time_span':
      currentValue = axisSignals.time_span_days;
      break;
    case 'frequency':
      currentValue = axisSignals.frequency * 100; // Converter para percentual
      break;
  }

  // Calcular progresso
  const progress = Math.min(currentValue / condition.threshold, 1);
  const completed = currentValue >= condition.threshold;

  return { progress, completed };
}

/**
 * Calcula progresso formatado para exibição
 */
export function formatAchievementProgress(
  achievement: Achievement,
  userAchievement: UserAchievement | null,
  signals: AxisSignalsAggregate[]
): {
  progressPercent: number;
  remaining?: string;
  canComplete: boolean;
} {
  const evaluation = evaluateAchievement(achievement, signals);
  const progressPercent = Math.round(evaluation.progress * 100);

  let remaining: string | undefined;
  let canComplete = false;

  if (!evaluation.completed) {
    const condition = achievement.condition;
    const axisSignals = signals.find(s => s.axis_key === condition.axis_key || !condition.axis_key);

    if (axisSignals) {
      let currentValue = 0;
      switch (condition.signal) {
        case 'activity_count':
          currentValue = axisSignals.activity_count;
          break;
        case 'streak':
          currentValue = axisSignals.streak;
          break;
        case 'diary_mentions':
          currentValue = axisSignals.diary_mentions;
          break;
        case 'time_span':
          currentValue = axisSignals.time_span_days;
          break;
        case 'frequency':
          currentValue = axisSignals.frequency * 100;
          break;
      }

      const diff = condition.threshold - currentValue;
      if (diff > 0 && diff <= 10) {
        // Só mostrar "faltam X" se estiver próximo
        canComplete = true;
        if (condition.signal === 'activity_count' || condition.signal === 'streak') {
          remaining = `faltam ${Math.ceil(diff)} ${condition.signal === 'streak' ? 'dias' : 'atividades'}`;
        } else if (condition.signal === 'diary_mentions') {
          remaining = `faltam ${Math.ceil(diff)} menções`;
        }
      }
    }
  }

  return {
    progressPercent,
    remaining,
    canComplete,
  };
}

