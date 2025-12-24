/**
 * Calcula e atualiza identity_axes baseado em sinais
 * 
 * Converte axis_signals em identity_axes com status e relevance_score
 */

import { IdentityAxis, AxisStatus } from '../types/identity_axes';
import { AxisSignalsAggregate } from '../types/identity_axes';

/**
 * Calcula relevance_score e status de um eixo baseado em sinais
 */
export function calculateAxisRelevance(
  signals: AxisSignalsAggregate,
  previousAxis?: IdentityAxis
): {
  relevance_score: number;
  status: AxisStatus;
  first_detected_at: string | null;
  last_active_at: string;
} {
  // Calcular relevance_score (0-1)
  // Fórmula: combinação de frequência, consistência e integração
  const frequency = signals.frequency; // 0-1
  const consistency = Math.min(signals.activity_count / 30, 1); // Normalizado
  const integration = signals.diary_mentions > 0 ? 0.2 : 0; // Bonus por integração

  const relevance_score = Math.min(
    0.5 * frequency + 0.3 * consistency + 0.2 * (signals.streak / 30) + integration,
    1.0
  );

  // Determinar status
  let status: AxisStatus = 'latent';

  if (relevance_score >= 0.7) {
    status = 'central';
  } else if (relevance_score >= 0.4) {
    status = 'emerging';
  } else if (relevance_score >= 0.2) {
    status = previousAxis?.status === 'central' || previousAxis?.status === 'emerging'
      ? 'fading'
      : 'latent';
  } else {
    status = 'latent';
  }

  // Determinar first_detected_at e last_active_at
  const first_detected_at = previousAxis?.first_detected_at || new Date().toISOString();
  const last_active_at = new Date().toISOString();

  return {
    relevance_score,
    status,
    first_detected_at: previousAxis?.first_detected_at || first_detected_at,
    last_active_at,
  };
}

/**
 * Agrega sinais em formato para cálculo de relevance
 */
export function aggregateSignals(signals: Array<{
  signal_type: string;
  value: number;
  period: string;
}>): AxisSignalsAggregate {
  const aggregate: AxisSignalsAggregate = {
    axis_key: '', // Será preenchido externamente
    activity_count: 0,
    streak: 0,
    diary_mentions: 0,
    time_span_days: 0,
    frequency: 0,
    last_calculated: new Date().toISOString(),
  };

  signals.forEach(signal => {
    switch (signal.signal_type) {
      case 'activity_count':
        aggregate.activity_count = signal.value;
        break;
      case 'streak':
        aggregate.streak = signal.value;
        break;
      case 'diary_mentions':
        aggregate.diary_mentions = signal.value;
        break;
      case 'time_span':
        aggregate.time_span_days = signal.value;
        break;
      case 'frequency':
        aggregate.frequency = signal.value;
        break;
    }
  });

  return aggregate;
}

