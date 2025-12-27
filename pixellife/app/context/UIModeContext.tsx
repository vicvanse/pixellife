'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type UIMode = 'gamified' | 'board';

interface UIModeContextType {
  mode: UIMode;
  setMode: (mode: UIMode) => void;
  toggleMode: () => void;
}

const UIModeContext = createContext<UIModeContextType | undefined>(undefined);

export function UIModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<UIMode>('gamified');
  const [mounted, setMounted] = useState(false);

  // Carregar modo do localStorage ao montar
  useEffect(() => {
    const savedMode = localStorage.getItem('uiMode') as UIMode;
    if (savedMode === 'gamified' || savedMode === 'board') {
      setModeState(savedMode);
    }
    setMounted(true);
  }, []);

  // Salvar modo no localStorage quando mudar e aplicar classe no body
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('uiMode', mode);
      // Aplicar classe no body
      document.body.classList.remove('gamified-ui', 'board-ui');
      document.body.classList.add(`${mode}-ui`);
    }
  }, [mode, mounted]);

  const setMode = (newMode: UIMode) => {
    setModeState(newMode);
  };

  const toggleMode = () => {
    setModeState(prev => prev === 'gamified' ? 'board' : 'gamified');
  };

  return (
    <UIModeContext.Provider value={{ mode, setMode, toggleMode }}>
      {children}
    </UIModeContext.Provider>
  );
}

export function useUIMode() {
  const context = useContext(UIModeContext);
  if (context === undefined) {
    throw new Error('useUIMode must be used within a UIModeProvider');
  }
  return context;
}
