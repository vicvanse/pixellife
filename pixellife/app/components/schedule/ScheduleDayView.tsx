"use client";

import { useSchedule, type ScheduleEvent } from "../../hooks/useSchedule";
import { ScheduleEventCard } from "./ScheduleEventCard";

interface ScheduleDayViewProps {
  date: string;
  onBack: () => void;
}

export function ScheduleDayView({ date, onBack }: ScheduleDayViewProps) {
  const { getDaySummary } = useSchedule();
  const summary = getDaySummary(date);

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    return `${days[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
  };

  const eventsByType = summary.events.reduce((acc, event) => {
    if (!acc[event.type]) {
      acc[event.type] = [];
    }
    acc[event.type].push(event);
    return acc;
  }, {} as Record<string, ScheduleEvent[]>);

  const typeLabels: Record<string, string> = {
    journal: 'Diário',
    habit: 'Hábitos',
    expense: 'Despesas',
    financial: 'Compromissos Financeiros',
    biography: 'Biografia',
    custom: 'Personalizados'
  };

  return (
    <div className="w-full">
      <button
        onClick={onBack}
        className="mb-4 px-4 py-2 bg-gray-200 rounded font-pixel hover:bg-gray-300"
      >
        ← Voltar
      </button>

      <h2 className="text-2xl font-bold font-pixel mb-4">
        {formatDate(date)}
      </h2>

      {/* Resumo do dia */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-100 p-4 rounded border-2 border-black">
          <div className="text-sm font-pixel text-gray-600">Hábitos</div>
          <div className="text-2xl font-pixel-bold">
            {summary.habitsCompleted}/{summary.totalHabits}
          </div>
        </div>
        <div className="bg-green-100 p-4 rounded border-2 border-black">
          <div className="text-sm font-pixel text-gray-600">Despesas</div>
          <div className="text-2xl font-pixel-bold">
            R$ {summary.expensesTotal.toFixed(2)}
          </div>
        </div>
        <div className="bg-purple-100 p-4 rounded border-2 border-black">
          <div className="text-sm font-pixel text-gray-600">Compromissos</div>
          <div className="text-2xl font-pixel-bold">
            {summary.financialEvents}
          </div>
        </div>
        <div className="bg-yellow-100 p-4 rounded border-2 border-black">
          <div className="text-sm font-pixel text-gray-600">Total Eventos</div>
          <div className="text-2xl font-pixel-bold">
            {summary.events.length}
          </div>
        </div>
      </div>

      {/* Eventos por tipo */}
      {Object.keys(eventsByType).length === 0 ? (
        <div className="text-center py-8 text-gray-500 font-pixel">
          Nenhum evento registrado para este dia
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(eventsByType).map(([type, events]) => (
            <div key={type}>
              <h3 className="text-lg font-pixel-bold mb-2">
                {typeLabels[type] || type}
              </h3>
              <div className="space-y-2">
                {events.map(event => (
                  <ScheduleEventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

