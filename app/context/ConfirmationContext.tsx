"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useLanguage } from "./LanguageContext";

interface ConfirmationData {
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

interface ConfirmationContextType {
  showConfirmation: (data: ConfirmationData) => void;
  hideConfirmation: () => void;
  confirmation: ConfirmationData | null;
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

export function ConfirmationProvider({ children }: { children: ReactNode }) {
  const [confirmation, setConfirmation] = useState<ConfirmationData | null>(null);

  const showConfirmation = useCallback((data: ConfirmationData) => {
    setConfirmation(data);
  }, []);

  const hideConfirmation = useCallback(() => {
    setConfirmation(null);
  }, []);

  return (
    <ConfirmationContext.Provider value={{ showConfirmation, hideConfirmation, confirmation }}>
      {children}
      {confirmation && (
        <ConfirmationDialog
          message={confirmation.message}
          onConfirm={() => {
            confirmation.onConfirm();
            hideConfirmation();
          }}
          onCancel={() => {
            if (confirmation.onCancel) {
              confirmation.onCancel();
            }
            hideConfirmation();
          }}
        />
      )}
    </ConfirmationContext.Provider>
  );
}

function ConfirmationDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div 
      className="fixed inset-0 bg-black/20 flex items-center justify-center z-[100]"
      onClick={onCancel}
    >
      <div 
        className="bg-white p-6 max-w-md w-full mx-4"
        style={{
          borderRadius: '6px',
          border: '1px solid #e5e5e5',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-pixel-bold mb-4" style={{ color: '#333', fontSize: '18px' }}>
          {t('common.confirmAction')}
        </h2>
        
        <div className="mb-6">
          <p className="font-pixel whitespace-pre-line" style={{ color: '#666', fontSize: '14px', lineHeight: '1.6' }}>
            {message}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 font-pixel transition-all hover:opacity-80"
            style={{
              backgroundColor: '#f5f5f5',
              border: '1px solid #e5e5e5',
              color: '#666',
              fontSize: '14px',
              borderRadius: '4px',
            }}
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 font-pixel-bold transition-all hover:opacity-90"
            style={{
              backgroundColor: '#f44336',
              border: '1px solid #f44336',
              color: '#FFFFFF',
              fontSize: '14px',
              borderRadius: '4px',
            }}
          >
            {t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useConfirmation() {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error("useConfirmation must be used within ConfirmationProvider");
  }
  return context;
}

