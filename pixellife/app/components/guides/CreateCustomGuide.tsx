'use client';

import { useState } from 'react';
import { useGuides } from '../../hooks/useGuides';
import { useLanguage } from '../../context/LanguageContext';
import type { Guide } from '../../types/guides';

interface CreateCustomGuideProps {
  onClose: () => void;
  onCreated: (guide: Guide) => void;
}

export function CreateCustomGuide({ onClose, onCreated }: CreateCustomGuideProps) {
  const { t, tString } = useLanguage();
  const { createCustomGuide } = useGuides();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [philosophicalNote, setPhilosophicalNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      alert(t('guides.fillNameDescription'));
      return;
    }

    const guide = createCustomGuide(
      name.trim(),
      description.trim(),
      philosophicalNote.trim() || undefined
    );

    onCreated(guide);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 max-w-md w-full mx-4 rounded"
        style={{
          border: '1px solid #e5e5e5',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.12)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-pixel-bold text-lg mb-4" style={{ color: '#111' }}>
          {t('guides.createCustomGuide')}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-pixel-bold text-sm mb-1" style={{ color: '#111' }}>
              {t('guides.pathName')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={tString('guides.pathNamePlaceholder')}
              className="w-full px-3 py-2 rounded font-pixel text-sm"
              style={{
                border: '1px solid #e5e5e5',
                backgroundColor: '#FFFFFF',
              }}
              required
            />
          </div>

          <div>
            <label className="block font-pixel-bold text-sm mb-1" style={{ color: '#111' }}>
              {t('guides.description')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={tString('guides.descriptionPlaceholder')}
              rows={3}
              className="w-full px-3 py-2 rounded font-pixel text-sm"
              style={{
                border: '1px solid #e5e5e5',
                backgroundColor: '#FFFFFF',
              }}
              required
            />
          </div>

          <div>
            <label className="block font-pixel-bold text-sm mb-1" style={{ color: '#111' }}>
              {t('guides.philosophicalNote')}
            </label>
            <textarea
              value={philosophicalNote}
              onChange={(e) => setPhilosophicalNote(e.target.value)}
              placeholder={tString('guides.philosophicalNotePlaceholder')}
              rows={2}
              className="w-full px-3 py-2 rounded font-pixel text-sm"
              style={{
                border: '1px solid #e5e5e5',
                backgroundColor: '#FFFFFF',
              }}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded font-pixel-bold transition-colors hover:opacity-90"
              style={{
                backgroundColor: '#f2f2f2',
                border: '1px solid #e5e5e5',
                color: '#111',
                fontSize: '14px',
              }}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded font-pixel-bold transition-colors hover:opacity-90"
              style={{
                backgroundColor: '#6daffe',
                border: '1px solid #1b5cff',
                color: '#111',
                fontSize: '14px',
              }}
            >
              {t('common.add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

