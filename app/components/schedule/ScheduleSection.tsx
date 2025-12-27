"use client";

import { useState } from "react";
import { useSchedule } from "../../hooks/useSchedule";
import { ScheduleCalendar } from "./ScheduleCalendar";
import { ScheduleDayView } from "./ScheduleDayView";
import { CalendarSyncSettings } from "./CalendarSyncSettings";

export function ScheduleSection() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [view, setView] = useState<'calendar' | 'day' | 'settings'>('calendar');
  const { getDaySummary } = useSchedule();

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b mb-4">
        <h2 className="text-2xl font-bold font-pixel">Cronograma</h2>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setView('calendar');
              setSelectedDate(null);
            }}
            className={`px-4 py-2 rounded font-pixel ${view === 'calendar' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Calendário
          </button>
          <button
            onClick={() => setView('settings')}
            className={`px-4 py-2 rounded font-pixel ${view === 'settings' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Sincronização
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="w-full overflow-y-auto">
        {view === 'calendar' && (
          <ScheduleCalendar
            onDateSelect={(date) => {
              setSelectedDate(date);
              setView('day');
            }}
          />
        )}
        {view === 'day' && selectedDate && (
          <ScheduleDayView
            date={selectedDate}
            onBack={() => {
              setSelectedDate(null);
              setView('calendar');
            }}
          />
        )}
        {view === 'settings' && (
          <CalendarSyncSettings />
        )}
      </div>
    </div>
  );
}

