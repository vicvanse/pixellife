'use client';

import { TimelineEvent } from '@/app/hooks/useTimeline';

interface TimelineEventCardProps {
  event: TimelineEvent;
  onEdit: () => void;
  onDelete: () => void;
}

export function TimelineEventCard({ event, onEdit, onDelete }: TimelineEventCardProps) {
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${day}/${month}/${year}`;
  };

  const formatYear = (dateStr: string): string => {
    return dateStr.substring(0, 4);
  };

  return (
    <div
      className="p-3 rounded cursor-pointer transition-all"
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #e0e0e0',
        borderRadius: '6px',
      }}
      onClick={onEdit}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#4caf50';
        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#e0e0e0';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-pixel-bold" style={{ color: '#111', fontSize: '16px' }}>
              {event.title}
            </h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-red-500 hover:text-red-700 transition-colors ml-2"
              style={{ fontSize: '18px', flexShrink: 0 }}
            >
              ×
            </button>
          </div>
          <p className="font-pixel" style={{ color: '#666', fontSize: '14px' }}>
            {formatDate(event.date)}
          </p>
        </div>
      </div>
    </div>
  );
}

