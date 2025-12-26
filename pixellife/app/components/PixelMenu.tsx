'use client';

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useUI } from "../context/UIContext";
import { useUserModules } from "../hooks/useUserModules";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";

interface PixelMenuProps {
  onHabitsClick?: () => void;
  onJournalClick?: () => void;
  onExpensesClick?: () => void;
  onCosmeticsClick?: () => void;
  onPossessionsClick?: () => void;
  onCustomizeClick?: () => void;
}

// Componente de ícone pixel art
function PixelIcon({ children, size = 24 }: { children: React.ReactNode; size?: number }) {
  return (
    <div 
      className="flex items-center justify-center mb-1 md:mb-0 md:mr-1"
      style={{ 
        width: `${size}px`, 
        height: `${size}px`,
        imageRendering: 'pixelated',
      }}
    >
      {children}
    </div>
  );
}

// Ícones pixel art usando CSS - tamanho reduzido
const Icons = {
  Display: () => (
    <div className="w-6 h-6 bg-black border-2 border-black relative" style={{ imageRendering: 'pixelated' }}>
      <div className="absolute inset-0.5 bg-white border border-black"></div>
      <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 bg-black"></div>
      <div className="absolute top-0.5 right-0.5 w-0.5 h-0.5 bg-black"></div>
      <div className="absolute bottom-0.5 left-0.5 w-0.5 h-0.5 bg-black"></div>
      <div className="absolute bottom-0.5 right-0.5 w-0.5 h-0.5 bg-black"></div>
    </div>
  ),
  Habits: () => (
    <div className="w-6 h-6 bg-black border-2 border-black relative" style={{ imageRendering: 'pixelated' }}>
      <div className="absolute top-1 left-1.5 w-3 h-0.5 bg-white"></div>
      <div className="absolute top-2.5 left-1.5 w-3 h-0.5 bg-white"></div>
      <div className="absolute top-4 left-1.5 w-3 h-0.5 bg-white"></div>
      <div className="absolute top-1 right-0.5 w-0.5 h-0.5 bg-white"></div>
      <div className="absolute top-2.5 right-0.5 w-0.5 h-0.5 bg-white"></div>
      <div className="absolute top-4 right-0.5 w-0.5 h-0.5 bg-white"></div>
    </div>
  ),
  Journal: () => (
    <div className="w-6 h-6 bg-black border-2 border-black relative" style={{ imageRendering: 'pixelated' }}>
      <div className="absolute inset-0.5 bg-white border border-black"></div>
      <div className="absolute top-1 left-1 w-2 h-0.5 bg-black"></div>
      <div className="absolute top-2 left-1 w-3 h-0.5 bg-black"></div>
      <div className="absolute top-3 left-1 w-2 h-0.5 bg-black"></div>
      <div className="absolute top-4 left-1 w-3 h-0.5 bg-black"></div>
    </div>
  ),
  Expenses: () => (
    <div className="w-6 h-6 bg-black border-2 border-black relative" style={{ imageRendering: 'pixelated' }}>
      <div className="absolute top-1 left-1 w-3 h-3 bg-white border border-black"></div>
      <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-black"></div>
      <div className="absolute bottom-1 left-1 w-0.5 h-0.5 bg-white"></div>
      <div className="absolute bottom-1 right-1 w-0.5 h-0.5 bg-white"></div>
    </div>
  ),
  Objetivos: () => (
    <div className="w-6 h-6 bg-black border-2 border-black relative" style={{ imageRendering: 'pixelated' }}>
      <div className="absolute top-1 left-1 w-3 h-3 bg-white border border-black"></div>
      <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-black"></div>
    </div>
  ),
  Tree: () => (
    <div className="w-6 h-6 bg-black border-2 border-black relative" style={{ imageRendering: 'pixelated' }}>
      <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-0.5 h-1.5 bg-white"></div>
      <div className="absolute top-1.5 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white border border-black"></div>
      <div className="absolute top-0.5 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-white"></div>
    </div>
  ),
  Customize: () => (
    <div 
      className="text-center leading-none"
      style={{
        color: '#9e9e9e',
        fontSize: '32px',
        fontWeight: 300,
        lineHeight: '1',
      }}
    >
      +
    </div>
  ),
  Cosmetics: () => (
    <div className="w-6 h-6 bg-black border-2 border-black relative" style={{ imageRendering: 'pixelated' }}>
      <div className="absolute top-1 left-1 w-3 h-3 bg-white border border-black"></div>
      <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-black"></div>
      <div className="absolute top-0.5 right-0.5 w-0.5 h-0.5 bg-white"></div>
      <div className="absolute bottom-0.5 right-0.5 w-0.5 h-0.5 bg-white"></div>
    </div>
  ),
  Biography: () => (
    <div className="w-6 h-6 bg-black border-2 border-black relative" style={{ imageRendering: 'pixelated' }}>
      {/* Livro aberto */}
      <div className="absolute top-1 left-1 w-4 h-3 bg-white border border-black"></div>
      {/* Linhas de texto */}
      <div className="absolute top-1.5 left-1.5 w-3 h-0.5 bg-black"></div>
      <div className="absolute top-2 left-1.5 w-2.5 h-0.5 bg-black"></div>
      <div className="absolute top-2.5 left-1.5 w-3 h-0.5 bg-black"></div>
      {/* Página direita */}
      <div className="absolute top-1 right-1 w-1 h-3 bg-white border-l border-black"></div>
    </div>
  ),
  Mapas: () => (
    <div className="w-6 h-6 bg-black border-2 border-black relative" style={{ imageRendering: 'pixelated' }}>
      {/* Mapa/globo */}
      <div className="absolute top-1 left-1 w-4 h-4 bg-white border border-black rounded-full"></div>
      {/* Linhas de latitude */}
      <div className="absolute top-2 left-1.5 w-3 h-0.5 bg-black"></div>
      <div className="absolute top-3 left-1.5 w-3 h-0.5 bg-black"></div>
      {/* Ponto de localização */}
      <div className="absolute top-2.5 left-2.5 w-0.5 h-0.5 bg-black"></div>
    </div>
  ),
  Feedback: () => (
    <div className="w-6 h-6 bg-black border-2 border-black relative" style={{ imageRendering: 'pixelated' }}>
      {/* Gráfico/feedback */}
      <div className="absolute bottom-1 left-1 w-1 h-2 bg-white"></div>
      <div className="absolute bottom-1 left-2.5 w-1 h-3 bg-white"></div>
      <div className="absolute bottom-1 left-4 w-1 h-1.5 bg-white"></div>
      <div className="absolute bottom-1 left-5.5 w-1 h-2.5 bg-white"></div>
    </div>
  ),
  Guides: () => (
    <div className="w-6 h-6 bg-black border-2 border-black relative" style={{ imageRendering: 'pixelated' }}>
      {/* Livro/guia */}
      <div className="absolute top-1 left-1 w-4 h-3 bg-white border border-black"></div>
      <div className="absolute top-1.5 left-1.5 w-3 h-0.5 bg-black"></div>
      <div className="absolute top-2 left-1.5 w-2.5 h-0.5 bg-black"></div>
      <div className="absolute top-2.5 left-1.5 w-3 h-0.5 bg-black"></div>
    </div>
  ),
  Schedule: () => (
    <div className="w-6 h-6 bg-black border-2 border-black relative" style={{ imageRendering: 'pixelated' }}>
      {/* Calendário pixel art */}
      <div className="absolute inset-0.5 bg-white border border-black"></div>
      {/* Linhas do calendário */}
      <div className="absolute top-1.5 left-0.5 right-0.5 h-0.5 bg-black"></div>
      <div className="absolute top-2.5 left-0.5 right-0.5 h-0.5 bg-black"></div>
      {/* Pontos representando dias */}
      <div className="absolute top-3.5 left-1 w-0.5 h-0.5 bg-black"></div>
      <div className="absolute top-3.5 left-2 w-0.5 h-0.5 bg-black"></div>
      <div className="absolute top-3.5 left-3 w-0.5 h-0.5 bg-black"></div>
      <div className="absolute top-4 left-1 w-0.5 h-0.5 bg-black"></div>
      <div className="absolute top-4 left-2 w-0.5 h-0.5 bg-black"></div>
      <div className="absolute top-4 left-3 w-0.5 h-0.5 bg-black"></div>
    </div>
  ),
};

export default function PixelMenu({ 
  onHabitsClick, 
  onJournalClick, 
  onExpensesClick, 
  onCosmeticsClick,
  onPossessionsClick,
  onCustomizeClick,
}: PixelMenuProps) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const { mode, setMode, viewMode, toggleViewMode } = useUI();
  const { isModuleActive } = useUserModules();
  const { logout, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('display');
  const isTreePage = pathname === "/tree";
  const isBoardPage = pathname === "/board";

  // Detectar seção ativa baseado no hash ou pathname
  useEffect(() => {
    if (isBoardPage || pathname.startsWith('/board')) {
      const hash = typeof window !== 'undefined' ? window.location.hash : '';
      if (hash) {
        setActiveSection(hash.replace('#', ''));
      } else if (pathname === '/board/feedback') {
        setActiveSection('feedback');
      } else if (pathname === '/board/guides') {
        setActiveSection('guides');
      } else if (pathname === '/board/schedule' || hash === '#schedule') {
        setActiveSection('schedule');
      } else {
        setActiveSection('display');
      }
    } else if (pathname === '/mapas') {
      setActiveSection('mapas');
    } else {
      setActiveSection('');
    }
  }, [pathname, isBoardPage]);

  // Adiciona padding-top ao body quando o menu superior está presente (desktop)
  // No mobile, mantém comportamento de sidebar
  useEffect(() => {
    const updatePadding = () => {
      // Remove classes antigas
      document.body.classList.remove('with-top-nav', 'with-left-nav');
      
      // Adiciona classe apropriada baseado no tamanho da tela
      if (window.innerWidth >= 768) {
        document.body.classList.add('with-top-nav');
      } else {
        document.body.classList.add('with-left-nav');
      }
    };
    
    // Atualizar imediatamente
    updatePadding();
    
    // Atualizar quando a janela redimensionar
    window.addEventListener('resize', updatePadding);
    
    return () => {
      window.removeEventListener('resize', updatePadding);
      document.body.classList.remove('with-top-nav', 'with-left-nav');
    };
  }, []);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isMenuOpen && !(e.target as HTMLElement).closest('.hamburger-menu')) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMenuOpen]);

  // Touch targets de 48px mínimo para mobile (WCAG/Apple guidelines)
  // Visual pode ser menor, mas área clicável deve ser 48px
  // Mobile: vertical (flex-col), Desktop: horizontal (flex-row)
  const navItemClass = "flex flex-col md:flex-row items-center justify-center py-3 px-2 md:py-2 md:px-4 w-full md:w-auto min-h-[48px] md:min-h-[60px] border border-transparent bg-transparent font-pixel text-xs font-pixel-bold hover:bg-[#ece8dd] transition-colors cursor-pointer rounded-md touch-manipulation";
  const activeNavItemClass = "flex flex-col md:flex-row items-center justify-center py-3 px-2 md:py-2 md:px-4 w-full md:w-auto min-h-[48px] md:min-h-[60px] border-2 border-black bg-white font-pixel text-xs font-pixel-bold rounded-md touch-manipulation";

  const isActive = (path: string) => {
    if (path === "/display") return pathname === "/display";
    if (path === "/habits") return pathname === "/habits";
    if (path === "/journal") return pathname?.startsWith("/journal");
    if (path === "/daily") return pathname === "/daily";
    if (path === "/expenses") return pathname === "/expenses";
    if (path === "/possessions") return pathname === "/possessions";
    if (path === "/tree") return pathname === "/tree";
    if (path === "/cosmetics") return pathname === "/cosmetics";
    if (path === "/board#biography" || path === "biography") {
      if (typeof window !== 'undefined') {
        return pathname === "/board" && window.location.hash === "#biography";
      }
      return false;
    }
    return false;
  };

  // Função para scroll suave para âncoras no modo board
  const scrollToSection = (sectionId: string) => {
    if (mode === 'board' && isBoardPage) {
      // Aguardar um pouco para garantir que o DOM está pronto
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          // Para display, usar offset mínimo para ficar próximo da barra
          const headerOffset = sectionId === 'display' ? 10 : 80;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: Math.max(0, offsetPosition), // Garantir que não seja negativo
            behavior: 'smooth'
          });
        }
      }, 50);
    }
  };

  // Função para navegar ou scrollar baseado no modo
  const handleNavClick = (sectionId: string, route: string) => {
    if (mode === 'board') {
      setActiveSection(sectionId);
      
      if (viewMode === 'continuous') {
        // Modo contínuo: apenas atualizar seção, sem scroll
        if (pathname !== '/board') {
          router.push(`/board#${sectionId}`);
        } else {
          router.push(`/board#${sectionId}`);
        }
        // Disparar evento para atualizar seção ativa no board
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('boardSectionChange', { detail: { section: sectionId } }));
        }
      } else {
        // Modo focado: atualizar seção ativa (Display sempre visível, outra seção muda)
        // Todas as seções, incluindo feedback e guides, devem aparecer no board principal
        if (pathname !== '/board') {
          router.push('/board');
        }
        setActiveSection(sectionId);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('boardSectionChange', { detail: { section: sectionId } }));
        }
      }
    } else {
      router.push(route);
    }
  };

  const handleModeChange = (newMode: 'game' | 'board') => {
    setMode(newMode);
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    setIsMenuOpen(false);
    await logout();
    router.push('/auth/login');
  };

  return (
    <>
      {/* Hood branco superior no mobile - apenas PIXELLIFE */}
      <div 
        className="fixed top-0 left-0 right-0 z-40 md:hidden bg-white flex items-center justify-center"
        style={{ 
          height: 'max(env(safe-area-inset-top, 0px), 44px)',
          minHeight: '44px',
        }}
      >
        <span className="text-xs font-pixel font-bold" style={{ color: '#111' }}>PIXELLIFE</span>
      </div>

      {/* Barra de navegação inferior no mobile - estilo deck */}
      <div 
        className="fixed left-0 right-0 bottom-0 z-40 md:hidden mobile-bottom-nav-deck" 
        style={{ 
          bottom: 'max(env(safe-area-inset-bottom, 0px), 0px)',
          height: 'calc(60px + max(env(safe-area-inset-bottom, 0px), 0px))',
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0px)',
        }}
      >
        <div className="flex items-center justify-around h-full px-2" style={{ backgroundColor: '#FFFFFF', borderTop: '2px solid #000' }}>
          {/* Display */}
          <button
            onClick={() => {
              setActiveSection('display');
              handleNavClick('display', '/board');
            }}
            className="flex flex-col items-center justify-center touch-manipulation"
            style={{
              minWidth: '60px',
              minHeight: '60px',
              color: activeSection === 'display' ? '#111' : '#666',
              border: activeSection === 'display' ? '2px solid #000' : '2px solid transparent',
              borderRadius: '4px',
              backgroundColor: activeSection === 'display' ? '#FFFFFF' : 'transparent',
            }}
          >
            <span className="text-xs font-pixel-bold" style={{ fontSize: '12px' }}>DISPLAY</span>
          </button>

          {/* Feedback */}
          <button
            onClick={() => {
              setActiveSection('feedback');
              handleNavClick('feedback', '/board');
            }}
            className="flex flex-col items-center justify-center touch-manipulation"
            style={{
              minWidth: '60px',
              minHeight: '60px',
              color: activeSection === 'feedback' ? '#111' : '#666',
              border: activeSection === 'feedback' ? '2px solid #000' : '2px solid transparent',
              borderRadius: '4px',
              backgroundColor: activeSection === 'feedback' ? '#FFFFFF' : 'transparent',
            }}
          >
            <span className="text-xs font-pixel-bold" style={{ fontSize: '12px' }}>FEEDBACK</span>
          </button>

          {/* Info (Guides) */}
          <button
            onClick={() => {
              setActiveSection('guides');
              handleNavClick('guides', '/board');
            }}
            className="flex flex-col items-center justify-center touch-manipulation"
            style={{
              minWidth: '60px',
              minHeight: '60px',
              color: activeSection === 'guides' ? '#111' : '#666',
              border: activeSection === 'guides' ? '2px solid #000' : '2px solid transparent',
              borderRadius: '4px',
              backgroundColor: activeSection === 'guides' ? '#FFFFFF' : 'transparent',
            }}
          >
            <span className="text-xs font-pixel-bold" style={{ fontSize: '12px' }}>INFO</span>
          </button>
        </div>
      </div>
      {/* Desktop: Barra horizontal no topo */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-[60px] flex-row items-center justify-between px-4 gap-2" style={{ backgroundColor: '#FFFFFF', borderBottom: '2px solid #d0d0d0', boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.12)' }}>
        {/* Logo/Título à esquerda */}
        <div className="flex items-center gap-3">
          {/* Botão hamburger para dropdown de modo */}
          <div className="hamburger-menu relative">
            <button
              className="flex items-center justify-center p-2 border border-transparent bg-transparent hover:bg-[#ece8dd] transition-colors cursor-pointer rounded-md"
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
            >
              <div className="w-5 h-5 bg-black border-2 border-black relative flex flex-col items-center justify-center gap-0.5" style={{ imageRendering: 'pixelated' }}>
                <div className="w-3 h-0.5 bg-white"></div>
                <div className="w-3 h-0.5 bg-white"></div>
                <div className="w-3 h-0.5 bg-white"></div>
              </div>
            </button>
            {/* Menu dropdown */}
            {isMenuOpen && (
              <div 
                className="absolute top-full left-0 mt-2 w-48 bg-white border border-[#d8d4c7] rounded-md shadow-lg z-50"
                onClick={(e) => e.stopPropagation()}
              >
                {user ? (
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 font-pixel text-sm transition-colors hover:bg-[#ece8dd] text-red-600"
                  >
                    Deslogar
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      window.location.href = 'https://pixellife.vercel.app/auth/login';
                    }}
                    className="w-full text-left px-4 py-3 font-pixel text-sm transition-colors hover:bg-[#ece8dd]"
                  >
                    Logar
                  </button>
                )}
              </div>
            )}
          </div>
          <span className="text-sm font-pixel font-bold" style={{ color: mode === 'board' ? '#111' : '#000000' }}>PIXELLIFE</span>
        </div>

        {/* Navegação horizontal no centro */}
        <div className="flex items-center gap-1 flex-1 justify-center overflow-x-auto">
          {/* Modo focado: apenas Display, Feedback, Guias */}
          {mode === 'board' && viewMode === 'focused' ? (
            <>
              {/* Display */}
              <button
                onClick={() => handleNavClick('display', '/board')}
                className={activeSection === 'display' ? activeNavItemClass : navItemClass}
              >
                <PixelIcon>
                  <Icons.Display />
                </PixelIcon>
                <span>DISPLAY</span>
              </button>

              {/* Feedback */}
              <button
                onClick={() => handleNavClick('feedback', '/board')}
                className={activeSection === 'feedback' ? activeNavItemClass : navItemClass}
              >
                <PixelIcon>
                  <Icons.Feedback />
                </PixelIcon>
                <span>FEEDBACK</span>
              </button>

              {/* Guias */}
              <button
                onClick={() => handleNavClick('guides', '/board')}
                className={activeSection === 'guides' ? activeNavItemClass : navItemClass}
              >
                <PixelIcon>
                  <Icons.Guides />
                </PixelIcon>
                <span>GUIAS</span>
              </button>
            </>
          ) : (
            <>
              {/* Modo contínuo: todos os ícones */}
              {/* Display */}
              {mode === 'board' ? (
                <button
                  onClick={() => handleNavClick('display', '/board')}
                  className={activeSection === 'display' ? activeNavItemClass : navItemClass}
                >
                  <PixelIcon>
                    <Icons.Display />
                  </PixelIcon>
                  <span>DISPLAY</span>
                </button>
              ) : (
                <Link 
                  href="/display" 
                  className={isActive("/display") ? activeNavItemClass : navItemClass}
                >
                  <PixelIcon>
                    <Icons.Display />
                  </PixelIcon>
                  <span>DISPLAY</span>
                </Link>
              )}
              
              {/* Hábitos */}
              {mode === 'board' ? (
                <button
                  onClick={() => handleNavClick('habits', '/board')}
                  className={activeSection === 'habits' ? activeNavItemClass : navItemClass}
                >
                  <PixelIcon>
                    <Icons.Habits />
                  </PixelIcon>
                  <span>HÁBITOS</span>
                </button>
              ) : onHabitsClick ? (
                <button
                  onClick={onHabitsClick}
                  className={navItemClass}
                >
                  <PixelIcon>
                    <Icons.Habits />
                  </PixelIcon>
                  <span>HÁBITOS</span>
                </button>
              ) : (
                <Link 
                  href="/habits" 
                  className={isActive("/habits") ? activeNavItemClass : navItemClass}
                >
                  <PixelIcon>
                    <Icons.Habits />
                  </PixelIcon>
                  <span>HÁBITOS</span>
                </Link>
              )}

              {/* Diário */}
              {mode === 'board' ? (
                <button
                  onClick={() => handleNavClick('journal', '/board')}
                  className={activeSection === 'journal' ? activeNavItemClass : navItemClass}
                >
                  <PixelIcon>
                    <Icons.Journal />
                  </PixelIcon>
                  <span>DIÁRIO</span>
                </button>
              ) : onJournalClick ? (
                <button
                  onClick={onJournalClick}
                  className={navItemClass}
                >
                  <PixelIcon>
                    <Icons.Journal />
                  </PixelIcon>
                  <span>DIÁRIO</span>
                </button>
              ) : (
                <Link 
                  href="/display?overlay=journal" 
                  className={isActive("/daily") || isActive("/journal") ? activeNavItemClass : navItemClass}
                >
                  <PixelIcon>
                    <Icons.Journal />
                  </PixelIcon>
                  <span>DIÁRIO</span>
                </Link>
              )}

              {/* Finanças */}
              {mode === 'board' ? (
                <button
                  onClick={() => handleNavClick('finances', '/board')}
                  className={activeSection === 'finances' ? activeNavItemClass : navItemClass}
                >
                  <PixelIcon>
                    <Icons.Expenses />
                  </PixelIcon>
                  <span>FINANÇAS</span>
                </button>
              ) : onExpensesClick ? (
                <button
                  onClick={onExpensesClick}
                  className={navItemClass}
                >
                  <PixelIcon>
                    <Icons.Expenses />
                  </PixelIcon>
                  <span>FINANÇAS</span>
                </button>
              ) : (
                <Link 
                  href="/expenses" 
                  className={isActive("/expenses") ? activeNavItemClass : navItemClass}
                >
                  <PixelIcon>
                    <Icons.Expenses />
                  </PixelIcon>
                  <span>FINANÇAS</span>
                </Link>
              )}

              {/* Mapas - sem hover */}
              {mode === 'board' ? (
                <button
                  onClick={() => handleNavClick('mapas', '/board')}
                  className={activeSection === 'mapas' ? activeNavItemClass : navItemClass.replace('hover:bg-[#ece8dd]', '')}
                >
                  <PixelIcon>
                    <Icons.Mapas />
                  </PixelIcon>
                  <span>MAPAS</span>
                </button>
              ) : (
                <Link 
                  href="/mapas" 
                  className={isActive("/mapas") ? activeNavItemClass : navItemClass.replace('hover:bg-[#ece8dd]', '')}
                >
                  <PixelIcon>
                    <Icons.Mapas />
                  </PixelIcon>
                  <span>MAPAS</span>
                </Link>
              )}

              {/* Objetivos */}
              {mode === 'board' ? (
                <button
                  onClick={() => handleNavClick('goals', '/board')}
                  className={activeSection === 'goals' ? activeNavItemClass : navItemClass}
                >
                  <PixelIcon>
                    <Icons.Objetivos />
                  </PixelIcon>
                  <span>{t('sections.goals')}</span>
                </button>
              ) : onPossessionsClick ? (
                <button
                  onClick={onPossessionsClick}
                  className={navItemClass}
                >
                  <PixelIcon>
                    <Icons.Objetivos />
                  </PixelIcon>
                  <span>{t('sections.goals')}</span>
                </button>
              ) : (
                <Link 
                  href="/possessions" 
                  className={isActive("/possessions") ? activeNavItemClass : navItemClass}
                >
                  <PixelIcon>
                    <Icons.Objetivos />
                  </PixelIcon>
                  <span>{t('sections.goals')}</span>
                </Link>
              )}

              {/* Biografia - sem hover */}
              {mode === 'board' ? (
                <button
                  onClick={() => handleNavClick('biography', '/board')}
                  className={isActive("biography") ? activeNavItemClass : navItemClass.replace('hover:bg-[#ece8dd]', '')}
                >
                  <PixelIcon>
                    <Icons.Biography />
                  </PixelIcon>
                  <span>BIOGRAFIA</span>
                </button>
              ) : (
                <Link 
                  href="/board#biography" 
                  className={isActive("biography") ? activeNavItemClass : navItemClass.replace('hover:bg-[#ece8dd]', '')}
                >
                  <PixelIcon>
                    <Icons.Biography />
                  </PixelIcon>
                  <span>BIOGRAFIA</span>
                </Link>
              )}

              {/* Cronograma */}
              {mode === 'board' ? (
                <button
                  onClick={() => handleNavClick('schedule', '/board')}
                  className={activeSection === 'schedule' ? activeNavItemClass : navItemClass}
                >
                  <PixelIcon>
                    <Icons.Schedule />
                  </PixelIcon>
                  <span>CRONOGRAMA</span>
                </button>
              ) : (
                <Link 
                  href="/schedule" 
                  className={isActive("/schedule") ? activeNavItemClass : navItemClass}
                >
                  <PixelIcon>
                    <Icons.Schedule />
                  </PixelIcon>
                  <span>CRONOGRAMA</span>
                </Link>
              )}
            </>
          )}

          {/* Cosméticos - apenas no modo game */}
          {mode === 'game' && (
            onCosmeticsClick ? (
              <button
                onClick={onCosmeticsClick}
                className={navItemClass}
              >
                <PixelIcon>
                  <Icons.Cosmetics />
                </PixelIcon>
                <span>COSMÉTICOS</span>
              </button>
            ) : (
              <Link 
                href="/cosmetics" 
                className={isActive("/cosmetics") ? activeNavItemClass : navItemClass}
              >
                <PixelIcon>
                  <Icons.Cosmetics />
                </PixelIcon>
                <span>COSMÉTICOS</span>
              </Link>
            )
          )}

        </div>

        {/* Toggle de modo de visualização à direita (apenas no modo board) */}
        {mode === 'board' && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-pixel" style={{ color: '#666' }}>
              {viewMode === 'continuous' ? 'Visão contínua' : 'Visão focada'}
            </span>
            <button
              onClick={() => {
                toggleViewMode();
                // Quando muda para visão focada, sempre direcionar para display
                if (viewMode === 'continuous') {
                  setTimeout(() => {
                    setActiveSection('display');
                    router.push('/board#display');
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('boardSectionChange', { detail: { section: 'display' } }));
                    }
                  }, 100);
                }
              }}
              className="relative w-12 h-6 rounded-full transition-colors touch-manipulation"
              style={{
                backgroundColor: viewMode === 'continuous' ? '#4d82ff' : '#d0d0d0',
              }}
              aria-label={viewMode === 'continuous' ? 'Alternar para visão focada' : 'Alternar para visão contínua'}
            >
              <div
                className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform"
                style={{
                  transform: viewMode === 'continuous' ? 'translateX(0)' : 'translateX(24px)',
                }}
              />
            </button>
          </div>
        )}
      </nav>
    </>
  );
}
