'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/app/context/LanguageContext';
import { AboutItem, AboutItemCategory, ABOUT_CATEGORIES } from '@/app/hooks/useAboutItems';

interface AboutItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<AboutItem, 'id'>) => void;
  editingItem?: AboutItem;
  category: AboutItemCategory;
}

export function AboutItemModal({ isOpen, onClose, onSave, editingItem, category }: AboutItemModalProps) {
  const { t } = useLanguage();
  const [label, setLabel] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [author, setAuthor] = useState('');
  const [year, setYear] = useState<number | undefined>(undefined);
  const [personalNote, setPersonalNote] = useState('');
  const [addedYear, setAddedYear] = useState<number | undefined>(undefined);
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');

  useEffect(() => {
    if (editingItem) {
      setLabel(editingItem.label);
      setCoverImage(editingItem.coverImage || '');
      setAuthor(editingItem.metadata?.author || '');
      setYear(editingItem.metadata?.year);
      setPersonalNote(editingItem.personalNote || '');
      setAddedYear(editingItem.addedYear);
      setCity(editingItem.metadata?.city || '');
      setCountry(editingItem.metadata?.country || '');
    } else {
      setLabel('');
      setCoverImage('');
      setAuthor('');
      setYear(undefined);
      setPersonalNote('');
      setAddedYear(new Date().getFullYear()); // Ano atual como padrão
      setCity('');
      setCountry('');
    }
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!label.trim()) {
      alert('Por favor, preencha o nome');
      return;
    }

    onSave({
      category,
      label: label.trim(),
      coverImage: coverImage.trim() || undefined,
      personalNote: personalNote.trim() || undefined,
      addedYear: addedYear || new Date().getFullYear(),
      metadata: {
        ...(author.trim() && { author: author.trim() }),
        ...(year && { year }),
        ...(city.trim() && { city: city.trim() }),
        ...(country.trim() && { country: country.trim() }),
      },
    });

    onClose();
  };

  const categoryInfo = ABOUT_CATEGORIES[category];

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ 
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.12)',
        }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-pixel-bold" style={{ color: '#333', fontSize: '18px', fontWeight: 600 }}>
            {editingItem ? `Editar ${categoryInfo.label}` : `Novo ${categoryInfo.label}`}
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

        {/* Nome */}
        <div className="mb-4">
          <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>
            Nome:
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full px-3 py-2 rounded font-pixel focus:outline-none focus:ring-2 focus:ring-green-400"
            style={{ 
              fontSize: '16px',
              backgroundColor: '#fff',
              border: '1px solid #d6d6d6',
            }}
            placeholder={`Ex: ${category === 'books' ? 'O Pequeno Príncipe' : category === 'albums' ? 'In Rainbows' : category === 'films' ? 'Blade Runner' : 'Nome'}`}
            maxLength={100}
          />
        </div>

        {/* Autor (para livros e álbuns) */}
        {(category === 'books' || category === 'albums' || category === 'authors') && (
          <div className="mb-4">
            <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>
              {category === 'books' ? 'Autor:' : category === 'albums' ? 'Artista:' : 'Nome:'}
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-3 py-2 rounded font-pixel focus:outline-none focus:ring-2 focus:ring-green-400"
              style={{ 
                fontSize: '16px',
                backgroundColor: '#fff',
                border: '1px solid #d6d6d6',
              }}
              placeholder="Ex: Antoine de Saint-Exupéry"
              maxLength={100}
            />
          </div>
        )}

        {/* Ano (ano de lançamento/publicação) */}
        {(category === 'books' || category === 'albums' || category === 'films') && (
          <div className="mb-4">
            <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>
              Ano de lançamento:
            </label>
            <input
              type="number"
              value={year || ''}
              onChange={(e) => setYear(e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 rounded font-pixel focus:outline-none focus:ring-2 focus:ring-green-400"
              style={{ 
                fontSize: '16px',
                backgroundColor: '#fff',
                border: '1px solid #d6d6d6',
              }}
              placeholder="Ex: 1943"
              min="1000"
              max={new Date().getFullYear() + 10}
            />
          </div>
        )}

        {/* Cidade e País (para lugares) */}
        {category === 'places' && (
          <>
            <div className="mb-4">
              <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>
                Cidade:
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 rounded font-pixel focus:outline-none focus:ring-2 focus:ring-green-400"
                style={{ 
                  fontSize: '16px',
                  backgroundColor: '#fff',
                  border: '1px solid #d6d6d6',
                }}
                placeholder="Ex: São Paulo"
                maxLength={100}
              />
            </div>
            <div className="mb-4">
              <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>
                País:
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 rounded font-pixel focus:outline-none focus:ring-2 focus:ring-green-400"
                style={{ 
                  fontSize: '16px',
                  backgroundColor: '#fff',
                  border: '1px solid #d6d6d6',
                }}
                placeholder="Ex: Brasil"
                maxLength={100}
              />
            </div>
            <div className="mb-4">
              <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>
                Ano (opcional):
              </label>
              <input
                type="number"
                value={year || ''}
                onChange={(e) => setYear(e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 rounded font-pixel focus:outline-none focus:ring-2 focus:ring-green-400"
                style={{ 
                  fontSize: '16px',
                  backgroundColor: '#fff',
                  border: '1px solid #d6d6d6',
                }}
                placeholder="Ex: 2023"
                min="1000"
                max={new Date().getFullYear() + 10}
              />
            </div>
          </>
        )}

        {/* Ano adicionado como favorito */}
        <div className="mb-4">
          <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>
            Favorito desde:
          </label>
          <input
            type="number"
            value={addedYear || ''}
            onChange={(e) => setAddedYear(e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-3 py-2 rounded font-pixel focus:outline-none focus:ring-2 focus:ring-green-400"
            style={{ 
              fontSize: '16px',
              backgroundColor: '#fff',
              border: '1px solid #d6d6d6',
            }}
            placeholder={new Date().getFullYear().toString()}
            min="1900"
            max={new Date().getFullYear()}
          />
        </div>

        {/* Nota pessoal */}
        <div className="mb-6">
          <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>
            Nota pessoal (opcional):
          </label>
          <textarea
            value={personalNote}
            onChange={(e) => setPersonalNote(e.target.value)}
            className="w-full px-3 py-2 rounded font-pixel focus:outline-none focus:ring-2 focus:ring-green-400"
            style={{ 
              fontSize: '16px',
              backgroundColor: '#fff',
              border: '1px solid #d6d6d6',
              minHeight: '80px',
              resize: 'vertical',
            }}
            placeholder="Ex: escutei durante a IC"
            maxLength={200}
          />
        </div>

        {/* Imagem de capa */}
        <div className="mb-6">
          <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>
            URL da Imagem (opcional):
          </label>
          <input
            type="text"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            className="w-full px-3 py-2 rounded font-pixel focus:outline-none focus:ring-2 focus:ring-green-400"
            style={{ 
              fontSize: '16px',
              backgroundColor: '#fff',
              border: '1px solid #d6d6d6',
            }}
            placeholder="https://..."
          />
        </div>

        {/* Botões */}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 rounded transition-colors hover:opacity-90"
            style={{
              backgroundColor: '#7aff7a',
              border: '1px solid #0f9d58',
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

