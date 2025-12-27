"use client";

import { ReactNode } from "react";

interface PixelArtWindowProps {
  title: string;
  children: ReactNode;
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  className?: string;
  showControls?: boolean;
  // Tamanho dos sprites de borda (em pixels)
  borderSize?: number;
}

/**
 * Componente de janela em pixel art usando sprites de borda
 * 
 * Este componente demonstra como criar uma interface pixel art usando:
 * 1. Sprites de borda (9-slice) - quando você tiver as imagens
 * 2. Fallback CSS - enquanto não tem as imagens
 * 
 * Para usar com sprites reais:
 * 1. Crie as imagens em pixel art (ex: 16x16px ou 32x32px)
 * 2. Coloque em public/pixel-ui/window/
 * 3. Descomente as seções de sprites abaixo
 */
export function PixelArtWindow({
  title,
  children,
  onClose,
  onMinimize,
  onMaximize,
  className = "",
  showControls = true,
  borderSize = 16, // Tamanho padrão dos sprites (ajuste conforme suas imagens)
}: PixelArtWindowProps) {
  // ============================================
  // Fallback CSS (temporário)
  // ============================================
  // Use enquanto não tem as imagens de pixel art
  // Este é apenas um placeholder visual
  // 
  // Para usar sprites reais, veja o componente PixelWindow.tsx
  // que usa CSS Grid com 9-slice

  return (
    <div
      className={`relative bg-gray-800 ${className}`}
      style={{
        border: "4px solid #000",
        boxShadow: `
          inset -2px -2px 0 0 #555,
          inset 2px 2px 0 0 #aaa,
          4px 4px 0 0 #000
        `,
      }}
    >
      {/* Barra de título */}
      <div
        className="bg-gray-800 px-3 py-2 flex items-center justify-between"
        style={{
          borderBottom: "4px solid #000",
          boxShadow: "inset -1px -1px 0 0 #555, inset 1px 1px 0 0 #aaa",
        }}
      >
        <span className="text-white font-mono text-sm font-bold">{title}</span>
        
        {showControls && (
          <div className="flex items-center gap-1">
            {onMinimize && (
              <button
                onClick={onMinimize}
                className="w-6 h-6 bg-gray-700 border-2 border-black flex items-center justify-center hover:bg-gray-600 active:bg-gray-500"
                style={{
                  boxShadow: "inset -1px -1px 0 0 #555, inset 1px 1px 0 0 #aaa",
                }}
                title="Minimizar"
              >
                <span className="text-white text-xs font-bold">−</span>
              </button>
            )}
            {onMaximize && (
              <button
                onClick={onMaximize}
                className="w-6 h-6 bg-gray-700 border-2 border-black flex items-center justify-center hover:bg-gray-600 active:bg-gray-500"
                style={{
                  boxShadow: "inset -1px -1px 0 0 #555, inset 1px 1px 0 0 #aaa",
                }}
                title="Maximizar"
              >
                <span className="text-white text-xs font-bold">□</span>
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="w-6 h-6 bg-gray-700 border-2 border-black flex items-center justify-center hover:bg-red-600 active:bg-red-700"
                style={{
                  boxShadow: "inset -1px -1px 0 0 #555, inset 1px 1px 0 0 #aaa",
                }}
                title="Fechar"
              >
                <span className="text-white text-xs font-bold">×</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Área de conteúdo */}
      <div 
        className="bg-white p-6"
        style={{
          borderTop: "2px solid #ddd",
        }}
      >
        {children}
      </div>
    </div>
  );
}

