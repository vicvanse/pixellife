/**
 * Funções de validação de dados
 */

import { VALIDATION_LIMITS } from "./constants";

/**
 * Valida o comprimento de um texto
 */
export function validateTextLength(text: string, maxLength: number = VALIDATION_LIMITS.MAX_TEXT_LENGTH): boolean {
  return text.length <= maxLength;
}

/**
 * Valida um valor numérico de despesa
 */
export function validateExpenseValue(value: number): boolean {
  return (
    !isNaN(value) &&
    value >= VALIDATION_LIMITS.MIN_EXPENSE_VALUE &&
    value <= VALIDATION_LIMITS.MAX_EXPENSE_VALUE
  );
}

/**
 * Valida um valor alvo de objetivo
 */
export function validateTargetValue(value: number): boolean {
  return (
    !isNaN(value) &&
    value > 0 &&
    value <= VALIDATION_LIMITS.MAX_TARGET_VALUE
  );
}

/**
 * Valida uma descrição
 */
export function validateDescription(description: string): boolean {
  return (
    description.trim().length > 0 &&
    description.length <= VALIDATION_LIMITS.MAX_DESCRIPTION_LENGTH
  );
}

/**
 * Valida uma nota rápida
 */
export function validateQuickNote(text: string): boolean {
  return (
    text.trim().length > 0 &&
    text.length <= VALIDATION_LIMITS.MAX_QUICK_NOTE_LENGTH
  );
}

/**
 * Sanitiza um texto removendo caracteres perigosos
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/[<>]/g, "") // Remove < e >
    .trim();
}

/**
 * Valida uma data no formato YYYY-MM-DD
 */
export function validateDateString(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  
  const date = new Date(dateStr + "T00:00:00");
  return date instanceof Date && !isNaN(date.getTime());
}





