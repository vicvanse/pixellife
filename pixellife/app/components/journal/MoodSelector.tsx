"use client";

import { useState, useEffect } from "react";
import { Mood } from "@/app/hooks/useJournal";

interface MoodSelectorProps {
  value: Mood | null;
  onChange: (mood: Mood | null) => void;
  onNumberChange?: (number: number | null) => void; // Callback para quando o número é selecionado
  currentNumber?: number | null; // Número atual (0-10)
}

export function MoodSelector({ value, onChange, onNumberChange, currentNumber }: MoodSelectorProps) {
  const [showNumeric, setShowNumeric] = useState(false);
  
  // Sincronizar showNumeric com currentNumber e value
  // Se não há número selecionado E não há mood selecionado, sair do modo numérico
  // Isso garante que quando o componente é montado com estado vazio, não fica em modo numérico
  useEffect(() => {
    // Se não há número selecionado E não há mood selecionado, garantir que está em modo emoji
    if ((currentNumber === null || currentNumber === undefined) && value === null) {
      setShowNumeric(false);
    }
  }, [currentNumber, value]);
  
  const moods: { value: Mood; label: string; emoji: string; color: string }[] = [
    { value: "bad", label: "Ruim", emoji: "😞", color: "bg-red-400" },
    { value: "neutral", label: "Médio", emoji: "😐", color: "bg-yellow-400" },
    { value: "good", label: "Bom", emoji: "😊", color: "bg-green-400" },
  ];

  // Função para converter número (0-10) para mood
  const numberToMood = (num: number): Mood => {
    if (num <= 3) return "bad";
    if (num <= 6) return "neutral";
    return "good";
  };

  // Função para converter mood para número aproximado
  const moodToNumber = (mood: Mood | null): number | null => {
    if (mood === null) return null;
    if (mood === "bad") return 2;
    if (mood === "neutral") return 5;
    return 8;
  };

  const handleNumericClick = (num: number) => {
    // Se já está selecionado, desseleciona
    const mappedMood = numberToMood(num);
    const isSelected = value !== null && value === mappedMood && currentNumber === num;
    if (isSelected) {
      onChange(null);
      if (onNumberChange) {
        onNumberChange(null);
      }
    } else {
      const newMood = numberToMood(num);
      onChange(newMood);
      if (onNumberChange) {
        onNumberChange(num);
      }
    }
  };

  const handleMoodClick = (moodValue: Mood) => {
    // Se já está selecionado, desseleciona
    if (value === moodValue) {
      onChange(null);
      if (onNumberChange) {
        onNumberChange(null);
      }
    } else {
      // Quando seleciona um emoji, limpar o número (não usar número inferido)
      onChange(moodValue);
      if (onNumberChange) {
        onNumberChange(null); // Limpar número quando seleciona emoji
      }
    }
  };

  // displayNumber: só mostrar número se foi explicitamente selecionado
  // Não usar moodToNumber para calcular displayNumber, pois isso pode causar confusão
  // Se currentNumber existe, usar ele; caso contrário, null (não calcular a partir do mood)
  const displayNumber = currentNumber !== undefined && currentNumber !== null ? currentNumber : null;

  return (
    <div className="flex gap-2 justify-center md:justify-start items-center">
      {!showNumeric ? (
        <>
          {moods.map((mood) => (
            <button
              key={mood.value}
              onClick={() => handleMoodClick(mood.value)}
              className={`
                border-2 border-black px-3 py-2 font-mono font-bold text-sm
                ${value === mood.value ? mood.color : "bg-gray-200"}
                hover:opacity-90 touch-manipulation min-h-[48px]
                flex items-center gap-2
              `}
              aria-label={`Humor: ${mood.label}`}
              aria-pressed={value === mood.value}
              role="button"
            >
              <span className="text-xl">{mood.emoji}</span>
              <span>{mood.label}</span>
            </button>
          ))}
        </>
      ) : (
        <div className="flex gap-2 flex-wrap justify-center">
          {Array.from({ length: 11 }, (_, i) => i).map((num) => {
            const mappedMood = numberToMood(num);
            const isSelected = value !== null && value === mappedMood && displayNumber === num;
            return (
              <button
                key={num}
                onClick={() => handleNumericClick(num)}
                className={`
                  w-12 h-12 rounded-full border-2 border-black font-mono font-bold text-sm
                  flex items-center justify-center touch-manipulation
                  ${isSelected ? "bg-blue-400" : "bg-gray-200"}
                  hover:opacity-90
                `}
                style={{ minWidth: '48px', minHeight: '48px' }}
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







