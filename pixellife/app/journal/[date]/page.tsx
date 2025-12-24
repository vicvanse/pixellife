"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import PixelMenu from "../../components/PixelMenu";
import { useCosmetics } from "../../components/CosmeticsContext";
import { useJournal } from "../../hooks/useJournal";
import Link from "next/link";

export default function JournalDatePage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = use(params);
  const { background } = useCosmetics();
  const { getEntry } = useJournal();
  const router = useRouter();
  const entry = getEntry(date);

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

  const formatDate = (dateStr: string) => {
    const dateObj = new Date(dateStr + "T00:00:00");
    const days = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
    const months = [
      "janeiro",
      "fevereiro",
      "março",
      "abril",
      "maio",
      "junho",
      "julho",
      "agosto",
      "setembro",
      "outubro",
      "novembro",
      "dezembro",
    ];
    return `${days[dateObj.getDay()]}, ${dateObj.getDate()} de ${months[dateObj.getMonth()]} de ${dateObj.getFullYear()}`;
  };

  const getMoodLabel = (mood: string | null, moodNumber?: number) => {
    if (mood === null) {
      return { label: "Sem humor", emoji: "—", color: "bg-gray-300" };
    }
    const moods: { [key: string]: { label: string; emoji: string; color: string } } = {
      good: { label: "Bom", emoji: "😊", color: "bg-green-400" },
      neutral: { label: "Médio", emoji: "😐", color: "bg-yellow-400" },
      bad: { label: "Ruim", emoji: "😞", color: "bg-red-400" },
    };
    return moods[mood] || moods.neutral;
  };

  if (!entry) {
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
          <div className="bg-white border-4 border-black p-6 text-center shadow-[6px_6px_0_0_#000]">
            <p className="mb-4">Entrada não encontrada para esta data.</p>
            <button
              onClick={() => router.push("/display?overlay=journal")}
              className="inline-block bg-gray-300 border-4 border-black px-4 py-2 font-bold hover:bg-gray-400 shadow-[4px_4px_0_0_#000]"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const moodInfo = getMoodLabel(entry.mood, entry.moodNumber ?? undefined);

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
          Diário
        </h1>

        {/* Cabeçalho */}
        <div 
          className="p-4 mb-4 rounded-md"
          style={{
            background: '#f7f7f7',
            border: '1px solid #ccc',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
          }}
        >
          <h2 className="text-xl font-bold mb-3" style={{ color: '#333' }}>{formatDate(date)}</h2>
          {entry.mood === null ? (
            <div 
              className="inline-block px-4 py-2 font-bold rounded-md border"
              style={{
                backgroundColor: '#e8e8e8',
                border: '1px solid #ddd',
                color: '#666'
              }}
            >
              Sem humor selecionado
            </div>
          ) : entry.moodNumber !== undefined ? (
            <div 
              className="inline-block px-4 py-2 font-bold rounded-full border" 
              style={{ 
                backgroundColor: '#e8e8e8',
                color: '#111',
                border: '1px solid #e8e8e2'
              }}
            >
              {entry.moodNumber}
            </div>
          ) : (
            <div 
              className="inline-block px-4 py-2 font-bold rounded-md border"
              style={{
                backgroundColor: entry.mood === 'good' ? '#C8E6C9' : entry.mood === 'neutral' ? '#FFF9C4' : '#FFCDD2',
                border: '1px solid #ddd',
                color: '#111'
              }}
            >
              {moodInfo.emoji} {moodInfo.label}
            </div>
          )}
        </div>

        {/* Entrada principal */}
        {entry.text && (
          <div 
            className="p-4 mb-4 rounded-md"
            style={{
              background: '#f7f7f7',
              border: '1px solid #ccc',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
            }}
          >
            <h3 
              className="font-bold mb-3" 
              style={{ 
                color: '#333',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontSize: '14px',
                fontWeight: 400
              }}
            >
              Entrada do dia
            </h3>
            <p 
              className="whitespace-pre-wrap" 
              style={{ 
                fontSize: '0.9rem', 
                color: '#555', 
                lineHeight: '1.4rem' 
              }}
            >
              {entry.text}
            </p>
          </div>
        )}

        {/* Quick Notes */}
        {entry.quickNotes.length > 0 && (
          <div 
            className="p-4 mb-4 rounded-md"
            style={{
              background: '#f7f7f7',
              border: '1px solid #ccc',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
            }}
          >
            <h3 
              className="font-bold mb-3" 
              style={{ 
                color: '#333',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontSize: '14px',
                fontWeight: 400
              }}
            >
              Pensamentos rápidos
            </h3>
            <div 
              className="space-y-2"
              style={{
                background: '#ffffff',
                border: '1px solid #ddd',
                borderRadius: '4px',
                padding: '12px'
              }}
            >
              {entry.quickNotes.map((note, index) => (
                <div
                  key={note.id}
                  className="text-sm"
                  style={{
                    paddingBottom: index < entry.quickNotes.length - 1 ? '8px' : '0',
                    borderBottom: index < entry.quickNotes.length - 1 ? '1px solid #eee' : 'none'
                  }}
                >
                  <span 
                    className="text-xs font-bold" 
                    style={{ color: '#999' }}
                  >
                    {note.time}
                  </span>
                  <p 
                    className="mt-1" 
                    style={{ 
                      fontSize: '0.9rem', 
                      color: '#555' 
                    }}
                  >
                    {note.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botão voltar */}
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
  );
}







