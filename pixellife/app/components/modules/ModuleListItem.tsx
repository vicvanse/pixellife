'use client';

import { Module } from '@/app/hooks/useUserModules';

interface ModuleListItemProps {
  module: Module;
  isActive: boolean;
  onToggle: () => void;
}

export function ModuleListItem({ module, isActive, onToggle }: ModuleListItemProps) {
  const handleDivClick = (e: React.MouseEvent) => {
    // Só toggle se o clique não foi diretamente no checkbox ou no wrapper do checkbox
    const target = e.target as HTMLElement;
    // Se o target é o input, um label, ou está dentro de um input/label, não fazer nada
    if (target.tagName === 'INPUT' || target.tagName === 'LABEL' || target.closest('input') || target.closest('label')) {
      return;
    }
    // Se clicou em qualquer outro lugar do card, fazer toggle
    e.preventDefault();
    e.stopPropagation();
    onToggle();
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Prevenir propagação para não disparar o onClick do div
    e.stopPropagation();
    // O toggle é feito automaticamente pelo React (checked={isActive})
    // Mas precisamos atualizar o estado manualmente
    onToggle();
  };

  const handleCheckboxClick = (e: React.MouseEvent<HTMLInputElement>) => {
    // Prevenir que o clique no checkbox dispare o onClick do div
    e.stopPropagation();
  };

  const handleCheckboxWrapperClick = (e: React.MouseEvent) => {
    // Prevenir que cliques no wrapper do checkbox disparem o onClick do div
    e.stopPropagation();
  };

  return (
    <div
      className="flex items-center gap-3 p-3 rounded transition-colors cursor-pointer"
      onClick={handleDivClick}
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5E5E5',
        borderRadius: '8px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#FAFAFA';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#FFFFFF';
      }}
    >
      <div onClick={handleCheckboxWrapperClick}>
        <input
          type="checkbox"
          checked={isActive}
          onChange={handleCheckboxChange}
          onClick={handleCheckboxClick}
          className="w-4 h-4 rounded cursor-pointer"
          style={{
            accentColor: '#007AFF',
            cursor: 'pointer',
          }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <h3
          className="font-medium"
          style={{
            color: '#1D1D1F',
            fontSize: '15px',
            fontWeight: 400,
          }}
        >
          {module.name}
        </h3>
        <p
          className="text-sm"
          style={{
            color: '#86868B',
            fontSize: '13px',
            fontWeight: 300,
            marginTop: '2px',
          }}
        >
          {module.description}
        </p>
      </div>
    </div>
  );
}

