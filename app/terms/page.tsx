'use client';

import { useLanguage } from '../context/LanguageContext';

export default function TermsPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-pixel-bold text-3xl mb-6" style={{ color: '#111' }}>
          {t('terms.title')}
        </h1>
        <div className="font-pixel space-y-4" style={{ color: '#333', lineHeight: '1.6' }}>
          <p>
            {t('terms.content1')}
          </p>
          <h2 className="font-pixel-bold text-xl mt-6 mb-3" style={{ color: '#111' }}>
            {t('terms.use')}
          </h2>
          <p>
            {t('terms.useContent')}
          </p>
          <h2 className="font-pixel-bold text-xl mt-6 mb-3" style={{ color: '#111' }}>
            {t('terms.liability')}
          </h2>
          <p>
            {t('terms.liabilityContent')}
          </p>
        </div>
      </div>
    </div>
  );
}

