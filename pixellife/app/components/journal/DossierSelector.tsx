"use client";

import { useState, useRef, useEffect } from 'react';
import { useDossiers, Dossier } from '@/app/hooks/useDossiers';

interface DossierSelectorProps {
  selectedDossierIds: string[];
  onSelect: (dossierId: string) => void;
  onDeselect: (dossierId: string) => void;
  onClose: () => void;
}

export function DossierSelector({ 
  selectedDossierIds, 
  onSelect, 
  onDeselect, 
  onClose 
}: DossierSelectorProps) {
  const { dossiers } = useDossiers();
  const [searchQuery, setSearchQuery] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Filtrar dossiês
  const filteredDossiers = dossiers.filter(dossier =>
    dossier.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separar fixados e recentes
  const pinnedDossiers = filteredDossiers.filter(d => d.pinned);
  const recentDossiers = filteredDossiers
    .filter(d => !d.pinned)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5); // Apenas 5 mais recentes

  const handleToggle = (dossierId: string) => {
    if (selectedDossierIds.includes(dossierId)) {
      onDeselect(dossierId);
    } else {
      onSelect(dossierId);
    }
  };

  return (
    <div
      ref={popoverRef}
      className="absolute z-50 bg-white border-4 border-black shadow-[6px_6px_0_0_#000] font-mono"
      style={{
        width: '280px',
        maxHeight: '400px',
        top: '100%',
        left: 0,
        marginTop: '4px',
      }}
    >
      {/* Campo de busca */}
      <div className="p-3 border-b-2 border-black">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar dossiê..."
          className="w-full px-2 py-1 border-2 border-black focus:outline-none font-pixel text-sm"
          autoFocus
        />
      </div>

      {/* Conteúdo scrollável */}
      <div className="overflow-y-auto" style={{ maxHeight: '320px' }}>
        {/* Dossiês fixados */}
        {pinnedDossiers.length > 0 && (
          <div className="p-2">
            <div className="text-xs font-pixel-bold mb-2 px-2" style={{ color: '#666' }}>
              ⭐ Fixados
            </div>
            {pinnedDossiers.map(dossier => (
              <DossierItem
                key={dossier.id}
                dossier={dossier}
                isSelected={selectedDossierIds.includes(dossier.id)}
                onToggle={() => handleToggle(dossier.id)}
              />
            ))}
          </div>
        )}

        {/* Dossiês recentes */}
        {recentDossiers.length > 0 && (
          <div className="p-2 border-t-2 border-black">
            <div className="text-xs font-pixel-bold mb-2 px-2" style={{ color: '#666' }}>
              📁 Recentes
            </div>
            {recentDossiers.map(dossier => (
              <DossierItem
                key={dossier.id}
                dossier={dossier}
                isSelected={selectedDossierIds.includes(dossier.id)}
                onToggle={() => handleToggle(dossier.id)}
              />
            ))}
          </div>
        )}

        {/* Sem resultados */}
        {filteredDossiers.length === 0 && (
          <div className="p-4 text-center font-pixel text-sm" style={{ color: '#999' }}>
            Nenhum dossiê encontrado
          </div>
        )}
      </div>
    </div>
  );
}

interface DossierItemProps {
  dossier: Dossier;
  isSelected: boolean;
  onToggle: () => void;
}

function DossierItem({ dossier, isSelected, onToggle }: DossierItemProps) {
  return (
    <button
      onClick={onToggle}
      className="w-full text-left px-2 py-2 mb-1 hover:bg-gray-100 transition-colors flex items-center gap-2"
      style={{
        backgroundColor: isSelected ? '#e3f2fd' : 'transparent',
        border: isSelected ? '2px solid #2196f3' : '1px solid transparent',
      }}
    >
      <span className="text-sm font-pixel" style={{ color: isSelected ? '#2196f3' : '#333' }}>
        {isSelected ? '☑' : '☐'} {dossier.title}
      </span>
    </button>
  );
}









