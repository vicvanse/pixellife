'use client';

import { Module } from '@/app/hooks/useUserModules';
import { ToggleIOS } from './ToggleIOS';

interface ModuleCardMinimalProps {
  module: Module;
  isActive: boolean;
  onToggle: () => void;
}

export function ModuleCardMinimal({ module, isActive, onToggle }: ModuleCardMinimalProps) {
  return (
    <div
      className="flex items-center justify-between p-4 rounded-lg transition-colors"
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5E5E5',
        borderRadius: '10px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#FAFAFA';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#FFFFFF';
      }}
    >
      <div className="flex-1 min-w-0">
        <h3
          className="font-medium mb-1"
          style={{
            color: '#1D1D1F',
            fontSize: '16px',
            fontWeight: 400,
            letterSpacing: '-0.01em',
          }}
        >
          {module.name}
        </h3>
        <p
          className="text-sm"
          style={{
            color: '#86868B',
            fontSize: '14px',
            fontWeight: 300,
            lineHeight: '1.4',
          }}
        >
          {module.description}
        </p>
      </div>
      <div className="ml-4 flex-shrink-0">
        <ToggleIOS checked={isActive} onChange={onToggle} />
      </div>
    </div>
  );
}

