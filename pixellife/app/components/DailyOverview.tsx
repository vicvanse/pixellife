'use client';

import { useState, useEffect, useRef } from 'react';
import { useJournal, type Mood } from '../hooks/useJournal';
import { useHabits, type Habit } from '../hooks/useHabits';
import { PixelCard } from './PixelCard';
import { useConfirmation } from '../context/ConfirmationContext';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { MoodSelector } from './journal/MoodSelector';

export function DailyOverview() {
  const { t, tString, language } = useLanguage();
  const { getTodayDate, getEntry, updateJournalEntry, addQuickNote, removeQuickNote, getAllDates, journal, updateQuickNote } = useJournal();
  const { setJournal } = useApp();
  const { habits, toggleCheck, addHabit, updateHabit, deleteHabit } = useHabits();
  const [selectedDate, setSelectedDate] = useState('');
  const [mood, setMood] = useState<Mood | null>(null);
  const [text, setText] = useState('');
  const [quickNotes, setQuickNotes] = useState<Array<{ id: string; text: string }>>([]);
  const [newQuickNote, setNewQuickNote] = useState('');
  const [isAddingQuickNote, setIsAddingQuickNote] = useState(false);
  const [editingQuickNoteDate, setEditingQuickNoteDate] = useState<string | null>(null); // Data do card que está sendo editado
  const [inlineQuickNoteText, setInlineQuickNoteText] = useState(''); // Texto do input inline
  const [days, setDays] = useState<string[]>([]);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [quickThoughtsMonth, setQuickThoughtsMonth] = useState(new Date());
  const [journalDates, setJournalDates] = useState<string[]>([]);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  const { showConfirmation } = useConfirmation();
  const [currentMoodNumber, setCurrentMoodNumber] = useState<number | null>(null);
  const [showDateCalendar, setShowDateCalendar] = useState(false);
  const [dateCalendarMonth, setDateCalendarMonth] = useState(new Date());
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const [blocksMode, setBlocksMode] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editingBlockText, setEditingBlockText] = useState('');
  const [editingQuickNote, setEditingQuickNote] = useState<{ date: string; noteId: string } | null>(null);
  const [editingQuickNoteText, setEditingQuickNoteText] = useState('');
  const quickThoughtsScrollRef = useRef<HTMLDivElement>(null);
  const [showQuickThoughtsView, setShowQuickThoughtsView] = useState(false);
  const [showJournalHistory, setShowJournalHistory] = useState(false);
  const isInitialLoadRef = useRef(true);

  // Inicializar com data de hoje
  useEffect(() => {
    const todayDate = getTodayDate();
    setSelectedDate(todayDate);
    loadJournalEntry(todayDate);
    setJournalDates(getAllDates());
    // Marcar que a carga inicial foi concluída após um pequeno delay
    setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 200); // Aumentado para garantir que loadJournalEntry terminou
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll para o primeiro dia catalogado quando o mês mudar
  useEffect(() => {
    if (quickThoughtsScrollRef.current) {
      // Encontrar o primeiro dia com pensamentos
      const firstDayWithNotes = Object.keys(journal)
        .filter(date => {
          const entry = journal[date];
          if (!entry?.quickNotes || entry.quickNotes.length === 0) return false;
          const [y, m] = date.split('-').map(Number);
          const currentMonth = quickThoughtsMonth.getMonth();
          const currentYear = quickThoughtsMonth.getFullYear();
          return y === currentYear && m - 1 === currentMonth;
        })
        .sort()
        .reverse()[0];
      
      if (firstDayWithNotes) {
        const [y, m, d] = firstDayWithNotes.split('-').map(Number);
        const daysInMonth = new Date(y, m, 0).getDate();
        const dayIndex = daysInMonth - d; // Ordem decrescente
        const scrollPosition = dayIndex * 200;
        quickThoughtsScrollRef.current.scrollLeft = scrollPosition;
      }
    }
  }, [quickThoughtsMonth]); // Removido journal das dependências para não scrollar ao deletar

  // Atualizar os 7 dias (últimos 7 dias incluindo hoje)
  useEffect(() => {
    const updateDays = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const d = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const da = String(date.getDate()).padStart(2, "0");
        d.push(`${y}-${m}-${da}`);
      }
      setDays(d);
    };

    updateDays();
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const ms = tomorrow.getTime() - now.getTime();
    const timeoutId = setTimeout(() => updateDays(), ms);
    return () => clearTimeout(timeoutId);
  }, []);

  const loadJournalEntry = (date: string) => {
    const entry = getEntry(date);
    if (entry) {
      setMood(entry.mood);
      // Carregar moodNumber se existir, caso contrário null
      setCurrentMoodNumber(entry.moodNumber ?? null);
      setText(entry.text);
      setIsTextExpanded(!!entry.text);
      const notes = entry.quickNotes.map((note) => ({ id: note.id, text: note.text }));
      setQuickNotes(notes);
      // Atualizar a referência de sincronização
      lastSyncedJournalRef.current = entry.quickNotes.map(n => `${n.id}:${n.text}`).sort().join('|');
    } else {
      setMood(null);
      setCurrentMoodNumber(null);
      setText('');
      setIsTextExpanded(false);
      setQuickNotes([]);
      lastSyncedJournalRef.current = '';
    }
  };

  // Sincronizar quickNotes quando o journal do dia selecionado mudar (para sincronizar com exclusões no histórico)
  // IMPORTANTE: Usar refs para rastrear operações em andamento e evitar sincronização prematura
  const isDeletingRef = useRef(false);
  const isAddingRef = useRef(false);
  const isEditingRef = useRef(false);
  const lastSyncedJournalRef = useRef<string>('');
  
  useEffect(() => {
    if (!selectedDate) return;
    
    // Se estamos deletando, adicionando ou editando, não sincronizar ainda (aguardar a operação completar)
    if (isDeletingRef.current || isAddingRef.current || isEditingRef.current) {
      return;
    }
    
    const entry = getEntry(selectedDate);
    if (entry && entry.quickNotes) {
      // Criar uma chave única do estado atual do journal para esta data
      const journalStateKey = entry.quickNotes.map(n => `${n.id}:${n.text}`).sort().join('|');
      
      // Se o journal não mudou desde a última sincronização, não fazer nada
      if (lastSyncedJournalRef.current === journalStateKey) {
        return;
      }
      
      // Comparar IDs e textos para detectar mudanças reais
      const currentNotesIds = quickNotes.map(n => n.id).sort().join('|');
      const journalNotesIds = entry.quickNotes.map(n => n.id).sort().join('|');
      const currentNotesText = quickNotes.map(n => n.text).join('|');
      const journalNotesText = entry.quickNotes.map(n => n.text).join('|');
      
      // Só atualizar se houver diferença real (IDs ou textos diferentes)
      if (currentNotesIds !== journalNotesIds || currentNotesText !== journalNotesText) {
        setQuickNotes(entry.quickNotes.map((note) => ({ id: note.id, text: note.text })));
        lastSyncedJournalRef.current = journalStateKey;
      }
    } else if (!entry && quickNotes.length > 0) {
      setQuickNotes([]);
      lastSyncedJournalRef.current = '';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journal, selectedDate]);
  

  // Auto-save journal text (salva apenas se houver interação explícita)
  // Aumentado debounce para melhorar performance no mobile
  useEffect(() => {
    if (!selectedDate) return;
    
    // Não salvar durante a carga inicial
    if (isInitialLoadRef.current) return;
    
    // Não salvar se estamos adicionando, deletando ou editando (evitar conflitos)
    if (isAddingRef.current || isDeletingRef.current || isEditingRef.current) return;
    
    // Não salvar se não houver conteúdo (texto, quickNotes ou mood selecionado)
    const hasText = text.trim().length > 0;
    const hasQuickNotes = quickNotes.some(n => n.text && n.text.trim().length > 0);
    const hasMood = mood !== null;
    
    if (!hasText && !hasQuickNotes && !hasMood) return;
    
    const timeout = setTimeout(() => {
      // Obter a entrada atual do journal para preservar os IDs dos quickNotes
      const currentEntry = getEntry(selectedDate);
      const existingQuickNotes = currentEntry?.quickNotes || [];
      
      // Filtrar pensamentos vazios antes de salvar, preservando IDs quando possível
      const filteredQuickNotes = quickNotes
        .filter(n => n.text && n.text.trim().length > 0)
        .map(n => {
          // Tentar encontrar o quickNote correspondente no journal para preservar ID e time
          const existing = existingQuickNotes.find(e => e.id === n.id) || 
                          existingQuickNotes.find(e => e.text.trim() === n.text.trim());
          return {
            id: existing?.id || (typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9)),
            time: existing?.time || '',
            text: n.text.trim()
          };
        });
      
      // Salvar mood e moodNumber apenas se foram selecionados
      updateJournalEntry(selectedDate, { 
        mood: mood || undefined,
        moodNumber: currentMoodNumber ?? undefined, // Só salvar se houver número selecionado
        text, 
        quickNotes: filteredQuickNotes
      });
      setJournalDates(getAllDates());
      
      // Atualizar a referência de sincronização após salvar
      const entry = getEntry(selectedDate);
      if (entry && entry.quickNotes) {
        lastSyncedJournalRef.current = entry.quickNotes.map(n => `${n.id}:${n.text}`).sort().join('|');
      }
    }, 2000); // Aumentado de 1000ms para 2000ms para reduzir salvamentos frequentes
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, selectedDate, mood, currentMoodNumber, setJournal, quickNotes]);

  // Salvar texto antes de sair da página ou desmontar componente
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!selectedDate) return;
      
      // Verificar se há conteúdo para salvar
      const hasText = text.trim().length > 0;
      const hasQuickNotes = quickNotes.some(n => n.text && n.text.trim().length > 0);
      const hasMood = mood !== null;
      
      // Só salvar se houver conteúdo
      if (hasText || hasQuickNotes || hasMood) {
        // Obter a entrada atual do journal para preservar os IDs dos quickNotes
        const currentEntry = getEntry(selectedDate);
        const existingQuickNotes = currentEntry?.quickNotes || [];
        
        // Filtrar pensamentos vazios antes de salvar, preservando IDs quando possível
        const filteredQuickNotes = quickNotes
          .filter(n => n.text && n.text.trim().length > 0)
          .map(n => {
            // Tentar encontrar o quickNote correspondente no journal para preservar ID e time
            const existing = existingQuickNotes.find(e => e.id === n.id) || 
                            existingQuickNotes.find(e => e.text.trim() === n.text.trim());
            return {
              id: existing?.id || (typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9)),
              time: existing?.time || '',
              text: n.text.trim()
            };
          });
        updateJournalEntry(selectedDate, { 
          mood: mood || undefined,
          moodNumber: currentMoodNumber ?? undefined,
          text, 
          quickNotes: filteredQuickNotes
        });
      }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, selectedDate, mood, currentMoodNumber, quickNotes, updateJournalEntry]);

  // Função auxiliar para salvar antes de mudar de data
  const saveCurrentEntry = () => {
    if (selectedDate && (text.trim() || mood !== null || quickNotes.length > 0)) {
      const currentEntry = getEntry(selectedDate);
      const existingQuickNotes = currentEntry?.quickNotes || [];
      
      const filteredQuickNotes = quickNotes
        .filter(n => n.text && n.text.trim().length > 0)
        .map(n => {
          const existing = existingQuickNotes.find(e => e.id === n.id) || 
                          existingQuickNotes.find(e => e.text.trim() === n.text.trim());
          return {
            id: existing?.id || (typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9)),
            time: existing?.time || '',
            text: n.text.trim()
          };
        });
      updateJournalEntry(selectedDate, { 
        mood: mood || undefined,
        moodNumber: currentMoodNumber ?? undefined,
        text, 
        quickNotes: filteredQuickNotes
      });
      setJournalDates(getAllDates());
    }
  };

  const handleDateChange = (date: string) => {
    // Salvar o texto da data atual antes de mudar
    saveCurrentEntry();
    // Marcar como carga inicial ao mudar de data
    isInitialLoadRef.current = true;
    setSelectedDate(date);
    loadJournalEntry(date);
    // Permitir salvamento após carregar a nova data
    // Aumentar um pouco para garantir que loadJournalEntry terminou e evitar sobreposição
    setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 200);
  };

  const handleMoodChange = (newMood: Mood | null) => {
    if (!selectedDate) return;
    setMood(newMood);
    // Limpar número quando seleciona emoji
    setCurrentMoodNumber(null);
    
    const currentEntry = getEntry(selectedDate);
    const existingQuickNotes = currentEntry?.quickNotes || [];
    const existingText = currentEntry?.text || text;
    
    // Se não há mood, texto e quickNotes, deletar a entrada
    if (newMood === null && !existingText.trim() && existingQuickNotes.length === 0) {
      setJournal((prev) => {
        const updated = { ...prev };
        delete updated[selectedDate];
        return updated;
      });
      setJournalDates(getAllDates().filter(date => date !== selectedDate));
    } else {
      updateJournalEntry(selectedDate, { 
        mood: newMood || undefined,
        moodNumber: undefined, // Limpar número quando seleciona emoji
        text: existingText, 
        quickNotes: existingQuickNotes
      });
      setJournalDates(getAllDates());
    }
  };

  const handleNumberChange = (num: number | null) => {
    if (!selectedDate) return;
    setCurrentMoodNumber(num);
    
    // Determinar mood baseado no número
    let newMood: Mood | null = null;
    if (num !== null) {
      if (num <= 3) newMood = 'bad';
      else if (num <= 6) newMood = 'neutral';
      else newMood = 'good';
    }
    
    setMood(newMood);
    
    const currentEntry = getEntry(selectedDate);
    const existingQuickNotes = currentEntry?.quickNotes || [];
    const existingText = currentEntry?.text || text;
    
    // Se não há mood, texto e quickNotes, deletar a entrada
    if (newMood === null && !existingText.trim() && existingQuickNotes.length === 0) {
      setJournal((prev) => {
        const updated = { ...prev };
        delete updated[selectedDate];
        return updated;
      });
      setJournalDates(getAllDates().filter(date => date !== selectedDate));
    } else {
      updateJournalEntry(selectedDate, { 
        mood: newMood || undefined,
        moodNumber: num ?? undefined, // Salvar número ou undefined se null
        text: existingText, 
        quickNotes: existingQuickNotes
      });
      setJournalDates(getAllDates());
    }
  };


  const handleAddQuickNote = () => {
    if (newQuickNote.trim() && selectedDate) {
      // Marcar que estamos adicionando para evitar sincronização prematura
      isAddingRef.current = true;
      
      addQuickNote(selectedDate, newQuickNote.trim());
      
      // Atualizar o estado local imediatamente para feedback visual
      // O ID será corrigido pela sincronização quando o journal atualizar
      const tempId = Date.now().toString();
      setQuickNotes([...quickNotes, { id: tempId, text: newQuickNote.trim() }]);
      
      setNewQuickNote('');
      setIsAddingQuickNote(false);
      
      // Resetar a flag após um delay para permitir que a adição complete
      setTimeout(() => {
        isAddingRef.current = false;
      }, 300);
    }
  };

  const handleAddInlineQuickNote = (dateStr: string) => {
    const textToAdd = inlineQuickNoteText.trim();
    if (!textToAdd) return;
    
    // Marcar que estamos adicionando para evitar sincronização prematura
    isAddingRef.current = true;
    
    // Obter a entrada atual do journal para garantir que estamos trabalhando com dados atualizados
    const currentEntry = getEntry(dateStr);
    
    // Obter o texto longo da data selecionada para preservá-lo
    const selectedEntry = selectedDate ? getEntry(selectedDate) : null;
    const textToPreserve = selectedEntry?.text || '';
    
    // Se não existe entrada para esta data, criar uma com o texto preservado antes de adicionar o quickNote
    if (!currentEntry) {
      updateJournalEntry(dateStr, {
        mood: undefined,
        moodNumber: undefined,
        text: textToPreserve, // Preservar o texto longo da data selecionada
        quickNotes: [],
      });
    }
    
    // Usar apenas addQuickNote para adicionar o pensamento rápido (evita duplicação)
    addQuickNote(dateStr, textToAdd);
    
    // Se estamos adicionando na data selecionada, atualizar o estado local imediatamente
    if (dateStr === selectedDate) {
      const entry = getEntry(dateStr);
      if (entry && entry.quickNotes) {
        // Encontrar o quick note recém-adicionado (o último com o texto correspondente)
        const newNote = entry.quickNotes.find(n => n.text === textToAdd && !quickNotes.find(qn => qn.id === n.id));
        if (newNote) {
          setQuickNotes([...quickNotes, { id: newNote.id, text: newNote.text }]);
          lastSyncedJournalRef.current = entry.quickNotes.map(n => `${n.id}:${n.text}`).sort().join('|');
        }
      }
    }
    
    // Limpar o estado após adicionar
    setInlineQuickNoteText('');
    setEditingQuickNoteDate(null);
    
    // Atualizar as datas do journal
    setJournalDates(getAllDates());
    
    // Resetar a flag após um delay para permitir que a adição complete
    setTimeout(() => {
      isAddingRef.current = false;
    }, 300);
  };

  const handleQuickNoteKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddQuickNote();
    }
  };

  const handleRemoveQuickNote = (noteId: string) => {
    if (selectedDate) {
      // Marcar que estamos deletando para evitar sincronização prematura
      isDeletingRef.current = true;
      
      // Remover do estado local imediatamente para feedback visual
      setQuickNotes(prev => prev.filter(n => n.id !== noteId));
      
      // Remover do journal
      removeQuickNote(selectedDate, noteId);
      setJournalDates(getAllDates());
      
      // Atualizar a referência de sincronização
      const entry = getEntry(selectedDate);
      if (entry && entry.quickNotes) {
        lastSyncedJournalRef.current = entry.quickNotes.map(n => `${n.id}:${n.text}`).sort().join('|');
      } else {
        lastSyncedJournalRef.current = '';
      }
      
      // Resetar a flag após um delay para permitir sincronização futura
      setTimeout(() => {
        isDeletingRef.current = false;
      }, 300);
    }
  };

  // Funções para modo blocos
  const handleToggleBlocksMode = () => {
    setBlocksMode(!blocksMode);
    if (!blocksMode && quickNotes.length === 0 && text.trim()) {
      // Se não há quick notes mas há texto, converter texto em primeiro bloco
      const firstBlock = { 
        id: Date.now().toString(), 
        text: text.trim(),
        createdAt: new Date().toISOString()
      };
      setQuickNotes([firstBlock]);
    }
  };

  const handleAddBlock = () => {
    const newBlock = {
      id: Date.now().toString(),
      text: '',
      createdAt: new Date().toISOString()
    };
    const updatedNotes = [...quickNotes, newBlock];
    setQuickNotes(updatedNotes);
    setEditingBlockId(newBlock.id);
    setEditingBlockText('');
  };

  const handleEditBlock = (blockId: string) => {
    const block = quickNotes.find(n => n.id === blockId);
    if (block) {
      setEditingBlockId(blockId);
      setEditingBlockText(block.text);
    }
  };

  const handleSaveBlock = (blockId: string) => {
    if (selectedDate) {
      const updatedNotes = editingBlockText.trim()
        ? quickNotes.map(note => 
            note.id === blockId 
              ? { ...note, text: editingBlockText.trim() }
              : note
          )
        : quickNotes.filter(note => note.id !== blockId); // Remove se estiver vazio
      
      setQuickNotes(updatedNotes);
      // Obter a entrada atual do journal para preservar os IDs e times dos quickNotes
      const currentEntry = getEntry(selectedDate);
      const existingQuickNotes = currentEntry?.quickNotes || [];
      
      // Salvar no journal, preservando IDs e times quando possível
      updateJournalEntry(selectedDate, {
        mood: mood as Mood,
        moodNumber: currentMoodNumber ?? undefined,
        text,
        quickNotes: updatedNotes.map(n => {
          // Tentar encontrar o quickNote correspondente no journal para preservar ID e time
          const existing = existingQuickNotes.find(e => e.id === n.id);
          return {
            id: existing?.id || n.id || (typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9)),
            time: existing?.time || '',
            text: n.text
          };
        })
      });
    }
    setEditingBlockId(null);
    setEditingBlockText('');
  };

  const handleCancelEdit = () => {
    setEditingBlockId(null);
    setEditingBlockText('');
  };

  const handleRemoveBlock = (blockId: string) => {
    if (selectedDate) {
      const updatedNotes = quickNotes.filter(n => n.id !== blockId);
      setQuickNotes(updatedNotes);
      // Obter a entrada atual do journal para preservar os IDs e times dos quickNotes
      const currentEntry = getEntry(selectedDate);
      const existingQuickNotes = currentEntry?.quickNotes || [];
      
      // Atualizar no journal, preservando IDs e times quando possível
      updateJournalEntry(selectedDate, {
        mood: mood as Mood,
        moodNumber: currentMoodNumber ?? undefined,
        text,
        quickNotes: updatedNotes.map(n => {
          // Tentar encontrar o quickNote correspondente no journal para preservar ID e time
          const existing = existingQuickNotes.find(e => e.id === n.id);
          return {
            id: existing?.id || n.id || (typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9)),
            time: existing?.time || '',
            text: n.text
          };
        })
      });
    }
  };

  const handleAddHabit = () => {
    const name = prompt('Novo nome do hábito:');
    if (name && name.trim()) {
      const trimmedName = name.trim().substring(0, 35); // Limitar a 35 caracteres
      if (trimmedName) addHabit(trimmedName);
    }
  };

  const handleRenameHabit = (habitId: number, currentName: string) => {
    const newName = prompt('Novo nome do hábito:', currentName);
    if (!newName || newName.trim() === "") return;
    updateHabit(habitId, { name: newName.trim() });
    if (selectedHabit && selectedHabit.id === habitId) {
      setSelectedHabit({ ...selectedHabit, name: newName.trim() });
    }
  };

  const handleDeleteHabit = (habitId: number, habitName: string) => {
    showConfirmation({
      message: `Tem certeza que deseja excluir o hábito "${habitName}"?\n\nEsta ação não pode ser desfeita.`,
      onConfirm: () => {
        deleteHabit(habitId);
        if (selectedHabit && selectedHabit.id === habitId) {
          setSelectedHabit(null);
        }
      },
    });
  };

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    // Mapeamento de dias e meses por idioma
    const daysMap: Record<string, string[]> = {
      'pt': ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
      'en': ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      'es': ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
      'ko': ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
      'ja': ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
      'de': ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
      'fr': ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
      'it': ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'],
      'zh-CN': ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
      'zh-TW': ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
    };
    const monthsMap: Record<string, string[]> = {
      'pt': ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
      'en': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      'es': ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
      'ko': ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
      'ja': ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      'de': ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
      'fr': ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
      'it': ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'],
      'zh-CN': ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      'zh-TW': ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    };
    
    const days = daysMap[language] || daysMap['pt'];
    const months = monthsMap[language] || monthsMap['pt'];
    
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
  };

  const formatDateShort = (dateStr: string) => {
    return dateStr.substring(5).replace('-', '-');
  };

  const formatDateForHistory = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getMoodLabel = (mood: string, moodNumber?: number) => {
    const moods: { [key: string]: { label: string; emoji: string } } = {
      good: { label: tString('journal.moodGood'), emoji: "😊" },
      neutral: { label: tString('journal.moodNeutral'), emoji: "😐" },
      bad: { label: tString('journal.moodBad'), emoji: "😞" },
    };
    return moods[mood] || moods.neutral;
  };

  // Navegação de datas
  const navigateDate = (direction: 'prev' | 'next') => {
    if (!selectedDate) return;
    const current = new Date(selectedDate + 'T00:00:00');
    if (direction === 'prev') {
      current.setDate(current.getDate() - 1);
    } else {
      current.setDate(current.getDate() + 1);
    }
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, "0");
    const da = String(current.getDate()).padStart(2, "0");
    const newDate = `${y}-${m}-${da}`;
    handleDateChange(newDate);
  };

  // Calendário de hábitos
  const goToPreviousMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));
  };

  // Calendário de seleção de data
  const goToPreviousDateMonth = () => {
    setDateCalendarMonth(new Date(dateCalendarMonth.getFullYear(), dateCalendarMonth.getMonth() - 1, 1));
  };

  const goToNextDateMonth = () => {
    setDateCalendarMonth(new Date(dateCalendarMonth.getFullYear(), dateCalendarMonth.getMonth() + 1, 1));
  };

  // Verifica se uma entrada tem conteúdo válido (texto, pensamentos rápidos ou mood selecionado)
  const hasValidEntry = (dateStr: string): boolean => {
    const entry = getEntry(dateStr);
    if (!entry) return false;
    
    // Verifica se tem texto escrito
    const hasText = entry.text && entry.text.trim().length > 0;
    // Verifica se tem pensamentos rápidos
    const hasQuickNotes = entry.quickNotes && entry.quickNotes.length > 0;
    // Verifica se tem mood selecionado (não é null e existe)
    const hasMood = entry.mood !== null && entry.mood !== undefined;
    
    // Retorna true se tiver pelo menos um desses
    return hasText || hasQuickNotes || hasMood;
  };

  // Helper para formatar data sem problemas de fuso horário
  const formatDateKey = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getDateCalendarDays = (): Array<{ date: Date; isCurrentMonth: boolean; isToday: boolean; hasEntry: boolean }> => {
    const year = dateCalendarMonth.getFullYear();
    const month = dateCalendarMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    
    const today = new Date();
    const todayStr = formatDateKey(today);
    
    const prevMonthDays: Array<{ date: Date; isCurrentMonth: boolean; isToday: boolean; hasEntry: boolean }> = [];
    // Calcular dias do mês anterior
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = new Date(year, month - 1, day);
      const dateStr = formatDateKey(date);
      prevMonthDays.push({
        date,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        hasEntry: hasValidEntry(dateStr),
      });
    }
    
    const currentMonthDays: Array<{ date: Date; isCurrentMonth: boolean; isToday: boolean; hasEntry: boolean }> = [];
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateStr = formatDateKey(date);
      currentMonthDays.push({
        date,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        hasEntry: hasValidEntry(dateStr),
      });
    }
    
    const totalDays = prevMonthDays.length + currentMonthDays.length;
    const remainingDays = 42 - totalDays;
    const nextMonthDays: Array<{ date: Date; isCurrentMonth: boolean; isToday: boolean; hasEntry: boolean }> = [];
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      const dateStr = formatDateKey(date);
      nextMonthDays.push({
        date,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        hasEntry: hasValidEntry(dateStr),
      });
    }
    
    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  };

  const handleDateSelect = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const da = String(date.getDate()).padStart(2, "0");
    const newDate = `${y}-${m}-${da}`;
    handleDateChange(newDate);
    setShowDateCalendar(false);
  };

  const getMonthCalendarDays = (): Array<{ date: Date; isCurrentMonth: boolean; isToday: boolean }> => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    
    const prevMonthDays: Array<{ date: Date; isCurrentMonth: boolean; isToday: boolean }> = [];
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      const dateStr = date.toISOString().substring(0, 10);
      const todayStr = new Date().toISOString().substring(0, 10);
      prevMonthDays.push({
        date,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }
    
    const currentMonthDays: Array<{ date: Date; isCurrentMonth: boolean; isToday: boolean }> = [];
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().substring(0, 10);
      const todayStr = new Date().toISOString().substring(0, 10);
      currentMonthDays.push({
        date,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }
    
    const totalDays = prevMonthDays.length + currentMonthDays.length;
    const remainingDays = 42 - totalDays;
    const nextMonthDays: Array<{ date: Date; isCurrentMonth: boolean; isToday: boolean }> = [];
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      const dateStr = date.toISOString().substring(0, 10);
      const todayStr = new Date().toISOString().substring(0, 10);
      nextMonthDays.push({
        date,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }
    
    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  };

  // ===============================
  // Calculate monthly progress
  // ===============================
  const calculateMonthlyProgress = (habit: Habit, month: Date): number => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    
    // Get habit creation date
    const habitCreatedAt = habit.createdAt ? new Date(habit.createdAt) : firstDay;
    habitCreatedAt.setHours(0, 0, 0, 0);
    const startDate = habitCreatedAt > firstDay ? habitCreatedAt : firstDay;
    
    // Calculate days in the month that the habit was active
    // No primeiro mês: dias de check / dias restantes do mês (desde criação até hoje)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = lastDay > today ? today : lastDay;
    
    let totalDays = 0;
    let checkedDays = 0;
    
    // Iterar pelos dias desde a criação do hábito até hoje (ou fim do mês)
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = formatDateKey(d);
      totalDays++;
      if (habit.checks[dateStr]) {
        checkedDays++;
      }
    }
    
    return totalDays > 0 ? checkedDays / totalDays : 0;
  };

  const getProgressColor = (progress: number): string => {
    if (progress >= 0.75) return '#22c55e'; // verde escuro
    if (progress >= 0.50) return '#4ade80'; // verde sólido
    if (progress >= 0.25) return '#86efac'; // verde claro
    return '#d1d5db'; // cinza
  };

  const formatMonthYear = (date: Date): string => {
    const monthsFull = t('journal.monthsFull') as string[];
    const monthName = monthsFull[date.getMonth()];
    return `${monthName} ${t('common.of')} ${date.getFullYear()}`;
  };

  return (
    <div>
      <div>
        {/* Journal Card */}
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
              currentNumber={currentMoodNumber}
            />
          </div>

          {/* Container para Histórico e Text Area - aparece primeiro */}
          <div className="w-full mb-6">
            {/* Botão Histórico - acima do textarea */}
            <div className="flex justify-end mb-2">
              <button
                onClick={() => {
                  setShowJournalHistory(!showJournalHistory);
                }}
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

            {/* Histórico de Journal Entries - aparece acima do textarea quando ativo, empurrando-o para baixo */}
            {showJournalHistory && (() => {
              // Filtrar apenas entradas com texto longo anteriores à data selecionada
              const selectedDateObj = selectedDate ? new Date(selectedDate + 'T00:00:00') : null;
              
              const entriesWithText = journalDates
                .map((date) => {
                  const entry = getEntry(date);
                  if (!entry || !entry.text || !entry.text.trim()) return null;
                  
                  // Filtrar apenas datas anteriores à data selecionada
                  if (selectedDateObj) {
                    const dateObj = new Date(date + 'T00:00:00');
                    if (dateObj >= selectedDateObj) return null; // Ignorar data selecionada e futuras
                  }
                  
                  return { date, entry };
                })
                .filter((item): item is { date: string; entry: NonNullable<ReturnType<typeof getEntry>> } => item !== null)
                .sort((a, b) => {
                  // Ordenar por data (mais recente primeiro)
                  const dateA = new Date(a.date + 'T00:00:00').getTime();
                  const dateB = new Date(b.date + 'T00:00:00').getTime();
                  return dateB - dateA;
                })
                .slice(0, 5); // Limitar a 5 entradas
              
              return (
                <div className="mb-4 space-y-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {entriesWithText.length === 0 ? (
                    <p className="font-pixel text-center py-8" style={{ color: '#999', fontSize: '14px' }}>
                      {t('journal.noThoughtsThisMonth')}
                    </p>
                  ) : (
                    entriesWithText.map(({ date, entry }) => {
                    
                    const dateObj = new Date(date + 'T00:00:00');
                    const moodInfo = entry.mood ? {
                      good: { label: t('journal.moodGood'), emoji: '🙂' },
                      neutral: { label: t('journal.moodNeutral'), emoji: '😐' },
                      bad: { label: t('journal.moodBad'), emoji: '🙁' },
                    }[entry.mood] : null;
                    
                        return (
                          <div
                            key={date}
                                onClick={() => {
                          // Salvar o texto da data atual antes de mudar
                          saveCurrentEntry();
                          setSelectedDate(date);
                          loadJournalEntry(date);
                          setShowJournalHistory(false);
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

          {/* Quick Thoughts - aparece DEPOIS do texto longo */}
          {!showQuickThoughtsView ? (
            // Visualização Simples
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
                    <button
                      onClick={() => {
                        // Fechar histórico do journal se estiver aberto
                        if (showJournalHistory) {
                          setShowJournalHistory(false);
                        }
                        setShowQuickThoughtsView(true);
                      }}
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
                      {t('common.history')}
                    </button>
                  </div>

              <div className="flex flex-col gap-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {quickNotes.map((note, idx) => (
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
                            if (selectedDate && editingQuickNoteText.trim()) {
                              // Marcar que estamos editando
                              isEditingRef.current = true;
                              
                              // Atualizar no journal
                              updateQuickNote(selectedDate, note.id, editingQuickNoteText.trim());
                              
                              // Atualizar estado local imediatamente
                              setQuickNotes(prev => prev.map(n => 
                                n.id === note.id ? { ...n, text: editingQuickNoteText.trim() } : n
                              ));
                              
                              // Atualizar referência de sincronização
                              const entry = getEntry(selectedDate);
                              if (entry && entry.quickNotes) {
                                lastSyncedJournalRef.current = entry.quickNotes.map(n => `${n.id}:${n.text}`).sort().join('|');
                              }
                              
                              setEditingQuickNote(null);
                              setEditingQuickNoteText('');
                              
                              // Resetar flag após delay
                              setTimeout(() => {
                                isEditingRef.current = false;
                              }, 300);
                            }
                          } else if (e.key === 'Escape') {
                            setEditingQuickNote(null);
                            setEditingQuickNoteText('');
                            isEditingRef.current = false;
                          }
                        }}
                        onBlur={() => {
                          if (selectedDate && editingQuickNoteText.trim()) {
                            // Marcar que estamos editando
                            isEditingRef.current = true;
                            
                            // Atualizar no journal
                            updateQuickNote(selectedDate, note.id, editingQuickNoteText.trim());
                            
                            // Atualizar estado local imediatamente
                            setQuickNotes(prev => prev.map(n => 
                              n.id === note.id ? { ...n, text: editingQuickNoteText.trim() } : n
                            ));
                            
                            // Atualizar referência de sincronização
                            const entry = getEntry(selectedDate);
                            if (entry && entry.quickNotes) {
                              lastSyncedJournalRef.current = entry.quickNotes.map(n => `${n.id}:${n.text}`).sort().join('|');
                            }
                            
                            setEditingQuickNote(null);
                            setEditingQuickNoteText('');
                            
                            // Resetar flag após delay
                            setTimeout(() => {
                              isEditingRef.current = false;
                            }, 300);
                          } else {
                            setEditingQuickNote(null);
                            setEditingQuickNoteText('');
                            isEditingRef.current = false;
                          }
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
                      <span 
                        className="flex-1 cursor-text"
                        onDoubleClick={() => {
                          if (selectedDate) {
                            // Resetar flag de edição antes de iniciar nova edição
                            isEditingRef.current = false;
                            setEditingQuickNote({ date: selectedDate, noteId: note.id });
                            setEditingQuickNoteText(note.text);
                          }
                        }}
                      >
                        {note.text}
                      </span>
                    )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRemoveQuickNote(note.id);
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          className="text-red-500 ml-2 transition-opacity"
                          style={{ fontSize: '20px', opacity: 1, cursor: 'pointer', zIndex: 10 }}
                          title="Excluir pensamento rápido"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  {/* Input inline para adicionar quick thought */}
                    <div className="flex gap-2 mt-4">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={newQuickNote}
                          onChange={(e) => {
                            setNewQuickNote(e.target.value);
                            if (e.target.value.trim()) {
                              setIsAddingQuickNote(true);
                            }
                          }}
                          onKeyPress={handleQuickNoteKeyPress}
                          onFocus={() => setIsAddingQuickNote(true)}
                          onBlur={() => {
                            if (!newQuickNote.trim()) {
                              setIsAddingQuickNote(false);
                            }
                          }}
                          placeholder={tString('journal.addQuickThought')}
                          className="w-full px-4 py-3 rounded-md font-pixel"
                          style={{
                            backgroundColor: '#9e9e9e',
                            border: '1px solid #9e9e9e',
                            color: '#FFFFFF',
                            fontSize: '16px',
                          }}
                        />
                      </div>
                      {isAddingQuickNote && newQuickNote.trim() && (
                        <button
                          onClick={handleAddQuickNote}
                          className="px-6 py-3 rounded-md font-pixel-bold transition-all hover:opacity-95"
                          style={{
                            backgroundColor: '#9e9e9e',
                            border: '1px solid #9e9e9e',
                            color: '#FFFFFF',
                            fontSize: '16px',
                          }}
                        >
                          Enviar
                        </button>
                      )}
                    </div>
                </div>
          ) : (
            // Visualização em Tabela - aparece no mesmo lugar da visualização simples
            (() => {
              // Agrupar quick notes por data
              const thoughtsByDate: Array<{ date: string; notes: Array<{ time: string; text: string; index: number }> }> = [];
              Object.keys(journal)
                .sort()
                .reverse()
                .forEach((date) => {
                  const entry = journal[date];
                  if (entry && entry.quickNotes && entry.quickNotes.length > 0) {
                    const notes = entry.quickNotes.map((note, index) => ({
                      time: note.time || '',
                      text: note.text,
                      index,
                    }));
                    thoughtsByDate.push({ date, notes });
                  }
                });

              const today = new Date();
              const todayYearForHighlight = today.getFullYear();
              const todayMonthForHighlight = today.getMonth() + 1;
              const todayDayForHighlight = today.getDate();

              const getMonthName = () => {
                const monthsFull = t('journal.monthsFull') as string[];
                return monthsFull[quickThoughtsMonth.getMonth()];
              };
                  
              const getDaysInMonth = (month: number, year: number) => {
                return new Date(year, month + 1, 0).getDate();
              };

              const getFirstDayOfMonth = (month: number, year: number) => {
                return new Date(year, month, 1).getDay();
              };

              const month = quickThoughtsMonth.getMonth();
              const year = quickThoughtsMonth.getFullYear();
              const daysInMonth = getDaysInMonth(month, year);
              const firstDay = getFirstDayOfMonth(month, year);
                  
                  return (
                <div className="mb-6" style={{ backgroundColor: '#e8e8e8', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '16px' }}>
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-xs tracking-widest font-pixel-bold" style={{ color: '#333' }}>
                      {t('journal.quickThoughts')}
                    </p>
                    <button
                      onClick={() => setShowQuickThoughtsView(false)}
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
                      {t('common.hide')}
                    </button>
                            </div>

                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => {
                        const monthIndex = quickThoughtsMonth.getMonth();
                        setQuickThoughtsMonth((prev) => {
                          const newDate = new Date(prev);
                          newDate.setMonth(monthIndex - 1);
                          return newDate;
                        });
                      }}
                      className="px-3 py-1 rounded font-pixel text-xs transition-colors"
            style={{
                        backgroundColor: '#f0f0f0',
              color: '#333',
                        border: '1px solid #e0e0e0',
            }}
                    >
                      ←
                    </button>
                    <span className="font-pixel-bold text-sm" style={{ color: '#333' }}>
                      {getMonthName().toUpperCase()} · {quickThoughtsMonth.getFullYear()}
                    </span>
            <button
              onClick={() => {
                        const monthIndex = quickThoughtsMonth.getMonth();
                        setQuickThoughtsMonth((prev) => {
                          const newDate = new Date(prev);
                          newDate.setMonth(monthIndex + 1);
                          return newDate;
                        });
                      }}
                      disabled={(() => {
                        const today = new Date();
                        const currentMonth = today.getMonth();
                        const currentYear = today.getFullYear();
                        const viewMonth = quickThoughtsMonth.getMonth();
                        const viewYear = quickThoughtsMonth.getFullYear();
                        // Desabilitar se o próximo mês for futuro
                        const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
                        const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
                        return nextYear > currentYear || (nextYear === currentYear && nextMonth > currentMonth);
                      })()}
              className="px-3 py-1 rounded font-pixel text-xs transition-colors"
              style={{
                backgroundColor: '#f0f0f0',
                color: '#333',
                border: '1px solid #e0e0e0',
                        opacity: (() => {
                          const today = new Date();
                          const currentMonth = today.getMonth();
                          const currentYear = today.getFullYear();
                          const viewMonth = quickThoughtsMonth.getMonth();
                          const viewYear = quickThoughtsMonth.getFullYear();
                          const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
                          const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
                          return nextYear > currentYear || (nextYear === currentYear && nextMonth > currentMonth) ? 0.5 : 1;
                        })(),
                        cursor: (() => {
                          const today = new Date();
                          const currentMonth = today.getMonth();
                          const currentYear = today.getFullYear();
                          const viewMonth = quickThoughtsMonth.getMonth();
                          const viewYear = quickThoughtsMonth.getFullYear();
                          const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
                          const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
                          return nextYear > currentYear || (nextYear === currentYear && nextMonth > currentMonth) ? 'not-allowed' : 'pointer';
                        })(),
                      }}
                    >
                      →
            </button>
          </div>

                  <div
                    ref={quickThoughtsScrollRef}
                    className="overflow-x-auto quick-thoughts-horizontal-scrollbar"
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#d0d0d0 transparent',
                    }}
                    onScroll={(e) => {
                      const scrollPosition = e.currentTarget.scrollLeft;
                      if (typeof window !== 'undefined') {
                        sessionStorage.setItem('quickThoughtsScroll', scrollPosition.toString());
                }
                    }}
                    onClick={(e) => {
                      // Não bloquear cliques em botões dentro do scroll
                      const target = e.target as HTMLElement;
                      if (target.tagName === 'BUTTON' || target.closest('button')) {
                        return; // Deixar o botão processar o clique
                      }
                    }}
                    onMouseDown={(e) => {
                      // Não bloquear mousedown em botões
                      const target = e.target as HTMLElement;
                      if (target.tagName === 'BUTTON' || target.closest('button')) {
                        return; // Deixar o botão processar o mousedown
                      }
                    }}
                  >
                    <div className="inline-flex gap-3" style={{ minWidth: 'max-content' }}>
                      {(() => {
                        // Obter data de hoje
                        const today = new Date();
                        const todayYear = today.getFullYear();
                        const todayMonth = today.getMonth() + 1;
                        const todayDay = today.getDate();
            
                        // Verificar se estamos no mês atual
                        const isCurrentMonth = year === todayYear && month + 1 === todayMonth;
            
                        // Gerar array de dias: apenas até hoje, em ordem decrescente (hoje primeiro)
                        const daysToShow: number[] = [];
                        if (isCurrentMonth) {
                          // Mês atual: mostrar de hoje até o dia 1
                          for (let d = todayDay; d >= 1; d--) {
                            daysToShow.push(d);
                          }
                        } else if (year < todayYear || (year === todayYear && month + 1 < todayMonth)) {
                          // Mês passado: mostrar todos os dias em ordem decrescente
                          for (let d = daysInMonth; d >= 1; d--) {
                            daysToShow.push(d);
                          }
                        } else {
                          // Mês futuro: não mostrar nada
                          return <div key="no-days" className="text-center p-4 font-pixel text-sm" style={{ color: '#999' }}>Nenhum dia disponível</div>;
                        }
                        
                        if (daysToShow.length === 0) {
                          return <div key="no-days" className="text-center p-4 font-pixel text-sm" style={{ color: '#999' }}>Nenhum dia disponível</div>;
                        }
                        
                        return daysToShow.map((day) => {
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const entry = journal[dateStr];
                          const quickNotesForDay = entry?.quickNotes || [];
                          const isToday = year === todayYearForHighlight && 
                                         month + 1 === todayMonthForHighlight && 
                                         day === todayDayForHighlight;
                          
                          // Verificar se é um dia futuro (não deve aparecer, mas por segurança)
                          const dateObj = new Date(year, month, day);
                          const todayDate = new Date();
                          todayDate.setHours(0, 0, 0, 0);
                          dateObj.setHours(0, 0, 0, 0);
                          const isFuture = dateObj > todayDate;
                          
                          if (isFuture) return null;

                          return (
                            <div
                              key={day}
                              className="flex-shrink-0 border rounded-lg p-2 flex flex-col"
                              style={{
                                width: 'calc((100vw - 200px) / 5)',
                                maxWidth: '280px',
                                minWidth: '200px',
                                minHeight: '328px', // Reduzido 5% (345px * 0.95 = 327.75px)
                                maxHeight: '328px', // Limitar altura máxima para garantir que o botão apareça
                                backgroundColor: isToday ? '#9e9e9e' : '#FFFFFF',
                                borderColor: isToday ? '#9e9e9e' : '#e0e0e0',
                              }}
                            >
                              <div className="font-pixel-bold mb-2 flex-shrink-0" style={{ color: '#666', fontSize: '14px', textAlign: 'center' }}>
                                {day} {(t('journal.daysShort') as string[])[new Date(year, month, day).getDay()]}
                              </div>
                              <div 
                                className="space-y-1 quick-notes-vertical-scrollbar flex-1 overflow-y-auto" 
                                style={{ minHeight: 0, scrollbarWidth: 'thin', scrollbarColor: '#d0d0d0 transparent' }}
                                onDoubleClick={(e) => {
                                  // Prevenir que o duplo clique no container interfira com o duplo clique nos itens
                                  e.stopPropagation();
                                }}
                              >
                                {quickNotesForDay.map((note) => {
                                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                  const isEditing = editingQuickNote && editingQuickNote.date === dateStr && editingQuickNote.noteId === note.id;
                                  
                                  return (
                                    <div
                                      key={note.id}
                                      className="p-1 rounded font-pixel relative group"
                                      style={{
                                        backgroundColor: '#f0f0f0',
                                        fontSize: '16px',
                                        color: '#333',
                                        wordBreak: 'break-word',
                                        textAlign: 'center',
                                        pointerEvents: 'auto',
                                      }}
                                      onDoubleClick={(e) => {
                                        // Prevenir propagação para não interferir com outros eventos
                                        e.stopPropagation();
                                      }}
                                    >
                                      {isEditing ? (
                                        <input
                                          type="text"
                                          value={editingQuickNoteText}
                                          onChange={(e) => setEditingQuickNoteText(e.target.value)}
                                          onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                              if (editingQuickNoteText.trim()) {
                                                // Marcar que estamos editando
                                                isEditingRef.current = true;
                                                
                                                // Atualizar no journal
                                                updateQuickNote(dateStr, note.id, editingQuickNoteText.trim());
                                                
                                                // Se for a data selecionada, atualizar estado local
                                                if (dateStr === selectedDate) {
                                                  setQuickNotes(prev => prev.map(n => 
                                                    n.id === note.id ? { ...n, text: editingQuickNoteText.trim() } : n
                                                  ));
                                                }
                                                
                                                // Atualizar referência de sincronização
                                                const entry = getEntry(dateStr);
                                                if (entry && entry.quickNotes) {
                                                  lastSyncedJournalRef.current = entry.quickNotes.map(n => `${n.id}:${n.text}`).sort().join('|');
                                                }
                                                
                                                setEditingQuickNote(null);
                                                setEditingQuickNoteText('');
                                                
                                                // Resetar flag após delay
                                                setTimeout(() => {
                                                  isEditingRef.current = false;
                                                }, 300);
                                              }
                                            } else if (e.key === 'Escape') {
                                                setEditingQuickNote(null);
                                                setEditingQuickNoteText('');
                                                isEditingRef.current = false;
                                            }
                                          }}
                                          onBlur={() => {
                                            if (editingQuickNoteText.trim()) {
                                              // Marcar que estamos editando
                                              isEditingRef.current = true;
                                              
                                              // Atualizar no journal
                                              updateQuickNote(dateStr, note.id, editingQuickNoteText.trim());
                                              
                                              // Se for a data selecionada, atualizar estado local
                                              if (dateStr === selectedDate) {
                                                setQuickNotes(prev => prev.map(n => 
                                                  n.id === note.id ? { ...n, text: editingQuickNoteText.trim() } : n
                                                ));
                                              }
                                              
                                              // Atualizar referência de sincronização
                                              const entry = getEntry(dateStr);
                                              if (entry && entry.quickNotes) {
                                                lastSyncedJournalRef.current = entry.quickNotes.map(n => `${n.id}:${n.text}`).sort().join('|');
                                              }
                                              
                                              setEditingQuickNote(null);
                                              setEditingQuickNoteText('');
                                              
                                              // Resetar flag após delay
                                              setTimeout(() => {
                                                isEditingRef.current = false;
                                              }, 300);
                                            } else {
                                              setEditingQuickNote(null);
                                              setEditingQuickNoteText('');
                                              isEditingRef.current = false;
                                            }
                                          }}
                                          className="w-full px-2 py-1 rounded font-pixel border"
                style={{
                                            backgroundColor: '#FFFFFF',
                                            borderColor: '#d0d0d0',
                                            color: '#333',
                                            fontSize: '16px',
                                            textAlign: 'center',
                                          }}
                                          autoFocus
                                        />
                                      ) : (
                                        <span 
                                          className="cursor-text select-none"
                                          onDoubleClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            // Resetar flag de edição antes de iniciar nova edição
                                            isEditingRef.current = false;
                                            setEditingQuickNote({ date: dateStr, noteId: note.id });
                                            setEditingQuickNoteText(note.text);
                                          }}
                                          style={{
                                            userSelect: 'none',
                                            WebkitUserSelect: 'none',
                                            pointerEvents: 'auto',
                                          }}
                                        >
                                          {note.text}
                                        </span>
                                      )}
                    <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          // Marcar que estamos deletando para evitar sincronização prematura
                                          isDeletingRef.current = true;
                                          
                                          // Remover o pensamento rápido usando a função do hook
                                          removeQuickNote(dateStr, note.id);
                                          setJournalDates(getAllDates());
                                          
                                          // Atualizar a referência de sincronização
                                          const entry = getEntry(dateStr);
                                          if (entry && entry.quickNotes) {
                                            lastSyncedJournalRef.current = entry.quickNotes.map(n => `${n.id}:${n.text}`).sort().join('|');
                                          } else {
                                            lastSyncedJournalRef.current = '';
                                          }
                                          
                                          // Resetar a flag após um delay para permitir sincronização futura
                                          setTimeout(() => {
                                            isDeletingRef.current = false;
                                          }, 300);
                                          
                                          // Prevenir qualquer scroll automático
                                          if (e.currentTarget) {
                                            e.currentTarget.blur();
                                          }
                                        }}
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                        }}
                                        className="absolute top-0 right-0 w-5 h-5 flex items-center justify-center rounded-full bg-red-400 hover:bg-red-500 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                        style={{ fontSize: '12px' }}
                                        title="Excluir"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                              {/* Botão de adicionar fora da área de scroll para sempre estar visível */}
                              {editingQuickNoteDate === `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` ? (
                                  <div className="mt-1 flex flex-col gap-1 flex-shrink-0">
                                    <input
                                      type="text"
                                      value={inlineQuickNoteText}
                                      onChange={(e) => setInlineQuickNoteText(e.target.value)}
                                      onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                          handleAddInlineQuickNote(dateStr);
                                        } else if (e.key === 'Escape') {
                                          e.preventDefault();
                                          setEditingQuickNoteDate(null);
                                          setInlineQuickNoteText('');
                                        }
                                      }}
                                      onBlur={(e) => {
                                        // Verificar se o blur foi causado por um clique em um botão
                                        // Se sim, não fechar o input
                                        const relatedTarget = e.relatedTarget as HTMLElement;
                                        if (relatedTarget && (relatedTarget.tagName === 'BUTTON' || relatedTarget.closest('button'))) {
                                          return; // Não fechar se foi um clique em botão
                                        }
                                        // Verificar se o input ainda está montado (pode ter sido removido pelo handleAddInlineQuickNote)
                                        const currentDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                        if (editingQuickNoteDate !== currentDateStr) {
                                          return; // Já foi fechado ou mudou de data
                                        }
                                        // Não fechar automaticamente ao perder foco, apenas se estiver vazio
                                        // Usar setTimeout para evitar conflitos com cliques e scroll
                                        setTimeout(() => {
                                          const stillActive = editingQuickNoteDate === currentDateStr;
                                          if (!inlineQuickNoteText.trim() && stillActive) {
                                            setEditingQuickNoteDate(null);
                                            setInlineQuickNoteText('');
                                          }
                                        }, 300);
                                      }}
                                      placeholder={tString('journal.addQuickThought')}
                                      className="w-full px-2 py-1 rounded font-pixel border"
                      style={{
                                        backgroundColor: isToday ? '#FFFFFF' : '#f0f0f0',
                                        borderColor: '#d0d0d0',
                        color: '#333',
                                        fontSize: '16px',
                      }}
                                      autoFocus
                                    />
                                    <div className="flex gap-1">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                          // Adicionar o pensamento rápido
                                          handleAddInlineQuickNote(dateStr);
                                        }}
                                        onMouseDown={(e) => {
                                          e.preventDefault(); // Prevenir blur do input
                                          e.stopPropagation();
                                        }}
                                        className="flex-1 px-2 py-1 rounded font-pixel text-xs cursor-pointer"
                                        style={{
                                          backgroundColor: '#9e9e9e',
                                          color: '#FFFFFF',
                                          fontSize: '12px',
                                          zIndex: 10,
                      }}
                    >
                                        Adicionar
                    </button>
                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setEditingQuickNoteDate(null);
                                          setInlineQuickNoteText('');
                                        }}
                                        onMouseDown={(e) => {
                                          e.preventDefault(); // Prevenir blur do input
                                          e.stopPropagation();
                                        }}
                                        className="px-2 py-1 rounded font-pixel text-xs"
                        style={{ 
                                          backgroundColor: '#e0e0e0',
                                          color: '#666',
                          fontSize: '12px',
                        }}
                      >
                                        Cancelar
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                      <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      // NÃO mudar a data selecionada, apenas abrir input inline
                                      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                      console.log('Botão clicado, abrindo input para:', dateStr);
                                      setEditingQuickNoteDate(dateStr);
                                      setInlineQuickNoteText('');
                                      // Forçar re-render se necessário
                                      setTimeout(() => {
                                        const input = document.querySelector(`input[placeholder="${tString('journal.addQuickThought')}"]`) as HTMLInputElement;
                                        if (input && editingQuickNoteDate === dateStr) {
                                          input.focus();
                                        }
                                      }, 100);
                                    }}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                    }}
                                    onTouchStart={(e) => {
                                      e.stopPropagation();
                                    }}
                                    onPointerDown={(e) => {
                                      e.stopPropagation();
                                    }}
                                    className="w-full mt-1 p-1 rounded font-pixel border border-dashed flex-shrink-0 cursor-pointer"
                                    style={{
                                      backgroundColor: isToday ? '#FFFFFF' : 'transparent',
                                      borderColor: isToday ? '#FFFFFF' : '#d0d0d0',
                                      color: isToday ? '#333' : '#999',
                                      fontSize: '13px',
                                      textAlign: 'center',
                                      zIndex: 50,
                                      position: 'relative',
                                      pointerEvents: 'auto',
                                      touchAction: 'manipulation',
                                    }}
                                    title="Clique para adicionar pensamento rápido"
                      >
                                    + {t('journal.clickToAdd')}
                      </button>
                                )}
                    </div>
                          );
                        });
                      })()}
                  </div>
                </div>
                </div>
              );
            })()
          )}

        </PixelCard>
      </div>

      {/* Modal de calendário de hábito */}
      {selectedHabit && (() => {
        // Buscar o hábito atualizado do array habits para garantir que o progresso seja recalculado
        const currentHabit = habits.find(h => h.id === selectedHabit.id) || selectedHabit;
        const monthlyProgress = calculateMonthlyProgress(currentHabit, calendarMonth);
        const progressColor = getProgressColor(monthlyProgress);
        const progressPercent = Math.round(monthlyProgress * 100);
        
        return (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"
          onClick={() => setSelectedHabit(null)}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 shadow-lg relative"
            style={{
              border: '1px solid #d8d4c7',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <h3 
                  className="text-lg font-pixel-bold line-clamp-2" 
                  style={{ color: '#333', maxWidth: '300px' }}
                  title={selectedHabit.name}
                >
                  {selectedHabit.name}
                </h3>
                <button
                  onClick={() => {
                    handleRenameHabit(selectedHabit.id, selectedHabit.name);
                  }}
                  className="px-2 py-1 rounded text-xs font-pixel border border-[#d8d4c7] hover:bg-[#ece8dd] transition-colors"
                  style={{ color: '#111' }}
                >
                  ✎ Renomear
                </button>
                <button
                  onClick={() => {
                    handleDeleteHabit(selectedHabit.id, selectedHabit.name);
                    setSelectedHabit(null);
                  }}
                  className="px-2 py-1 rounded text-xs font-pixel border border-[#d8d4c7] hover:bg-red-50 transition-colors"
                  style={{ color: '#C62828' }}
                >
                  🗑 Excluir
                </button>
              </div>
              <button
                onClick={() => setSelectedHabit(null)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>
            
            {/* Navegação do mês */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={goToPreviousMonth}
                className="px-3 py-1 rounded border border-[#d8d4c7] hover:bg-[#ece8dd] transition-colors font-pixel-bold"
                style={{ color: '#111' }}
              >
                ↑
              </button>
              <span className="text-sm font-pixel-bold" style={{ color: '#333' }}>
                {formatMonthYear(calendarMonth)}
              </span>
              <button
                onClick={goToNextMonth}
                className="px-3 py-1 rounded border border-[#d8d4c7] hover:bg-[#ece8dd] transition-colors font-pixel-bold"
                style={{ color: '#111' }}
              >
                ↓
              </button>
            </div>

            {/* Calendário e barra de progresso lado a lado */}
            <div className="flex gap-4">
              {/* Grid do calendário */}
              <div className="flex-1 grid grid-cols-7 gap-1">
                {/* Cabeçalho dos dias da semana */}
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day) => (
                  <div 
                    key={day} 
                    className="text-center font-pixel-bold p-2 text-xs rounded"
                    style={{ 
                      backgroundColor: '#E3F2FD',
                      border: '1px solid #d8d4c7',
                      color: '#111'
                    }}
                  >
                    {day}
                  </div>
                ))}

                {/* Dias do calendário */}
                {getMonthCalendarDays().map(({ date, isCurrentMonth, isToday }) => {
                  const dateStr = date.toISOString().substring(0, 10);
                  const checked = currentHabit.checks[dateStr];
                  const dayNumber = date.getDate();
                  const isCreatedDate = currentHabit.createdAt && dateStr === currentHabit.createdAt.substring(0, 10);

                  return (
                    <div
                      key={dateStr}
                      onClick={() => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const clickDate = new Date(date);
                        clickDate.setHours(0, 0, 0, 0);
                        
                        if (clickDate <= today) {
                          toggleCheck(currentHabit.id, dateStr);
                        }
                      }}
                      className={`
                        aspect-square flex flex-col items-center justify-center
                        rounded border p-1 transition-colors
                        ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
                        ${isToday ? 'ring-2 ring-[#111]' : ''}
                        ${checked ? 'bg-green-50' : ''}
                      `}
                      style={{
                        borderColor: '#d8d4c7',
                        cursor: (() => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const clickDate = new Date(date);
                          clickDate.setHours(0, 0, 0, 0);
                          return clickDate <= today ? 'pointer' : 'not-allowed';
                        })(),
                      }}
                    >
                      <span className={`text-xs font-pixel ${!isCurrentMonth ? 'text-gray-400' : ''}`}>
                        {dayNumber}
                      </span>
                      {isCreatedDate && (
                        <div className="w-2 h-2 rounded-full bg-black mt-1" />
                      )}
                      {checked && !isCreatedDate && (
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-1" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Barra lateral de progresso mensal */}
              <div className="w-16 flex flex-col items-center gap-2">
                <div className="flex-1 w-8 bg-gray-200 border-2 border-black relative" style={{ minHeight: '300px' }}>
                  <div
                    className="absolute bottom-0 w-full border-2 border-black transition-all"
                    style={{
                      height: `${monthlyProgress * 100}%`,
                      backgroundColor: progressColor,
                    }}
                  />
                </div>
                <div className="text-xs font-bold text-center" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                  {progressPercent}%
                </div>
                <div className="text-xs font-semibold text-center" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                  {formatMonthYear(calendarMonth).split(' ')[0]}
                </div>
              </div>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Modal de Calendário para Seleção de Data */}
      {showDateCalendar && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"
          onClick={() => setShowDateCalendar(false)}
        >
          <div 
            className="p-6 max-w-2xl w-full mx-4 rounded-lg"
            style={{
              background: '#f7f7f7',
              border: '1px solid #ccc',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-pixel-bold" style={{ fontSize: '20px', color: '#333' }}>
                {t('common.selectDate')}
              </h2>
              <button
                onClick={() => setShowDateCalendar(false)}
                className="px-3 py-1 rounded transition-colors"
                style={{
                  background: '#f7f7f7',
                  border: '1px solid #ccc',
                  color: '#333'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0f0f0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f7f7f7';
                }}
              >
                ×
              </button>
            </div>
            
            {/* Navegação do mês */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={goToPreviousDateMonth}
                className="px-3 py-1 rounded transition-colors font-pixel-bold"
                style={{
                  background: '#f7f7f7',
                  border: '1px solid #ccc',
                  color: '#333'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0f0f0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f7f7f7';
                }}
              >
                ↑
              </button>
              <span className="font-pixel-bold" style={{ fontSize: '16px', color: '#333' }}>
                {formatMonthYear(dateCalendarMonth)}
              </span>
              <button
                onClick={goToNextDateMonth}
                className="px-3 py-1 rounded transition-colors font-pixel-bold"
                style={{
                  background: '#f7f7f7',
                  border: '1px solid #ccc',
                  color: '#333'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0f0f0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f7f7f7';
                }}
              >
                ↓
              </button>
            </div>

            {/* Grid do calendário */}
            <div className="grid grid-cols-7 gap-1">
              {/* Cabeçalho dos dias da semana */}
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day) => (
                <div 
                  key={day} 
                  className="text-center font-pixel-bold p-2 rounded"
                  style={{ 
                    backgroundColor: '#e8e8e8',
                    border: '1px solid #e0e0e0',
                    color: '#333',
                    fontSize: '14px'
                  }}
                >
                  {day}
                </div>
              ))}

              {/* Dias do calendário */}
              {getDateCalendarDays().map(({ date, isCurrentMonth, isToday, hasEntry }, index) => {
                const dateStr = formatDateKey(date);
                const dayNumber = date.getDate();
                const isSelected = dateStr === selectedDate;

                return (
                  <div
                    key={`${dateStr}-${index}`}
                    onClick={() => handleDateSelect(date)}
                    className={`
                      aspect-square flex flex-col items-center justify-center
                      rounded border p-1 transition-colors cursor-pointer
                      ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
                      ${isSelected ? 'bg-blue-400' : ''}
                      hover:bg-gray-100
                    `}
                    style={{
                      borderColor: isSelected ? '#2563eb' : '#e0e0e0',
                    }}
                  >
                    <span className={`text-sm font-pixel ${!isCurrentMonth ? 'text-gray-400' : ''} ${isSelected ? 'text-white' : ''}`}>
                      {dayNumber}
                    </span>
                    {hasEntry && (
                      <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? 'bg-white' : 'bg-gray-600'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
