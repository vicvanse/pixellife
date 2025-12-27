"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";

interface QuickNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (text: string) => void;
  initialText?: string;
  isEdit?: boolean;
}

export function QuickNoteModal({ isOpen, onClose, onSave, initialText = "", isEdit = false }: QuickNoteModalProps) {
  const { t } = useLanguage();
  const [text, setText] = useState("");

  // Atualiza o texto quando o modal abre ou quando initialText muda
  useEffect(() => {
    if (isOpen) {
      setText(initialText);
    }
  }, [isOpen, initialText]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (text.trim()) {
      onSave(text.trim());
      setText("");
      onClose();
    }
  };

  const handleCancel = () => {
    setText("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 max-w-md w-full mx-4"
        style={{
          borderRadius: '10px',
          border: '1px solid #e0e0e0',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.12)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-pixel-bold" style={{ color: '#333', fontSize: '18px' }}>
            {isEdit ? t('common.editQuickThought') : t('common.writeQuickThought')}
          </h2>
          <button
            onClick={onClose}
            className="px-2 py-1 rounded font-pixel-bold transition-colors hover:bg-gray-100 touch-manipulation"
            style={{
              backgroundColor: '#f5f5f5',
              border: '1px solid #d4d4d4',
              color: '#555',
              fontSize: '14px',
              minWidth: '48px',
              minHeight: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
        
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full px-3 py-2 rounded font-pixel resize-none mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
          style={{
            fontSize: '16px',
            backgroundColor: '#fff',
            border: '1px solid #d6d6d6',
            minHeight: '100px',
          }}
          rows={4}
          placeholder="Digite seu pensamento..."
          autoFocus
        />

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 rounded font-pixel-bold transition-colors hover:opacity-90 touch-manipulation min-h-[48px]"
            style={{
              backgroundColor: '#7aff7a',
              border: '1px solid #0f9d58',
              color: '#111',
              fontSize: '14px',
            }}
          >
            Salvar
          </button>
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 rounded font-pixel-bold transition-colors hover:opacity-90 touch-manipulation min-h-[48px]"
            style={{
              backgroundColor: '#f5f5f5',
              border: '1px solid #d4d4d4',
              color: '#555',
              fontSize: '14px',
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}




