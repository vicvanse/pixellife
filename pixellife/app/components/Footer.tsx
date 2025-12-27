'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage, languageNames, type Language } from '../context/LanguageContext';
import { useState, useRef, useEffect } from 'react';

export function Footer() {
  const { t, language, setLanguage } = useLanguage();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Não mostrar seletor de idiomas em páginas de auth
  const isAuthPage = pathname?.startsWith('/auth/login') || pathname?.startsWith('/auth/register');
  const showLanguageSelector = !isAuthPage;

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const languages: Language[] = ['en', 'ko', 'pt', 'es', 'ja', 'de', 'fr', 'it', 'zh-CN', 'zh-TW'];

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang);
    setIsOpen(false);
  };

  return (
    <footer
      className="w-full mt-auto"
      style={{
        backgroundColor: '#f7f7f7',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        {/* Links com Language */}
        <div className="flex flex-wrap justify-center gap-4 items-center">
          <Link
            href="/about"
            className="font-pixel transition-colors"
            style={{ color: '#000000', fontSize: '16px' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#000000';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#000000';
            }}
          >
            {t('footer.about')}
          </Link>
          <Link
            href="/privacy"
            className="font-pixel transition-colors"
            style={{ color: '#000000', fontSize: '16px' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#000000';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#000000';
            }}
          >
            {t('footer.privacy')}
          </Link>
          <Link
            href="/terms"
            className="font-pixel transition-colors"
            style={{ color: '#000000', fontSize: '16px' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#000000';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#000000';
            }}
          >
            {t('footer.terms')}
          </Link>
          <Link
            href="/community"
            className="font-pixel transition-colors"
            style={{ color: '#000000', fontSize: '16px' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#000000';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#000000';
            }}
          >
            COMMUNITY
          </Link>
          {showLanguageSelector && (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="font-pixel transition-colors"
                style={{ color: '#000000', fontSize: '16px' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#000000';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#000000';
                }}
              >
                {t('footer.language')}
              </button>
              {isOpen && (
                <div
                  className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white border border-gray-300 rounded shadow-lg z-50 min-w-[150px]"
                  style={{ backgroundColor: '#ffffff' }}
                >
                  {languages.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => handleLanguageSelect(lang)}
                      className={`w-full text-left px-4 py-2 font-pixel text-sm hover:bg-gray-100 transition-colors ${
                        language === lang ? 'bg-gray-100 font-bold' : ''
                      }`}
                      style={{
                        color: language === lang ? '#000000' : '#000000',
                        fontSize: '14px',
                      }}
                    >
                      {languageNames[lang]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}

