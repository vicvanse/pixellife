'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/app/context/LanguageContext';
import { Dossier } from '@/app/hooks/useDossiers';

interface DossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dossier: Omit<Dossier, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editingDossier?: Dossier;
}

export function DossierModal({ isOpen, onClose, onSave, editingDossier }: DossierModalProps) {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (editingDossier) {
      setTitle(editingDossier.title);
      setContent(editingDossier.content);
      setDescription(editingDossier.description || '');
    } else {
      setTitle('');
      setContent('');
      setDescription('');
    }
  }, [editingDossier, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim()) {
      alert('Por favor, preencha o título');
      return;
    }
    if (!content.trim()) {
      alert('Por favor, preencha o conteúdo');
      return;
    }

    onSave({
      title: title.trim(),
      content: content.trim(),
      description: description.trim() || undefined,
    });

    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ 
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.12)',
        }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-pixel-bold" style={{ color: '#333', fontSize: '18px', fontWeight: 600 }}>
            {editingDossier ? 'Editar Dossiê' : 'Novo Dossiê'}
          </h2>
          <button
            onClick={onClose}
            className="px-2 py-1 rounded transition-colors hover:bg-gray-100"
            style={{
              backgroundColor: '#f5f5f5',
              border: '1px solid #d4d4d4',
              color: '#555',
              fontSize: '14px',
              borderRadius: '6px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Título */}
        <div className="mb-4">
          <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>
            Título:
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded font-pixel focus:outline-none focus:ring-2 focus:ring-blue-400"
            style={{ 
              fontSize: '16px',
              backgroundColor: '#fff',
              border: '1px solid #d6d6d6',
            }}
            placeholder="Ex: Minha relação com estudo"
            maxLength={100}
          />
        </div>

        {/* Descrição (opcional) */}
        <div className="mb-4">
          <label className="block font-pixel mb-2" style={{ color: '#666', fontSize: '14px' }}>
            Descrição (opcional):
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 rounded font-pixel focus:outline-none focus:ring-2 focus:ring-blue-400"
            style={{ 
              fontSize: '14px',
              backgroundColor: '#fff',
              border: '1px solid #d6d6d6',
            }}
            placeholder="Uma linha curta sobre este dossiê..."
            maxLength={80}
          />
        </div>

        {/* Conteúdo */}
        <div className="mb-6">
          <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>
            Conteúdo:
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 rounded font-pixel resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
            style={{ 
              fontSize: '16px', 
              minHeight: '300px',
              backgroundColor: '#fff',
              border: '1px solid #d6d6d6',
            }}
            placeholder="Escreva seu dossiê..."
          />
        </div>

        {/* Botões */}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 rounded transition-colors hover:opacity-90"
            style={{
              backgroundColor: '#6daffe',
              border: '1px solid #1b5cff',
              color: '#111',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '8px',
            }}
          >
            Salvar
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded transition-colors hover:opacity-90"
            style={{
              backgroundColor: '#f5f5f5',
              border: '1px solid #d4d4d4',
              color: '#555',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '8px',
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

