/**
 * Engine de cálculo financeiro - Funções puras
 * Extraídas de useExpenses para facilitar testes e reutilização
 */

export interface SavedValue {
  value: number;
  dateKey: string;
}

/**
 * Calcula saldo incremental baseado em valor base e totais diários
 */
export function calculateIncrementalBalance(
  baseValue: number,
  dailyTotals: number[]
): number {
  return dailyTotals.reduce((acc, total) => acc + total, baseValue);
}

/**
 * Busca último valor salvo antes de uma data específica
 * Simulação da lógica de getLastSavedAccountMoney
 */
export function findLastSavedValue(
  dateKeys: string[],
  savedValues: Record<string, number>
): SavedValue | null {
  // Busca do mais recente para o mais antigo
  for (let i = dateKeys.length - 1; i >= 0; i--) {
    const key = dateKeys[i];
    if (savedValues[key] !== undefined && savedValues[key] !== null) {
      return { value: savedValues[key], dateKey: key };
    }
  }
  return null;
}

/**
 * Calcula limite restante baseado em limite mensal e gastos acumulados
 */
export function calculateRemainingLimit(
  monthlyLimit: number,
  accumulatedExpenses: number
): number {
  return Math.max(0, monthlyLimit - accumulatedExpenses);
}

/**
 * Calcula gastos acumulados (apenas valores negativos) em um período
 */
export function calculateAccumulatedExpenses(
  dailyTotals: number[]
): number {
  return dailyTotals
    .filter(total => total < 0)
    .reduce((acc, total) => acc + Math.abs(total), 0);
}

/**
 * Valida se um valor financeiro é válido
 */
export function isValidFinancialValue(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Formata valor monetário para exibição
 */
export function formatCurrency(value: number, locale = 'pt-BR', currency = 'BRL'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(value);
}

