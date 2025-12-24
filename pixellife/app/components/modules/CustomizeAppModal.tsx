'use client';

import { useState, useEffect } from 'react';
import { useUserModules, AVAILABLE_MODULES, ModuleId } from '@/app/hooks/useUserModules';
import { ModuleListItem } from './ModuleListItem';

interface CustomizeAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Valores padrão (todos ativos) - mesmo do hook
const DEFAULT_MODULES: Record<ModuleId, boolean> = {
  biography: true,
  habits: true,
  journal: true,
  finances: true,
  objectives: true,
  maps: true,
  cosmetics: true,
  statistics: true,
};

export function CustomizeAppModal({ isOpen, onClose }: CustomizeAppModalProps) {
  const { modules, saveModules, restoreDefaults } = useUserModules();
  const [tempModules, setTempModules] = useState<Record<ModuleId, boolean>>(DEFAULT_MODULES);

  // Carregar módulos apenas ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      // Carrega uma vez ao abrir o modal
      setTempModules(modules);
    }
  }, [isOpen, modules]); // Adicionado modules novamente, mas só quando isOpen muda para true

  if (!isOpen) return null;

  const handleToggle = (moduleId: ModuleId) => {
    setTempModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const handleOK = async () => {
    await saveModules(tempModules);
    onClose();
    // O saveModules já atualiza o estado do hook, que deve causar re-render automático
  };

  const handleCancel = () => {
    setTempModules(modules); // Resetar para estado salvo
    onClose();
  };

  const handleReset = async () => {
    // Restaurar padrões (todos ativos)
    const defaultModules: Record<ModuleId, boolean> = {
      biography: true,
      habits: true,
      journal: true,
      finances: true,
      objectives: true,
      maps: true,
      cosmetics: true,
      statistics: true,
    };
    setTempModules(defaultModules);
    // Não salva automaticamente, apenas atualiza o estado temporário
    // O usuário precisa clicar em OK para salvar
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={handleCancel}
      style={{
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Content - Lista compacta */}
        <div
          className="overflow-y-auto px-4 py-3"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#E5E5E5 transparent',
            maxHeight: '400px',
          }}
        >
          <div className="space-y-1">
            {AVAILABLE_MODULES.map((module) => (
              <ModuleListItem
                key={module.id}
                module={module}
                isActive={tempModules[module.id]}
                onToggle={() => handleToggle(module.id)}
              />
            ))}
          </div>
        </div>

        {/* Footer - Botões Reset, Cancelar e OK */}
        <div
          className="px-4 py-3 border-t flex gap-2"
          style={{
            borderColor: '#E5E5E5',
            backgroundColor: '#FAFAFA',
          }}
        >
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: '#F2F2F2',
              color: '#1D1D1F',
              fontSize: '15px',
              fontWeight: 400,
              flex: '0 0 auto',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#E5E5E5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#F2F2F2';
            }}
          >
            Reset
          </button>
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: '#F2F2F2',
              color: '#1D1D1F',
              fontSize: '15px',
              fontWeight: 400,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#E5E5E5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#F2F2F2';
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleOK}
            className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: '#007AFF',
              color: '#FFFFFF',
              fontSize: '15px',
              fontWeight: 400,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#0051D5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#007AFF';
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

