'use client';

import { useState } from 'react';
import { useLifeDex } from '@/app/hooks/useLifeDex';
import { FutureListModal } from './FutureListModal';

export function LifeDexFutureTab() {
  const {
    futureLists,
    futureListItems,
    addFutureList,
    deleteFutureList,
    addFutureListItem,
    updateFutureListItem,
    deleteFutureListItem,
  } = useLifeDex();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingListId, setEditingListId] = useState<string | null>(null);

  const handleEditList = (listId: string) => {
    setEditingListId(listId);
    setIsModalOpen(true);
  };

  const handleDeleteList = (listId: string) => {
    if (confirm('Tem certeza que deseja excluir esta lista? Todos os itens serão removidos.')) {
      deleteFutureList(listId);
    }
  };

  const handleToggleItem = (itemId: string, completed: boolean) => {
    updateFutureListItem(itemId, { completed: !completed });
  };

  const handleDeleteItem = (itemId: string) => {
    if (confirm('Tem certeza que deseja excluir este item?')) {
      deleteFutureListItem(itemId);
    }
  };

  const getListItems = (listId: string) => {
    return futureListItems.filter(item => item.listId === listId);
  };

  const getListProgress = (listId: string) => {
    const items = getListItems(listId);
    if (items.length === 0) return { completed: 0, total: 0, percentage: 0 };
    const completed = items.filter(item => item.completed).length;
    return {
      completed,
      total: items.length,
      percentage: Math.round((completed / items.length) * 100),
    };
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-pixel-bold" style={{ color: '#333', fontSize: '18px' }}>
          Planos e Listas Futuras
        </h2>
        <button
          onClick={() => {
            setEditingListId(null);
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
          + Nova Lista
        </button>
      </div>

      {futureLists.length === 0 ? (
        <p className="font-pixel text-center py-8" style={{ color: '#999', fontSize: '16px' }}>
          Nenhuma lista futura ainda. Crie uma lista para planejar suas experiências!
        </p>
      ) : (
        <div className="space-y-6">
          {futureLists.map((list) => {
            const items = getListItems(list.id);
            const progress = getListProgress(list.id);

            return (
              <div
                key={list.id}
                className="p-4 rounded-md"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-pixel-bold mb-1" style={{ color: '#333', fontSize: '18px' }}>
                      {list.name}
                    </h3>
                    {list.description && (
                      <p className="font-pixel mb-2" style={{ color: '#666', fontSize: '14px' }}>
                        {list.description}
                      </p>
                    )}
                    <div className="mb-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-pixel" style={{ color: '#666', fontSize: '14px' }}>
                          {progress.completed} / {progress.total} itens
                        </span>
                        <span className="font-pixel-bold" style={{ color: '#333', fontSize: '14px' }}>
                          {progress.percentage}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full" style={{ backgroundColor: '#E4E0DA' }}>
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${progress.percentage}%`,
                            backgroundColor: '#4d82ff',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => handleEditList(list.id)}
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
                      onClick={() => handleDeleteList(list.id)}
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

                <div className="space-y-2">
                  {items.length === 0 ? (
                    <p className="font-pixel text-center py-2" style={{ color: '#999', fontSize: '14px' }}>
                      Nenhum item nesta lista
                    </p>
                  ) : (
                    items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 p-2 rounded"
                        style={{
                          backgroundColor: item.completed ? '#f0f0f0' : '#FFFFFF',
                          border: '1px solid #e0e0e0',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => handleToggleItem(item.id, item.completed)}
                          className="w-4 h-4"
                          style={{ accentColor: '#4d82ff' }}
                        />
                        <span
                          className="font-pixel flex-1"
                          style={{
                            color: item.completed ? '#999' : '#333',
                            textDecoration: item.completed ? 'line-through' : 'none',
                            fontSize: '14px',
                          }}
                        >
                          {item.text}
                        </span>
                        {item.plannedFor && (
                          <span className="font-pixel" style={{ color: '#999', fontSize: '12px' }}>
                            {item.plannedFor}
                          </span>
                        )}
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-500"
                          style={{ fontSize: '18px' }}
                        >
                          ×
                        </button>
                      </div>
                    ))
                  )}
                  <button
                    onClick={() => {
                      const text = prompt('Novo item:');
                      if (text && text.trim()) {
                        const plannedFor = prompt('Planejado para (opcional):') || undefined;
                        addFutureListItem({
                          listId: list.id,
                          text: text.trim(),
                          completed: false,
                          plannedFor,
                        });
                      }
                    }}
                    className="w-full px-3 py-2 rounded font-pixel text-sm"
                    style={{
                      backgroundColor: '#f0f0f0',
                      border: '1px solid #d0d0d0',
                      color: '#333',
                      fontSize: '14px',
                    }}
                  >
                    + Adicionar Item
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <FutureListModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingListId(null);
          }}
          editingListId={editingListId}
        />
      )}
    </div>
  );
}

