/**
 * Constantes compartilhadas da aplicação
 */

// Prefixos para localStorage
export const STORAGE_PREFIX = "pixel-life";
export const STORAGE_VERSION = "v1";

// Keys do localStorage
export const STORAGE_KEYS = {
  COSMETICS: `${STORAGE_PREFIX}-cosmetics-${STORAGE_VERSION}`,
  HABITS: `${STORAGE_PREFIX}-habits-${STORAGE_VERSION}`,
  JOURNAL: `${STORAGE_PREFIX}-journal-${STORAGE_VERSION}`,
  EXPENSES: `${STORAGE_PREFIX}-expenses-${STORAGE_VERSION}`,
  POSSESSIONS: `${STORAGE_PREFIX}-possessions-${STORAGE_VERSION}`,
  TREE_LEISURE: `${STORAGE_PREFIX}-tree-leisure-${STORAGE_VERSION}`,
  TREE_PERSONAL: `${STORAGE_PREFIX}-tree-personal-${STORAGE_VERSION}`,
  MENU_STATE: "pixel-menu-open",
} as const;

// Cores semânticas
export const COLORS = {
  SUCCESS: "bg-green-400",
  WARNING: "bg-yellow-400",
  ERROR: "bg-red-400",
  INFO: "bg-blue-400",
  NEUTRAL: "bg-gray-400",
  PRIMARY: "bg-blue-300",
} as const;

// Tamanhos de borda
export const BORDER_SIZES = {
  THICK: "border-4",
  MEDIUM: "border-2",
  THIN: "border",
} as const;

// Limites de validação
export const VALIDATION_LIMITS = {
  MAX_TEXT_LENGTH: 10000,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_QUICK_NOTE_LENGTH: 200,
  MAX_EXPENSE_VALUE: 999999999,
  MIN_EXPENSE_VALUE: -999999999,
  MAX_TARGET_VALUE: 999999999,
} as const;

// Intervalos de atualização (em ms)
export const UPDATE_INTERVALS = {
  EXPENSES_POLLING: 5000, // 5 segundos ao invés de 1 segundo
  DEBOUNCE_SAVE: 1000,
  DEBOUNCE_SEARCH: 300,
} as const;

// Configurações de data
export const DATE_FORMATS = {
  DISPLAY: "pt-BR",
  STORAGE: "YYYY-MM-DD",
} as const;
























