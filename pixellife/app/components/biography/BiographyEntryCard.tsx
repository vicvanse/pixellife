'use client';

import { BiographyEntry, formatBiographyDate, CATEGORIES } from '@/app/hooks/useBiography';

interface BiographyEntryCardProps {
  entry: BiographyEntry;
  onEdit: () => void;
  onDelete: () => void;
}

export function BiographyEntryCard({ entry, onEdit, onDelete }: BiographyEntryCardProps) {
  const categoryInfo = CATEGORIES[entry.category];
  const formattedDate = formatBiographyDate(entry.date);

  if (entry.type === 'milestone') {
    return (
      <div
        className="p-4 rounded-sm cursor-pointer transition-all"
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
        }}
        onClick={onEdit}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl" style={{ imageRendering: 'pixelated' }}>
            {entry.emoji || categoryInfo.emoji}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-pixel-bold" style={{ color: '#333', fontSize: '16px' }}>
                {entry.title}
              </h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-red-500 hover:text-red-700 transition-colors ml-2"
                style={{ fontSize: '18px' }}
              >
                ×
              </button>
            </div>
            <p className="font-pixel mb-1" style={{ color: '#666', fontSize: '14px' }}>
              {formattedDate}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="inline-block px-2 py-0.5 rounded font-pixel text-xs"
                style={{
                  backgroundColor: '#f0f0f0',
                  border: '1px solid #d0d0d0',
                  color: '#333',
                }}
              >
                {categoryInfo.emoji} {categoryInfo.label}
              </span>
              {entry.tag && (
                <span
                  className="inline-block px-2 py-0.5 rounded font-pixel text-xs"
                  style={{
                    backgroundColor: '#e3f2fd',
                    border: '1px solid #6daffe',
                    color: '#1976d2',
                  }}
                >
                  {entry.tag}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Story type
  return (
    <div
      className="p-6 rounded-sm cursor-pointer transition-all"
      style={{
        backgroundColor: '#FFFFFF',
        border: '2px solid #e0e0e0',
        borderRadius: '8px',
      }}
      onClick={onEdit}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-pixel-bold mb-2" style={{ color: '#333', fontSize: '18px' }}>
            {entry.title}
          </h3>
          <p className="font-pixel mb-2" style={{ color: '#666', fontSize: '14px' }}>
            {formattedDate}
          </p>
          <span
            className="inline-block px-2 py-0.5 rounded font-pixel text-xs mb-2"
            style={{
              backgroundColor: '#f0f0f0',
              border: '1px solid #d0d0d0',
              color: '#333',
            }}
          >
            {categoryInfo.emoji} {categoryInfo.label}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-red-500 hover:text-red-700 transition-colors ml-2"
          style={{ fontSize: '18px' }}
        >
          ×
        </button>
      </div>
      {entry.photo && (
        <div className="mb-3">
          <img
            src={entry.photo}
            alt={entry.title}
            className="w-full h-48 object-cover rounded"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>
      )}
      <p className="font-pixel" style={{ color: '#555', fontSize: '14px', lineHeight: '1.6' }}>
            {entry.text}
      </p>
    </div>
  );
}

