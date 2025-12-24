'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUI } from '../context/UIContext';

export function UIModeRouter() {
  const { mode } = useUI();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Não redirecionar em páginas de autenticação
    if (pathname.startsWith('/auth')) return;

    if (mode === 'board' && pathname !== '/board') {
      router.push('/board');
    } else if (mode === 'game' && pathname === '/board') {
      router.push('/display');
    }
  }, [mode, pathname, router]);

  return null;
}

