'use client';

import { useState } from 'react';
import { useGuides } from '../../hooks/useGuides';
import { useLanguage } from '../../context/LanguageContext';
import type { Guide } from '../../types/guides';
import { GuideTreeView } from './GuideTreeView';
import { CreateCustomGuide } from './CreateCustomGuide';

export function GuidesOverview() {
  const { t } = useLanguage();
  const { getOfficialGuides, getCustomGuides } = useGuides();
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const officialGuides = getOfficialGuides();
  const customGuides = getCustomGuides();

  if (selectedGuide) {
    return (
      <div>
        <button
          onClick={() => setSelectedGuide(null)}
          className="mb-4 px-4 py-2 rounded font-pixel-bold transition-colors hover:opacity-90"
          style={{
            backgroundColor: '#f2f2f2',
            border: '1px solid #e5e5e5',
            color: '#111',
            fontSize: '14px',
          }}
        >
          {t('guides.back')}
        </button>
        <GuideTreeView guide={selectedGuide} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Título e descrição */}
      <div className="mb-6">
        <h2 className="font-pixel-bold text-xl mb-2" style={{ color: '#111' }}>
          {t('guides.title')}
        </h2>
        <p className="font-pixel text-sm" style={{ color: '#666' }}>
          {t('guides.subtitle')}
        </p>
      </div>

      {/* Guias Oficiais */}
      <div>
        <h3 className="font-pixel-bold text-lg mb-4" style={{ color: '#111' }}>
          {t('guides.officialGuides')}
        </h3>
        {officialGuides.length === 0 ? (
          <p className="font-pixel text-sm text-center py-8" style={{ color: '#999' }}>
            {t('guides.loading')}
          </p>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {officialGuides.map((guide) => (
            <button
              key={guide.id}
              onClick={() => setSelectedGuide(guide)}
              className="p-4 rounded text-left transition-all hover:shadow-md"
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #e5e5e5',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
              }}
            >
              <h4 
                className="font-pixel-bold text-base mb-2 line-clamp-2" 
                style={{ color: '#111', maxWidth: '200px' }}
                title={guide.name}
              >
                {guide.name}
              </h4>
              <p className="font-pixel text-sm mb-2" style={{ color: '#666' }}>
                {guide.description}
              </p>
              {guide.philosophicalNote && (
                <p className="font-pixel text-xs italic" style={{ color: '#999' }}>
                  {guide.philosophicalNote}
                </p>
              )}
            </button>
          ))}
        </div>
        )}
      </div>

      {/* Guias Customizados */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-pixel-bold text-lg" style={{ color: '#111' }}>
            {t('guides.myGuides')}
          </h3>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded font-pixel-bold transition-colors hover:opacity-90"
            style={{
              backgroundColor: '#6daffe',
              border: '1px solid #1b5cff',
              color: '#111',
              fontSize: '14px',
            }}
          >
            {t('guides.createGuide')}
          </button>
        </div>
        {customGuides.length === 0 ? (
          <p className="font-pixel text-sm text-center py-8" style={{ color: '#999' }}>
            {t('guides.noCustomGuides')}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customGuides.map((guide) => (
              <button
                key={guide.id}
                onClick={() => setSelectedGuide(guide)}
                className="p-4 rounded text-left transition-all hover:shadow-md"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #e5e5e5',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                }}
              >
                <h4 className="font-pixel-bold text-base mb-2" style={{ color: '#111' }}>
                  {guide.name}
                </h4>
                <p className="font-pixel text-sm" style={{ color: '#666' }}>
                  {guide.description}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateCustomGuide
          onClose={() => setShowCreateModal(false)}
          onCreated={(guide) => {
            setShowCreateModal(false);
            setSelectedGuide(guide);
          }}
        />
      )}
    </div>
  );
}

