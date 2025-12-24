'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

interface FinanceBoxProps {
  label: string;
  value: number;
  color?: string;
  hidden?: boolean;
  onToggleVisibility?: () => void;
}

export function FinanceBox({ label, value, color = '#111', hidden = false, onToggleVisibility }: FinanceBoxProps) {
  return (
    <div
      className="p-3 relative mobile-finance-slot"
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #e8e8e2',
        borderRadius: '8px',
      }}
    >
      <div className="flex justify-between items-center">
        <span className="font-pixel" style={{ color: '#666', fontSize: '16px' }}>
          {label}
        </span>
        <div className="flex items-center gap-2" style={{ flex: 1, justifyContent: 'flex-end', minWidth: 0 }}>
          <span 
            className="font-pixel-bold" 
            style={{ 
              color, 
              fontSize: '14px',
              wordBreak: 'break-word',
              textAlign: 'right',
              minWidth: 0,
              maxWidth: '100%',
              display: 'block',
            }}
          >
            {hidden ? (
              <span style={{ letterSpacing: '4px', userSelect: 'none' }}>••••••</span>
            ) : (
              new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(value)
            )}
          </span>
          {onToggleVisibility && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleVisibility();
              }}
              className="transition-all hover:opacity-70 touch-manipulation flex-shrink-0"
              style={{
                color: '#999',
                cursor: 'pointer',
                backgroundColor: 'transparent',
                border: 'none',
                minWidth: '24px',
                minHeight: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                marginLeft: '4px',
              }}
              title={hidden ? 'Mostrar valor' : 'Ocultar valor'}
              aria-label={hidden ? 'Mostrar valor' : 'Ocultar valor'}
            >
              <FontAwesomeIcon 
                icon={hidden ? faEyeSlash : faEye} 
                style={{ width: '16px', height: '16px', fontSize: '16px' }}
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

