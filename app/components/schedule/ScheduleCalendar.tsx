"use client";

import { useState, useMemo } from "react";
import { useSchedule } from "../../hooks/useSchedule";

interface ScheduleCalendarProps {
  onDateSelect: (date: string) => void;
}

export function ScheduleCalendar({ onDateSelect }: ScheduleCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { getAllDates, getDaySummary } = useSchedule();
  
  const datesWithEvents = useMemo(() => {
    return new Set(getAllDates());
  }, [getAllDates]);

  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const days = [];
  const current = new Date(startDate);
  
  while (current <= monthEnd || current.getDay() !== 0) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const formatDateKey = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getDayColor = (date: Date): string => {
    const dateKey = formatDateKey(date);
    if (!datesWithEvents.has(dateKey)) return 'bg-gray-100';
    
    const summary = getDaySummary(dateKey);
    if (summary.mood === 'good') return 'bg-green-200';
    if (summary.mood === 'bad') return 'bg-red-200';
    if (summary.mood === 'neutral') return 'bg-yellow-200';
    if (summary.events.length > 0) return 'bg-blue-200';
    return 'bg-gray-200';
  };

  return (
    <div className="w-full bg-gray-300 p-4 rounded">
      {/* Header do calendário */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="px-4 py-2 bg-gray-200 rounded font-pixel hover:bg-gray-300"
        >
          ←
        </button>
        <h3 className="text-xl font-bold font-pixel">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          onClick={handleNextMonth}
          className="px-4 py-2 bg-gray-200 rounded font-pixel hover:bg-gray-300"
        >
          →
        </button>
      </div>

      {/* Dias da semana */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center font-pixel-bold text-sm py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Dias do mês */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, idx) => {
          const dateKey = formatDateKey(date);
          const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
          const hasEvents = datesWithEvents.has(dateKey);
          const summary = hasEvents ? getDaySummary(dateKey) : null;
          
          return (
            <button
              key={idx}
              onClick={() => {
                if (isCurrentMonth) {
                  onDateSelect(dateKey);
                }
              }}
              className={`
                w-10 h-10 p-1 rounded border-2 font-pixel text-base font-bold
                ${isCurrentMonth ? 'border-black' : 'border-gray-300 text-gray-400'}
                ${isToday(date) ? 'ring-2 ring-blue-500' : ''}
                ${getDayColor(date)}
                hover:opacity-80 transition-opacity
                ${!isCurrentMonth ? 'cursor-not-allowed' : 'cursor-pointer'}
              `}
              disabled={!isCurrentMonth}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <span className="text-base font-bold">{date.getDate()}</span>
                {summary && summary.events.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {summary.events.slice(0, 3).map((event, i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: event.color }}
                        title={event.title}
                      />
                    ))}
                    {summary.events.length > 3 && (
                      <span className="text-xs">+{summary.events.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

