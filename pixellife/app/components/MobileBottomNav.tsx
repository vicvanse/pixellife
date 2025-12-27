'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';

interface MobileBottomNavProps {
  onPlusClick?: () => void;
}

export function MobileBottomNav({ onPlusClick }: MobileBottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showQuickActionsModal, setShowQuickActionsModal] = useState(false);

  const handleHomeClick = () => {
    router.push('/display');
  };

  const handleSearchClick = () => {
    setShowSearchModal(true);
  };

  const handlePlusClick = () => {
    if (onPlusClick) {
      onPlusClick();
    } else {
      setShowQuickActionsModal(true);
    }
  };

  const handleQuickAction = (action: string) => {
    setShowQuickActionsModal(false);
    switch (action) {
      case 'journal':
        router.push('/display?overlay=journal');
        break;
      case 'expense':
        router.push('/display?overlay=expenses');
        break;
      case 'habit':
        router.push('/display?overlay=habits');
        break;
      case 'mapas':
        router.push('/mapas');
        break;
      default:
        break;
    }
  };

  return (
    <>
      {/* Barra inferior fixa - Design comercial "Soft Pixel" */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden flex items-center justify-around"
        style={{
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid rgba(0, 0, 0, 0.08)',
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)',
          paddingTop: '12px',
          height: 'calc(72px + max(env(safe-area-inset-bottom, 0px), 12px))',
          minHeight: '84px',
          boxShadow: '0px -2px 8px rgba(0, 0, 0, 0.04)',
        }}
      >
        {/* Casa - Display */}
        <button
          onClick={handleHomeClick}
          className="flex flex-col items-center justify-center touch-manipulation relative"
          style={{
            minWidth: '64px',
            minHeight: '64px',
          }}
          aria-label="Home"
        >
          {/* Ícone pixel art preenchido */}
          <div 
            className="w-8 h-8 relative mb-1"
            style={{
              imageRendering: 'pixelated',
              backgroundColor: pathname === '/display' || pathname === '/board' ? '#4d82ff' : '#9e9e9e',
              border: '2px solid',
              borderColor: pathname === '/display' || pathname === '/board' ? '#1b5cff' : '#666',
            }}
          >
            {/* Casa pixel art */}
            <div className="absolute inset-0.5 bg-white border border-black"></div>
            <div className="absolute top-0.5 left-1/2 transform -translate-x-1/2 w-2 h-1.5 bg-black"></div>
            <div className="absolute top-2 left-1.5 w-1 h-1 bg-black"></div>
            <div className="absolute top-2 right-1.5 w-1 h-1 bg-black"></div>
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-black"></div>
          </div>
          {/* Indicador ativo */}
          {pathname === '/display' || pathname === '/board' ? (
            <div 
              className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full"
              style={{ backgroundColor: '#4d82ff' }}
            />
          ) : null}
          <span 
            className="text-xs font-pixel font-bold" 
            style={{ 
              fontSize: '10px',
              color: pathname === '/display' || pathname === '/board' ? '#4d82ff' : '#666',
            }}
          >
            Display
          </span>
        </button>

        {/* Busca */}
        <button
          onClick={handleSearchClick}
          className="flex flex-col items-center justify-center touch-manipulation relative"
          style={{
            minWidth: '64px',
            minHeight: '64px',
          }}
          aria-label="Buscar"
        >
          {/* Ícone pixel art preenchido */}
          <div 
            className="w-8 h-8 relative mb-1"
            style={{
              imageRendering: 'pixelated',
              backgroundColor: '#9e9e9e',
              border: '2px solid #666',
            }}
          >
            {/* Lupa pixel art */}
            <div className="absolute top-1 left-1 w-4 h-4 bg-white border border-black rounded-full"></div>
            <div className="absolute bottom-0.5 right-0.5 w-1.5 h-0.5 bg-black transform rotate-45 origin-bottom-right"></div>
          </div>
          <span 
            className="text-xs font-pixel font-bold" 
            style={{ fontSize: '10px', color: '#666' }}
          >
            Buscar
          </span>
        </button>

        {/* Plus - Ações rápidas */}
        <button
          onClick={handlePlusClick}
          className="flex flex-col items-center justify-center touch-manipulation relative"
          style={{
            minWidth: '64px',
            minHeight: '64px',
          }}
          aria-label="Adicionar"
        >
          {/* Ícone pixel art preenchido */}
          <div 
            className="w-8 h-8 relative mb-1 flex items-center justify-center"
            style={{
              imageRendering: 'pixelated',
              backgroundColor: '#7aff7a',
              border: '2px solid #0f9d58',
              borderRadius: '8px',
            }}
          >
            {/* Plus pixel art */}
            <div className="w-4 h-0.5 bg-black"></div>
            <div className="absolute w-0.5 h-4 bg-black"></div>
          </div>
          <span 
            className="text-xs font-pixel font-bold" 
            style={{ fontSize: '10px', color: '#666' }}
          >
            Adicionar
          </span>
        </button>
      </div>

      {/* Modal de busca (placeholder por enquanto) */}
      {showSearchModal && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center md:hidden"
          onClick={() => setShowSearchModal(false)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-pixel-bold mb-4" style={{ color: '#333', fontSize: '18px' }}>
              Buscar
            </h2>
            <input
              type="text"
              placeholder="Buscar hábitos, diário, finanças..."
              className="w-full border-2 border-black p-3 font-pixel"
              autoFocus
            />
            <p className="mt-4 text-sm font-pixel" style={{ color: '#666' }}>
              Funcionalidade de busca em desenvolvimento...
            </p>
            <button
              onClick={() => setShowSearchModal(false)}
              className="mt-4 w-full bg-gray-200 border-2 border-black px-4 py-2 font-pixel-bold"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Modal de ações rápidas */}
      {showQuickActionsModal && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] flex items-end justify-center md:hidden"
          onClick={() => setShowQuickActionsModal(false)}
        >
          <div
            className="bg-white rounded-t-lg w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
            style={{
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
            }}
          >
            <div className="p-4 border-b-2 border-[#d0d0d0]">
              <h2 className="font-pixel-bold text-center" style={{ color: '#333', fontSize: '18px' }}>
                Ações Rápidas
              </h2>
            </div>
            <div className="p-4 space-y-2">
              <button
                onClick={() => handleQuickAction('journal')}
                className="w-full text-left px-4 py-3 rounded-lg font-pixel transition-colors touch-manipulation"
                style={{
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #e0e0e0',
                  color: '#111',
                  minHeight: '56px',
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">📔</span>
                  <span>Adicionar pensamento rápido</span>
                </div>
              </button>
              <button
                onClick={() => handleQuickAction('expense')}
                className="w-full text-left px-4 py-3 rounded-lg font-pixel transition-colors touch-manipulation"
                style={{
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #e0e0e0',
                  color: '#111',
                  minHeight: '56px',
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">💰</span>
                  <span>Adicionar gasto</span>
                </div>
              </button>
              <button
                onClick={() => handleQuickAction('habit')}
                className="w-full text-left px-4 py-3 rounded-lg font-pixel transition-colors touch-manipulation"
                style={{
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #e0e0e0',
                  color: '#111',
                  minHeight: '56px',
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">✅</span>
                  <span>Adicionar hábito</span>
                </div>
              </button>
              <button
                onClick={() => handleQuickAction('mapas')}
                className="w-full text-left px-4 py-3 rounded-lg font-pixel transition-colors touch-manipulation"
                style={{
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #e0e0e0',
                  color: '#111',
                  minHeight: '56px',
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🗺️</span>
                  <span>Explorar Mapas</span>
                </div>
              </button>
            </div>
            <div className="p-4 border-t-2 border-[#d0d0d0]">
              <button
                onClick={() => setShowQuickActionsModal(false)}
                className="w-full bg-gray-200 border-2 border-black px-4 py-3 font-pixel-bold rounded-lg touch-manipulation"
                style={{ minHeight: '48px' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

