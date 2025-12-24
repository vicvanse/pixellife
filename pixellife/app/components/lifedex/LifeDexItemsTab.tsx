'use client';

import { useState } from 'react';
import { useLifeDex } from '@/app/hooks/useLifeDex';
import { ItemModal } from './ItemModal';

interface LifeDexItemsTabProps {
  categoryId: string;
  onBack: () => void;
}

export function LifeDexItemsTab({ categoryId, onBack }: LifeDexItemsTabProps) {
  const { categories, getItemsByCategory, deleteItem } = useLifeDex();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const category = categories.find(c => c.id === categoryId);
  const items = getItemsByCategory(categoryId);

  const handleEdit = (itemId: string) => {
    setEditingItemId(itemId);
    setIsModalOpen(true);
  };

  const handleDelete = (itemId: string) => {
    if (confirm('Tem certeza que deseja excluir este item?')) {
      deleteItem(itemId);
    }
  };

  const getStatusLabel = (item: ReturnType<typeof getItemsByCategory>[0]) => {
    if (item.planned) return 'Planejado';
    if (item.experienced) {
      if (item.type === 'progress') {
        return `Progresso: ${item.progress || 0}%`;
      }
      if (item.type === 'list') {
        const completed = item.subItems?.filter(s => s.completed).length || 0;
        const total = item.subItems?.length || 0;
        return `${completed}/${total} concluídos`;
      }
      return 'Experienciado';
    }
    return 'Não feito';
  };

  const getStars = (rating?: number) => {
    if (!rating) return '';
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="px-2 py-1 rounded font-pixel"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #e0e0e0',
              color: '#333',
              fontSize: '14px',
            }}
          >
            ← Voltar
          </button>
          <h2 className="font-pixel-bold" style={{ color: '#333', fontSize: '18px' }}>
            {category?.icon} {category?.name || 'Itens'}
          </h2>
        </div>
        <button
          onClick={() => {
            setEditingItemId(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2 rounded font-pixel-bold transition-colors hover:opacity-90"
          style={{
            backgroundColor: '#7aff7a',
            border: '1px solid #0f9d58',
            color: '#111',
            fontSize: '14px',
          }}
        >
          + Novo Item
        </button>
      </div>

      {items.length === 0 ? (
        <p className="font-pixel text-center py-8" style={{ color: '#999', fontSize: '16px' }}>
          Nenhum item nesta categoria ainda. Adicione seu primeiro item!
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-md transition-all"
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
              }}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {item.icon && (
                      <span style={{ fontSize: '20px' }}>{item.icon}</span>
                    )}
                    <h3 className="font-pixel-bold" style={{ color: '#333', fontSize: '16px' }}>
                      {item.name}
                    </h3>
                  </div>
                  <p className="font-pixel mb-2" style={{ color: '#666', fontSize: '14px' }}>
                    {getStatusLabel(item)}
                  </p>
                  {item.rating && (
                    <p className="font-pixel mb-1" style={{ color: '#333', fontSize: '14px' }}>
                      {getStars(item.rating)}
                    </p>
                  )}
                  {item.type === 'progress' && item.progress !== undefined && (
                    <div className="w-full h-2 rounded-full mb-2" style={{ backgroundColor: '#E4E0DA' }}>
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${item.progress}%`,
                          backgroundColor: '#4d82ff',
                        }}
                      />
                    </div>
                  )}
                  {item.type === 'list' && item.subItems && item.subItems.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {item.subItems.map((subItem) => (
                        <div key={subItem.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={subItem.completed}
                            readOnly
                            className="w-4 h-4"
                            style={{ accentColor: '#4d82ff' }}
                          />
                          <span
                            className="font-pixel"
                            style={{
                              color: subItem.completed ? '#999' : '#333',
                              textDecoration: subItem.completed ? 'line-through' : 'none',
                              fontSize: '14px',
                            }}
                          >
                            {subItem.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {item.notes && (
                    <p className="font-pixel mt-2" style={{ color: '#666', fontSize: '14px' }}>
                      {item.notes}
                    </p>
                  )}
                  {item.dateExperienced && (
                    <p className="font-pixel mt-1" style={{ color: '#999', fontSize: '12px' }}>
                      {new Date(item.dateExperienced).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                  {item.plannedFor && (
                    <p className="font-pixel mt-1" style={{ color: '#999', fontSize: '12px' }}>
                      Planejado para: {item.plannedFor}
                    </p>
                  )}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 rounded font-pixel text-xs"
                          style={{
                            backgroundColor: '#f0f0f0',
                            border: '1px solid #d0d0d0',
                            color: '#333',
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() => handleEdit(item.id)}
                    className="px-2 py-1 rounded font-pixel text-xs"
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #e0e0e0',
                      color: '#333',
                      fontSize: '12px',
                    }}
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="px-2 py-1 rounded font-pixel text-xs"
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #e0e0e0',
                      color: '#C62828',
                      fontSize: '12px',
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <ItemModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingItemId(null);
          }}
          categoryId={categoryId}
          editingItemId={editingItemId}
        />
      )}
    </div>
  );
}

