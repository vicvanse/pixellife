'use client';

import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer
      className="w-full mt-auto"
      style={{
        backgroundColor: '#f7f7f7',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-[18px]">
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
        </div>
      </div>
    </footer>
  );
}

