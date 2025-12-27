'use client';

import { useEffect, useState } from 'react';

export function PWAInstaller() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Verificar se é iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Verificar se já está instalado (standalone mode)
    const standalone = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Se já está instalado, não mostrar prompt
    if (standalone) {
      return;
    }

    // Para iOS, sempre mostrar instruções (Safari não dispara beforeinstallprompt)
    if (iOS) {
      // Verificar se já mostrou antes (localStorage)
      const hasShownBefore = localStorage.getItem('pwa-install-prompt-shown');
      if (!hasShownBefore) {
        setShowPrompt(true);
      }
      return;
    }

    // Para outros navegadores, escutar evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      // iOS: apenas marcar como mostrado
      localStorage.setItem('pwa-install-prompt-shown', 'true');
      setShowPrompt(false);
      return;
    }

    if (!deferredPrompt) {
      return;
    }

    // Mostrar prompt de instalação
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('PWA instalado com sucesso');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
    localStorage.setItem('pwa-install-prompt-shown', 'true');
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-prompt-shown', 'true');
  };

  if (!showPrompt || isStandalone) {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-50 p-4 rounded-lg border-4 border-black"
      style={{
        backgroundColor: '#fff9e6',
        maxWidth: '400px',
        margin: '0 auto',
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-pixel-bold text-sm" style={{ color: '#111' }}>
          {isIOS ? 'Instalar no iPhone/iPad' : 'Instalar App'}
        </h3>
        <button
          onClick={handleDismiss}
          className="font-pixel-bold text-lg leading-none"
          style={{ color: '#666', cursor: 'pointer' }}
          aria-label="Fechar"
        >
          ×
        </button>
      </div>
      
      {isIOS ? (
        <div className="text-xs font-pixel" style={{ color: '#333' }}>
          <p className="mb-2">Para instalar no iOS:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Toque no botão de compartilhar</li>
            <li>Selecione &quot;Adicionar à Tela Inicial&quot;</li>
            <li>Toque em &quot;Adicionar&quot;</li>
          </ol>
          <p className="mt-2 text-xs" style={{ color: '#666' }}>
            Isso protege seus dados contra limpeza automática.
          </p>
        </div>
      ) : (
        <div className="text-xs font-pixel" style={{ color: '#333' }}>
          <p className="mb-2">
            Instale o Pixel Life para acesso rápido e proteção de dados.
          </p>
          <button
            onClick={handleInstall}
            className="mt-2 px-4 py-2 font-pixel-bold text-sm border-2 border-black"
            style={{
              backgroundColor: '#4caf50',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Instalar Agora
          </button>
        </div>
      )}
    </div>
  );
}

