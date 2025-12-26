'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useJournal, type Mood } from '../hooks/useJournal';
import { useLanguage } from '../context/LanguageContext';
import { MoodSelector } from './journal/MoodSelector';
import { PixelCard } from './PixelCard';

/**
 * NOVA SEÇÃO DO JOURNAL - Versão corrigida
 * Resolve:
 * 1. Bug de salvamento: salva quick notes antes de sair da página
 * 2. Bug de mood: permite desescolher (null) corretamente
 */
export function JournalSectionNew() {
  const { t, tString } = useLanguage();
  const { getTodayDate, getEntry, updateJournalEntry, addQuickNote, removeQuickNote, updateQuickNote, getAllDates, journal } = useJournal();
  
  // Estados principais
  const [selectedDate, setSelectedDate] = useState('');
  const [mood, setMood] = useState<Mood | null>(null);
  const [moodNumber, setMoodNumber] = useState<number | null>(null);
  const [text, setText] = useState('');
  const [quickNotes, setQuickNotes] = useState<Array<{ id: string; text: string; time?: string }>>([]);
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const [showJournalHistory, setShowJournalHistory] = useState(false);
  const [journalDates, setJournalDates] = useState<string[]>([]);
  const [showDateCalendar, setShowDateCalendar] = useState(false);
  const [dateCalendarMonth, setDateCalendarMonth] = useState(new Date());
  const [editingQuickNote, setEditingQuickNote] = useState<{ date: string; noteId: string } | null>(null);
  const [editingQuickNoteText, setEditingQuickNoteText] = useState('');
  
  // Refs para controle
  const textSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);
  const quickNotesRef = useRef<Array<{ id: string; text: string; time?: string }>>([]); // Ref para sempre ter o estado mais recente

  // Manter ref sincronizado com estado
  useEffect(() => {
    quickNotesRef.current = quickNotes;
  }, [quickNotes]);

  // Inicializar com data de hoje
  useEffect(() => {
    const todayDate = getTodayDate();
    setSelectedDate(todayDate);
    loadJournalEntry(todayDate);
    setJournalDates(getAllDates());
    setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 200);
  }, []);

  // Carregar entrada do journal
  const loadJournalEntry = (date: string) => {
    const entry = getEntry(date);
    if (entry) {
      setMood(entry.mood);
      setMoodNumber(entry.moodNumber ?? null);
      setText(entry.text);
      setIsTextExpanded(!!entry.text);
      const notes = entry.quickNotes.map((note) => ({ 
        id: note.id, 
        text: note.text,
        time: note.time 
      }));
      setQuickNotes(notes);
      quickNotesRef.current = notes;
    } else {
      setMood(null);
      setMoodNumber(null);
      setText('');
      setIsTextExpanded(false);
      setQuickNotes([]);
      quickNotesRef.current = [];
    }
  };

  // Função para salvar tudo (texto, mood, quick notes)
  const saveAll = useCallback(() => {
    if (!selectedDate) return;
    
    // Usar ref para ter sempre o estado mais recente dos quick notes
    const currentQuickNotes = quickNotesRef.current;
    
    // Obter entrada atual para preservar IDs e times
    const currentEntry = getEntry(selectedDate);
    const existingQuickNotes = currentEntry?.quickNotes || [];
    
    // Mapear quick notes preservando IDs e times quando possível
    const mappedQuickNotes = currentQuickNotes
      .filter(n => n.text && n.text.trim().length > 0)
      .map(n => {
        // Tentar encontrar o quickNote correspondente no journal para preservar ID e time
        const existing = existingQuickNotes.find(e => e.id === n.id) || 
                        existingQuickNotes.find(e => e.text.trim() === n.text.trim());
        return {
          id: existing?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`),
          time: existing?.time || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          text: n.text.trim()
        };
      });
    
    // IMPORTANTE: Passar mood: null explicitamente quando desescolhido, não undefined
    updateJournalEntry(selectedDate, {
      text,
      mood: mood, // null quando desescolhido, não undefined
      moodNumber: moodNumber ?? undefined,
      quickNotes: mappedQuickNotes
    });
    
    setJournalDates(getAllDates());
  }, [selectedDate, text, mood, moodNumber, getEntry, updateJournalEntry, getAllDates]);

  // Auto-save do texto com debounce
  useEffect(() => {
    if (!selectedDate || isInitialLoadRef.current) return;

    if (textSaveTimeoutRef.current) {
      clearTimeout(textSaveTimeoutRef.current);
    }

    textSaveTimeoutRef.current = setTimeout(() => {
      saveAll();
    }, 2000);

    return () => {
      if (textSaveTimeoutRef.current) {
        clearTimeout(textSaveTimeoutRef.current);
      }
    };
  }, [text, selectedDate, mood, moodNumber, saveAll]);

  // Salvar quick notes quando mudarem (com debounce menor)
  useEffect(() => {
    if (!selectedDate || isInitialLoadRef.current) return;

    const timeout = setTimeout(() => {
      saveAll();
    }, 1000);

    return () => clearTimeout(timeout);
  }, [quickNotes, selectedDate, saveAll]);

  // Salvar antes de sair da página ou desmontar componente
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Limpar timeout pendente
      if (textSaveTimeoutRef.current) {
        clearTimeout(textSaveTimeoutRef.current);
        textSaveTimeoutRef.current = null;
      }
      // Salvar tudo imediatamente
      saveAll();
    };

    // Salvar quando o componente for desmontado
    const handleUnload = () => {
      handleBeforeUnload();
    };

    // Adicionar listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleUnload);

    // Cleanup: salvar antes de remover listeners
    return () => {
      handleBeforeUnload(); // Salvar antes de desmontar
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleUnload);
    };
  }, [saveAll]);

  // Sincronizar quando o journal mudar externamente (mas não durante edição)
  useEffect(() => {
    if (!selectedDate || editingQuickNote) return;
    const entry = getEntry(selectedDate);
    if (entry) {
      // Só atualizar se realmente mudou
      const currentNotesKey = quickNotes.map(n => `${n.id}:${n.text}`).sort().join('|');
      const journalNotesKey = entry.quickNotes.map(n => `${n.id}:${n.text}`).sort().join('|');
      
      if (currentNotesKey !== journalNotesKey) {
        const notes = entry.quickNotes.map(n => ({ id: n.id, text: n.text, time: n.time }));
        setQuickNotes(notes);
        quickNotesRef.current = notes;
      }
      
      if (entry.text !== text) {
        setText(entry.text);
      }
      
      if (entry.mood !== mood) {
        setMood(entry.mood);
      }
      
      if (entry.moodNumber !== moodNumber) {
        setMoodNumber(entry.moodNumber ?? null);
      }
    }
  }, [journal, selectedDate]);

  // Navegação de datas
  const navigateDate = (direction: 'prev' | 'next') => {
    if (!selectedDate) return;
    // Salvar antes de mudar
    saveAll();
    const date = new Date(selectedDate + 'T00:00:00');
    date.setDate(date.getDate() + (direction === 'next' ? 1 : -1));
    const newDate = date.toISOString().substring(0, 10);
    setSelectedDate(newDate);
    isInitialLoadRef.current = true;
    loadJournalEntry(newDate);
    setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 200);
  };

  // Formatação de data
  const formatDisplayDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    const monthsFull = t('journal.monthsFull') as string[];
    const daysShort = t('journal.daysShort') as string[];
    return `${daysShort[date.getDay()]}, ${date.getDate()} ${t('common.of')} ${monthsFull[date.getMonth()]}`;
  };

  const formatDateForHistory = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    const monthsFull = t('journal.monthsFull') as string[];
    return `${date.getDate()} ${t('common.of')} ${monthsFull[date.getMonth()]}`;
  };

  // Handlers
  const handleMoodChange = (newMood: Mood | null) => {
    setMood(newMood);
    setMoodNumber(null);
    if (selectedDate) {
      // IMPORTANTE: Passar null explicitamente quando desescolhido
      updateJournalEntry(selectedDate, {
        mood: newMood, // null quando desescolhido, não undefined
        moodNumber: undefined,
        text,
        quickNotes: quickNotesRef.current.map(n => ({
          id: n.id,
          time: n.time || '',
          text: n.text
        }))
      });
      setJournalDates(getAllDates());
    }
  };

  const handleNumberChange = (num: number | null) => {
    setMoodNumber(num);
    let newMood: Mood | null = null;
    if (num !== null) {
      if (num <= 3) newMood = 'bad';
      else if (num <= 6) newMood = 'neutral';
      else newMood = 'good';
    }
    setMood(newMood);
    if (selectedDate) {
      // IMPORTANTE: Passar null explicitamente quando num é null
      updateJournalEntry(selectedDate, {
        mood: newMood, // null quando desescolhido
        moodNumber: num ?? undefined,
        text,
        quickNotes: quickNotesRef.current.map(n => ({
          id: n.id,
          time: n.time || '',
          text: n.text
        }))
      });
      setJournalDates(getAllDates());
    }
  };

  const handleAddQuickNote = (text: string) => {
    if (!text.trim() || !selectedDate) return;
    addQuickNote(selectedDate, text.trim());
    // Atualizar estado local após um pequeno delay
    setTimeout(() => {
      const entry = getEntry(selectedDate);
      if (entry) {
        const notes = entry.quickNotes.map(n => ({ id: n.id, text: n.text, time: n.time }));
        setQuickNotes(notes);
        quickNotesRef.current = notes;
      }
    }, 100);
  };

  const handleRemoveQuickNote = (noteId: string) => {
    if (!selectedDate) return;
    removeQuickNote(selectedDate, noteId);
    const updated = quickNotes.filter(n => n.id !== noteId);
    setQuickNotes(updated);
    quickNotesRef.current = updated;
    // Salvar imediatamente
    setTimeout(() => saveAll(), 100);
  };

  const handleUpdateQuickNote = (noteId: string, newText: string) => {
    if (!selectedDate || !newText.trim()) {
      setEditingQuickNote(null);
      setEditingQuickNoteText('');
      return;
    }
    
    // Atualizar estado local imediatamente
    const updated = quickNotes.map(n => n.id === noteId ? { ...n, text: newText.trim() } : n);
    setQuickNotes(updated);
    quickNotesRef.current = updated;
    
    // Salvar no journal
    updateQuickNote(selectedDate, noteId, newText.trim());
    
    setEditingQuickNote(null);
    setEditingQuickNoteText('');
    
    // Salvar tudo para garantir sincronização
    setTimeout(() => saveAll(), 100);
  };

  return (
    <div>
      <PixelCard className="p-6">
        {/* Cabeçalho com navegação de datas */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateDate('prev')}
              className="w-8 h-8 flex items-center justify-center rounded border border-[#d8d4c7] hover:bg-[#ece8dd] transition-colors font-pixel-bold"
              style={{ color: '#111' }}
            >
              ←
            </button>
            <h2 
              className="text-sm font-pixel-bold cursor-pointer hover:underline" 
              style={{ color: '#333', fontSize: '16px' }}
              title="Clique para selecionar uma data"
              onClick={() => {
                if (selectedDate) {
                  const date = new Date(selectedDate + 'T00:00:00');
                  setDateCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1));
                }
                setShowDateCalendar(true);
              }}
            >
              {selectedDate ? formatDisplayDate(selectedDate) : 'Loading...'}
            </h2>
            <button
              onClick={() => navigateDate('next')}
              className="w-8 h-8 flex items-center justify-center rounded border border-[#d8d4c7] hover:bg-[#ece8dd] transition-colors font-pixel-bold"
              style={{ color: '#111' }}
            >
              →
            </button>
          </div>
        </div>

        {/* Mood Selector */}
        <div className="flex justify-center mb-4">
          <MoodSelector
            value={mood}
            onChange={handleMoodChange}
            onNumberChange={handleNumberChange}
            currentNumber={moodNumber}
          />
        </div>

        {/* Container para Histórico e Text Area */}
        <div className="w-full mb-6">
          {/* Botão Histórico */}
          <div className="flex justify-end mb-2">
            <button
              onClick={() => setShowJournalHistory(!showJournalHistory)}
              className="px-3 py-1 rounded font-pixel text-xs transition-colors"
              style={{ 
                backgroundColor: '#f0f0f0',
                color: '#333',
                border: '1px solid #e0e0e0',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e0e0e0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f0f0f0';
              }}
            >
              {showJournalHistory ? t('common.hide') : t('common.history')}
            </button>
          </div>

          {/* Histórico de Journal Entries */}
          {showJournalHistory && (() => {
            const selectedDateObj = selectedDate ? new Date(selectedDate + 'T00:00:00') : null;
            
            const entriesWithText = journalDates
              .map((date) => {
                const entry = getEntry(date);
                if (!entry || !entry.text || !entry.text.trim()) return null;
                
                if (selectedDateObj) {
                  const dateObj = new Date(date + 'T00:00:00');
                  if (dateObj >= selectedDateObj) return null;
                }
                
                return { date, entry };
              })
              .filter((item): item is { date: string; entry: NonNullable<ReturnType<typeof getEntry>> } => item !== null)
              .sort((a, b) => {
                const dateA = new Date(a.date + 'T00:00:00').getTime();
                const dateB = new Date(b.date + 'T00:00:00').getTime();
                return dateB - dateA;
              })
              .slice(0, 5);
            
            return (
              <div className="mb-4 space-y-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {entriesWithText.length === 0 ? (
                  <p className="font-pixel text-center py-8" style={{ color: '#999', fontSize: '14px' }}>
                    {t('journal.noThoughtsThisMonth')}
                  </p>
                ) : (
                  entriesWithText.map(({ date, entry }) => {
                    const moodInfo = entry.mood ? {
                      good: { label: t('journal.moodGood'), emoji: '🙂' },
                      neutral: { label: t('journal.moodNeutral'), emoji: '😐' },
                      bad: { label: t('journal.moodBad'), emoji: '🙁' },
                    }[entry.mood] : null;
                    
                    return (
                      <div
                        key={date}
                        onClick={() => {
                          saveAll(); // Salvar antes de mudar
                          setSelectedDate(date);
                          isInitialLoadRef.current = true;
                          loadJournalEntry(date);
                          setShowJournalHistory(false);
                          setTimeout(() => {
                            isInitialLoadRef.current = false;
                          }, 200);
                        }}
                        className="p-4 rounded-lg cursor-pointer transition-all"
                        style={{
                          backgroundColor: '#fafafa',
                          border: '1px solid #e5e5e5',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f0f0f0';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#fafafa';
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-pixel-bold" style={{ color: '#333', fontSize: '16px' }}>
                            {formatDateForHistory(date)}
                          </span>
                          {entry.moodNumber !== undefined ? (
                            <span 
                              className="font-pixel-bold px-2 py-1 rounded-full border" 
                              style={{
                                backgroundColor: '#e8e8e8',
                                fontSize: '14px', 
                                color: '#111',
                                border: '1px solid #e8e8e2'
                              }}
                            >
                              {entry.moodNumber}
                            </span>
                          ) : (
                            moodInfo && (
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{moodInfo.emoji}</span>
                                <span className="font-pixel text-xs" style={{ color: '#666' }}>{moodInfo.label}</span>
                              </div>
                            )
                          )}
                        </div>
                        {entry.text && (
                          <p
                            className="font-pixel mb-2" 
                            style={{
                              fontSize: '14px', 
                              color: '#555', 
                              lineHeight: '1.4',
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {entry.text}
                          </p>
                        )}
                        {entry.quickNotes && entry.quickNotes.length > 0 && (
                          <p 
                            className="font-pixel text-xs" 
                            style={{ color: '#999' }}
                          >
                            {entry.quickNotes.length} {tString('journal.quickThoughts').toLowerCase()}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            );
          })()}

          {/* Label e Text Area */}
          <div>
            <label className="font-pixel-bold mb-2 block" style={{ color: '#333', fontSize: '14px' }}>
              {t('journal.longText')}:
            </label>
            {!isTextExpanded && text ? (
              <div
                onClick={() => setIsTextExpanded(true)}
                className="w-full p-4 rounded-lg cursor-pointer font-pixel"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #e0e0e0',
                  color: '#333',
                  fontSize: '16px',
                  minHeight: '60px',
                  maxHeight: '120px',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  lineHeight: '1.5',
                }}
              >
                {text}
              </div>
            ) : (
              <textarea
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setIsTextExpanded(true);
                }}
                onBlur={() => {
                  if (!text.trim()) {
                    setIsTextExpanded(false);
                  }
                }}
                placeholder={tString('journal.writeAboutDay')}
                className="w-full p-4 rounded-lg resize-none font-pixel focus:outline-none journal-textarea-scrollbar"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #e0e0e0',
                  color: '#333',
                  fontSize: '16px',
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'transparent transparent',
                  minHeight: text.trim() || isTextExpanded ? '198px' : '80px',
                }}
              />
            )}
          </div>
        </div>

        {/* Quick Thoughts */}
        <div 
          className="border border-[#e0e0e0] rounded-lg p-4 mb-6"
          style={{
            backgroundColor: '#e8e8e8',
          }}
        >
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs tracking-widest font-pixel-bold" style={{ color: '#333' }}>
              {t('journal.quickThoughts')}
            </p>
          </div>

          <div className="flex flex-col gap-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {quickNotes.map((note) => (
              <div
                key={note.id}
                className="p-2 rounded-md font-pixel text-gray-800 flex justify-between items-center relative group border border-[#e0e0e0]"
                style={{ 
                  fontSize: '16px',
                  backgroundColor: '#FFFFFF',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#ececec';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                }}
              >
                {editingQuickNote && editingQuickNote.date === selectedDate && editingQuickNote.noteId === note.id ? (
                  <input
                    type="text"
                    value={editingQuickNoteText}
                    onChange={(e) => setEditingQuickNoteText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleUpdateQuickNote(note.id, editingQuickNoteText);
                      } else if (e.key === 'Escape') {
                        setEditingQuickNote(null);
                        setEditingQuickNoteText('');
                      }
                    }}
                    onBlur={() => {
                      handleUpdateQuickNote(note.id, editingQuickNoteText);
                    }}
                    className="flex-1 px-2 py-1 rounded font-pixel border"
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#d0d0d0',
                      color: '#333',
                      fontSize: '16px',
                    }}
                    autoFocus
                  />
                ) : (
                  <>
                    <span 
                      className="flex-1 cursor-text"
                      onDoubleClick={() => {
                        setEditingQuickNote({ date: selectedDate, noteId: note.id });
                        setEditingQuickNoteText(note.text);
                      }}
                    >
                      {note.text}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingQuickNote({ date: selectedDate, noteId: note.id });
                          setEditingQuickNoteText(note.text);
                        }}
                        className="px-2 py-1 text-xs font-pixel border border-[#d0d0d0] rounded hover:bg-[#f0f0f0]"
                        style={{ color: '#333' }}
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => handleRemoveQuickNote(note.id)}
                        className="px-2 py-1 text-xs font-pixel border border-[#d0d0d0] rounded hover:bg-[#f0f0f0]"
                        style={{ color: '#333' }}
                      >
                        ×
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Input para adicionar novo quick note */}
          <div className="mt-3">
            <input
              type="text"
              placeholder={tString('journal.addQuickThought')}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  handleAddQuickNote(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
              className="w-full px-3 py-2 rounded font-pixel border border-[#e0e0e0] focus:outline-none"
              style={{
                backgroundColor: '#FFFFFF',
                color: '#333',
                fontSize: '16px',
              }}
            />
          </div>
        </div>
      </PixelCard>
    </div>
  );
}

