'use client';

import { useLanguage } from '../context/LanguageContext';

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-pixel-bold text-3xl mb-6" style={{ color: '#111' }}>
          {t('about.title')}
        </h1>
        <div className="font-pixel space-y-4" style={{ color: '#333', lineHeight: '1.6' }}>
          <p>
            {t('about.content1')}
          </p>
          <p>
            {t('about.content2')}
          </p>
        </div>
      </div>
    </div>
  );
}

