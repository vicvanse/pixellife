'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useJournal } from '../../hooks/useJournal';

interface ExpandedThoughtsViewProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExpandedThoughtsView({ isOpen, onClose }: ExpandedThoughtsViewProps) {
  const { t, tString, language } = useLanguage();
  const { journal, updateQuickNote } = useJournal();
  const [editingNote, setEditingNote] = useState<{ date: string; noteId: string } | null>(null);
  const [editText, setEditText] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Agrupar quick notes por data
  const thoughtsByDate = useMemo(() => {
    const grouped: Array<{ date: string; notes: Array<{ id: string; time: string; text: string }> }> = [];
    
    Object.keys(journal)
      .sort()
      .reverse()
      .forEach((date) => {
        const entry = journal[date];
        if (entry?.quickNotes && entry.quickNotes.length > 0) {
          grouped.push({
            date,
            notes: entry.quickNotes,
          });
        }
      });

    return grouped;
  }, [journal]);

  // Gerar todos os dias do mês selecionado (ordem decrescente - mais recente primeiro)
  const allDaysOfMonth = useMemo(() => {
    const month = selectedMonth.getMonth();
    const year = selectedMonth.getFullYear();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days: Array<{ date: string; notes: Array<{ id: string; time: string; text: string }> }> = [];
    
    // Criar um mapa de pensamentos por data para acesso rápido
    const thoughtsMap = new Map<string, Array<{ id: string; time: string; text: string }>>();
    thoughtsByDate.forEach(({ date, notes }) => {
      const [y, m] = date.split('-').map(Number);
      if (y === year && m - 1 === month) {
        thoughtsMap.set(date, notes);
      }
    });
    
    // Gerar todos os dias do mês (do último para o primeiro)
    for (let day = daysInMonth; day >= 1; day--) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        date: dateStr,
        notes: thoughtsMap.get(dateStr) || [],
      });
    }
    
    return days;
  }, [thoughtsByDate, selectedMonth]);

  // Obter dias da semana e meses traduzidos
  const days = t('journal.days') as string[];
  const months = t('journal.months') as string[];
  
  // Abreviações dos dias da semana (3 primeiras letras)
  const getDayAbbreviation = (dayIndex: number): string => {
    const dayName = days[dayIndex] || '';
    return dayName.substring(0, 3).toLowerCase();
  };

  // Formatar data para obter dia da semana e número do dia
  const getDateInfo = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return {
      dayOfWeek: date.getDay(),
      dayNumber: day,
      date: date,
    };
  };

  // Obter nome do mês completo traduzido
  const getMonthName = () => {
    const monthIndex = selectedMonth.getMonth();
    // Usar traduções completas do mês
    const fullMonthNames: Record<string, string[]> = {
      'pt': ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
      'en': ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      'es': ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
      'ko': ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
      'ja': ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      'de': ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
      'fr': ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
      'it': ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'],
      'zh-CN': ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
      'zh-TW': ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
    };
    const monthNames = fullMonthNames[language] || fullMonthNames['pt'];
    return monthNames[monthIndex];
  };

  const handleEdit = (date: string, noteId: string, currentText: string) => {
    setEditingNote({ date, noteId });
    setEditText(currentText);
  };

  const handleSaveEdit = () => {
    if (editingNote) {
      updateQuickNote(editingNote.date, editingNote.noteId, editText);
      setEditingNote(null);
      setEditText('');
    }
  };

  const handleCancelEdit = () => {
    setEditingNote(null);
    setEditText('');
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    setSelectedMonth((prev) => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  // Scroll para o primeiro dia catalogado quando o mês mudar
  useEffect(() => {
    if (scrollContainerRef.current && allDaysOfMonth.length > 0) {
      // Scroll para o início (primeiro dia catalogado está no início devido à ordem decrescente)
      scrollContainerRef.current.scrollLeft = 0;
    }
  }, [allDaysOfMonth, selectedMonth]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg w-full max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{
          border: '1px solid #e0e0e0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#e0e0e0] flex justify-between items-center">
          <h2 className="font-pixel-bold text-xl" style={{ color: '#111' }}>
            {t('journal.quickThoughts')}
          </h2>
          <div className="flex items-center gap-4">
            {/* Month Selector */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => changeMonth('prev')}
                className="px-3 py-1 rounded font-pixel hover:bg-gray-100 transition-colors"
                style={{ color: '#111' }}
              >
                ←
              </button>
              <span className="font-pixel-bold text-lg" style={{ color: '#111' }}>
                {getMonthName()} {selectedMonth.getFullYear()}
              </span>
              <button
                onClick={() => changeMonth('next')}
                className="px-3 py-1 rounded font-pixel hover:bg-gray-100 transition-colors"
                style={{ color: '#111' }}
              >
                →
              </button>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
              style={{ color: '#666' }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Calendar View - Tabela estilo Google Sheets */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-x-auto" ref={scrollContainerRef}>
            <div className="inline-flex flex-col min-w-full" style={{ minWidth: `${allDaysOfMonth.length * 200}px` }}>
              {/* Month Row - Single cell spanning all columns */}
              <div className="flex border-b-2 border-black">
                <div
                  className="flex-shrink-0 p-2 text-center font-pixel-bold"
                  style={{ 
                    width: `${allDaysOfMonth.length * 200}px`,
                    backgroundColor: '#fafafa',
                    color: '#111',
                    fontSize: '14px',
                  }}
                >
                  {getMonthName()}
                </div>
              </div>

              {/* Days of Week Row */}
              <div className="flex border-b border-[#e0e0e0]">
                {allDaysOfMonth.map(({ date }) => {
                  const { dayOfWeek } = getDateInfo(date);
                  return (
                    <div
                      key={date}
                      className="flex-shrink-0 border-r border-[#e0e0e0] p-2 text-center font-pixel"
                      style={{ 
                        width: '200px',
                        backgroundColor: '#f5f5f5',
                        color: '#666',
                        fontSize: '12px',
                      }}
                    >
                      {getDayAbbreviation(dayOfWeek)}
                    </div>
                  );
                })}
              </div>

              {/* Day Numbers Row */}
              <div className="flex border-b-2 border-black">
                {allDaysOfMonth.map(({ date }) => {
                  const { dayNumber } = getDateInfo(date);
                  return (
                    <div
                      key={date}
                      className="flex-shrink-0 border-r border-[#e0e0e0] p-2 text-center font-pixel-bold"
                      style={{ 
                        width: '200px',
                        backgroundColor: '#fafafa',
                        color: '#111',
                        fontSize: '16px',
                      }}
                    >
                      {dayNumber}
                    </div>
                  );
                })}
              </div>

              {/* Content Row - Scrollable com blocos */}
              <div className="flex flex-1" style={{ minHeight: '400px', maxHeight: '60vh' }}>
                {allDaysOfMonth.map(({ date, notes }) => (
                  <div
                    key={date}
                    className="flex-shrink-0 border-r border-[#e0e0e0] p-3 overflow-y-auto"
                    style={{ 
                      width: '200px',
                      backgroundColor: '#FFFFFF',
                    }}
                  >
                    <div className="space-y-2">
                      {notes.length === 0 ? null : (
                        notes.map((note) => (
                          <div
                            key={note.id}
                            className="p-2 rounded"
                            style={{
                              backgroundColor: '#f7f7f7',
                              border: '1px solid #e0e0e0',
                              marginBottom: '8px',
                            }}
                          >
                            {editingNote?.date === date && editingNote?.noteId === note.id ? (
                              <div className="space-y-2">
                                <textarea
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  className="w-full p-2 rounded font-pixel resize-none"
                                  style={{
                                    backgroundColor: '#FFFFFF',
                                    border: '1px solid #ccc',
                                    color: '#333',
                                    fontSize: '12px',
                                    minHeight: '80px',
                                  }}
                                  autoFocus
                                />
                                <div className="flex gap-2 justify-end">
                                  <button
                                    onClick={handleCancelEdit}
                                    className="px-2 py-1 rounded font-pixel text-xs"
                                    style={{
                                      backgroundColor: '#e0e0e0',
                                      color: '#333',
                                    }}
                                  >
                                    {t('common.cancel')}
                                  </button>
                                  <button
                                    onClick={handleSaveEdit}
                                    className="px-2 py-1 rounded font-pixel text-xs"
                                    style={{
                                      backgroundColor: '#4d82ff',
                                      color: '#FFFFFF',
                                    }}
                                  >
                                    {t('common.save')}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                {note.time && (
                                  <span
                                    className="text-xs font-pixel block mb-1"
                                    style={{ color: '#999' }}
                                  >
                                    {note.time}
                                  </span>
                                )}
                                <p
                                  className="font-pixel whitespace-pre-wrap text-xs"
                                  style={{
                                    color: '#333',
                                    lineHeight: '1.4',
                                    marginBottom: '4px',
                                  }}
                                >
                                  {note.text}
                                </p>
                                <button
                                  onClick={() => handleEdit(date, note.id, note.text)}
                                  className="text-xs text-gray-500 hover:text-gray-700"
                                  title={tString('common.edit')}
                                >
                                  ✎
                                </button>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
