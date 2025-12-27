"use client";

import { useState } from "react";
import { useSchedule } from "../../hooks/useSchedule";
import { ScheduleCalendar } from "./ScheduleCalendar";
import { ScheduleDayView } from "./ScheduleDayView";
import { CalendarSyncSettings } from "./CalendarSyncSettings";

interface ScheduleOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ScheduleOverlay({ isOpen, onClose }: ScheduleOverlayProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [view, setView] = useState<'calendar' | 'day' | 'settings'>('calendar');
  const { getDaySummary } = useSchedule();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-4xl h-[90vh] bg-white rounded-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
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
            <button
              onClick={onClose}
              className="px-4 py-2 bg-red-500 text-white rounded font-pixel"
            >
              Fechar
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="h-full overflow-y-auto p-4">
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
    </div>
  );
}

