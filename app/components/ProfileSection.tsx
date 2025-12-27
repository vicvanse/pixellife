'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StatsPanel } from './display/StatsPanel';
import { DisplayMain } from './display/DisplayMain';
import { ProfilePanel } from './display/ProfilePanel';
import { AvatarSelectorOverlay } from './AvatarSelectorOverlay';

export function ProfileSection() {
  const [isAvatarSelectorOpen, setIsAvatarSelectorOpen] = useState(false);
  const router = useRouter();

  const handleBiographyClick = () => {
    // Navegar para board
    router.push('/board#biography');
    // Disparar eventos para mudar para seção biography e aba "sobre mim"
    setTimeout(() => {
      // Primeiro, mudar para a seção biography
      window.dispatchEvent(new CustomEvent('boardSectionChange', { detail: { section: 'biography' } }));
      // Depois, mudar para a aba "sobre mim"
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('setBiographyTab', { detail: { tab: 'about' } }));
      }, 50);
    }, 200);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Painel lateral esquerdo - MY STATS */}
        {/* No mobile: order-2 (segundo), no desktop: order-1 (primeiro) */}
        <div className="md:col-span-3 order-2 md:order-1">
          <StatsPanel />
          <button
            onClick={handleBiographyClick}
            className="w-full mt-4 px-3 py-2 rounded font-pixel transition-colors touch-manipulation min-h-[48px]"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #e0e0e0',
              color: '#111',
              fontSize: '14px',
              borderRadius: '8px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
            }}
          >
            + Sobre mim
          </button>
        </div>

        {/* Display central - Perfil do usuário */}
        {/* No mobile: order-1 (primeiro), no desktop: order-2 (segundo) */}
        <div className="md:col-span-6 order-1 md:order-2">
          <DisplayMain />
        </div>

        {/* Painel lateral direito - MY PROFILE */}
        {/* No mobile: order-3 (terceiro), no desktop: order-3 (terceiro) */}
        <div className="md:col-span-3 order-3">
          <ProfilePanel onAvatarChangeClick={() => setIsAvatarSelectorOpen(true)} />
        </div>
      </div>

      {/* Overlay de seleção de avatar */}
      <AvatarSelectorOverlay 
        isOpen={isAvatarSelectorOpen} 
        onClose={() => setIsAvatarSelectorOpen(false)} 
      />
    </>
  );
}
