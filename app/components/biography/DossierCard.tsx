'use client';

import { Dossier } from '@/app/hooks/useDossiers';

interface DossierCardProps {
  dossier: Dossier;
  onDoubleClick: () => void;
  onTogglePin?: () => void;
}

export function DossierCard({ dossier, onDoubleClick, onTogglePin }: DossierCardProps) {
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;
    
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const itemCount = dossier.itemCount ?? 0;
  const itemText = itemCount === 1 ? 'item' : 'itens';

  return (
    <div
      className="p-4 rounded cursor-pointer transition-all relative"
      style={{
        backgroundColor: '#f7f7f7',
        border: '1px solid #e0e0e0',
        borderRadius: '6px',
      }}
      onDoubleClick={onDoubleClick}
    >
      {/* Ícone de fixar no canto superior direito */}
      {onTogglePin && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin();
          }}
          className="absolute top-2 right-2 z-10"
          style={{
            fontSize: '18px',
            color: dossier.pinned ? '#ffa500' : '#999',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            lineHeight: '1',
          }}
          title={dossier.pinned ? 'Desfixar' : 'Fixar'}
        >
          {dossier.pinned ? '⭐' : '☆'}
        </button>
      )}

      {/* Ícone de pasta */}
      <div className="mb-3" style={{ fontSize: '32px', lineHeight: '1' }}>
        📁
      </div>

      {/* Nome grande */}
      <h3 
        className="font-pixel-bold mb-2" 
        style={{ 
          color: '#111', 
          fontSize: '18px',
          lineHeight: '1.3',
          wordBreak: 'break-word',
        }}
      >
        {dossier.title}
      </h3>

      {/* Metadados pequenos embaixo */}
      <div className="space-y-1">
        <p className="font-pixel" style={{ color: '#666', fontSize: '12px' }}>
          {itemCount > 0 ? `${itemCount} ${itemText}` : 'Vazio'}
        </p>
        <p className="font-pixel" style={{ color: '#999', fontSize: '11px' }}>
          Atualizado {formatDate(dossier.updatedAt)}
        </p>
        {dossier.description && (
          <p 
            className="font-pixel mt-2 line-clamp-1" 
            style={{ 
              color: '#777', 
              fontSize: '12px',
              lineHeight: '1.4',
            }}
          >
            {dossier.description}
          </p>
        )}
      </div>

      {/* Dica de duplo clique */}
      <p 
        className="font-pixel mt-2" 
        style={{ 
          color: '#999', 
          fontSize: '10px',
          fontStyle: 'italic',
        }}
      >
        Duplo clique para abrir
      </p>
    </div>
  );
}
