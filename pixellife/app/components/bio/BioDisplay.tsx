"use client";

import { useState, useRef } from "react";
import { useBio } from "../../hooks/useBio";
import { useLanguage } from "../../context/LanguageContext";
import { BioEditor, BioEditorRef } from "./BioEditor";

interface BioDisplayProps {
  showEditButton?: boolean;
  isEditing?: boolean; // Controlado externamente
  onEditingChange?: (editing: boolean) => void; // Callback quando muda modo de edição
  hideButtons?: boolean; // Quando true, não mostra botões próprios
}

export function BioDisplay({ 
  showEditButton = true, 
  isEditing: externalIsEditing, 
  onEditingChange,
  hideButtons = false 
}: BioDisplayProps) {
  const { t } = useLanguage();
  const { currentBio, loading } = useBio();
  const [internalIsEditing, setInternalIsEditing] = useState(false);
  const bioEditorRef = useRef<BioEditorRef>(null);

  // Usar estado externo se fornecido, senão usar interno
  const isEditing = externalIsEditing !== undefined ? externalIsEditing : internalIsEditing;
  const setIsEditing = onEditingChange || setInternalIsEditing;

  // Expor funções via window quando usado no DisplayMain (hack temporário)
  if (hideButtons && typeof window !== "undefined") {
    (window as any).__bioDisplaySave = async (): Promise<{ success: boolean; error?: string }> => {
      if (bioEditorRef.current) {
        return await bioEditorRef.current.saveBio();
      }
      return { success: false, error: "Editor não disponível" };
    };
    (window as any).__bioDisplayGetText = (): string => {
      if (bioEditorRef.current) {
        return bioEditorRef.current.getText();
      }
      return currentBio?.text || "";
    };
  }

  if (isEditing) {
    return (
      <div className="w-full max-w-md mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-pixel-bold" style={{ color: '#111', fontSize: '16px' }}>{t('display.bio')}</span>
        </div>
        <BioEditor
          ref={bioEditorRef}
          hideButtons={hideButtons}
          onSave={() => setIsEditing(false)}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full max-w-md mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-pixel-bold" style={{ color: '#111', fontSize: '16px' }}>{t('display.bio')}</span>
        </div>
        <p 
          className="font-pixel text-center" 
          style={{ 
            color: '#666', 
            fontSize: '16px', 
            lineHeight: '1.6',
          }}
        >
          Carregando...
        </p>
      </div>
    );
  }

  if (!currentBio) {
    return (
      <div className="w-full max-w-md mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-pixel-bold" style={{ color: '#111', fontSize: '16px' }}>{t('display.bio')}</span>
          {showEditButton && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-2 py-1 font-pixel text-xs transition-colors hover:bg-gray-100"
              style={{
                border: '1px solid #e0e0e0',
                backgroundColor: '#FFFFFF',
                color: '#111',
                borderRadius: '4px',
              }}
            >
              {t('common.edit')}
            </button>
          )}
        </div>
        <p 
          className="font-pixel text-center" 
          style={{ 
            color: '#666', 
            fontSize: '16px', 
            lineHeight: '1.6',
          }}
        >
          {t('bio.noBioYet')}
        </p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  return (
    <div className="w-full max-w-md mb-4">
      <div className="flex items-center justify-between mb-3">
        <span className="font-pixel-bold" style={{ color: '#111', fontSize: '16px' }}>{t('display.bio')}</span>
        {showEditButton && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-2 py-1 font-pixel text-xs transition-colors hover:bg-gray-100"
            style={{
              border: '1px solid #e0e0e0',
              backgroundColor: '#FFFFFF',
              color: '#111',
              borderRadius: '4px',
            }}
          >
            {t('common.edit')}
          </button>
        )}
      </div>
      {!isEditing && (
        <p 
          className="font-pixel text-center" 
          style={{ 
            color: '#666', 
            fontSize: '16px', 
            lineHeight: '1.6',
          }}
        >
          {currentBio.text}
        </p>
      )}
    </div>
  );
}

