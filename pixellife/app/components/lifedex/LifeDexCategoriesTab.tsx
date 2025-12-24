'use client';

import { useState } from 'react';
import { useLifeDex } from '@/app/hooks/useLifeDex';
import { CategoryModal } from './CategoryModal';

interface LifeDexCategoriesTabProps {
  onSelectCategory: (categoryId: string) => void;
}

export function LifeDexCategoriesTab({ onSelectCategory }: LifeDexCategoriesTabProps) {
  const { categories, getCategoryProgress, deleteCategory } = useLifeDex();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);

  const handleEdit = (categoryId: string) => {
    setEditingCategory(categoryId);
    setIsModalOpen(true);
  };

  const handleDelete = (categoryId: string) => {
    if (confirm('Tem certeza que deseja excluir esta categoria? Todos os itens serão removidos.')) {
      deleteCategory(categoryId);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-pixel-bold" style={{ color: '#333', fontSize: '18px' }}>
          Categorias
        </h2>
        <button
          onClick={() => {
            setEditingCategory(null);
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
          + Nova Categoria
        </button>
      </div>

      {categories.length === 0 ? (
        <p className="font-pixel text-center py-8" style={{ color: '#999', fontSize: '16px' }}>
          Nenhuma categoria ainda. Crie sua primeira categoria para começar!
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => {
            const progress = getCategoryProgress(category.id);
            return (
              <div
                key={category.id}
                className="p-4 rounded-md cursor-pointer transition-all hover:shadow-md"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                }}
                onClick={() => onSelectCategory(category.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {category.icon && (
                        <span style={{ fontSize: '20px' }}>{category.icon}</span>
                      )}
                      <h3 className="font-pixel-bold" style={{ color: '#333', fontSize: '16px' }}>
                        {category.name}
                      </h3>
                    </div>
                    {category.description && (
                      <p className="font-pixel mb-2" style={{ color: '#666', fontSize: '14px' }}>
                        {category.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(category.id);
                      }}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(category.id);
                      }}
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
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <CategoryModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingCategory(null);
          }}
          editingCategoryId={editingCategory}
        />
      )}
    </div>
  );
}

