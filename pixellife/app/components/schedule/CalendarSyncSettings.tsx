"use client";

import { GoogleCalendarSync } from "./GoogleCalendarSync";
import { AppleCalendarSync } from "./AppleCalendarSync";

export function CalendarSyncSettings() {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-pixel-bold mb-4">Sincronização com Calendários</h3>
      
      <div className="space-y-4">
        <GoogleCalendarSync />
        <AppleCalendarSync />
      </div>

      <div className="mt-6 p-4 bg-gray-100 rounded border-2 border-black">
        <p className="text-sm font-pixel text-gray-700">
          <strong>Nota:</strong> A sincronização exporta todos os eventos do seu cronograma 
          (hábitos, diário, despesas, compromissos financeiros e eventos da biografia) para 
          seus calendários externos.
        </p>
      </div>
    </div>
  );
}

