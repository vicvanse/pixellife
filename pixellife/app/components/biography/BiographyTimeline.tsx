'use client';

import { BiographyEntry, CATEGORIES } from '@/app/hooks/useBiography';

interface BiographyTimelineProps {
  entriesByYear: Array<{ year: number | string; entries: BiographyEntry[] }>;
  onEdit: (entry: BiographyEntry) => void;
  onDelete: (entry: BiographyEntry) => void;
}

// Função para formatar data no estilo timeline
function formatTimelineDate(date: BiographyEntry['date']): string {
  if (date.precision === 'range' && date.endYear) {
    return `${date.year} — ${date.endYear}`;
  } else if (date.precision === 'exact' && date.month && date.day) {
    return `${date.day}/${date.month}/${date.year}`;
  } else if (date.precision === 'exact' && date.month) {
    return `${date.month}/${date.year}`;
  } else if (date.precision === 'approximate') {
    return `~${date.year}`;
  }
  return String(date.year);
}

// Cores por categoria
const CATEGORY_COLORS: Record<string, string> = {
  fundacao: '#4da6ff',
  conquistas: '#ffd24d',
  aprendizados: '#a177ff',
  evolucao: '#6bd36b',
  mudancas: '#ff6b6b',
  carreira: '#ff8c42',
  fases: '#9b59b6',
};

export function BiographyTimeline({ entriesByYear, onEdit, onDelete }: BiographyTimelineProps) {
  return (
    <div className="timeline" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {entriesByYear.map(({ year: yearValue, entries }) => {
        const year = String(yearValue);
        return (
        <div key={year} className="year-section" style={{ marginBottom: '40px' }}>
          {/* Divisor de ano */}
          <div 
            className="year-divider"
            style={{
              margin: '20px 0',
              textAlign: 'center',
              fontWeight: 600,
              color: '#444',
              fontSize: '18px',
              position: 'relative',
            }}
          >
            <span style={{ 
              display: 'inline-block',
              padding: '0 16px',
              backgroundColor: '#f5f5f5',
              position: 'relative',
              zIndex: 1,
            }}>
              {year}
            </span>
            <div 
              style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                height: '1px',
                backgroundColor: '#ddd',
                zIndex: 0,
              }}
            />
          </div>

          {/* Items da timeline */}
          {entries.map((entry) => {
            const categoryInfo = CATEGORIES[entry.category];
            const categoryColor = CATEGORY_COLORS[entry.category] || '#666';
            const isMilestone = entry.type === 'milestone';

            return (
              <div
                key={entry.id}
                className="timeline-item"
                style={{
                  display: 'flex',
                  marginLeft: '40px',
                  marginBottom: '16px',
                  alignItems: 'flex-start',
                }}
              >
                {/* Bolinha pixelada */}
                <div
                  className="timeline-dot"
                  style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: categoryColor,
                    borderRadius: '50%',
                    marginRight: '12px',
                    marginTop: '6px',
                    flexShrink: 0,
                    border: '2px solid #000',
                  }}
                />

                {/* Card */}
                <div
                  className="timeline-card"
                  onClick={() => onEdit(entry)}
                  style={{
                    border: '1px solid #e3e3e3',
                    borderRadius: '6px',
                    padding: isMilestone ? '12px 14px' : '16px',
                    background: isMilestone ? '#ffffff' : '#fafafa',
                    transition: 'all 0.15s ease',
                    cursor: 'pointer',
                    flex: 1,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                    e.currentTarget.style.borderColor = categoryColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = '#e3e3e3';
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 
                      className="font-pixel-bold"
                      style={{ 
                        color: '#111', 
                        fontSize: isMilestone ? '16px' : '18px',
                        marginBottom: '4px',
                      }}
                    >
                      {entry.title}
                    </h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(entry);
                      }}
                      className="text-red-500 hover:text-red-700 transition-colors ml-2"
                      style={{ fontSize: '18px', flexShrink: 0 }}
                    >
                      ×
                    </button>
                  </div>

                  {/* Categoria com ícone */}
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-pixel text-xs"
                      style={{
                        backgroundColor: `${categoryColor}20`,
                        border: `1px solid ${categoryColor}`,
                        color: categoryColor,
                      }}
                    >
                      <span style={{ fontSize: '14px' }}>{categoryInfo.emoji}</span>
                      {categoryInfo.label}
                    </span>
                  </div>

                  {/* Tempo */}
                  <div 
                    className="font-pixel text-xs"
                    style={{ 
                      color: '#666',
                      marginBottom: isMilestone ? 0 : '8px',
                    }}
                  >
                    {formatTimelineDate(entry.date)}
                  </div>

                  {/* Tag (apenas para milestone) */}
                  {isMilestone && entry.tag && (
                    <div className="mt-2">
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
                    </div>
                  )}

                  {/* Texto (apenas para story) */}
                  {!isMilestone && (
                    <p 
                      className="font-pixel mt-3"
                      style={{ 
                        color: '#555', 
                        fontSize: '14px', 
                        lineHeight: '1.6',
                      }}
                    >
                      {entry.text}
                    </p>
                  )}

                  {/* Foto (apenas para story) */}
                  {!isMilestone && entry.photo && (
                    <div className="mt-3">
                      <img
                        src={entry.photo}
                        alt={entry.title}
                        className="w-full h-48 object-cover rounded"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
      })}
    </div>
  );
}

