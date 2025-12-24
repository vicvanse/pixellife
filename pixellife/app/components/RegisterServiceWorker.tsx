'use client';

import { useEffect } from 'react';

export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[SW] Service Worker registrado:', registration.scope);
        })
        .catch((error) => {
          console.error('[SW] Erro ao registrar Service Worker:', error);
        });
    }
  }, []);

  return null;
}

