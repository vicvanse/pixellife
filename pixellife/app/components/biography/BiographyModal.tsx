'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/app/context/LanguageContext';
import {
  BiographyEntry,
  BiographyMilestone,
  BiographyStory,
  BiographyEntryType,
  BiographyCategory,
  BiographyDate,
  DatePrecision,
  CATEGORIES,
} from '@/app/hooks/useBiography';

interface BiographyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: Omit<BiographyMilestone, 'id' | 'createdAt'> | Omit<BiographyStory, 'id' | 'createdAt'>) => void;
  editingEntry?: BiographyEntry;
  availableMilestones?: BiographyMilestone[]; // Para selecionar milestones relacionados
}

const EMOJI_OPTIONS = [
  '🧱', '📚', '💪', '🎖️', '🔄', '💼', '💭',
  '🏆', '📘', '⚔️', '🎯', '✨', '🌟', '📝',
  '🎨', '🎵', '🎬', '🚀', '💡', '🔬', '🎓',
];

export function BiographyModal({ isOpen, onClose, onSave, editingEntry }: BiographyModalProps) {
  const { t } = useLanguage();
  const [type, setType] = useState<BiographyEntryType>('milestone');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [category, setCategory] = useState<BiographyCategory>('fundacao');
  const [emoji, setEmoji] = useState('🧱');
  const [tag, setTag] = useState('');
  const [photo, setPhoto] = useState('');
  
  // Date fields
  const [precision, setPrecision] = useState<DatePrecision>('approximate');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState<number | undefined>(undefined);
  const [day, setDay] = useState<number | undefined>(undefined);
  const [endYear, setEndYear] = useState<number | undefined>(undefined);
  const [endMonth, setEndMonth] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (editingEntry) {
      setType(editingEntry.type);
      setTitle(editingEntry.title);
      setCategory(editingEntry.category);
      if (editingEntry.type === 'milestone') {
        setEmoji(editingEntry.emoji);
        setTag(editingEntry.tag || '');
      } else {
        setText(editingEntry.text);
        setPhoto(editingEntry.photo || '');
      }
      const date = editingEntry.date;
      setPrecision(date.precision);
      setYear(date.year);
      setMonth(date.month);
      setDay(date.day);
      setEndYear(date.endYear);
      setEndMonth(date.endMonth);
    } else {
      // Reset form
      setType('milestone');
      setTitle('');
      setText('');
      setCategory('fundacao');
      setEmoji('🧱');
      setTag('');
      setPhoto('');
      setPrecision('approximate');
      setYear(new Date().getFullYear());
      setMonth(undefined);
      setDay(undefined);
      setEndYear(undefined);
      setEndMonth(undefined);
    }
  }, [editingEntry, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim()) {
      alert('Por favor, preencha o título');
      return;
    }

    const date: BiographyDate = {
      year,
      precision,
      ...(month && { month }),
      ...(day && { day }),
      ...(endYear && { endYear }),
      ...(endMonth && { endMonth }),
    };

    if (type === 'milestone') {
      const milestone: Omit<BiographyMilestone, 'id' | 'createdAt'> = {
        type: 'milestone',
        title: title.trim(),
        date,
        category,
        emoji,
        ...(tag && { tag: tag.trim() }),
      };
      onSave(milestone);
    } else {
      if (!text.trim()) {
        alert('Por favor, preencha o texto da história');
        return;
      }
      const story: Omit<BiographyStory, 'id' | 'createdAt'> = {
        type: 'story',
        title: title.trim(),
        text: text.trim(),
        date,
        category,
        ...(photo && { photo }),
      };
      onSave(story);
    }

    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ 
          scrollbarWidth: 'thin',
          borderRadius: '10px',
          border: '1px solid #e0e0e0',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.12)',
        }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-pixel-bold" style={{ color: '#333', fontSize: '18px', fontWeight: 600 }}>
            {editingEntry ? t('common.editEntry') : t('common.addStory')}
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

        {/* Tipo */}
        <div className="mb-4">
          <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>
            Tipo:
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setType('milestone')}
              className="px-4 py-2 rounded transition-colors"
              style={{
                backgroundColor: type === 'milestone' ? '#2563eb' : '#f5f5f5',
                border: `1px solid ${type === 'milestone' ? '#1b5cff' : '#d4d4d4'}`,
                color: type === 'milestone' ? '#fff' : '#555',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '8px',
              }}
            >
              Entrada Curta
            </button>
            <button
              onClick={() => setType('story')}
              className="px-4 py-2 rounded transition-colors"
              style={{
                backgroundColor: type === 'story' ? '#2563eb' : '#f5f5f5',
                border: `1px solid ${type === 'story' ? '#1b5cff' : '#d4d4d4'}`,
                color: type === 'story' ? '#fff' : '#555',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '8px',
              }}
            >
              Entrada Longa
            </button>
          </div>
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
            placeholder="Ex: Comecei musculação"
          />
        </div>

        {/* Data */}
        <div className="mb-4">
          <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>
            Tempo:
          </label>
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setPrecision('exact')}
              className="px-3 py-1 rounded text-sm transition-colors"
              style={{
                backgroundColor: precision === 'exact' ? '#2563eb' : '#f5f5f5',
                border: `1px solid ${precision === 'exact' ? '#1b5cff' : '#d4d4d4'}`,
                color: precision === 'exact' ? '#fff' : '#555',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '6px',
              }}
            >
              Exata
            </button>
            <button
              onClick={() => setPrecision('approximate')}
              className="px-3 py-1 rounded text-sm transition-colors"
              style={{
                backgroundColor: precision === 'approximate' ? '#2563eb' : '#f5f5f5',
                border: `1px solid ${precision === 'approximate' ? '#1b5cff' : '#d4d4d4'}`,
                color: precision === 'approximate' ? '#fff' : '#555',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '6px',
              }}
            >
              Aproximada
            </button>
            <button
              onClick={() => setPrecision('range')}
              className="px-3 py-1 rounded text-sm transition-colors"
              style={{
                backgroundColor: precision === 'range' ? '#2563eb' : '#f5f5f5',
                border: `1px solid ${precision === 'range' ? '#1b5cff' : '#d4d4d4'}`,
                color: precision === 'range' ? '#fff' : '#555',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '6px',
              }}
            >
              Intervalo
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
              className="px-3 py-2 rounded font-pixel focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{ 
                fontSize: '16px', 
                width: '100px',
                backgroundColor: '#fff',
                border: '1px solid #d6d6d6',
              }}
              placeholder="Ano"
            />
            {precision === 'exact' && (
              <>
                <input
                  type="number"
                  value={month || ''}
                  onChange={(e) => setMonth(e.target.value ? parseInt(e.target.value) : undefined)}
                  className="px-3 py-2 rounded font-pixel focus:outline-none focus:ring-2 focus:ring-blue-400"
                  style={{ 
                    fontSize: '16px', 
                    width: '80px',
                    backgroundColor: '#fff',
                    border: '1px solid #d6d6d6',
                  }}
                  placeholder="Mês"
                  min="1"
                  max="12"
                />
                <input
                  type="number"
                  value={day || ''}
                  onChange={(e) => setDay(e.target.value ? parseInt(e.target.value) : undefined)}
                  className="px-3 py-2 rounded font-pixel focus:outline-none focus:ring-2 focus:ring-blue-400"
                  style={{ 
                    fontSize: '16px', 
                    width: '80px',
                    backgroundColor: '#fff',
                    border: '1px solid #d6d6d6',
                  }}
                  placeholder="Dia"
                  min="1"
                  max="31"
                />
              </>
            )}
            {precision === 'range' && (
              <input
                type="number"
                value={endYear || ''}
                onChange={(e) => setEndYear(e.target.value ? parseInt(e.target.value) : undefined)}
                className="px-3 py-2 rounded font-pixel focus:outline-none focus:ring-2 focus:ring-blue-400"
                style={{ 
                  fontSize: '16px', 
                  width: '100px',
                  backgroundColor: '#fff',
                  border: '1px solid #d6d6d6',
                }}
                placeholder="Até ano"
              />
            )}
          </div>
        </div>

        {/* Categoria */}
        <div className="mb-4">
          <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>
            Categoria:
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as BiographyCategory)}
            className="w-full px-3 py-2 rounded font-pixel focus:outline-none focus:ring-2 focus:ring-blue-400"
            style={{ 
              fontSize: '16px',
              backgroundColor: '#fff',
              border: '1px solid #d6d6d6',
            }}
          >
            {Object.entries(CATEGORIES).map(([key, { label, emoji }]) => (
              <option key={key} value={key}>
                {emoji} {label}
              </option>
            ))}
          </select>
        </div>

        {/* Emoji (apenas para milestone) */}
        {type === 'milestone' && (
          <div className="mb-4">
            <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>
              Emoji:
            </label>
            <div className="flex gap-2 flex-wrap">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className="text-2xl p-2 rounded transition-colors"
                  style={{
                    border: `1px solid ${emoji === e ? '#2563eb' : '#dcdcdc'}`,
                    backgroundColor: emoji === e ? '#e3f2fd' : '#f5f5f5',
                    borderRadius: '6px',
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tag (apenas para milestone) */}
        {type === 'milestone' && (
          <div className="mb-4">
            <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>
              Tag (opcional):
            </label>
            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="w-full px-3 py-2 rounded font-pixel focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{ 
                fontSize: '16px',
                backgroundColor: '#fff',
                border: '1px solid #d6d6d6',
              }}
              placeholder="Ex: Importante, Virada de vida"
            />
          </div>
        )}

        {/* Texto (apenas para story) */}
        {type === 'story' && (
          <div className="mb-4">
            <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>
              Texto:
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-3 py-2 rounded font-pixel resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{ 
                fontSize: '16px', 
                minHeight: '150px',
                backgroundColor: '#fff',
                border: '1px solid #d6d6d6',
              }}
              placeholder="Escreva sua história..."
            />
          </div>
        )}

        {/* Foto (apenas para story) */}
        {type === 'story' && (
          <div className="mb-4">
            <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>
              Foto URL (opcional):
            </label>
            <input
              type="text"
              value={photo}
              onChange={(e) => setPhoto(e.target.value)}
              className="w-full px-3 py-2 rounded font-pixel focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{ 
                fontSize: '16px',
                backgroundColor: '#fff',
                border: '1px solid #d6d6d6',
              }}
              placeholder="https://..."
            />
          </div>
        )}

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

