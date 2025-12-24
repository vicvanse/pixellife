'use client';

interface TimelineGapProps {
  days: number;
  onExpand?: () => void;
}

export function TimelineGap({ days, onExpand }: TimelineGapProps) {
  const formatGapText = (days: number): string => {
    if (days < 7) return '';
    if (days < 30) return `${days} dias sem registros`;
    if (days < 60) return `${Math.floor(days / 30)} mês sem registros`;
    return `${Math.floor(days / 30)} meses sem registros`;
  };

  const gapText = formatGapText(days);
  if (!gapText) return null;

  return (
    <div 
      className="timeline-gap flex items-center relative"
      style={{ 
        height: '30px',
        marginLeft: '80px',
        marginBottom: '8px',
        cursor: onExpand ? 'pointer' : 'default'
      }}
      onClick={onExpand}
    >
      {/* Texto do gap */}
      <span
        className="font-pixel"
        style={{
          fontSize: '12px',
          color: '#999',
          fontStyle: 'italic',
        }}
      >
        {gapText}
      </span>
    </div>
  );
}

