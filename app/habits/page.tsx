"use client";

import { useEffect, useState } from "react";

import PixelMenu from "../components/PixelMenu";
import { useHabits, type Habit } from "../hooks/useHabits";
import { useConfirmation } from "../context/ConfirmationContext";
import { useLanguage } from "../context/LanguageContext";

export default function HabitsPage() {
  const { t } = useLanguage();
  const { habits, addHabit, deleteHabit, toggleCheck, reorderHabits, updateHabit } = useHabits();
  const [days, setDays] = useState<string[]>([]);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const { showConfirmation } = useConfirmation();
  const [editingHabit, setEditingHabit] = useState<{ id: number; currentName: string } | null>(null);
  const [editingHabitName, setEditingHabitName] = useState('');

  // ===============================
  // 7 dias anteriores
  // ===============================
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

  useEffect(() => {
    updateDays();
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const ms = tomorrow.getTime() - now.getTime();
    const timeoutId = setTimeout(() => updateDays(), ms);
    return () => clearTimeout(timeoutId);
  }, []);

  // Sincroniza selectedHabit com o estado habits quando habits muda
  useEffect(() => {
    if (selectedHabit) {
      const updatedHabit = habits.find((h) => h.id === selectedHabit.id);
      if (!updatedHabit) {
        // Hábito foi excluído, fecha o calendário
        setSelectedHabit(null);
      } else {
        // Atualiza selectedHabit com os dados mais recentes
        setSelectedHabit(updatedHabit);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habits]);

  // ===============================
  // Drag & Drop
  // ===============================
  const [draggedHabit, setDraggedHabit] = useState<Habit | null>(null);
  const [dragOverHabit, setDragOverHabit] = useState<Habit | null>(null);

  const handleDragStart = (habit: Habit) => setDraggedHabit(habit);

  const handleDragOver = (e: React.DragEvent, target: Habit) => {
    e.preventDefault();
    if (draggedHabit && draggedHabit.id !== target.id) setDragOverHabit(target);
  };

  const handleDrop = (target: Habit) => {
    if (!draggedHabit) return;
    const clone = [...habits];
    const from = clone.findIndex((h) => h.id === draggedHabit.id);
    const to = clone.findIndex((h) => h.id === target.id);
    const [removed] = clone.splice(from, 1);
    clone.splice(to, 0, removed);
    reorderHabits(clone);
    setDraggedHabit(null);
    setDragOverHabit(null);
  };

  // ===============================
  // Rename habit
  // ===============================
  const renameHabit = (habitId: number, currentName: string) => {
    setEditingHabit({ id: habitId, currentName });
    setEditingHabitName(currentName);
  };

  const handleSaveRename = () => {
    if (!editingHabit) return;
    
    const trimmedName = editingHabitName.trim().substring(0, 32);
    if (!trimmedName) {
      setEditingHabit(null);
      setEditingHabitName('');
      return;
    }

    if (editingHabit.id === -1) {
      // Adicionar novo hábito
      addHabit(trimmedName);
    } else {
      // Renomear hábito existente
      updateHabit(editingHabit.id, { name: trimmedName });

      if (selectedHabit && selectedHabit.id === editingHabit.id) {
        setSelectedHabit({ ...selectedHabit, name: trimmedName });
      }
    }
    
    setEditingHabit(null);
    setEditingHabitName('');
  };

  const handleCancelRename = () => {
    setEditingHabit(null);
    setEditingHabitName('');
  };

  // ===============================
  // Delete habit
  // ===============================
  const handleDeleteHabit = (habitId: number, habitName: string) => {
    showConfirmation({
      message: `Tem certeza que deseja excluir o hábito "${habitName}"?\n\nEsta ação não pode ser desfeita.`,
      onConfirm: () => {
        deleteHabit(habitId);
        
        // Fecha o calendário se o hábito excluído estava aberto
        if (selectedHabit && selectedHabit.id === habitId) {
          setSelectedHabit(null);
        }
      },
    });
  };

  // ===============================
  // Calendar month navigation
  // ===============================
  const goToPreviousMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));
  };

  // ===============================
  // Get calendar days for a month
  // ===============================
  const getMonthCalendarDays = (): Array<{ date: Date; isCurrentMonth: boolean; isToday: boolean }> => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    
    // Primeiro dia do mês
    const firstDay = new Date(year, month, 1);
    // Último dia do mês
    const lastDay = new Date(year, month + 1, 0);
    
    // Dia da semana do primeiro dia (0 = Domingo, 6 = Sábado)
    const firstDayOfWeek = firstDay.getDay();
    
    // Dias do mês anterior para completar a primeira semana
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
    
    // Dias do mês atual
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
    
    // Calcular quantas semanas completas temos
    const totalDays = prevMonthDays.length + currentMonthDays.length;
    const weeks = Math.ceil(totalDays / 7);
    
    // Retornar apenas as semanas completas do mês (sem dias do próximo mês)
    return [...prevMonthDays, ...currentMonthDays];
  };

  // ===============================
  // Format date in Portuguese
  // ===============================
  const formatDatePortuguese = (date: Date): string => {
    const days = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
    const months = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];
    
    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    return `${dayName}, ${monthName} ${day}`;
  };

  const formatMonthYear = (date: Date): string => {
    const months = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];
    return `${months[date.getMonth()]} de ${date.getFullYear()}`;
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
    
    // Calculate days in the month that the habit was active
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = lastDay > today ? today : lastDay;
    
    // Contar apenas os dias desde a criação do hábito até hoje (ou fim do mês)
    // Mas calcular o progresso baseado em todos os dias do mês
    let totalDaysInMonth = lastDay.getDate(); // Total de dias no mês
    let checkedDays = 0;
    
    // Iterar pelos dias desde a criação do hábito até hoje (ou fim do mês)
    const startDate = habitCreatedAt > firstDay ? habitCreatedAt : firstDay;
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${day}`;
      if (habit.checks[dateStr]) {
        checkedDays++;
      }
    }
    
    // Progresso = dias com check / total de dias do mês
    // Isso evita que 1 check de 1 dia mostre 100%
    return totalDaysInMonth > 0 ? checkedDays / totalDaysInMonth : 0;
  };

  const getProgressColor = (progress: number): string => {
    if (progress >= 0.75) return '#22c55e'; // verde escuro
    if (progress >= 0.50) return '#4ade80'; // verde sólido
    if (progress >= 0.25) return '#86efac'; // verde claro
    return '#d1d5db'; // cinza
  };

  // ===============================
  // Render
  // ===============================
  return (
    <div className="relative w-full min-h-screen overflow-auto font-mono p-6">
      <PixelMenu />

      <h1 className="text-center text-2xl font-bold mb-6">Hábitos</h1>

      <div className="max-w-3xl mx-auto border-4 border-black bg-white shadow-[6px_6px_0_0_#000]">
        {/* Cabeçalho */}
        <div className="grid grid-cols-[180px_repeat(7,minmax(34px,0.765fr))] border-b-4 border-black sticky top-0 bg-white z-10">
          <div className="bg-blue-300 font-bold border-r-4 border-black p-2 flex items-center justify-center">{t('sections.habits')}</div>
          {days.map((d) => (
            <div key={d} className="text-center bg-blue-200 border-r-4 border-black p-2">
              {d.substring(5)}
            </div>
          ))}
        </div>

        {/* LISTA COM SCROLL DE 500px */}
        <div style={{ maxHeight: "500px", overflowY: "auto" }}>
          {habits.map((habit) => (
            <div
              key={habit.id}
              draggable
              onDragStart={() => handleDragStart(habit)}
              onDragOver={(e) => handleDragOver(e, habit)}
              onDrop={() => handleDrop(habit)}
              className={`grid grid-cols-[180px_repeat(7,minmax(34px,0.765fr))] border-b-4 border-black ${
                draggedHabit?.id === habit.id ? "opacity-40" : ""
              } ${dragOverHabit?.id === habit.id ? "bg-blue-100" : ""}`}
            >
              <div
                className="p-2 border-r-4 border-black bg-gray-100 font-semibold flex items-center cursor-pointer gap-2"
                onClick={() => {
                  setSelectedHabit(habit);
                  setCalendarMonth(new Date()); // Reset para o mês atual
                }}
              >
                <span className="text-gray-600 font-bold text-xl flex-shrink-0">+</span>
                <span 
                  className="flex-1 text-center block truncate"
                  style={{ 
                    maxWidth: '150px'
                  }}
                  title={habit.name}
                >
                  {habit.name.length > 27 ? habit.name.substring(0, 27) + '...' : habit.name}
                </span>
              </div>

              {days.map((d) => (
                <div
                  key={d}
                  onClick={() => toggleCheck(habit.id, d)}
                  className="flex items-center justify-center border-r-4 border-black cursor-pointer"
                >
                  <img
                    src={habit.checks[d] ? "/icon2.1.png" : "/icon2.2.png"}
                    className="w-6 h-6 object-contain"
                  />
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Botão adicionar hábito */}
        <button
          onClick={() => {
            setEditingHabit({ id: -1, currentName: '' });
            setEditingHabitName('');
          }}
          className="w-full bg-gray-300 border-4 border-black p-2 font-bold hover:bg-gray-400 shadow-[4px_4px_0_0_#000]"
        >
          + {t('common.addHabit')}
        </button>
      </div>

      {/* Modal do Calendário */}
      {selectedHabit && (() => {
        // Buscar o hábito atualizado do array habits para garantir que o progresso seja recalculado
        const currentHabit = habits.find(h => h.id === selectedHabit.id) || selectedHabit;
        const monthlyProgress = calculateMonthlyProgress(currentHabit, calendarMonth);
        const progressColor = getProgressColor(monthlyProgress);
        const progressPercent = Math.round(monthlyProgress * 100);
        
        return (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedHabit(null)}
        >
          <div 
            className="bg-white border-4 border-black p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-[8px_8px_0_0_#000] relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho do calendário */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">{selectedHabit.name}</h2>
                  <button
                    onClick={() => handleDeleteHabit(selectedHabit.id, selectedHabit.name)}
                    className="bg-red-300 border-2 border-black px-2 py-1 text-xs font-bold hover:bg-red-400 touch-manipulation"
                    style={{ minWidth: '48px', minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Excluir hábito"
                    aria-label="Excluir hábito"
                  >
                    🗑
                  </button>
                  <button
                    onClick={() => renameHabit(selectedHabit.id, selectedHabit.name)}
                    className="bg-blue-300 border-2 border-black px-2 py-1 text-xs font-bold hover:bg-blue-400 touch-manipulation"
                    style={{ minWidth: '48px', minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Renomear hábito"
                    aria-label="Renomear hábito"
                  >
                    ✎
                  </button>
                </div>
                <button
                  onClick={() => setSelectedHabit(null)}
                  className="bg-red-400 border-4 border-black px-4 py-2 font-bold hover:bg-red-500 touch-manipulation min-h-[48px] min-w-[48px]"
                  aria-label="Fechar"
                >
                  X
                </button>
              </div>
              
              {/* Data selecionada e navegação do mês */}
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-semibold">
                  {formatDatePortuguese(new Date())}
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={goToPreviousMonth}
                    className="bg-gray-300 border-2 border-black px-3 py-1 font-bold hover:bg-gray-400 touch-manipulation min-h-[48px] min-w-[48px]"
                    aria-label="Mês anterior"
                  >
                    ↑
                  </button>
                  <span className="text-lg font-bold">
                    {formatMonthYear(calendarMonth)}
                  </span>
                  <button
                    onClick={goToNextMonth}
                    className="bg-gray-300 border-2 border-black px-3 py-1 font-bold hover:bg-gray-400 touch-manipulation min-h-[48px] min-w-[48px]"
                    aria-label="Próximo mês"
                  >
                    ↓
                  </button>
                </div>
              </div>
            </div>

            {/* Calendário e barra de progresso lado a lado */}
            <div className="flex gap-4">
              {/* Grid do calendário */}
              <div className="flex-1 grid grid-cols-7 gap-1">
                {/* Cabeçalho dos dias da semana */}
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day) => (
                  <div key={day} className="text-center font-bold bg-blue-200 border-2 border-black p-2 text-sm">
                    {day}
                  </div>
                ))}

                {/* Dias do calendário */}
                {getMonthCalendarDays().map(({ date, isCurrentMonth, isToday }) => {
                  const dateStr = date.toISOString().substring(0, 10);
                  const checked = selectedHabit.checks[dateStr];
                  const dayNumber = date.getDate();
                  const isCreatedDate = selectedHabit.createdAt && dateStr === selectedHabit.createdAt.substring(0, 10);

                  return (
                    <div
                      key={dateStr}
                      onClick={() => {
                        // Permite marcar qualquer data passada ou hoje (não permite futuro)
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const clickDate = new Date(date);
                        clickDate.setHours(0, 0, 0, 0);
                        
                        if (clickDate <= today) {
                          toggleCheck(selectedHabit.id, dateStr);
                          // O selectedHabit será sincronizado automaticamente pelo useEffect
                        }
                      }}
                      className={`
                        aspect-square flex flex-col items-center justify-center
                        border-2 border-black p-1 touch-manipulation
                        ${!isCurrentMonth ? 'bg-gray-100 text-gray-400' : 'bg-white'}
                        ${isToday ? 'ring-4 ring-blue-500 bg-blue-50' : ''}
                        ${checked ? 'bg-green-100' : ''}
                      `}
                      style={{
                        cursor: (() => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const clickDate = new Date(date);
                          clickDate.setHours(0, 0, 0, 0);
                          return clickDate <= today ? 'pointer' : 'not-allowed';
                        })(),
                        minWidth: '48px',
                        minHeight: '48px',
                      }}
                    >
                      <span className={`text-sm font-semibold ${!isCurrentMonth ? 'text-gray-400' : ''}`}>
                        {dayNumber}
                      </span>
                      {isCreatedDate && (
                        <div className="w-2 h-2 rounded-full bg-black mt-1" />
                      )}
                      {checked && !isCreatedDate && (
                        <div className="w-2 h-2 rounded-full bg-green-600 mt-1" />
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

      {/* Modal de Edição/Renomear */}
      {editingHabit && (
        <div 
          className="fixed inset-0 bg-black/20 flex items-center justify-center z-[100]"
          onClick={handleCancelRename}
        >
          <div 
            className="bg-white p-6 max-w-md w-full mx-4"
            style={{
              borderRadius: '6px',
              border: '1px solid #e5e5e5',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-pixel-bold mb-4" style={{ color: '#333', fontSize: '18px' }}>
              {editingHabit.id === -1 ? t('common.newHabit') : t('common.renameHabit')}
            </h2>
            
            <div className="mb-6">
              <p className="font-pixel whitespace-pre-line mb-4" style={{ color: '#666', fontSize: '14px', lineHeight: '1.6' }}>
                {editingHabit.id === -1 ? t('common.habitName') : t('common.newHabitName')}
              </p>
              <input
                type="text"
                value={editingHabitName}
                onChange={(e) => {
                  const value = e.target.value.substring(0, 32);
                  setEditingHabitName(value);
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveRename();
                  } else if (e.key === 'Escape') {
                    handleCancelRename();
                  }
                }}
                className="w-full px-4 py-2 font-pixel border"
                style={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#e5e5e5',
                  color: '#333',
                  fontSize: '14px',
                  borderRadius: '4px',
                }}
                maxLength={32}
                autoFocus
              />
              <p className="mt-1 font-pixel text-xs" style={{ color: '#999' }}>
                {editingHabitName.length}/32 {t('display.characters')}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancelRename}
                className="flex-1 px-4 py-2 font-pixel transition-all hover:opacity-80"
                style={{
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #e5e5e5',
                  color: '#666',
                  fontSize: '14px',
                  borderRadius: '4px',
                }}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSaveRename}
                className="flex-1 px-4 py-2 font-pixel-bold transition-all hover:opacity-90"
                style={{
                  backgroundColor: '#9e9e9e',
                  border: '1px solid #9e9e9e',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  borderRadius: '4px',
                }}
              >
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
