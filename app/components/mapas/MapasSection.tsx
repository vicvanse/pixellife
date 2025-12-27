'use client';

import { useState } from 'react';
import { MapasCategoriesTab } from './MapasCategoriesTab';
import { MapasItemsTab } from './MapasItemsTab';
import { useMapas } from '../../hooks/useMapas';
import { useLanguage } from '../../context/LanguageContext';

type MapasTab = 'categories' | 'items';

export function MapasSection() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<MapasTab>('categories');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { categories, elements, userElements, loading } = useMapas();

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'thin' }}>
        <button
          onClick={() => setActiveTab('categories')}
          className="px-4 py-2 font-pixel-bold transition-colors flex-shrink-0 touch-manipulation min-h-[44px]"
          style={{
            backgroundColor: activeTab === 'categories' ? '#FFFFFF' : '#d0d0d0',
            border: activeTab === 'categories' ? '1px solid #000' : '1px solid #d0d0d0',
            color: activeTab === 'categories' ? '#111' : '#666',
            fontSize: '16px',
            borderRadius: '6px',
          }}
        >
          {t('mapas.categories')}
        </button>
        <button
          onClick={() => setActiveTab('items')}
          className="px-4 py-2 font-pixel-bold transition-colors flex-shrink-0 touch-manipulation min-h-[44px]"
          style={{
            backgroundColor: activeTab === 'items' ? '#FFFFFF' : '#d0d0d0',
            border: activeTab === 'items' ? '1px solid #000' : '1px solid #d0d0d0',
            color: activeTab === 'items' ? '#111' : '#666',
            fontSize: '16px',
            borderRadius: '6px',
          }}
        >
          {t('mapas.items')}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-8">
          <p className="font-pixel text-sm" style={{ color: '#999' }}>
            Carregando...
          </p>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12">
          <p className="font-pixel text-base mb-4" style={{ color: '#666' }}>
            Nenhuma categoria encontrada.
          </p>
          <p className="font-pixel text-sm mb-6" style={{ color: '#999' }}>
            Execute o schema do Supabase para criar as tabelas de Mapas.
          </p>
        </div>
      ) : (
        <>
          {activeTab === 'categories' && (
            <MapasCategoriesTab
              categories={categories}
              userElements={userElements}
              elements={elements}
              onCategorySelect={setSelectedCategory}
            />
          )}
          {activeTab === 'items' && (
            <MapasItemsTab
              categories={categories}
              elements={elements}
              userElements={userElements}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
          )}
        </>
      )}
    </div>
  );
}

