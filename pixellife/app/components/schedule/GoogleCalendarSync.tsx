"use client";

import { useState } from "react";
import { useSchedule } from "../../hooks/useSchedule";

export function GoogleCalendarSync() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { getAllDates, getDaySummary } = useSchedule();

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      // Redirecionar para OAuth do Google
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId) {
        alert('Google Client ID não configurado. Configure NEXT_PUBLIC_GOOGLE_CLIENT_ID nas variáveis de ambiente.');
        return;
      }
      
      const redirectUri = `${window.location.origin}/api/auth/google/callback`;
      const scope = 'https://www.googleapis.com/auth/calendar';
      const responseType = 'code';
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${responseType}&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;
      
      window.location.href = authUrl;
    } catch (error) {
      console.error('Erro ao conectar Google Calendar:', error);
      alert('Erro ao conectar com Google Calendar');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsLoading(true);
    try {
      const dates = getAllDates();
      const events: Array<{
        summary: string;
        description: string;
        start: { dateTime: string; timeZone: string };
        end: { dateTime: string; timeZone: string };
        colorId: string;
      }> = [];

      for (const date of dates) {
        const summary = getDaySummary(date);
        summary.events.forEach(event => {
          events.push({
            summary: event.title,
            description: event.description || '',
            start: {
              dateTime: new Date(`${date}T00:00:00`).toISOString(),
              timeZone: 'America/Sao_Paulo',
            },
            end: {
              dateTime: new Date(`${date}T23:59:59`).toISOString(),
              timeZone: 'America/Sao_Paulo',
            },
            colorId: getColorId(event.color),
          });
        });
      }

      // Enviar para API route que fará a sincronização
      const response = await fetch('/api/calendar/google/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
      });

      if (response.ok) {
        alert('Eventos sincronizados com sucesso!');
      } else {
        alert('Erro ao sincronizar eventos');
      }
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      alert('Erro ao sincronizar eventos');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border-2 border-black rounded">
      <h3 className="text-xl font-pixel-bold">Google Calendar</h3>
      {!isConnected ? (
        <button
          onClick={handleConnect}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded font-pixel disabled:opacity-50 hover:bg-blue-600"
        >
          {isLoading ? 'Conectando...' : 'Conectar Google Calendar'}
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-green-600 font-pixel">✓ Conectado ao Google Calendar</p>
          <button
            onClick={handleSync}
            disabled={isLoading}
            className="px-4 py-2 bg-green-500 text-white rounded font-pixel disabled:opacity-50 hover:bg-green-600"
          >
            {isLoading ? 'Sincronizando...' : 'Sincronizar Eventos'}
          </button>
        </div>
      )}
    </div>
  );
}

function getColorId(color: string): string {
  // Mapear cores para colorId do Google Calendar
  const colorMap: Record<string, string> = {
    '#22c55e': '10', // Verde
    '#ef4444': '11', // Vermelho
    '#eab308': '5',  // Amarelo
    '#8b5cf6': '3',  // Roxo
    '#4ade80': '10', // Verde claro
    '#f59e0b': '6',  // Laranja
    '#10b981': '10', // Verde escuro
  };
  return colorMap[color] || '1';
}

