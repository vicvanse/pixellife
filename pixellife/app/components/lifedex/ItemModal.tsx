'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/app/context/LanguageContext';
import { useLifeDex, LifeDexItem } from '@/app/hooks/useLifeDex';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: string;
  editingItemId?: string | null;
}

export function ItemModal({ isOpen, onClose, categoryId, editingItemId }: ItemModalProps) {
  const { t } = useLanguage();
  const { items, addItem, updateItem } = useLifeDex();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [type, setType] = useState<'check' | 'progress' | 'list' | 'free'>('check');
  const [experienced, setExperienced] = useState(false);
  const [planned, setPlanned] = useState(false);
  const [dateExperienced, setDateExperienced] = useState('');
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [plannedFor, setPlannedFor] = useState('');
  const [progress, setProgress] = useState<number>(0);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [subItems, setSubItems] = useState<Array<{ id: string; text: string; completed: boolean }>>([]);
  const [subItemInput, setSubItemInput] = useState('');

  const editingItem = editingItemId ? items.find(i => i.id === editingItemId) : null;

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setIcon(editingItem.icon || '');
      setType(editingItem.type);
      setExperienced(editingItem.experienced);
      setPlanned(editingItem.planned);
      setDateExperienced(editingItem.dateExperienced || '');
      setRating(editingItem.rating);
      setNotes(editingItem.notes || '');
      setPlannedFor(editingItem.plannedFor || '');
      setProgress(editingItem.progress || 0);
      setTags(editingItem.tags || []);
      setSubItems(editingItem.subItems || []);
    } else {
      setName('');
      setIcon('');
      setType('check');
      setExperienced(false);
      setPlanned(false);
      setDateExperienced('');
      setRating(undefined);
      setNotes('');
      setPlannedFor('');
      setProgress(0);
      setTags([]);
      setSubItems([]);
    }
  }, [editingItem, isOpen]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleAddSubItem = () => {
    if (subItemInput.trim()) {
      setSubItems([...subItems, {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: subItemInput.trim(),
        completed: false,
      }]);
      setSubItemInput('');
    }
  };

  const handleToggleSubItem = (id: string) => {
    setSubItems(subItems.map(sub => sub.id === id ? { ...sub, completed: !sub.completed } : sub));
  };

  const handleRemoveSubItem = (id: string) => {
    setSubItems(subItems.filter(sub => sub.id !== id));
  };

  const handleSave = () => {
    if (!name.trim()) return;

    const itemData: Omit<LifeDexItem, 'id' | 'createdAt' | 'updatedAt'> = {
      categoryId,
      name: name.trim(),
      icon: icon || undefined,
      type,
      experienced,
      planned,
      dateExperienced: dateExperienced || undefined,
      rating,
      notes: notes.trim() || undefined,
      plannedFor: plannedFor.trim() || undefined,
      progress: type === 'progress' ? progress : undefined,
      tags: tags.length > 0 ? tags : undefined,
      subItems: type === 'list' && subItems.length > 0 ? subItems : undefined,
    };

    if (editingItem) {
      updateItem(editingItem.id, itemData);
    } else {
      addItem(itemData);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
      style={{ overflowY: 'auto', padding: '20px' }}
    >
      <div
        className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 shadow-lg my-4"
        style={{ border: '1px solid #e0e0e0', borderRadius: '10px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-pixel-bold mb-4" style={{ color: '#333', fontSize: '18px' }}>
          {editingItem ? t('common.editItem') : t('common.newItem')}
        </h2>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
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
              maxLength={32}
              placeholder="Ex: Ver baleia jubarte, Comer ramen..."
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
              placeholder="🐋, 🍜..."
              maxLength={2}
            />
          </div>

          <div>
            <label className="block font-pixel-bold mb-1" style={{ color: '#333', fontSize: '14px' }}>
              Tipo
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full px-3 py-2 rounded border font-pixel"
              style={{
                border: '1px solid #d6d6d6',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            >
              <option value="check">Checkbox (Feito/Não feito)</option>
              <option value="progress">Progresso (0-100%)</option>
              <option value="list">Lista (subitens)</option>
              <option value="free">Texto livre</option>
            </select>
          </div>

          {type === 'progress' && (
            <div>
              <label className="block font-pixel-bold mb-1" style={{ color: '#333', fontSize: '14px' }}>
                Progresso: {progress}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => setProgress(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          )}

          {type === 'list' && (
            <div>
              <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '14px' }}>
                Subitens
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={subItemInput}
                  onChange={(e) => setSubItemInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSubItem()}
                  className="flex-1 px-3 py-2 rounded border font-pixel"
                  style={{
                    border: '1px solid #d6d6d6',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                  placeholder="Adicionar subitem..."
                />
                <button
                  onClick={handleAddSubItem}
                  className="px-3 py-2 rounded font-pixel"
                  style={{
                    backgroundColor: '#f0f0f0',
                    border: '1px solid #d0d0d0',
                    color: '#333',
                    fontSize: '14px',
                  }}
                >
                  +
                </button>
              </div>
              <div className="space-y-1">
                {subItems.map((subItem) => (
                  <div key={subItem.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={subItem.completed}
                      onChange={() => handleToggleSubItem(subItem.id)}
                      className="w-4 h-4"
                      style={{ accentColor: '#4d82ff' }}
                    />
                    <span className="font-pixel flex-1" style={{ fontSize: '14px' }}>{subItem.text}</span>
                    <button
                      onClick={() => handleRemoveSubItem(subItem.id)}
                      className="text-red-500"
                      style={{ fontSize: '18px' }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '14px' }}>
              Status
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={experienced}
                  onChange={(e) => {
                    setExperienced(e.target.checked);
                    if (e.target.checked) setPlanned(false);
                  }}
                  className="w-4 h-4"
                  style={{ accentColor: '#4d82ff' }}
                />
                <span className="font-pixel" style={{ fontSize: '14px' }}>Já vivenciei</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={planned}
                  onChange={(e) => {
                    setPlanned(e.target.checked);
                    if (e.target.checked) setExperienced(false);
                  }}
                  className="w-4 h-4"
                  style={{ accentColor: '#4d82ff' }}
                />
                <span className="font-pixel" style={{ fontSize: '14px' }}>Planejado</span>
              </label>
            </div>
          </div>

          {experienced && (
            <>
              <div>
                <label className="block font-pixel-bold mb-1" style={{ color: '#333', fontSize: '14px' }}>
                  Data da experiência
                </label>
                <input
                  type="date"
                  value={dateExperienced}
                  onChange={(e) => setDateExperienced(e.target.value)}
                  className="w-full px-3 py-2 rounded border font-pixel"
                  style={{
                    border: '1px solid #d6d6d6',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div>
                <label className="block font-pixel-bold mb-1" style={{ color: '#333', fontSize: '14px' }}>
                  Nota (1-5)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      onClick={() => setRating(rating === num ? undefined : num)}
                      className="px-3 py-1 rounded font-pixel"
                      style={{
                        backgroundColor: rating === num ? '#4d82ff' : '#f0f0f0',
                        border: `1px solid ${rating === num ? '#4d82ff' : '#d0d0d0'}`,
                        color: rating === num ? '#fff' : '#333',
                        fontSize: '14px',
                      }}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {planned && (
            <div>
              <label className="block font-pixel-bold mb-1" style={{ color: '#333', fontSize: '14px' }}>
                Planejado para
              </label>
              <input
                type="text"
                value={plannedFor}
                onChange={(e) => setPlannedFor(e.target.value)}
                className="w-full px-3 py-2 rounded border font-pixel"
                style={{
                  border: '1px solid #d6d6d6',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
                placeholder="Ex: 2026, Janeiro 2025..."
              />
            </div>
          )}

          <div>
            <label className="block font-pixel-bold mb-1" style={{ color: '#333', fontSize: '14px' }}>
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                className="flex-1 px-3 py-2 rounded border font-pixel"
                style={{
                  border: '1px solid #d6d6d6',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
                placeholder="Adicionar tag..."
              />
              <button
                onClick={handleAddTag}
                className="px-3 py-2 rounded font-pixel"
                style={{
                  backgroundColor: '#f0f0f0',
                  border: '1px solid #d0d0d0',
                  color: '#333',
                  fontSize: '14px',
                }}
              >
                +
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 rounded font-pixel text-xs flex items-center gap-1"
                  style={{
                    backgroundColor: '#f0f0f0',
                    border: '1px solid #d0d0d0',
                    color: '#333',
                  }}
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="text-red-500"
                    style={{ fontSize: '14px' }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-pixel-bold mb-1" style={{ color: '#333', fontSize: '14px' }}>
              Notas
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded border font-pixel"
              style={{
                border: '1px solid #d6d6d6',
                borderRadius: '6px',
                fontSize: '14px',
                minHeight: '80px',
              }}
              placeholder="Reflexões, detalhes, observações..."
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

