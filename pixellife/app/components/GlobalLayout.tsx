"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useCosmetics } from "./CosmeticsContext";
import { useUI } from "../context/UIContext";
import { useSyncData, useSyncExpenses, useSyncPossessions, useSyncTree, useSyncCosmetics, useSyncBiography } from "../hooks/useSyncData";
import { SyncDiagnostics } from "./SyncDiagnostics";
import { ToastContainer } from "./Toast";
import { MobileBottomNav } from "./MobileBottomNav";
import { Footer } from "./Footer";

interface GlobalLayoutProps {
  children: React.ReactNode;
}

export function GlobalLayout({ children }: GlobalLayoutProps) {
  const { background } = useCosmetics();
  const { mode } = useUI();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [currentBackground, setCurrentBackground] = useState("/fundo3.png");
  
  // Ocultar Footer nas páginas de auth (elas têm seu próprio rodapé)
  const isAuthPage = pathname?.startsWith('/auth/login') || pathname?.startsWith('/auth/register');

  // Log para confirmar que GlobalLayout está sendo executado
  useEffect(() => {
    console.log("🔧 GlobalLayout: Componente montado - Hooks de sincronização ativos");
  }, []);

  // Sincronizar todos os dados com Supabase
  useSyncData();
  useSyncExpenses();
  useSyncPossessions();
  useSyncTree();
  useSyncCosmetics();
  useSyncBiography();

  // Evitar hydration mismatch: só atualiza o background após montar no cliente
  useEffect(() => {
    setMounted(true);
    setCurrentBackground(background);
  }, [background]);

  // No modo board, não mostrar background pixelado
  const showPixelBackground = mode === 'game';

  return (
    <main className="relative w-full min-h-screen fade mobile-cream-bg" style={{
      paddingLeft: 'env(safe-area-inset-left)',
      paddingRight: 'env(safe-area-inset-right)',
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {/* Background global único - aplicado em todas as páginas (apenas no modo gamificado) */}
      {showPixelBackground && (
        <>
          {!mounted ? (
            // Durante SSR/hidratação inicial, usa valor padrão
            <img
              src="/fundo3.png"
              alt="Background"
              className="fixed inset-0 w-full h-full object-cover image-render-pixel pointer-events-none z-0"
              style={{
                imageRendering: "pixelated",
                width: "100vw",
                height: "100vh",
                minWidth: "100%",
                minHeight: "100%",
              }}
              draggable="false"
            />
          ) : currentBackground !== "none" ? (
            <img
              src={currentBackground}
              alt="Background"
              className="fixed inset-0 w-full h-full object-cover image-render-pixel pointer-events-none z-0"
              style={{
                imageRendering: "pixelated",
                width: "100vw",
                height: "100vh",
                minWidth: "100%",
                minHeight: "100%",
              }}
              draggable="false"
            />
          ) : (
            <div
              className="fixed inset-0 w-full h-full z-0"
              style={{
                backgroundColor: "#d8d8d8",
                width: "100vw",
                height: "100vh",
                minWidth: "100%",
                minHeight: "100%",
              }}
            />
          )}
        </>
      )}

      {/* Conteúdo das páginas */}
      <div className="relative z-10 min-h-screen mobile-content-wrapper flex flex-col">
        <SyncDiagnostics />
        <ToastContainer />
        <div className="flex-1">
          {children}
        </div>
        {!isAuthPage && <Footer />}
      </div>

      {/* Barra inferior mobile - removida no mobile, agora está no PixelMenu */}
    </main>
  );
}


