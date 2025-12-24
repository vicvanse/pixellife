"use client";

import { useState, useEffect } from "react";
import {
  useExpenses,
  type DailyExpenseItem,
  type MonthlyRow,
  type ReserveMovement,
} from "../hooks/useExpenses";
import { AddExpenseModal } from "./expenses/AddExpenseModal";
import { AddReserveModal } from "./expenses/AddReserveModal";
import { CSVImporter } from "./expenses/CSVImporter";
// Não precisamos mais ler da tabela finances - tudo vem de user_data via syncToSupabase
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

interface ExpensesOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = "daily" | "month" | "reserve";

export function ExpensesOverlay({ isOpen, onClose }: ExpensesOverlayProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const {
    getTodayDate,
    formatDateKey,
    formatMonthKey,
    getDailyExpenses,
    addDailyExpense,
    removeDailyExpense,
    calculateDailyTotal,
    getReserveMovements,
    addReserveMovement,
    removeReserveMovement,
    calculateDailyReserveDelta,
    getSalary,
    saveSalary,
    getDesiredMonthlyExpense,
    saveDesiredMonthlyExpense,
    getResetDate,
    saveResetDate,
    getBudget,
    saveBudget,
    getInitialReserve,
    saveInitialReserve,
    calculateMonthlyData,
    getCurrentReserve,
    getAccountMoney,
    saveAccountMoney,
    isSyncing,
  } = useExpenses();

  // ===============================
  // ESTADO
  // ===============================
  const [activeTab, setActiveTab] = useState<Tab>("daily");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [dailyItems, setDailyItems] = useState<DailyExpenseItem[]>([]);
  const [reserveItems, setReserveItems] = useState<ReserveMovement[]>([]);
  const [monthlyRows, setMonthlyRows] = useState<MonthlyRow[]>([]);
  const [initialReserve, setInitialReserve] = useState<number>(0);
  const [salary, setSalary] = useState<number | null>(null);
  const [desiredMonthlyExpense, setDesiredMonthlyExpense] = useState<number>(0);
  const [resetDate, setResetDate] = useState<number>(1);
  const [accountMoney, setAccountMoney] = useState<number | null>(null);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isAddReserveModalOpen, setIsAddReserveModalOpen] = useState(false);
  const [isCSVImporterOpen, setIsCSVImporterOpen] = useState(false);
  const [isEditAccountMoneyModalOpen, setIsEditAccountMoneyModalOpen] = useState(false);
  const [selectedEditDate, setSelectedEditDate] = useState<Date>(new Date());
  const [editAccountMoneyValue, setEditAccountMoneyValue] = useState<number | null>(null);
  const [selectedGoalIdForExpense, setSelectedGoalIdForExpense] = useState<number | undefined>();
  const [showDateCalendar, setShowDateCalendar] = useState(false);
  const [dateCalendarMonth, setDateCalendarMonth] = useState<Date>(new Date());

  // ===============================
  // CARREGAR DADOS DO DIA SELECIONADO
  // ===============================
  useEffect(() => {
    if (!isOpen) return;
    const dateKey = formatDateKey(selectedDate);
    const items = getDailyExpenses(dateKey);
    const rItems = getReserveMovements(dateKey);
    setDailyItems(items);
    setReserveItems(rItems);
  }, [selectedDate, formatDateKey, getDailyExpenses, getReserveMovements, isOpen]);

  // Escutar mudanças no localStorage (quando dados são recarregados do Supabase)
  useEffect(() => {
    if (!isOpen) return;
    
    const handleStorageChange = () => {
      const dateKey = formatDateKey(selectedDate);
      const items = getDailyExpenses(dateKey);
      const rItems = getReserveMovements(dateKey);
      setDailyItems(items);
      setReserveItems(rItems);
    };

    const handleExpensesUpdate = () => {
      const dateKey = formatDateKey(selectedDate);
      const items = getDailyExpenses(dateKey);
      const rItems = getReserveMovements(dateKey);
      setDailyItems(items);
      setReserveItems(rItems);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("expenses-updated", handleExpensesUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("expenses-updated", handleExpensesUpdate);
    };
  }, [isOpen, selectedDate, formatDateKey, getDailyExpenses, getReserveMovements]);

  // ===============================
  // CARREGAR DADOS DO MÊS SELECIONADO
  // ===============================
  useEffect(() => {
    if (!isOpen) return;
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const monthKey = formatMonthKey(selectedMonth);
    
    const prev = new Date(year, month - 1, 1);
    const prevKey = formatMonthKey(prev);
    
    const prevRows = calculateMonthlyData(
      prev.getFullYear(),
      prev.getMonth(),
      getDesiredMonthlyExpense(prevKey),
      getResetDate(prevKey)
    );
    const prevFinalReserve = prevRows.length ? prevRows[prevRows.length - 1].reserve : 0;
    
    saveInitialReserve(monthKey, prevFinalReserve);
    
    const reserve = getInitialReserve(monthKey);
    setInitialReserve(reserve);
    
    const monthSalary = getSalary(monthKey);
    setSalary(monthSalary);
    
    const desiredExpense = getDesiredMonthlyExpense(monthKey);
    setDesiredMonthlyExpense(desiredExpense);
    
    const reset = getResetDate(monthKey);
    setResetDate(reset);
    
    const rows = calculateMonthlyData(year, month, desiredExpense, reset);
    setMonthlyRows(rows);
    
    // Dinheiro em conta - calcular a partir dos expenses no localStorage
    // Todos os dados vêm de user_data via syncToSupabase, não precisamos mais ler da tabela finances
    const loadAccountMoney = () => {
      const today = new Date();
      const todayKey = formatDateKey(today);
      
      // Buscar da tabela calculada (que usa dados do localStorage)
      const todayRow = rows.find((row) => {
        const rowDate = new Date(year, month, row.day);
        return formatDateKey(rowDate) === todayKey;
      });
      if (todayRow) {
        setAccountMoney(todayRow.accountMoney);
      } else {
        // Fallback: usar getAccountMoney (calcula a partir do localStorage)
        const accountMoneyValue = getAccountMoney(todayKey);
        setAccountMoney(accountMoneyValue);
      }
    };
    
    loadAccountMoney();
  }, [
    selectedMonth,
    formatMonthKey,
    calculateMonthlyData,
    getDesiredMonthlyExpense,
    getResetDate,
    saveInitialReserve,
    getInitialReserve,
    getSalary,
    formatDateKey,
    getAccountMoney,
    getReserveMovements,
    calculateDailyTotal,
    isOpen,
  ]);

  useEffect(() => {
    if (!isOpen) return;
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const rows = calculateMonthlyData(year, month, desiredMonthlyExpense, resetDate);
    setMonthlyRows(rows);
    
    // Recalcular dinheiro em conta do dia atual quando houver mudanças
    // Buscar o valor da tabela recalculada, não do getAccountMoney (que pode ter cache)
    const today = new Date();
    const todayKey = formatDateKey(today);
    const todayRow = rows.find((row) => {
      const rowDate = new Date(year, month, row.day);
      return formatDateKey(rowDate) === todayKey;
    });
    if (todayRow) {
      setAccountMoney(todayRow.accountMoney);
    } else {
      // Fallback se não encontrar na tabela
      const accountMoneyValue = getAccountMoney(todayKey);
      setAccountMoney(accountMoneyValue);
    }
  }, [
    dailyItems, 
    reserveItems, 
    selectedMonth, 
    desiredMonthlyExpense, 
    resetDate, 
    calculateMonthlyData, 
    isOpen, 
    formatDateKey, 
    getAccountMoney,
    accountMoney, // Incluir accountMoney para recalcular quando mudar
  ]);

  // ===============================
  // HANDLERS
  // ===============================
  const handleAddDailyItem = () => {
    setIsAddExpenseModalOpen(true);
  };

  const handleSaveExpense = (description: string, value: number, relatedGoalId?: number, category?: string) => {
    const dateKey = formatDateKey(selectedDate);
    const newItems = addDailyExpense(dateKey, description, value, relatedGoalId, category);
    setDailyItems(newItems);
  };

  const handleRemoveDailyItem = (id: string) => {
    const dateKey = formatDateKey(selectedDate);
    const newItems = removeDailyExpense(dateKey, id);
    setDailyItems(newItems);
  };

  const handleAddReserveItem = () => {
    setIsAddReserveModalOpen(true);
  };

  const handleSaveReserve = (description: string, value: number) => {
    const dateKey = formatDateKey(selectedDate);
    const newItems = addReserveMovement(dateKey, description, value);
    setReserveItems(newItems);
  };

  const handleRemoveReserveItem = (id: string) => {
    const dateKey = formatDateKey(selectedDate);
    const newItems = removeReserveMovement(dateKey, id);
    setReserveItems(newItems);
  };

  const handleDesiredMonthlyExpenseChange = (value: number) => {
    const monthKey = formatMonthKey(selectedMonth);
    saveDesiredMonthlyExpense(monthKey, value);
    setDesiredMonthlyExpense(value);
    
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const rows = calculateMonthlyData(year, month, value, resetDate);
    setMonthlyRows(rows);
  };

  const handleResetDateChange = (day: number) => {
    if (day < 1 || day > 31 || isNaN(day)) return;
    
    const monthKey = formatMonthKey(selectedMonth);
    saveResetDate(monthKey, day);
    setResetDate(day);
    
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const rows = calculateMonthlyData(year, month, desiredMonthlyExpense, day);
    setMonthlyRows(rows);
  };

  const handleAccountMoneyChange = async (value: number | null) => {
    const today = new Date();
    const todayKey = formatDateKey(today);
    
    if (value === null) {
      // Se o valor for null (vazio), remove a chave para usar o valor do dia anterior (calculado incrementalmente)
      // Remove o valor inicial salvo para o dia atual e todos os dias futuros do mês
      const todayYear = today.getFullYear();
      const todayMonth = today.getMonth();
      const daysInMonth = new Date(todayYear, todayMonth + 1, 0).getDate();
      
      for (let d = today.getDate(); d <= daysInMonth; d++) {
        const saveDate = new Date(todayYear, todayMonth, d);
        const saveKey = formatDateKey(saveDate);
        if (typeof window !== "undefined") {
          const storageKey = `pixel-life-expenses-v1:accountMoneyInitial:${saveKey}`;
          window.localStorage.removeItem(storageKey);
        }
      }
      
      // Recarregar a tabela PRIMEIRO para recalcular tudo
      const tableYear = selectedMonth.getFullYear();
      const tableMonth = selectedMonth.getMonth();
      const rows = calculateMonthlyData(tableYear, tableMonth, desiredMonthlyExpense, resetDate);
      setMonthlyRows(rows);
      
      // Depois de recalcular a tabela, buscar o valor calculado do dia atual da tabela
      const todayRow = rows.find((row) => {
        const rowDate = new Date(tableYear, tableMonth, row.day);
        return formatDateKey(rowDate) === todayKey;
      });
      
      // Atualiza o estado com o valor calculado da tabela (que é o valor do dia anterior + gastos/ganhos de hoje)
      if (todayRow) {
        setAccountMoney(todayRow.accountMoney);
      } else {
        // Se não encontrou na tabela, usa getAccountMoney como fallback
        const currentValue = getAccountMoney(todayKey);
        setAccountMoney(currentValue);
      }
    } else {
      // syncToSupabase() já salva todos os expenses (incluindo saldos) via user_data
      // Não precisamos mais salvar na tabela finances separadamente
      
      // Para calcular o valor inicial, precisamos subtrair os gastos e movimentações do dia atual
      // valor_total[dia] = valor_inicial[dia] + gastos_diários[dia] + movimentações_reserva[dia]
      // valor_inicial[dia] = valor_total[dia] - gastos_diários[dia] - movimentações_reserva[dia]
      const todayDailyTotal = calculateDailyTotal(todayKey);
      const todayReserveMovements = getReserveMovements(todayKey);
      const todayReserveDelta = todayReserveMovements.reduce((sum, m) => sum + m.value, 0);
      
      // Calcular o valor inicial: valor total menos os gastos e movimentações do dia atual
      const initialValue = value - todayDailyTotal - todayReserveDelta;
      
      // Salva o valor inicial para o dia atual e todos os dias futuros (localStorage para compatibilidade)
      saveAccountMoney(todayKey, initialValue);
      setAccountMoney(value);
      
      // Recarregar a tabela para refletir as mudanças
      const tableYear = selectedMonth.getFullYear();
      const tableMonth = selectedMonth.getMonth();
      const rows = calculateMonthlyData(tableYear, tableMonth, desiredMonthlyExpense, resetDate);
      setMonthlyRows(rows);
    }
  };

  const goToPreviousMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1));
  };

  const formatMonthYear = (date: Date): string => {
    const monthsFull = t('journal.monthsFull') as string[];
    return `${monthsFull[date.getMonth()]} ${t('common.of')} ${date.getFullYear()}`;
  };

  const formatDate = (date: Date): string => {
    const days = t('journal.days') as string[];
    const monthsFull = t('journal.monthsFull') as string[];
    return `${days[date.getDay()]}, ${date.getDate()} ${t('common.of')} ${monthsFull[date.getMonth()]} ${t('common.of')} ${date.getFullYear()}`;
  };

  // ===============================
  // CÁLCULOS
  // ===============================
  const todayTotal = calculateDailyTotal(formatDateKey(selectedDate));
  const todayKey = getTodayDate();
  const isToday = formatDateKey(selectedDate) === todayKey;
  
  const todayRow = monthlyRows.find((row) => {
    const rowDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), row.day);
    return formatDateKey(rowDate) === formatDateKey(new Date());
  });
  
  const todayReserveDelta = calculateDailyReserveDelta(formatDateKey(selectedDate));
  const currentReserve = getCurrentReserve();
  
  const formatNumber = (num: number): string => {
    const parts = Math.abs(num).toFixed(2).split(".");
    const integer = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${integer},${parts[1]}`;
  };

  // ===============================
  // FUNÇÕES DO CALENDÁRIO DE DATA
  // ===============================
  const goToPreviousDateMonth = () => {
    setDateCalendarMonth(new Date(dateCalendarMonth.getFullYear(), dateCalendarMonth.getMonth() - 1, 1));
  };

  const goToNextDateMonth = () => {
    setDateCalendarMonth(new Date(dateCalendarMonth.getFullYear(), dateCalendarMonth.getMonth() + 1, 1));
  };

  const getDateCalendarDays = (): Array<{ date: Date; isCurrentMonth: boolean; isToday: boolean }> => {
    const year = dateCalendarMonth.getFullYear();
    const month = dateCalendarMonth.getMonth();
    
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

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setShowDateCalendar(false);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white border-4 border-black p-5 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-[6px_6px_0_0_#000] font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Finanças</h1>
          <button
            onClick={onClose}
            className="bg-red-400 border-2 border-black px-3 py-1.5 font-bold hover:bg-red-500 shadow-[2px_2px_0_0_#000]"
          >
            X
          </button>
        </div>

        {/* Abas */}
        <div className="flex gap-2 mb-4 border-b-2 border-black">
          <button
            onClick={() => setActiveTab("daily")}
            className={`px-4 py-2 font-bold transition-colors ${
              activeTab === "daily"
                ? "bg-blue-400"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
            style={{ borderBottom: activeTab === "daily" ? "4px solid #1e40af" : "none" }}
          >
            Diário
          </button>
          <button
            onClick={() => setActiveTab("month")}
            className={`px-4 py-2 font-bold transition-colors ${
              activeTab === "month"
                ? "bg-green-400"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
            style={{ borderBottom: activeTab === "month" ? "4px solid #16a34a" : "none" }}
          >
            Mês
          </button>
          <button
            onClick={() => setActiveTab("reserve")}
            className={`px-4 py-2 font-bold transition-colors ${
              activeTab === "reserve"
                ? "bg-yellow-400"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
            style={{ borderBottom: activeTab === "reserve" ? "4px solid #ca8a04" : "none" }}
          >
            Reserva
          </button>
        </div>

        {/* Conteúdo das Abas */}
        {activeTab === "daily" && (
          <div className="space-y-4">
            {/* Data selecionada */}
            <div className="bg-blue-50 border-2 border-black p-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <button
                  onClick={() => {
                    const prevDay = new Date(selectedDate);
                    prevDay.setDate(prevDay.getDate() - 1);
                    setSelectedDate(prevDay);
                  }}
                  className="bg-gray-300 border-2 border-black px-2 py-1 text-xs font-bold hover:bg-gray-400 shadow-[2px_2px_0_0_#000]"
                >
                  ←
                </button>
                <button
                  onClick={() => {
                    if (selectedDate) {
                      const date = new Date(selectedDate);
                      setDateCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1));
                    }
                    setShowDateCalendar(true);
                  }}
                  className="border-2 border-black px-3 py-1 text-sm font-mono bg-white hover:bg-gray-100 flex items-center gap-2"
                >
                  {formatDateKey(selectedDate)}
                  <span>📅</span>
                </button>
                <button
                  onClick={() => {
                    const nextDay = new Date(selectedDate);
                    nextDay.setDate(nextDay.getDate() + 1);
                    setSelectedDate(nextDay);
                  }}
                  className="bg-gray-300 border-2 border-black px-2 py-1 text-xs font-bold hover:bg-gray-400 shadow-[2px_2px_0_0_#000]"
                >
                  →
                </button>
                {!isToday && (
                  <button
                    onClick={() => setSelectedDate(new Date())}
                    className="bg-blue-400 border-2 border-black px-2 py-1 text-xs font-bold hover:bg-blue-500 shadow-[2px_2px_0_0_#000] ml-2"
                  >
                    Hoje
                  </button>
                )}
              </div>
              <p className="text-sm text-center font-semibold">{formatDate(selectedDate)}</p>
            </div>

            {/* Botões de ação */}
            <div className="flex gap-2">
              <button
                onClick={handleAddDailyItem}
                className="flex-1 bg-green-400 border-2 border-black px-4 py-2 font-bold hover:bg-green-500 shadow-[2px_2px_0_0_#000]"
              >
                + Adicionar gasto/ganho
              </button>
              <button
                onClick={() => setIsCSVImporterOpen(true)}
                className="bg-blue-400 border-2 border-black px-4 py-2 font-bold hover:bg-blue-500 shadow-[2px_2px_0_0_#000]"
                title="Importar extrato CSV do banco"
              >
                📥 Importar CSV
              </button>
            </div>

            {/* Lista de gastos/ganhos */}
            {dailyItems.length > 0 ? (
              <div className="space-y-2">
                {dailyItems.map((item) => (
                  <div
                    key={item.id}
                    className="border-2 border-black p-3 bg-gray-50 flex items-center justify-between hover:bg-gray-100"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{item.description}</span>
                        {item.category && (
                          <span 
                            className="text-xs px-2 py-0.5 rounded"
                            style={{ 
                              backgroundColor: '#e0e0e0',
                              color: '#666',
                            }}
                          >
                            {item.category}
                          </span>
                        )}
                      </div>
                      <span className={`font-bold ${item.value >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {item.value >= 0 ? "+" : ""}R$ {item.value.toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveDailyItem(item.id)}
                      className="bg-red-400 border-2 border-black px-2 py-1 text-xs font-bold hover:bg-red-500 shadow-[2px_2px_0_0_#000] ml-2"
                      title="Remover item"
                    >
                      🗑
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 border-2 border-black p-4 text-center text-gray-500 text-sm">
                Nenhum gasto/ganho registrado neste dia.
              </div>
            )}

            {/* Resumo do dia */}
            <div className="bg-blue-50 border-2 border-black p-3">
              <p className="text-sm font-bold text-center">
                Total do dia: <span className={todayTotal >= 0 ? "text-green-600" : "text-red-600"}>
                  {todayTotal >= 0 ? "+" : ""}R$ {todayTotal.toFixed(2).replace(".", ",")}
                </span>
                {isSyncing && (
                  <span className="ml-2 text-xs text-gray-600">💾 Salvando...</span>
                )}
              </p>
            </div>
          </div>
        )}

        {activeTab === "month" && (
          <div className="space-y-4">
            {/* Controles do mês */}
            <div className="bg-green-50 border-2 border-black p-4">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={goToPreviousMonth}
                  className="bg-gray-300 border-2 border-black px-3 py-1 font-bold hover:bg-gray-400 shadow-[2px_2px_0_0_#000]"
                >
                  ←
                </button>
                <span className="text-lg font-bold">{formatMonthYear(selectedMonth)}</span>
                <button
                  onClick={goToNextMonth}
                  className="bg-gray-300 border-2 border-black px-3 py-1 font-bold hover:bg-gray-400 shadow-[2px_2px_0_0_#000]"
                >
                  →
                </button>
              </div>

              {/* Controles de gasto mensal desejado, reset e dinheiro em conta */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white border-2 border-black p-2 flex items-center gap-2">
                  <label className="text-xs font-bold whitespace-nowrap">Gasto mensal desejado (teto):</label>
                  <input
                    type="number"
                    value={desiredMonthlyExpense || ""}
                    onChange={(e) => handleDesiredMonthlyExpenseChange(parseFloat(e.target.value) || 0)}
                    className="flex-1 border-2 border-black px-2 py-1 text-sm min-w-0"
                    step="0.01"
                    placeholder="0"
                  />
                </div>
                <div className="bg-white border-2 border-black p-2 flex items-center gap-2">
                  <label className="text-xs font-bold whitespace-nowrap">Data de reset:</label>
                  <input
                    type="number"
                    value={resetDate}
                    onChange={(e) => {
                      const day = parseInt(e.target.value);
                      if (day >= 1 && day <= 31) {
                        handleResetDateChange(day);
                      }
                    }}
                    className="flex-1 border-2 border-black px-2 py-1 text-sm min-w-0"
                    min="1"
                    max="31"
                    placeholder="1"
                  />
                </div>
                <div className="bg-white border-2 border-black p-2 flex items-center gap-2">
                  <label className="text-xs font-bold whitespace-nowrap">Dinheiro em conta:</label>
                  <input
                    type="number"
                    value={accountMoney === null ? "" : accountMoney}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || val === null || val === undefined) {
                        handleAccountMoneyChange(null); // Vazio = usa valor anterior
                      } else {
                        const num = parseFloat(val);
                        handleAccountMoneyChange(isNaN(num) ? null : num);
                      }
                    }}
                    className="flex-1 border-2 border-black px-2 py-1 text-sm min-w-0"
                    step="0.01"
                    placeholder="Valor calculado"
                  />
                  <button
                    onClick={() => {
                      const today = new Date();
                      setSelectedEditDate(today);
                      const todayKey = formatDateKey(today);
                      const currentValue = getAccountMoney(todayKey);
                      // Mostra o valor atual calculado (não o valor inicial salvo)
                      setEditAccountMoneyValue(currentValue);
                      setIsEditAccountMoneyModalOpen(true);
                    }}
                    className="bg-blue-400 border-2 border-black px-2 py-1 text-xs font-bold hover:bg-blue-500 shadow-[2px_2px_0_0_#000] whitespace-nowrap"
                    title="Alterar valor de data específica"
                  >
                    📅
                  </button>
                </div>
              </div>
            </div>

            {/* Tabela mensal melhorada */}
            <div className="overflow-x-auto">
              <table className="w-full border-2 border-black border-collapse">
                <thead>
                  <tr className="bg-green-300 border-b-2 border-black">
                    <th className="border-r-2 border-black px-2 py-2 text-center font-bold text-xs w-[45px]">Dia</th>
                    <th className="border-r-2 border-black px-2 py-2 text-center font-bold text-xs">Detalhes</th>
                    <th className="border-r-2 border-black px-2 py-2 text-center font-bold text-xs w-[100px]">Gastos diários</th>
                    <th className="border-r-2 border-black px-2 py-2 text-center font-bold text-xs w-[100px]">Plano de Gastos</th>
                    <th className="border-r-2 border-black px-2 py-2 text-center font-bold text-xs w-[100px]">Dinheiro em conta</th>
                    <th className="px-2 py-2 text-center font-bold text-xs w-[100px]">Reserva</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyRows.map((row, index) => {
                    const rowDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), row.day);
                    const isRowToday = formatDateKey(rowDate) === todayKey;
                    const dateKey = formatDateKey(rowDate);
                    const dailyItemsForRow = getDailyExpenses(dateKey);
                    const isFuture = rowDate > new Date();
                    
                    const formatNumberLocal = (num: number): string => {
                      const parts = Math.abs(num).toFixed(2).split(".");
                      const integer = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                      return `${integer},${parts[1]}`;
                    };
                    
                    const formatDetails = () => {
                      if (dailyItemsForRow.length === 0) return null;
                      
                      const parts: React.ReactElement[] = [];
                      dailyItemsForRow.forEach((item, idx) => {
                        const isPositive = item.value >= 0;
                        const sign = isPositive ? "+" : "-";
                        const valueStr = formatNumberLocal(item.value);
                        
                        parts.push(
                          <span key={`item-${idx}`}>
                            <span className="text-black">"{item.description}"</span>{" "}
                            <span className={isPositive ? "text-green-600" : "text-red-600"}>
                              ({sign}{valueStr})
                            </span>
                          </span>
                        );
                        
                        if (idx < dailyItemsForRow.length - 1) {
                          parts.push(<span key={`plus-${idx}`}> + </span>);
                        }
                      });
                      
                      return parts.length > 0 ? parts : null;
                    };
                    
                    return (
                      <tr
                        key={row.day}
                        className={`border-b border-black ${
                          isRowToday ? "bg-yellow-100 ring-2 ring-yellow-400" : index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } ${isFuture ? "opacity-40" : ""}`}
                      >
                        <td className="border-r-2 border-black px-2 py-1 text-center text-xs font-semibold bg-gray-100">
                          {String(row.day).padStart(2, "0")}
                        </td>
                        <td className="border-r-2 border-black px-2 py-1 align-middle">
                          {formatDetails() ? (
                            <div className="w-full text-xs text-center" style={{ wordWrap: "break-word", whiteSpace: "pre-wrap", lineHeight: "1.5" }}>
                              {formatDetails()}
                            </div>
                          ) : (
                            <div className="w-full text-xs text-center text-gray-400">—</div>
                          )}
                        </td>
                        <td className={`border-r-2 border-black px-2 py-1 text-right text-xs align-middle ${
                          row.totalDaily >= 0 ? "text-green-600" : "text-red-600"
                        }`}>
                          {row.totalDaily >= 0 ? "+" : "-"}{formatNumberLocal(row.totalDaily)}
                        </td>
                        <td className={`border-r-2 border-black px-2 py-1 text-right text-xs align-middle font-bold ${
                          row.totalMonth >= 0 ? "text-green-600" : "text-red-600"
                        }`}>
                          {formatNumberLocal(row.totalMonth)}
                        </td>
                        <td className={`border-r-2 border-black px-2 py-1 text-right text-xs font-bold align-middle ${
                          row.accountMoney >= 0 ? "text-green-600" : "text-red-600"
                        }`}>
                          {formatNumberLocal(row.accountMoney)}
                        </td>
                        <td className={`px-2 py-1 text-right text-xs font-bold align-middle ${
                          row.reserve >= 0 ? "text-green-600" : "text-red-600"
                        }`}>
                          {formatNumberLocal(row.reserve)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "reserve" && (
          <div className="space-y-4">
            {/* Resumo da reserva */}
            <div className="bg-yellow-50 border-2 border-black p-4">
              <h2 className="text-lg font-bold mb-2">Reserva Atual</h2>
              <p className="text-2xl font-bold text-center">
                <span className={currentReserve >= 0 ? "text-green-600" : "text-red-600"}>
                  R$ {formatNumber(currentReserve)}
                </span>
              </p>
            </div>

            {/* Data selecionada */}
            <div className="bg-yellow-50 border-2 border-black p-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <button
                  onClick={() => {
                    const prevDay = new Date(selectedDate);
                    prevDay.setDate(prevDay.getDate() - 1);
                    setSelectedDate(prevDay);
                  }}
                  className="bg-gray-300 border-2 border-black px-2 py-1 text-xs font-bold hover:bg-gray-400 shadow-[2px_2px_0_0_#000]"
                >
                  ←
                </button>
                <button
                  onClick={() => {
                    if (selectedDate) {
                      const date = new Date(selectedDate);
                      setDateCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1));
                    }
                    setShowDateCalendar(true);
                  }}
                  className="border-2 border-black px-3 py-1 text-sm font-mono bg-white hover:bg-gray-100 flex items-center gap-2"
                >
                  {formatDateKey(selectedDate)}
                  <span>📅</span>
                </button>
                <button
                  onClick={() => {
                    const nextDay = new Date(selectedDate);
                    nextDay.setDate(nextDay.getDate() + 1);
                    setSelectedDate(nextDay);
                  }}
                  className="bg-gray-300 border-2 border-black px-2 py-1 text-xs font-bold hover:bg-gray-400 shadow-[2px_2px_0_0_#000]"
                >
                  →
                </button>
                {!isToday && (
                  <button
                    onClick={() => setSelectedDate(new Date())}
                    className="bg-blue-400 border-2 border-black px-2 py-1 text-xs font-bold hover:bg-blue-500 shadow-[2px_2px_0_0_#000] ml-2"
                  >
                    Hoje
                  </button>
                )}
              </div>
              <p className="text-sm text-center font-semibold">{formatDate(selectedDate)}</p>
            </div>

            {/* Botão adicionar */}
            <button
              onClick={handleAddReserveItem}
              className="w-full bg-yellow-400 border-2 border-black px-4 py-2 font-bold hover:bg-yellow-500 shadow-[2px_2px_0_0_#000]"
            >
              + Movimentar reserva
            </button>

            {/* Lista de movimentações */}
            {reserveItems.length > 0 ? (
              <div className="space-y-2">
                {reserveItems.map((item) => (
                  <div
                    key={item.id}
                    className="border-2 border-black p-3 bg-gray-50 flex items-center justify-between hover:bg-gray-100"
                  >
                    <div className="flex-1">
                      <span className="font-semibold">{item.description}</span>
                      <span className={`ml-2 font-bold ${item.value >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {item.value >= 0 ? "+" : ""}R$ {item.value.toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveReserveItem(item.id)}
                      className="bg-red-400 border-2 border-black px-2 py-1 text-xs font-bold hover:bg-red-500 shadow-[2px_2px_0_0_#000] ml-2"
                      title="Remover movimentação"
                    >
                      🗑
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 border-2 border-black p-4 text-center text-gray-500 text-sm">
                Nenhuma movimentação de reserva neste dia.
              </div>
            )}

            {/* Resumo do dia */}
            <div className="bg-yellow-50 border-2 border-black p-3">
              <p className="text-sm font-bold text-center">
                Movimentação hoje: <span className={todayReserveDelta >= 0 ? "text-green-600" : "text-red-600"}>
                  {todayReserveDelta >= 0 ? "+" : ""}R$ {todayReserveDelta.toFixed(2).replace(".", ",")}
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Modal de Adicionar Despesa */}
        <AddExpenseModal
          isOpen={isAddExpenseModalOpen}
          onClose={() => {
            setIsAddExpenseModalOpen(false);
            setSelectedGoalIdForExpense(undefined);
          }}
          onSave={handleSaveExpense}
          initialGoalId={selectedGoalIdForExpense}
        />

        {/* Modal de Importação CSV */}
        <CSVImporter
          isOpen={isCSVImporterOpen}
          onClose={() => setIsCSVImporterOpen(false)}
          onImport={(transactions) => {
            // Processar cada transação importada
            transactions.forEach((transaction) => {
              const dateKey = transaction.date;
              addDailyExpense(
                dateKey,
                transaction.description,
                transaction.value,
                undefined,
                transaction.category
              );
            });
            
            // Atualizar lista de itens do dia selecionado
            const dateKey = formatDateKey(selectedDate);
            const items = getDailyExpenses(dateKey);
            setDailyItems(items);
            
            setIsCSVImporterOpen(false);
          }}
        />

        {/* Modal de Movimentar Reserva */}
        <AddReserveModal
          isOpen={isAddReserveModalOpen}
          onClose={() => setIsAddReserveModalOpen(false)}
          onSave={handleSaveReserve}
        />

        {/* Modal para editar dinheiro em conta de data específica */}
        {isEditAccountMoneyModalOpen && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setIsEditAccountMoneyModalOpen(false)}
          >
            <div
              className="bg-white border-4 border-black p-6 max-w-md w-full mx-4 shadow-[8px_8px_0_0_#000] font-mono"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-4">Alterar Dinheiro em Conta</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-2">Data:</label>
                  <input
                    type="date"
                    value={formatDateKey(selectedEditDate)}
                    onChange={(e) => {
                      if (e.target.value) {
                        // Parse manual para evitar problemas de timezone
                        const [yearStr, monthStr, dayStr] = e.target.value.split("-");
                        const year = parseInt(yearStr, 10);
                        const month = parseInt(monthStr, 10) - 1; // month é 0-indexed
                        const day = parseInt(dayStr, 10);
                        const newDate = new Date(year, month, day);
                        setSelectedEditDate(newDate);
                        const dateKey = formatDateKey(newDate);
                        // Buscar o valor da tabela mensal se possível (usar o mês da data selecionada)
                        const editYear = newDate.getFullYear();
                        const editMonth = newDate.getMonth();
                        const editMonthKey = formatMonthKey(new Date(editYear, editMonth, 1));
                        const editDesiredExpense = getDesiredMonthlyExpense(editMonthKey);
                        const editResetDate = getResetDate(editMonthKey);
                        const rows = calculateMonthlyData(editYear, editMonth, editDesiredExpense, editResetDate);
                        const row = rows.find((r) => {
                          const rowDate = new Date(editYear, editMonth, r.day);
                          return formatDateKey(rowDate) === dateKey;
                        });
                        const currentValue = row ? row.accountMoney : getAccountMoney(dateKey);
                        // Mostra o valor atual calculado (não o valor inicial salvo)
                        setEditAccountMoneyValue(currentValue);
                      }
                    }}
                    className="w-full border-2 border-black px-2 py-1 text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold mb-2">Valor atual:</label>
                  <div className="bg-gray-100 border-2 border-black px-2 py-1 text-sm font-bold text-right">
                    R$ {editAccountMoneyValue !== null ? (() => {
                      const parts = Math.abs(editAccountMoneyValue).toFixed(2).split(".");
                      const integer = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                      return `${integer},${parts[1]}`;
                    })() : "—"}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-bold mb-2">Novo valor:</label>
                  <input
                    type="number"
                    value={editAccountMoneyValue === null ? "" : editAccountMoneyValue}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || val === null || val === undefined) {
                        setEditAccountMoneyValue(null); // Vazio = usa valor anterior
                      } else {
                        const num = parseFloat(val);
                        setEditAccountMoneyValue(isNaN(num) ? null : num);
                      }
                    }}
                    className="w-full border-2 border-black px-2 py-1 text-sm"
                    step="0.01"
                    placeholder="Deixe vazio para usar valor anterior"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Deixe vazio para continuar do valor anterior. Digite "0" para definir como zero.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <button
                  onClick={async () => {
                    const dateKey = formatDateKey(selectedEditDate);
                    
                    if (editAccountMoneyValue === null) {
                      // Se o valor for null (vazio), remove a chave para usar o valor do dia anterior (calculado incrementalmente)
                      // Remove o valor inicial salvo para a data selecionada e todos os dias futuros do mês
                      const selectedDate = new Date(selectedEditDate);
                      const editYear = selectedDate.getFullYear();
                      const editMonth = selectedDate.getMonth();
                      const daysInMonth = new Date(editYear, editMonth + 1, 0).getDate();
                      
                      for (let d = selectedDate.getDate(); d <= daysInMonth; d++) {
                        const saveDate = new Date(editYear, editMonth, d);
                        const saveKey = formatDateKey(saveDate);
                        if (typeof window !== "undefined") {
                          const storageKey = `pixel-life-expenses-v1:accountMoneyInitial:${saveKey}`;
                          window.localStorage.removeItem(storageKey);
                        }
                      }
                    } else {
                      // syncToSupabase() já salva todos os expenses (incluindo saldos) via user_data
                      // Não precisamos mais salvar na tabela finances separadamente
                      
                      // Calcular o valor inicial (antes dos gastos e movimentações)
                      const dailyTotal = calculateDailyTotal(dateKey);
                      const reserveMovements = getReserveMovements(dateKey);
                      const reserveDelta = reserveMovements.reduce((sum, m) => sum + m.value, 0);
                      const initialValue = editAccountMoneyValue - dailyTotal - reserveDelta;
                      
                      // Salvar o valor inicial para a data selecionada (localStorage para compatibilidade)
                      saveAccountMoney(dateKey, initialValue);
                      
                      // Atualizar o valor exibido se for a data atual
                      const today = new Date();
                      const todayKey = formatDateKey(today);
                      if (dateKey === todayKey) {
                        setAccountMoney(editAccountMoneyValue);
                      }
                    }
                    
                    // Recarregar a tabela do mês da data editada
                    const editYear = selectedEditDate.getFullYear();
                    const editMonth = selectedEditDate.getMonth();
                    const editMonthKey = formatMonthKey(new Date(editYear, editMonth, 1));
                    const editDesiredExpense = getDesiredMonthlyExpense(editMonthKey);
                    const editResetDate = getResetDate(editMonthKey);
                    const rows = calculateMonthlyData(editYear, editMonth, editDesiredExpense, editResetDate);
                    
                    // Se a data editada está no mês atual, atualizar a tabela exibida
                    const currentYear = selectedMonth.getFullYear();
                    const currentMonth = selectedMonth.getMonth();
                    if (editYear === currentYear && editMonth === currentMonth) {
                      setMonthlyRows(rows);
                    }
                    
                    // Se for a data atual e o valor foi apagado, atualizar o campo superior
                    const today = new Date();
                    const todayKey = formatDateKey(today);
                    if (dateKey === todayKey && editAccountMoneyValue === null) {
                      // Buscar na tabela do mês atual
                      const currentRows = calculateMonthlyData(currentYear, currentMonth, desiredMonthlyExpense, resetDate);
                      const todayRow = currentRows.find((row) => {
                        const rowDate = new Date(currentYear, currentMonth, row.day);
                        return formatDateKey(rowDate) === todayKey;
                      });
                      if (todayRow) {
                        setAccountMoney(todayRow.accountMoney);
                      } else {
                        const currentValue = getAccountMoney(todayKey);
                        setAccountMoney(currentValue);
                      }
                    }
                    
                    setIsEditAccountMoneyModalOpen(false);
                  }}
                  className="flex-1 bg-green-400 border-4 border-black px-4 py-2 font-bold hover:bg-green-500 shadow-[4px_4px_0_0_#000]"
                >
                  Salvar
                </button>
                <button
                  onClick={() => setIsEditAccountMoneyModalOpen(false)}
                  className="flex-1 bg-red-400 border-4 border-black px-4 py-2 font-bold hover:bg-red-500 shadow-[4px_4px_0_0_#000]"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de calendário de seleção de data */}
        {showDateCalendar && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"
            onClick={() => setShowDateCalendar(false)}
          >
            <div 
              className="p-6 max-w-2xl w-full mx-4 rounded-lg bg-white"
              style={{
                border: '1px solid #ccc',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-pixel-bold" style={{ fontSize: '20px', color: '#333' }}>
                  Selecionar Data
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
                {getDateCalendarDays().map(({ date, isCurrentMonth, isToday }) => {
                  const dateStr = date.toISOString().substring(0, 10);
                  const dayNumber = date.getDate();
                  const isSelected = formatDateKey(date) === formatDateKey(selectedDate);

                  return (
                    <div
                      key={dateStr}
                      onClick={() => handleDateSelect(date)}
                      className={`
                        aspect-square flex flex-col items-center justify-center
                        rounded border p-1 transition-colors cursor-pointer
                        ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
                        ${isSelected ? 'bg-blue-400 text-white' : ''}
                        hover:bg-gray-100
                      `}
                      style={{
                        borderColor: isSelected ? '#2563eb' : '#e0e0e0',
                      }}
                    >
                      <span className={`text-sm font-pixel ${!isCurrentMonth ? 'text-gray-400' : ''} ${isSelected ? 'text-white' : ''}`}>
                        {dayNumber}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Botões de ação */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setShowDateCalendar(false)}
                  className="flex-1 px-4 py-2 rounded transition-colors font-pixel-bold"
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
                  Limpar
                </button>
                <button
                  onClick={() => {
                    setSelectedDate(new Date());
                    setShowDateCalendar(false);
                  }}
                  className="flex-1 px-4 py-2 rounded transition-colors font-pixel-bold"
                  style={{
                    background: '#2563eb',
                    border: '1px solid #1b5cff',
                    color: '#fff'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#1d4ed8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#2563eb';
                  }}
                >
                  Hoje
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
