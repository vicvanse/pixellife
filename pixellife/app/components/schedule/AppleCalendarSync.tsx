"use client";

import { useSchedule } from "../../hooks/useSchedule";

export function AppleCalendarSync() {
  const { getAllDates, getDaySummary } = useSchedule();

  const generateICS = () => {
    const dates = getAllDates();
    let icsContent = "BEGIN:VCALENDAR\n";
    icsContent += "VERSION:2.0\n";
    icsContent += "PRODID:-//Pixel Life//Schedule//EN\n";
    icsContent += "CALSCALE:GREGORIAN\n";
    icsContent += "METHOD:PUBLISH\n";

    dates.forEach(date => {
      const summary = getDaySummary(date);
      summary.events.forEach(event => {
        const startDate = date.replace(/-/g, "");
        const endDate = date.replace(/-/g, "");
        
        icsContent += "BEGIN:VEVENT\n";
        icsContent += `UID:${event.id}@pixellife\n`;
        icsContent += `DTSTART;VALUE=DATE:${startDate}\n`;
        icsContent += `DTEND;VALUE=DATE:${endDate}\n`;
        icsContent += `SUMMARY:${event.title.replace(/,/g, '\\,')}\n`;
        icsContent += `DESCRIPTION:${(event.description || '').replace(/,/g, '\\,')}\n`;
        icsContent += `STATUS:CONFIRMED\n`;
        icsContent += "END:VEVENT\n";
      });
    });

    icsContent += "END:VCALENDAR";

    // Criar blob e fazer download
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pixellife-schedule-${new Date().toISOString().split('T')[0]}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 p-4 border-2 border-black rounded">
      <h3 className="text-xl font-pixel-bold">Apple Calendar</h3>
      <p className="text-sm font-pixel text-gray-700">
        Exporte seus eventos como arquivo .ics para importar no Apple Calendar ou outros 
        aplicativos de calendário compatíveis.
      </p>
      <button
        onClick={generateICS}
        className="px-4 py-2 bg-gray-800 text-white rounded font-pixel hover:bg-gray-900"
      >
        Exportar para Apple Calendar (.ics)
      </button>
    </div>
  );
}

