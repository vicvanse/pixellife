'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type UIMode = 'game' | 'board';
type ViewMode = 'continuous' | 'focused';

interface UIContextType {
  mode: UIMode;
  setMode: (mode: UIMode) => void;
  toggleMode: () => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<UIMode>('board'); // Modo padrão: board (Modo Tábua)
  const [viewMode, setViewModeState] = useState<ViewMode>('focused'); // Modo padrão: focado (para novos usuários)
  const [mounted, setMounted] = useState(false);

  // Carregar modos do localStorage ao montar
  // SEMPRE usar modo 'board' (Tábua) - modo Pixel Art foi removido
  useEffect(() => {
    // Forçar modo board sempre
    setModeState('board');
    
    const savedViewMode = localStorage.getItem('viewMode') as ViewMode;
    if (savedViewMode === 'continuous' || savedViewMode === 'focused') {
      setViewModeState(savedViewMode);
    }
    
    setMounted(true);
  }, []);

  // Salvar modos no localStorage quando mudarem e aplicar classe no body
  // SEMPRE usar modo 'board' (Tábua) - modo Pixel Art foi removido
  useEffect(() => {
    if (mounted) {
      // Forçar modo board sempre
      localStorage.setItem('uiMode', 'board');
      localStorage.setItem('viewMode', viewMode);
      // Aplicar classe no body
      document.body.classList.remove('gamified-ui', 'board-ui', 'game-ui');
      document.body.classList.add('board-ui');
    }
  }, [viewMode, mounted]);

  const setMode = (newMode: UIMode) => {
    // Sempre forçar modo board - modo Pixel Art foi removido
    setModeState('board');
  };

  const toggleMode = () => {
    // Modo sempre board - não há mais alternância
    setModeState('board');
  };

  const setViewMode = (newViewMode: ViewMode) => {
    setViewModeState(newViewMode);
  };

  const toggleViewMode = () => {
    setViewModeState(prev => prev === 'continuous' ? 'focused' : 'continuous');
  };

  return (
    <UIContext.Provider value={{ mode, setMode, toggleMode, viewMode, setViewMode, toggleViewMode }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}

