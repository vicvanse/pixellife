'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/app/context/LanguageContext';
import { Attribute } from '@/app/hooks/useAttributes';

interface AttributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (attribute: Omit<Attribute, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editingAttribute?: Attribute;
}

const CATEGORY_OPTIONS: Array<{ value: Attribute['category']; label: string; emoji: string }> = [
  { value: undefined, label: 'Nenhuma', emoji: '' },
  { value: 'physical', label: 'Físico', emoji: '💪' },
  { value: 'preference', label: 'Preferência', emoji: '🎵' },
  { value: 'skill', label: 'Habilidade', emoji: '🎯' },
  { value: 'trait', label: 'Traço', emoji: '✨' },
  { value: 'other', label: 'Outro', emoji: '📌' },
];

export function AttributeModal({ isOpen, onClose, onSave, editingAttribute }: AttributeModalProps) {
  const { t } = useLanguage();
  const [label, setLabel] = useState('');
  const [category, setCategory] = useState<Attribute['category']>(undefined);

  useEffect(() => {
    if (editingAttribute) {
      setLabel(editingAttribute.label);
      setCategory(editingAttribute.category);
    } else {
      setLabel('');
      setCategory(undefined);
    }
  }, [editingAttribute, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!label.trim()) {
      alert('Por favor, preencha o atributo');
      return;
    }

    onSave({
      label: label.trim(),
      category: category || undefined,
    });

    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 max-w-md w-full mx-4 border-4 border-black shadow-[8px_8px_0_0_#000] font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-pixel-bold" style={{ color: '#333', fontSize: '18px' }}>
            {editingAttribute ? 'Editar Atributo' : 'Novo Atributo'}
          </h2>
          <button
            onClick={onClose}
            className="bg-red-400 border-4 border-black px-3 py-1 font-bold hover:bg-red-500 shadow-[4px_4px_0_0_#000] text-xl"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        {/* Label/Texto do atributo */}
        <div className="mb-4">
          <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>
            Atributo:
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full px-3 py-2 border-2 border-black focus:outline-none font-pixel"
            style={{ 
              fontSize: '16px',
              backgroundColor: '#fff',
            }}
            placeholder="Ex: Uso óculos, Gosto de rock, Sou forte"
            maxLength={100}
            autoFocus
          />
        </div>

        {/* Categoria (opcional) */}
        <div className="mb-6">
          <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>
            Categoria (Opcional):
          </label>
          <select
            value={category || ''}
            onChange={(e) => setCategory(e.target.value as Attribute['category'] || undefined)}
            className="w-full px-3 py-2 border-2 border-black focus:outline-none font-pixel"
            style={{ 
              fontSize: '16px',
              backgroundColor: '#fff',
            }}
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value || 'none'} value={opt.value || ''}>
                {opt.emoji} {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Botões */}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 bg-green-400 border-4 border-black px-4 py-2 font-bold hover:bg-green-500 shadow-[4px_4px_0_0_#000] transition-all"
            style={{ color: '#111', fontSize: '14px' }}
          >
            Salvar
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 border-4 border-black px-4 py-2 font-bold hover:bg-gray-400 shadow-[4px_4px_0_0_#000] transition-all"
            style={{ color: '#111', fontSize: '14px' }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}


