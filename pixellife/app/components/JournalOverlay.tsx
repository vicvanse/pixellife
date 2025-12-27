"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useJournal, type JournalEntry, type QuickNote, type Mood } from "../hooks/useJournal";
import { MoodSelector } from "./journal/MoodSelector";
import { QuickNoteModal } from "./journal/QuickNoteModal";
import { DossierSelector } from "./journal/DossierSelector";
import { formatDate } from "../lib/utils";
import { validateTextLength, sanitizeText } from "../lib/validation";
import { VALIDATION_LIMITS } from "../lib/constants";
import { useJournalDossierLinks } from "../hooks/useJournalDossierLinks";
import { useDossiers } from "../hooks/useDossiers";
import Link from "next/link";

interface JournalOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JournalOverlay({ isOpen, onClose }: JournalOverlayProps) {
  const { t, tString } = useLanguage();
  const { getTodayDate, getEntry, updateJournalEntry, addQuickNote, removeQuickNote, updateQuickNote } = useJournal();
  const { 
    getDossiersForJournal, 
    linkJournalToDossier, 
    unlinkJournalFromDossier 
  } = useJournalDossierLinks();
  const { getAllDossiers } = useDossiers();
  
  const [today, setToday] = useState("");
  const [mood, setMood] = useState<Mood | null>(null);
  const [moodNumber, setMoodNumber] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [showDossierSelector, setShowDossierSelector] = useState(false);
  const [selectedDossierIds, setSelectedDossierIds] = useState<string[]>([]);
  const clipButtonRef = useRef<HTMLButtonElement>(null);
  const textSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Carrega dados quando o overlay abre
  useEffect(() => {
    if (!isOpen) {
      setMood("none");
      setMoodNumber(null);
      setText("");
      setShowDossierSelector(false);
      if (textSaveTimeoutRef.current) {
        clearTimeout(textSaveTimeoutRef.current);
        textSaveTimeoutRef.current = null;
      }
      return;
    }

    const todayDate = getTodayDate();
    setToday(todayDate);
    const entry = getEntry(todayDate);
    
    if (entry) {
      // Converter null para "none" ao carregar
      setMood(entry.mood ?? "none");
      setMoodNumber(entry.moodNumber ?? null);
      setText(entry.text ?? "");
    } else {
      setMood("none");
      setMoodNumber(null);
      setText("");
    }
    
    const linkedDossiers = getDossiersForJournal(todayDate);
    setSelectedDossierIds(linkedDossiers);
  }, [isOpen, getTodayDate, getEntry, getDossiersForJournal]);

  // Salvar texto com debounce
  useEffect(() => {
    if (!today || !isOpen) return;

    if (textSaveTimeoutRef.current) {
      clearTimeout(textSaveTimeoutRef.current);
    }

    textSaveTimeoutRef.current = setTimeout(() => {
      updateJournalEntry(today, {
        text,
        mood,
        moodNumber: moodNumber ?? undefined,
      });
    }, 1000);

    return () => {
      if (textSaveTimeoutRef.current) {
        clearTimeout(textSaveTimeoutRef.current);
      }
    };
  }, [text, today, isOpen, mood, moodNumber, updateJournalEntry]);

  // Salvar ao fechar
  useEffect(() => {
    if (!isOpen || !today) return;
    
    return () => {
      // Salvar estado final ao fechar
      updateJournalEntry(today, {
        text,
        mood,
        moodNumber: moodNumber ?? undefined,
      });
    };
  }, [isOpen, today, text, mood, moodNumber, updateJournalEntry]);

  const handleSave = useCallback(() => {
    if (!today) return;
    
    const sanitizedText = sanitizeText(text);
    if (validateTextLength(sanitizedText)) {
      updateJournalEntry(today, {
        text: sanitizedText,
        mood,
        moodNumber: moodNumber ?? undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }, [text, mood, moodNumber, today, updateJournalEntry]);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  }, []);

  if (!isOpen) return null;

  const entry = getEntry(today);
  const quickNotes = entry?.quickNotes || [];

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white border-4 border-black max-w-6xl w-full mx-4 max-h-[90vh] flex flex-col shadow-[8px_8px_0_0_#000] font-mono relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão X */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-red-400 border-4 border-black px-4 py-2 font-bold hover:bg-red-500 shadow-[4px_4px_0_0_#000] text-xl z-10"
          aria-label="Fechar diário"
          title="Fechar"
        >
          ×
        </button>

        {/* Conteúdo scrollável */}
        <div className="overflow-y-auto flex-1 p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6 pr-12">
            <div className="flex items-center gap-4 flex-wrap">
              <h1 className="text-3xl font-bold">
                Diário{today ? `, ${formatDate(today)}` : ""}
              </h1>
              
              {/* Botão de clip para vincular a dossiês */}
              {today && (
                <div className="relative">
                  <button
                    ref={clipButtonRef}
                    onClick={() => setShowDossierSelector(!showDossierSelector)}
                    className="bg-blue-400 border-4 border-black px-3 py-2 font-bold hover:bg-blue-500 shadow-[4px_4px_0_0_#000] text-lg"
                    title="Vincular a dossiês"
                    style={{
                      backgroundColor: selectedDossierIds.length > 0 ? '#4caf50' : '#6daffe',
                    }}
                  >
                    📎 {selectedDossierIds.length > 0 && `(${selectedDossierIds.length})`}
                  </button>
                  {showDossierSelector && (
                    <DossierSelector
                      selectedDossierIds={selectedDossierIds}
                      onSelect={(dossierId) => {
                        if (today) {
                          linkJournalToDossier(today, dossierId);
                          setSelectedDossierIds([...selectedDossierIds, dossierId]);
                        }
                      }}
                      onDeselect={(dossierId) => {
                        if (today) {
                          unlinkJournalFromDossier(today, dossierId);
                          setSelectedDossierIds(selectedDossierIds.filter(id => id !== dossierId));
                        }
                      }}
                      onClose={() => setShowDossierSelector(false)}
                    />
                  )}
                </div>
              )}
              
              <MoodSelector 
                value={mood} 
                onChange={(newMood) => {
                  setMood(newMood);
                  if (newMood === null) {
                    setMoodNumber(null);
                  } else {
                    setMoodNumber(null);
                  }
                  // Sempre salvar quando mood muda
                  if (today) {
                    updateJournalEntry(today, {
                      mood: newMood === "none" ? null : newMood, // Converter "none" para null ao salvar
                      moodNumber: undefined,
                      text,
                    });
                  }
                }}
                onNumberChange={(num) => {
                  setMoodNumber(num);
                  // Sempre salvar quando moodNumber muda
                  if (today) {
                    updateJournalEntry(today, {
                      mood,
                      moodNumber: num ?? undefined,
                      text,
                    });
                  }
                }}
                currentNumber={moodNumber}
              />
            </div>
          </div>

          {/* Layout: Entrada do Dia e Pensamentos Rápidos */}
          <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
            <div className="flex flex-col gap-6">
              {/* Entrada do Dia - primeiro */}
              <div>
                <label className="block font-bold mb-3 text-lg">Entrada do dia:</label>
                <textarea
                  value={text}
                  onChange={handleTextChange}
                  onBlur={(e) => {
                    const newText = e.target.value;
                    if (!validateTextLength(newText, VALIDATION_LIMITS.MAX_TEXT_LENGTH)) {
                      setText(newText.substring(0, VALIDATION_LIMITS.MAX_TEXT_LENGTH));
                    }
                  }}
                  className="w-full border-2 border-black p-4 font-mono resize-none min-h-[400px] focus:outline-none bg-[#fdfbf6]"
                  placeholder="Escreva sobre seu dia…"
                  aria-label="Entrada do dia"
                  maxLength={VALIDATION_LIMITS.MAX_TEXT_LENGTH}
                />
                
                {/* Rodapé com vínculos a dossiês */}
                {selectedDossierIds.length > 0 && (
                  <div className="mt-3 pt-3 border-t-2 border-black">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-pixel-bold" style={{ color: '#666' }}>
                        📎 Vinculado a:
                      </span>
                      {selectedDossierIds.map((dossierId) => {
                        const allDossiers = getAllDossiers();
                        const dossier = allDossiers.find(d => d.id === dossierId);
                        if (!dossier) return null;
                        return (
                          <span
                            key={dossierId}
                            className="inline-block px-2 py-1 text-xs font-pixel border-2 border-black bg-blue-100"
                            style={{ color: '#1b5cff' }}
                          >
                            {dossier.title}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Pensamentos Rápidos - segundo */}
              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <label className="block font-bold text-lg">Pensamentos rápidos:</label>
                  <button
                    onClick={() => {
                      setEditingNoteId(null);
                      setIsModalOpen(true);
                    }}
                    className="bg-blue-400 border-4 border-black px-3 py-2 font-bold hover:bg-blue-500 shadow-[4px_4px_0_0_#000] text-lg flex-shrink-0"
                    aria-label="Adicionar pensamento rápido"
                    title="Adicionar pensamento"
                  >
                    +
                  </button>
                </div>
                
                {/* Grid de pensamentos rápidos - sem placeholders artificiais */}
                <div className={`grid grid-cols-2 gap-3 ${quickNotes.length > 4 ? 'overflow-y-auto max-h-[300px] pr-2' : ''}`} style={quickNotes.length > 4 ? { scrollbarWidth: 'thin' } : {}}>
                  {quickNotes.map((note) => (
                    <div
                      key={note.id}
                      className="bg-gray-100 border-2 border-black p-3 flex flex-col min-h-[140px] shadow-[3px_3px_0_0_#000]"
                    >
                      <div className="flex-1 mb-2 overflow-hidden">
                        <span className="text-xs font-bold text-gray-600 block mb-1">{note.time}</span>
                        <p className="text-sm break-words line-clamp-3">{note.text}</p>
                      </div>
                      <div className="flex gap-1 justify-end mt-auto">
                        <button
                          onClick={() => {
                            setEditingNoteId(note.id);
                            setIsModalOpen(true);
                          }}
                          className="bg-yellow-400 border-2 border-black px-2 py-1 text-xs font-bold hover:bg-yellow-500 shadow-[2px_2px_0_0_#000]"
                          title={tString('common.editQuickThought')}
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => {
                            if (today) {
                              removeQuickNote(today, note.id);
                            }
                          }}
                          className="bg-red-400 border-2 border-black px-2 py-1 text-xs font-bold hover:bg-red-500 shadow-[2px_2px_0_0_#000]"
                          title="Remover pensamento"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Quick Note */}
        <QuickNoteModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingNoteId(null);
          }}
          onSave={(text) => {
            if (editingNoteId && today) {
              updateQuickNote(today, editingNoteId, text);
              setEditingNoteId(null);
            } else if (today) {
              addQuickNote(today, text);
            }
            setIsModalOpen(false);
          }}
          initialText={editingNoteId ? quickNotes.find(n => n.id === editingNoteId)?.text || "" : ""}
          isEdit={editingNoteId !== null}
        />

        {/* Botões fixos na parte inferior */}
        <div className="border-t-4 border-black p-6 bg-white space-y-3">
          <button
            onClick={handleSave}
            className={`w-full bg-green-400 border-4 border-black px-4 py-3 font-bold text-white hover:bg-green-500 shadow-[4px_4px_0_0_#000] transition-all ${
              saved ? "animate-pulse" : ""
            }`}
          >
            {saved ? "✓ Salvo!" : "Salvar"}
          </button>

          <Link
            href="/journal/history"
            className="block w-full bg-blue-300 border-4 border-black px-4 py-2 font-bold text-white text-center hover:bg-blue-400 shadow-[4px_4px_0_0_#000] text-sm"
          >
            Ver entradas anteriores
          </Link>
        </div>
      </div>
    </div>
  );
}
