'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage, languageNames, type Language } from '../context/LanguageContext';

export function Footer() {
  const { language, setLanguage, t } = useLanguage();
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  const languages: Language[] = ['en', 'ko', 'pt', 'es', 'ja', 'de', 'fr', 'it', 'zh-CN', 'zh-TW'];

  return (
    <footer
      className="w-full mt-auto"
      style={{
        backgroundColor: '#f7f7f7',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Links com Language */}
        <div className="flex flex-wrap justify-center gap-4 items-center">
          <Link
            href="/about"
            className="font-pixel transition-colors"
            style={{ color: '#333', fontSize: '16px' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#666';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#333';
            }}
          >
            {t('footer.about')}
          </Link>
          <Link
            href="/privacy"
            className="font-pixel transition-colors"
            style={{ color: '#333', fontSize: '16px' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#666';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#333';
            }}
          >
            {t('footer.privacy')}
          </Link>
          <Link
            href="/terms"
            className="font-pixel transition-colors"
            style={{ color: '#333', fontSize: '16px' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#666';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#333';
            }}
          >
            {t('footer.terms')}
          </Link>
          <div className="relative">
            <button
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className="font-pixel transition-colors"
              style={{ color: '#333', fontSize: '16px' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#666';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#333';
              }}
            >
              {t('footer.language')}
            </button>
            {showLanguageDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowLanguageDropdown(false)}
                />
                <div
                  className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white border border-[#9e9e9e] rounded shadow-lg z-20"
                  style={{ minWidth: '200px' }}
                >
                  <div className="py-2 max-h-64 overflow-y-auto">
                    {languages.map((lang) => (
                      <button
                        key={lang}
                        onClick={() => {
                          setLanguage(lang);
                          setShowLanguageDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 font-pixel text-sm transition-colors hover:bg-gray-100"
                        style={{
                          color: language === lang ? '#4d82ff' : '#333',
                          backgroundColor: language === lang ? '#f0f0f0' : 'transparent',
                        }}
                      >
                        {languageNames[lang]}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}

