"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PixelMenu from "../../components/PixelMenu";
import { useCosmetics } from "../../components/CosmeticsContext";
import { useJournal } from "../../hooks/useJournal";
import Link from "next/link";

export default function JournalHistoryPage() {
  const { background } = useCosmetics();
  const { getAllDates, getEntry } = useJournal();
  const router = useRouter();
  const [dates, setDates] = useState<string[]>([]);

  // Handlers para abrir overlays redirecionando para /display
  const handleExpensesClick = () => {
    router.push("/display?overlay=expenses");
  };

  const handleHabitsClick = () => {
    router.push("/display?overlay=habits");
  };

  const handleJournalClick = () => {
    router.push("/display?overlay=journal");
  };

  const handleCosmeticsClick = () => {
    router.push("/display?overlay=cosmetics");
  };

  const handlePossessionsClick = () => {
    router.push("/display?overlay=possessions");
  };

  useEffect(() => {
    setDates(getAllDates());
  }, [getAllDates]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getMoodLabel = (mood: string | null, moodNumber?: number) => {
    if (mood === null) {
      return { label: "Sem humor", emoji: "—" };
    }
    const moods: { [key: string]: { label: string; emoji: string } } = {
      good: { label: "Bom", emoji: "😊" },
      neutral: { label: "Médio", emoji: "😐" },
      bad: { label: "Ruim", emoji: "😞" },
    };
    return moods[mood] || moods.neutral;
  };

  const getTextPreview = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div
      className="relative min-h-screen p-6 font-mono"
      style={{
        backgroundColor: background === "none" ? "#d8d8d8" : undefined,
        backgroundImage: background === "none" ? "none" : `url(${background})`,
        backgroundSize: background === "none" ? undefined : "cover",
        backgroundPosition: background === "none" ? undefined : "center",
        backgroundRepeat: background === "none" ? undefined : "no-repeat",
        imageRendering: background === "none" ? undefined : "pixelated",
      }}
    >
      <PixelMenu 
        onHabitsClick={handleHabitsClick}
        onJournalClick={handleJournalClick}
        onExpensesClick={handleExpensesClick}
        onCosmeticsClick={handleCosmeticsClick}
        onPossessionsClick={handlePossessionsClick}
      />

      <div className="max-w-3xl mx-auto">
        <h1 
          className="text-center mb-6" 
          style={{ 
            fontSize: '24px',
            color: '#333',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: 400
          }}
        >
          Histórico do Diário
        </h1>

        {dates.length === 0 ? (
          <div 
            className="p-6 text-center rounded-md" 
            style={{
              background: '#f7f7f7',
              border: '1px solid #ccc',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
            }}
          >
            <p style={{ color: '#666' }}>Nenhuma entrada encontrada.</p>
          </div>
        ) : (
          <div 
            className="space-y-4"
            style={{
              maxHeight: '70vh',
              overflowY: 'auto',
              paddingRight: '8px'
            }}
          >
            {dates.map((date) => {
              const entry = getEntry(date);
              if (!entry) return null;
              const moodInfo = getMoodLabel(entry.mood, entry.moodNumber ?? undefined);
              return (
                <Link
                  key={date}
                  href={`/journal/${date}`}
                  className="block transition-all"
                  style={{
                    background: '#f7f7f7',
                    border: '1px solid #ccc',
                    borderRadius: '6px',
                    padding: '16px 20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    textDecoration: 'none',
                    color: 'inherit'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f0f0f0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f7f7f7';
                  }}
                >
                  <div 
                    className="flex items-center justify-between mb-3"
                    style={{
                      fontWeight: 500,
                      color: '#333'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-pixel-bold" style={{ fontSize: '16px', color: '#333' }}>
                        {formatDate(date)}
                      </span>
                        {entry.mood === null ? (
                          <span className="font-pixel text-sm" style={{ color: '#999' }}>Sem humor</span>
                        ) : entry.moodNumber !== undefined ? (
                          <span 
                            className="font-pixel-bold px-3 py-1 rounded-full border" 
                            style={{ 
                              backgroundColor: '#e8e8e8',
                              fontSize: '16px', 
                              color: '#111',
                              border: '1px solid #e8e8e2'
                            }}
                          >
                            {entry.moodNumber}
                          </span>
                      ) : (
                        <>
                          <span className="text-xl">{moodInfo.emoji}</span>
                          <span className="font-pixel text-sm" style={{ color: '#666' }}>{moodInfo.label}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {entry.text && (
                    <p 
                      className="mb-2" 
                      style={{ 
                        fontSize: '0.9rem', 
                        color: '#555', 
                        lineHeight: '1.4rem' 
                      }}
                    >
                      {getTextPreview(entry.text)}
                    </p>
                  )}
                  {entry.quickNotes.length > 0 && (
                    <p 
                      className="text-xs mt-2" 
                      style={{ color: '#999' }}
                    >
                      {entry.quickNotes.length} pensamento(s) rápido(s)
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={() => router.push("/display?overlay=journal")}
            className="block w-full px-4 py-3 font-bold text-center transition-colors"
            style={{
              background: '#f7f7f7',
              border: '1px solid #ccc',
              borderRadius: '6px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              color: '#333'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f0f0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f7f7f7';
            }}
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}







