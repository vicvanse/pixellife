"use client";

import { useState } from "react";
import { Mood } from "@/app/hooks/useJournal";

interface MoodSelectorProps {
  value: Mood | null;
  onChange: (mood: Mood | null) => void;
  onNumberChange?: (number: number | null) => void;
  currentNumber?: number | null;
}

export function MoodSelector({ value, onChange, onNumberChange, currentNumber }: MoodSelectorProps) {
  // Se há um número, mostrar modo numérico inicialmente
  const [showNumeric, setShowNumeric] = useState(currentNumber !== null && currentNumber !== undefined);
  
  // Atualizar showNumeric quando currentNumber muda (ex: ao carregar dados)
  useEffect(() => {
    if (currentNumber !== null && currentNumber !== undefined) {
      setShowNumeric(true);
    }
  }, [currentNumber]);

  const moods: { value: Mood; emoji: string }[] = [
    { value: "bad", emoji: "🙁" },
    { value: "neutral", emoji: "😐" },
    { value: "good", emoji: "🙂" },
  ];

  // Mapeamento: triste=2, sério=5, feliz=8
  const moodToNumber: Record<Mood, number> = {
    bad: 2,
    neutral: 5,
    good: 8,
  };

  // Converter número para mood
  const numberToMood = (num: number): Mood => {
    if (num <= 3) return "bad";
    if (num <= 6) return "neutral";
    return "good";
  };

  const handleMoodClick = (moodValue: Mood) => {
    // Se já está selecionado, desseleciona
    if (value === moodValue) {
      onChange(null);
      if (onNumberChange) {
        onNumberChange(null);
      }
    } else {
      // Seleciona o mood
      onChange(moodValue);
      // Se está em modo numérico, também seleciona o número correspondente
      if (showNumeric && onNumberChange) {
        onNumberChange(moodToNumber[moodValue]);
      } else if (onNumberChange) {
        // Se não está em modo numérico, limpa o número
        onNumberChange(null);
      }
    }
  };

  const handleNumberClick = (num: number) => {
    const mappedMood = numberToMood(num);
    const isSelected = value === mappedMood && currentNumber === num;

    // Se já está selecionado, desseleciona
    if (isSelected) {
      onChange(null);
      if (onNumberChange) {
        onNumberChange(null);
      }
    } else {
      // Seleciona o mood e o número
      onChange(mappedMood);
      if (onNumberChange) {
        onNumberChange(num);
      }
    }
  };

  return (
    <div className="flex gap-2 justify-center md:justify-start items-center">
      {!showNumeric ? (
        <>
          {/* Mostrar botão "#" quando não há mood selecionado para alternar para modo numérico */}
          {value === null && (
            <button
              onClick={() => setShowNumeric(true)}
              className="border-2 border-black px-3 py-2 font-mono font-bold text-sm bg-gray-200 hover:opacity-90 touch-manipulation min-h-[48px] flex items-center gap-2"
              aria-label="Mostrar números"
              title="Mostrar números (0-10)"
            >
              <span className="text-xl">#</span>
            </button>
          )}
          {moods.map((mood) => (
            <button
              key={mood.value}
              onClick={() => handleMoodClick(mood.value)}
              className={`
                border-2 border-black px-3 py-2 font-mono font-bold text-sm
                ${value === mood.value ? "bg-blue-200" : "bg-gray-200"}
                hover:opacity-90 touch-manipulation min-h-[48px]
                flex items-center gap-2
              `}
              aria-label={`Humor: ${mood.value}`}
              aria-pressed={value === mood.value}
            >
              <span className="text-xl">{mood.emoji}</span>
            </button>
          ))}
        </>
      ) : (
        <div className="flex gap-1.5 flex-wrap justify-center">
          {Array.from({ length: 11 }, (_, i) => i).map((num) => {
            const mappedMood = numberToMood(num);
            const isSelected = value === mappedMood && currentNumber === num;
            // Alternar entre cinza claro e escuro baseado no número
            const isEven = num % 2 === 0;
            const bgColor = isSelected 
              ? (isEven ? "bg-gray-600" : "bg-gray-700")
              : (isEven ? "bg-gray-200" : "bg-gray-300");
            const textColor = isSelected ? "text-white" : "text-black";
            
            return (
              <button
                key={num}
                onClick={() => handleNumberClick(num)}
                className={`
                  w-8 h-8 rounded-full border-2 border-black font-mono font-bold text-xs
                  flex items-center justify-center touch-manipulation
                  ${bgColor} ${textColor}
                  hover:opacity-80 transition-opacity
                `}
                style={{ minWidth: '32px', minHeight: '32px' }}
                aria-label={`Humor: ${num}`}
                aria-pressed={isSelected}
              >
                {num}
              </button>
            );
          })}
        </div>
      )}
      <button
        onClick={() => setShowNumeric(!showNumeric)}
        className="w-12 h-12 rounded-full border-2 border-black bg-gray-300 font-mono font-bold text-sm flex items-center justify-center hover:bg-gray-400 touch-manipulation"
        style={{ minWidth: '48px', minHeight: '48px' }}
        aria-label={showNumeric ? "Mostrar emojis" : "Mostrar números"}
        title={showNumeric ? "Mostrar emojis" : "Mostrar números"}
      >
        {showNumeric ? "😊" : "#"}
      </button>
    </div>
  );
}
