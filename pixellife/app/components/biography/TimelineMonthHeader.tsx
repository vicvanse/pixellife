'use client';

import { useLanguage } from '@/app/context/LanguageContext';

interface TimelineMonthHeaderProps {
  year: number;
  month: number;
  isExpanded: boolean;
  onToggle: () => void;
}

export function TimelineMonthHeader({ year, month, isExpanded, onToggle }: TimelineMonthHeaderProps) {
  const { t } = useLanguage();
  
  // Obter array de meses
  const monthsFull = t('journal.monthsFull');
  const monthNames = Array.isArray(monthsFull) ? monthsFull : [];
  
  // Fallback para português
  const fallbackMonths = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const monthName = monthNames[month] || fallbackMonths[month] || `Mês ${month + 1}`;

  return (
    <div
      className="sticky top-0 bg-white z-20 py-4"
      style={{ marginLeft: '80px' }}
    >
      <div 
        className="flex items-center gap-3 cursor-pointer transition-colors hover:opacity-80"
        onClick={onToggle}
        style={{ userSelect: 'none' }}
      >
        {/* Bolinha na linha */}
        <div
          style={{
            width: '12px',
            height: '12px',
            backgroundColor: '#000',
            borderRadius: '50%',
            flexShrink: 0,
            marginLeft: '-6px',
          }}
        />
        {/* Texto do mês */}
        <h2
          className="font-pixel-bold"
          style={{
            color: '#111',
            fontSize: '18px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          {monthName} {year}
        </h2>
        {/* Ícone de expandir/colapsar */}
        <span
          style={{
            fontSize: '16px',
            color: '#666',
            marginLeft: '4px',
          }}
        >
          {isExpanded ? '▾' : '▸'}
        </span>
      </div>
    </div>
  );
}

