'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/app/context/LanguageContext';
import { useAboutItems, AboutItem, AboutItemCategory, ABOUT_CATEGORIES } from '@/app/hooks/useAboutItems';

interface AboutItemsSectionProps {
  onAddItem: (category: AboutItemCategory) => void;
  onEditItem: (item: AboutItem) => void;
  onDeleteItem: (id: string) => void;
}

export function AboutItemsSection({ onAddItem, onEditItem, onDeleteItem }: AboutItemsSectionProps) {
  const { t } = useLanguage();
  const { getItemsByCategory, items } = useAboutItems();
  const [selectedCategory, setSelectedCategory] = useState<AboutItemCategory | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  
  // Forçar re-render quando os itens mudarem
  useEffect(() => {
    // Este useEffect garante que o componente re-renderize quando os itens mudarem
  }, [items]);

  const categories: AboutItemCategory[] = ['books', 'albums', 'films', 'ideas', 'authors', 'places'];

  // Função para renderizar card de favorito
  const renderFavoriteCard = (item: AboutItem) => {
    const isHovered = hoveredItem === item.id;
    const hasCover = item.coverImage && ['books', 'albums', 'films'].includes(item.category);
    const isTextual = ['ideas', 'authors'].includes(item.category);
    const isPlace = item.category === 'places';

    return (
      <div
        key={item.id}
        className="relative group cursor-pointer transition-all"
        onMouseEnter={() => setHoveredItem(item.id)}
        onMouseLeave={() => setHoveredItem(null)}
        onClick={() => onEditItem(item)}
        style={{
          backgroundColor: isTextual ? '#f8f8f8' : '#FFFFFF',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '12px',
          minHeight: hasCover ? '180px' : 'auto',
          position: 'relative',
        }}
      >
        {/* Botão remover (só no hover) */}
        {isHovered && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Tem certeza que deseja remover "${item.label}"?`)) {
                onDeleteItem(item.id);
              }
            }}
            className="absolute top-2 right-2 z-10 bg-white border border-gray-300 rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-50 hover:border-red-300 transition-colors"
            style={{ fontSize: '14px', color: '#666' }}
            title="Remover"
          >
            ×
          </button>
        )}

        {/* Card com capa (livros, álbuns, filmes) */}
        {hasCover && (
          <div className="flex flex-col h-full">
            <div className="flex-shrink-0 mb-2" style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5', borderRadius: '4px', overflow: 'hidden' }}>
              {item.coverImage ? (
                <img
                  src={item.coverImage}
                  alt={item.label}
                  className="w-full h-full object-cover"
                  style={{ imageRendering: 'pixelated' }}
                />
              ) : (
                <div className="text-gray-400 text-4xl">
                  {item.category === 'books' ? '📚' : item.category === 'albums' ? '🎵' : '🎬'}
                </div>
              )}
            </div>
            <div className="flex-1 flex flex-col">
              <h4 
                className="font-pixel-bold mb-1" 
                style={{ 
                  color: '#111', 
                  fontSize: '14px',
                  lineHeight: '1.3',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                }}
                title={item.label}
              >
                {item.label}
              </h4>
              {item.metadata?.author && (
                <p 
                  className="font-pixel" 
                  style={{ 
                    color: '#666', 
                    fontSize: '12px',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {item.metadata.author}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Card textual (ideias, autores) */}
        {isTextual && (
          <div className="flex flex-col h-full">
            <div className="flex items-start gap-2 mb-2">
              <span className="text-2xl flex-shrink-0">
                {item.category === 'ideas' ? '💡' : '✍️'}
              </span>
              <div className="flex-1 min-w-0">
                <h4 
                  className="font-pixel-bold mb-1" 
                  style={{ color: '#111', fontSize: '14px' }}
                >
                  {item.category === 'ideas' ? 'Ideia' : item.metadata?.author || 'Autor'}
                </h4>
                <p 
                  className="font-pixel" 
                  style={{ 
                    color: '#333', 
                    fontSize: '13px',
                    lineHeight: '1.4',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {item.label}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Card de lugar */}
        {isPlace && (
          <div className="flex flex-col h-full">
            <div className="flex items-start gap-2 mb-2">
              <span className="text-xl flex-shrink-0">📍</span>
              <div className="flex-1 min-w-0">
                <h4 
                  className="font-pixel-bold mb-1" 
                  style={{ color: '#111', fontSize: '14px' }}
                >
                  {item.label}
                </h4>
                {(item.metadata?.city || item.metadata?.country) && (
                  <p 
                    className="font-pixel" 
                    style={{ color: '#666', fontSize: '12px' }}
                  >
                    {[item.metadata.city, item.metadata.country].filter(Boolean).join(', ')}
                  </p>
                )}
                {item.metadata?.year && (
                  <p 
                    className="font-pixel" 
                    style={{ color: '#999', fontSize: '11px', marginTop: '2px' }}
                  >
                    {item.metadata.year}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Nota pessoal e "favorito desde" (só no hover) */}
        {isHovered && (
          <div 
            className="absolute bottom-0 left-0 right-0 p-2 bg-white border-t border-gray-200 rounded-b-lg"
            style={{ 
              boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
              zIndex: 5,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {item.personalNote && (
              <p 
                className="font-pixel mb-1" 
                style={{ color: '#555', fontSize: '12px', lineHeight: '1.3' }}
              >
                {item.personalNote}
              </p>
            )}
            {item.addedYear && (
              <p 
                className="font-pixel" 
                style={{ color: '#999', fontSize: '11px' }}
              >
                favorito desde {item.addedYear}
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Categorias - Chips mais altos e melhorados */}
      <div className="flex gap-2 flex-wrap mb-6">
        {categories.map((category) => {
          const categoryInfo = ABOUT_CATEGORIES[category];
          const categoryItems = getItemsByCategory(category);
          const isActive = selectedCategory === category;
          
          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
              className="px-4 py-3 rounded font-pixel-bold transition-all"
              style={{
                backgroundColor: isActive ? '#f0f0f0' : '#f8f8f8',
                border: isActive ? '2px solid #4caf50' : '1px solid #e5e5e5',
                color: isActive ? '#111' : '#666',
                fontSize: '14px',
                minHeight: '44px',
                boxShadow: isActive ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
              }}
            >
              <span className="mr-1">{categoryInfo.emoji}</span>
              <span>{categoryInfo.label}</span>
              {categoryItems.length > 0 && (
                <span 
                  className="ml-2 font-pixel" 
                  style={{ 
                    fontSize: '11px', 
                    color: '#999',
                    fontWeight: 'normal',
                  }}
                >
                  ({categoryItems.length})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Grid de cards */}
      {selectedCategory && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-pixel-bold" style={{ color: '#333', fontSize: '18px' }}>
              {ABOUT_CATEGORIES[selectedCategory].emoji} {ABOUT_CATEGORIES[selectedCategory].label}
            </h3>
          </div>
          
          {getItemsByCategory(selectedCategory).length === 0 ? (
            <div className="text-center py-12">
              <p className="font-pixel mb-4" style={{ color: '#999', fontSize: '16px' }}>
                Nenhum item ainda.
              </p>
              <button
                onClick={() => onAddItem(selectedCategory)}
                className="px-4 py-2 rounded font-pixel-bold transition-colors hover:opacity-90"
                style={{
                  backgroundColor: '#7aff7a',
                  border: '1px solid #0f9d58',
                  color: '#111',
                  fontSize: '14px',
                  borderRadius: '8px',
                }}
              >
                + Adicionar primeiro item
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {getItemsByCategory(selectedCategory).map((item) => renderFavoriteCard(item))}
              
              {/* Botão "+" sempre visível */}
              <button
                onClick={() => onAddItem(selectedCategory)}
                className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-green-400 hover:bg-green-50 transition-all cursor-pointer"
                style={{
                  minHeight: '180px',
                }}
                title="Adicionar novo favorito"
              >
                <span className="text-3xl mb-2">+</span>
                <span className="font-pixel text-sm" style={{ color: '#666' }}>
                  Adicionar
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {!selectedCategory && (
        <div className="text-center py-12">
          <p className="font-pixel" style={{ color: '#999', fontSize: '16px' }}>
            Selecione uma categoria para ver seus favoritos.
          </p>
        </div>
      )}
    </div>
  );
}
