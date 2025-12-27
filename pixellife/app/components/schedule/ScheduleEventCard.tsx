"use client";

import { type ScheduleEvent } from "../../hooks/useSchedule";

interface ScheduleEventCardProps {
  event: ScheduleEvent;
}

export function ScheduleEventCard({ event }: ScheduleEventCardProps) {
  return (
    <div
      className="p-4 rounded border-2 border-black font-pixel"
      style={{ backgroundColor: `${event.color}20`, borderColor: event.color }}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl">{event.icon}</div>
        <div className="flex-1">
          <h4 className="font-pixel-bold text-lg mb-1">{event.title}</h4>
          {event.description && (
            <p className="text-sm text-gray-700">{event.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

