'use client';

import { useState } from 'react';
import { useLifeDex } from '@/app/hooks/useLifeDex';
import { LifeDexCategoriesTab } from './LifeDexCategoriesTab';
import { LifeDexItemsTab } from './LifeDexItemsTab';
import { LifeDexFutureTab } from './LifeDexFutureTab';

export function LifeDexSection() {
  const [activeTab, setActiveTab] = useState<'categories' | 'items' | 'future'>('categories');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const { categories } = useLifeDex();

  const selectedCategory = selectedCategoryId ? categories.find(c => c.id === selectedCategoryId) : null;

  return (
    <div>
      {/* Abas */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'thin' }}>
        <button
          onClick={() => {
            setActiveTab('categories');
            setSelectedCategoryId(null);
          }}
          className="px-4 py-2 font-pixel-bold transition-colors flex-shrink-0 touch-manipulation min-h-[44px]"
          style={{
            backgroundColor: activeTab === 'categories' ? '#FFFFFF' : '#d0d0d0',
            border: activeTab === 'categories' ? '1px solid #000' : '1px solid #d0d0d0',
            color: activeTab === 'categories' ? '#111' : '#666',
            fontSize: '16px',
            borderRadius: '6px',
          }}
        >
          Categorias
        </button>
        <button
          onClick={() => setActiveTab('items')}
          disabled={!selectedCategoryId}
          className="px-4 py-2 font-pixel-bold transition-colors flex-shrink-0 touch-manipulation min-h-[44px]"
          style={{
            backgroundColor: activeTab === 'items' && selectedCategoryId ? '#FFFFFF' : '#d0d0d0',
            border: activeTab === 'items' && selectedCategoryId ? '1px solid #000' : '1px solid #d0d0d0',
            color: activeTab === 'items' && selectedCategoryId ? '#111' : '#666',
            fontSize: '16px',
            borderRadius: '6px',
            cursor: selectedCategoryId ? 'pointer' : 'not-allowed',
            opacity: selectedCategoryId ? 1 : 0.5,
          }}
        >
          Itens{selectedCategory && ` - ${selectedCategory.name}`}
        </button>
        <button
          onClick={() => {
            setActiveTab('future');
            setSelectedCategoryId(null);
          }}
          className="px-4 py-2 font-pixel-bold transition-colors flex-shrink-0 touch-manipulation min-h-[44px]"
          style={{
            backgroundColor: activeTab === 'future' ? '#FFFFFF' : '#d0d0d0',
            border: activeTab === 'future' ? '1px solid #000' : '1px solid #d0d0d0',
            color: activeTab === 'future' ? '#111' : '#666',
            fontSize: '16px',
            borderRadius: '6px',
          }}
        >
          Futuro
        </button>
      </div>

      {/* Conteúdo das abas */}
      {activeTab === 'categories' && (
        <LifeDexCategoriesTab
          onSelectCategory={(categoryId) => {
            setSelectedCategoryId(categoryId);
            setActiveTab('items');
          }}
        />
      )}

      {activeTab === 'items' && selectedCategoryId && (
        <LifeDexItemsTab
          categoryId={selectedCategoryId}
          onBack={() => {
            setSelectedCategoryId(null);
            setActiveTab('categories');
          }}
        />
      )}

      {activeTab === 'future' && (
        <LifeDexFutureTab />
      )}
    </div>
  );
}

