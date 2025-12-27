/**
 * Utilitários para garantir touch targets de 48px (WCAG/Apple guidelines)
 * Use estas classes ou estilos em componentes interativos mobile
 */

export const touchTargetStyles = {
  minSize: {
    minWidth: '48px',
    minHeight: '48px',
  },
  // Para botões pequenos visualmente mas com área clicável grande
  smallButton: {
    minWidth: '48px',
    minHeight: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px',
  },
} as const;

/**
 * Classes Tailwind para touch targets
 */
export const touchTargetClasses = {
  base: 'touch-manipulation min-h-[48px]',
  small: 'touch-manipulation min-h-[48px] min-w-[48px] flex items-center justify-center',
  full: 'touch-manipulation min-h-[48px] w-full',
} as const;

