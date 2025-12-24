'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/app/context/LanguageContext';
import { useLifeDex, LifeDexCategory } from '@/app/hooks/useLifeDex';
import { useAuth } from '@/app/context/AuthContext';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCategoryId?: string | null;
}

export function CategoryModal({ isOpen, onClose, editingCategoryId }: CategoryModalProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { categories, addCategory, updateCategory } = useLifeDex();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('');

  const editingCategory = editingCategoryId ? categories.find(c => c.id === editingCategoryId) : null;

  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name);
      setDescription(editingCategory.description || '');
      setIcon(editingCategory.icon || '');
    } else {
      setName('');
      setDescription('');
      setIcon('');
    }
  }, [editingCategory, isOpen]);

  const handleSave = () => {
    if (!name.trim() || !user) return;

    if (editingCategory) {
      updateCategory(editingCategory.id, { name: name.trim(), description: description.trim() || undefined, icon: icon || undefined });
    } else {
      addCategory({ userId: user.id, name: name.trim(), description: description.trim() || undefined, icon: icon || undefined });
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-lg"
        style={{ border: '1px solid #e0e0e0', borderRadius: '10px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-pixel-bold mb-4" style={{ color: '#333', fontSize: '18px' }}>
          {editingCategory ? t('common.editCategory') : t('common.newCategory')}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block font-pixel-bold mb-1" style={{ color: '#333', fontSize: '14px' }}>
              Nome *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded border font-pixel"
              style={{
                border: '1px solid #d6d6d6',
                borderRadius: '6px',
                fontSize: '14px',
              }}
              placeholder="Ex: Comidas, Animais, Lugares..."
            />
          </div>

          <div>
            <label className="block font-pixel-bold mb-1" style={{ color: '#333', fontSize: '14px' }}>
              Ícone (emoji)
            </label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="w-full px-3 py-2 rounded border font-pixel"
              style={{
                border: '1px solid #d6d6d6',
                borderRadius: '6px',
                fontSize: '14px',
              }}
              placeholder="🍽️, 🐾, 🌱..."
              maxLength={2}
            />
          </div>

          <div>
            <label className="block font-pixel-bold mb-1" style={{ color: '#333', fontSize: '14px' }}>
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded border font-pixel"
              style={{
                border: '1px solid #d6d6d6',
                borderRadius: '6px',
                fontSize: '14px',
                minHeight: '80px',
              }}
              placeholder="Descrição opcional da categoria..."
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded font-pixel-bold transition-colors"
            style={{
              backgroundColor: '#d0d0d0',
              border: '1px solid #d0d0d0',
              color: '#333',
              fontSize: '14px',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="flex-1 px-4 py-2 rounded font-pixel-bold transition-colors"
            style={{
              backgroundColor: name.trim() ? '#7aff7a' : '#d0d0d0',
              border: name.trim() ? '1px solid #0f9d58' : '1px solid #d0d0d0',
              color: name.trim() ? '#111' : '#666',
              fontSize: '14px',
              cursor: name.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

