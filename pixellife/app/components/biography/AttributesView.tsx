'use client';

import { useAttributes, Attribute } from '@/app/hooks/useAttributes';
import { useLanguage } from '@/app/context/LanguageContext';

interface AttributesViewProps {
  onEdit: (attribute: Attribute) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

const CATEGORY_LABELS: Record<NonNullable<Attribute['category']>, { label: string; emoji: string }> = {
  physical: { label: 'Físico', emoji: '🧬' },
  preference: { label: 'Preferências', emoji: '🎨' },
  skill: { label: 'Habilidades', emoji: '🛠' },
  trait: { label: 'Traços', emoji: '✨' },
  other: { label: 'Outros', emoji: '📌' },
};

const CATEGORY_ORDER: (Attribute['category'] | 'other')[] = ['physical', 'preference', 'skill', 'trait', 'other'];

export function AttributesView({ onEdit, onDelete, onAdd }: AttributesViewProps) {
  const { t } = useLanguage();
  const { attributes, getAttributesByCategory } = useAttributes();

  // Agrupar atributos por categoria (não usado diretamente, mas mantido para referência)
  // const groupedAttributes: Record<string, Attribute[]> = {};
  // CATEGORY_ORDER.forEach((cat) => {
  //   const catKey = cat || 'other';
  //   groupedAttributes[catKey] = getAttributesByCategory(cat || undefined);
  // });

  // Atributos sem categoria
  const uncategorized = attributes.filter((attr) => !attr.category);

  const renderChip = (attribute: Attribute) => {
    const categoryInfo = attribute.category 
      ? CATEGORY_LABELS[attribute.category as NonNullable<Attribute['category']>]
      : null;

    return (
      <div
        key={attribute.id}
        className="group relative cursor-pointer transition-all"
        onClick={() => onEdit(attribute)}
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #000',
          borderRadius: '4px',
          padding: '6px 12px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#4caf50';
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#000';
          e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
        }}
      >
        {categoryInfo && (
          <span className="text-base" style={{ fontSize: '16px', lineHeight: '1' }}>
            {categoryInfo.emoji}
          </span>
        )}
        <span className="font-pixel-bold" style={{ color: '#111', fontSize: '13px', whiteSpace: 'nowrap' }}>
          {attribute.label}
        </span>
        
        {/* Botão deletar (no hover) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Remover "${attribute.label}"?`)) {
              onDelete(attribute.id);
            }
          }}
          className="absolute -top-1.5 -right-1.5 bg-red-500 border-2 border-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ fontSize: '12px', color: '#fff', fontWeight: 'bold' }}
          title="Remover"
        >
          ×
        </button>
      </div>
    );
  };

  const renderCategorySection = (categoryKey: Attribute['category'] | 'other', label: string, emoji: string) => {
    const categoryAttributes = categoryKey === 'other' 
      ? uncategorized 
      : getAttributesByCategory(categoryKey || undefined);

    if (categoryAttributes.length === 0) return null;

    return (
      <div key={categoryKey || 'other'} className="mb-6">
        <h3 
          className="font-pixel-bold mb-3" 
          style={{ 
            color: '#666', 
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          {emoji} {label}
        </h3>
        <div className="flex flex-wrap gap-2">
          {categoryAttributes.map((attr) => renderChip(attr))}
          <button
            onClick={onAdd}
            className="flex items-center justify-center border border-dashed border-gray-300 rounded transition-all hover:bg-gray-50 hover:border-gray-400"
            style={{
              width: '36px',
              height: '36px',
              color: '#999',
              fontSize: '18px',
            }}
            title="Adicionar atributo"
          >
            +
          </button>
        </div>
      </div>
    );
  };

  const hasAnyAttributes = attributes.length > 0;

  return (
    <div
      className="w-full"
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}
    >
      {/* Cabeçalho interno */}
      <div className="flex justify-between items-center mb-6 pb-4" style={{ borderBottom: '1px solid #e5e5e5' }}>
        <h2 className="font-pixel-bold" style={{ color: '#111', fontSize: '18px' }}>
          ATRIBUTOS
        </h2>
        <button
          onClick={onAdd}
          className="bg-green-400 border border-black px-4 py-2 font-bold hover:bg-green-500 shadow-[2px_2px_0_0_#000]"
        >
          + Novo
        </button>
      </div>

      {/* Conteúdo - Seções de categorias */}
      {!hasAnyAttributes ? (
        <div className="text-center py-12">
          <p className="font-pixel mb-2" style={{ color: '#999', fontSize: '14px' }}>
            Nenhum atributo ainda.
          </p>
          <p className="font-pixel text-xs" style={{ color: '#bbb' }}>
            Adicione características sobre você para começar.
          </p>
        </div>
      ) : (
        <div>
          {CATEGORY_ORDER.map((cat) => {
            const catKey = cat || 'other';
            const categoryInfo = catKey === 'other' 
              ? { label: 'Outros', emoji: '📌' }
              : (CATEGORY_LABELS[catKey as NonNullable<Attribute['category']>] || { label: 'Outros', emoji: '📌' });
            return renderCategorySection(catKey, categoryInfo.label, categoryInfo.emoji);
          })}
          
          {/* Seção para atributos sem categoria (se houver) */}
          {uncategorized.length > 0 && (
            <div className="mb-6">
              <h3 
                className="font-pixel-bold mb-3" 
                style={{ 
                  color: '#666', 
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                📌 Outros
              </h3>
              <div className="flex flex-wrap gap-2">
                {uncategorized.map((attr) => renderChip(attr))}
                <button
                  onClick={onAdd}
                  className="flex items-center justify-center border border-dashed border-gray-300 rounded transition-all hover:bg-gray-50 hover:border-gray-400"
                  style={{
                    width: '36px',
                    height: '36px',
                    color: '#999',
                    fontSize: '18px',
                  }}
                  title="Adicionar atributo"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
