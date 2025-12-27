"use client";

import { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { useBio } from "../../hooks/useBio";
import { useLanguage } from "../../context/LanguageContext";

interface BioEditorProps {
  onSave?: () => void;
  onCancel?: () => void;
  hideButtons?: boolean; // Quando true, não mostra os botões (usado no DisplayMain)
  value?: string; // Valor controlado externamente
  onChange?: (text: string) => void; // Callback para quando o texto muda
}

export interface BioEditorRef {
  getText: () => string;
  saveBio: () => Promise<{ success: boolean; error?: string }>;
}

export const BioEditor = forwardRef<BioEditorRef, BioEditorProps>(
  ({ onSave, onCancel, hideButtons = false, value, onChange }, ref) => {
    const { t } = useLanguage();
    const { currentBio, saveBio: saveBioHook } = useBio();
    const [text, setText] = useState(value || currentBio?.text || "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Atualizar texto quando value ou currentBio mudarem
    useEffect(() => {
      if (value !== undefined) {
        setText(value);
      } else if (currentBio?.text) {
        setText(currentBio.text);
      }
    }, [value, currentBio?.text]);

    const handleTextChange = (newText: string) => {
      setText(newText);
      setError(null);
      onChange?.(newText);
    };

    const handleSave = async () => {
      if (!text.trim()) {
        setError("Bio não pode estar vazia");
        return;
      }

      setSaving(true);
      setError(null);

      const result = await saveBioHook(text);

      if (result.success) {
        setSaving(false);
        onSave?.();
      } else {
        setError(result.error || "Erro ao salvar bio");
        setSaving(false);
      }
    };

    // Expor funções via ref para uso externo
    useImperativeHandle(ref, () => ({
      getText: () => text,
      saveBio: async (): Promise<{ success: boolean; error?: string }> => {
        if (!text.trim()) {
          return { success: false, error: "Bio não pode estar vazia" };
        }

        setSaving(true);
        setError(null);

        const result = await saveBioHook(text);

        if (result.success) {
          setSaving(false);
          return { success: true };
        } else {
          setSaving(false);
          return { success: false, error: result.error || "Erro ao salvar bio" };
        }
      },
    }));

    return (
      <div className="space-y-2">
        <textarea
          value={text}
          onChange={(e) => {
            handleTextChange(e.target.value);
          }}
          placeholder="Como você se descreveria agora?"
          className="w-full px-3 py-2 rounded font-pixel text-sm resize-none"
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #e0e0e0",
            color: "#333",
            height: "auto",
          }}
          rows={3}
          maxLength={500}
        />
        {error && (
          <p className="text-xs font-pixel" style={{ color: "#f44336" }}>
            {error}
          </p>
        )}
        {!hideButtons && (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !text.trim()}
              className="px-3 py-1 rounded font-pixel text-xs transition-opacity"
              style={{
                backgroundColor: saving ? "#ccc" : "#9e9e9e",
                border: saving ? "1px solid #ccc" : "1px solid #9e9e9e",
                color: "#FFFFFF",
                opacity: saving || !text.trim() ? 0.5 : 1,
              }}
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
            {onCancel && (
              <button
                onClick={onCancel}
                disabled={saving}
                className="px-3 py-1 rounded font-pixel text-xs transition-opacity"
                style={{
                  backgroundColor: "#f5f5f5",
                  border: "1px solid #e0e0e0",
                  color: "#666",
                }}
              >
                Cancelar
              </button>
            )}
          </div>
        )}
        <p className="text-xs font-pixel" style={{ color: "#999" }}>
          {text.length}/500 {t('display.characters')}
        </p>
      </div>
    );
  }
);

BioEditor.displayName = "BioEditor";
