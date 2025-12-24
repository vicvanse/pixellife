'use client';

import PixelMenu from '../components/PixelMenu';
import { DailyOverview } from '../components/DailyOverview';
import { ProfileSection } from '../components/ProfileSection';
import { PixelCard } from '../components/PixelCard';
import { useHabits, type Habit } from '../hooks/useHabits';
import { useExpenses, type DailyExpenseItem, type ReserveMovement } from '../hooks/useExpenses';
import { usePossessions, type AssetGoal } from '../hooks/usePossessions';
import { useTree, type TreeSkill } from '../hooks/useTree';
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AddExpenseModal } from '../components/expenses/AddExpenseModal';
import { AddReserveModal } from '../components/expenses/AddReserveModal';
import { EditAccountMoneyModal } from '../components/expenses/EditAccountMoneyModal';
import { IncomeConfigModal } from '../components/expenses/IncomeConfigModal';
import { ExpensePlanningModal } from '../components/expenses/ExpensePlanningModal';
import { CSVImporter } from '../components/expenses/CSVImporter';
import { AddFinancialEntryModal } from '../components/finances/AddFinancialEntryModal';
import { useFinancialEntries, type FinancialEntry } from '../hooks/useFinancialEntries';
import { PossessionCard } from '../components/possessions/PossessionCard';
import { PossessionDetailsModal } from '../components/possessions/PossessionDetailsModal';
import { CreatePossessionModal } from '../components/possessions/CreatePossessionModal';
import { EditPossessionModal } from '../components/possessions/EditPossessionModal';
import { SkillCard } from '../components/tree/SkillCard';
import { SkillModal } from '../components/tree/SkillModal';
import { AchievementMiniCard } from '../components/display/AchievementMiniCard';
import { useJournal } from '../hooks/useJournal';
import { useConfirmation } from '../context/ConfirmationContext';
import { useBiography, formatBiographyDate } from '../hooks/useBiography';
import { BiographyEntryCard } from '../components/biography/BiographyEntryCard';
import { BiographyModal } from '../components/biography/BiographyModal';
import { BiographyTimeline } from '../components/biography/BiographyTimeline';
import type { BiographyEntry } from '../hooks/useBiography';
import { useTimeline } from '../hooks/useTimeline';
import { useDossiers } from '../hooks/useDossiers';
import { useAboutItems, AboutItemCategory } from '../hooks/useAboutItems';
import { TimelineView } from '../components/biography/TimelineView';
import { TimelineModal } from '../components/biography/TimelineModal';
import { DossierCard } from '../components/biography/DossierCard';
import { DossierModal } from '../components/biography/DossierModal';
import { DossierView } from '../components/biography/DossierView';
import { AboutItemsSection } from '../components/biography/AboutItemsSection';
import { AboutItemModal } from '../components/biography/AboutItemModal';
import { AttributesView } from '../components/biography/AttributesView';
import { AttributeModal } from '../components/biography/AttributeModal';
import { useAttributes, type Attribute } from '../hooks/useAttributes';
import type { TimelineEvent } from '../hooks/useTimeline';
import type { Dossier } from '../hooks/useDossiers';
import { useUserModules } from '../hooks/useUserModules';
import { CustomizeAppModal } from '../components/modules/CustomizeAppModal';
import { LifeDexSection } from '../components/lifedex/LifeDexSection';
import { FeedbackSection } from '../components/feedback/FeedbackSection';
import { GuidesSection } from '../components/guides/GuidesSection';
import { MapasSection } from '../components/mapas/MapasSection';
import { useUI } from '../context/UIContext';
import { useLanguage } from '../context/LanguageContext';
import { useSyncFinancialEntries } from '../hooks/useSyncData';

type BoardSection = 'display' | 'habits' | 'journal' | 'finances' | 'goals' | 'mapas' | 'biography' | 'feedback' | 'guides' | 'achievements';

function BoardPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, tString } = useLanguage();
  const { habits, addHabit, deleteHabit, toggleCheck, updateHabit, reorderHabits } = useHabits();
  const { getAllDates } = useJournal();
  const {
    formatMonthKey,
    formatDateKey,
    getDailyExpenses,
    addDailyExpense,
    removeDailyExpense,
    getReserveMovements,
    addReserveMovement,
    removeReserveMovement,
    getDesiredMonthlyExpense,
    saveDesiredMonthlyExpense,
    getResetDate,
    saveResetDate,
    getInitialReserve,
    saveInitialReserve,
    calculateMonthlyData,
    getCurrentReserve,
    getBudget,
    getAccountMoney,
    saveAccountMoney,
    getAccountMoneyInitialByDate,
    getSalary,
    saveSalary,
    getExpensesByGoalId,
    calculateDailyExpensesOnly,
    calculateDailyTotal,
    getCycleDates,
  } = useExpenses();
  const {
    getAllPossessions,
    addPossession,
    updatePossession,
    deletePossession,
    updateAllProgressFromAccountMoney,
  } = usePossessions();
  const {
    getLeisureSkills,
    getPersonalSkills,
    toggleAction,
    resetSkill,
    removeLeisureSkill,
    removePersonalSkill,
  } = useTree();
  
  const [days, setDays] = useState<string[]>([]);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [editingHabit, setEditingHabit] = useState<{ id: number; currentName: string } | null>(null);
  const [editingHabitName, setEditingHabitName] = useState('');

  // Sincronizar selectedHabit com habits quando há mudanças
  useEffect(() => {
    if (selectedHabit) {
      const updatedHabit = habits.find((h) => h.id === selectedHabit.id);
      if (updatedHabit) {
        setSelectedHabit(updatedHabit);
      }
    }
  }, [habits, selectedHabit?.id]);
  const [possessions, setPossessions] = useState<AssetGoal[]>([]);
  const [leisureSkills, setLeisureSkills] = useState<TreeSkill[]>([]);
  const [personalSkills, setPersonalSkills] = useState<TreeSkill[]>([]);
  const [monthlyData, setMonthlyData] = useState<any>(null);
  const [availableMoney, setAvailableMoney] = useState(0);
  const [reserve, setReserve] = useState(0);
  
  // Expenses states
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [dailyItems, setDailyItems] = useState<DailyExpenseItem[]>([]);
  const [reserveItems, setReserveItems] = useState<ReserveMovement[]>([]);
  const [monthlyReserveItems, setMonthlyReserveItems] = useState<ReserveMovement[]>([]);
  const [monthlyRows, setMonthlyRows] = useState<any[]>([]);
  const [selectedReserveMonth, setSelectedReserveMonth] = useState(new Date());
  const [initialReserve, setInitialReserve] = useState<number>(0);
  const [salary, setSalary] = useState<number | null>(null);
  const [desiredMonthlyExpense, setDesiredMonthlyExpense] = useState<number | ''>('');
  const [resetDate, setResetDate] = useState<number | ''>('');
  const [accountMoney, setAccountMoney] = useState<string>('');
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isAddReserveModalOpen, setIsAddReserveModalOpen] = useState(false);
  const [isCSVImporterOpen, setIsCSVImporterOpen] = useState(false);
  const [isEditAccountMoneyModalOpen, setIsEditAccountMoneyModalOpen] = useState(false);
  const [showExpenseTypeMenu, setShowExpenseTypeMenu] = useState(false);
  const [isAddFinancialEntryModalOpen, setIsAddFinancialEntryModalOpen] = useState(false);
  const [editingFinancialEntry, setEditingFinancialEntry] = useState<FinancialEntry | undefined>(undefined);
  const [showFinanceDateCalendar, setShowFinanceDateCalendar] = useState(false);
  const [financeDateCalendarMonth, setFinanceDateCalendarMonth] = useState(new Date());
  const { 
    addEntry: addFinancialEntry, 
    getEntriesForDate, 
    getRecurringEntriesForMonth, 
    removeEntry: removeFinancialEntry,
    getActiveRecurringEntries,
    endRecurrence,
    getCategoryAnalysis,
    updateEntry: updateFinancialEntry,
  } = useFinancialEntries();
  
  // Sincronizar financial entries com Supabase
  useSyncFinancialEntries();
  
  const [editingAccountMoneyDate, setEditingAccountMoneyDate] = useState<Date | null>(null);
  const [editingAccountMoneyValue, setEditingAccountMoneyValue] = useState<number>(0);
  const [activeFinanceTab, setActiveFinanceTab] = useState<'daily' | 'monthly' | 'reserve' | 'analysis'>('daily');
  const [isEditingMonthlyLimit, setIsEditingMonthlyLimit] = useState(false);
  const [recurringEntriesUpdateKey, setRecurringEntriesUpdateKey] = useState(0);
  // Modais de Finanças
  const [isIncomeConfigModalOpen, setIsIncomeConfigModalOpen] = useState(false);
  const [isExpensePlanningModalOpen, setIsExpensePlanningModalOpen] = useState(false);
  
  // Possessions states
  const [selectedPossession, setSelectedPossession] = useState<AssetGoal | null>(null);
  const [selectedExpenses, setSelectedExpenses] = useState<DailyExpenseItem[]>([]);
  const [isCreatePossessionModalOpen, setIsCreatePossessionModalOpen] = useState(false);
  const [isDetailsPossessionModalOpen, setIsDetailsPossessionModalOpen] = useState(false);
  const [isEditPossessionModalOpen, setIsEditPossessionModalOpen] = useState(false);
  // Ordenação de objetivos (permite múltiplas ordenações)
  const [sortCriteria, setSortCriteria] = useState<Array<{by: 'value' | 'status' | 'date', order: 'asc' | 'desc'}>>([]);
  
  // Tree states
  const [selectedSkill, setSelectedSkill] = useState<TreeSkill | null>(null);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [expandedGoalId, setExpandedGoalId] = useState<number | null>(null);
  const { showConfirmation } = useConfirmation();
  
  // Biography states - Nova estrutura
  const { addEvent, updateEvent, removeEvent } = useTimeline();
  const { addDossier, updateDossier, removeDossier, getAllDossiers, togglePin } = useDossiers();
  const { addItem, updateItem, removeItem } = useAboutItems();
  const { addAttribute, updateAttribute, removeAttribute } = useAttributes();
  
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [editingTimelineEvent, setEditingTimelineEvent] = useState<TimelineEvent | undefined>(undefined);
  
  const [isDossierModalOpen, setIsDossierModalOpen] = useState(false);
  const [editingDossier, setEditingDossier] = useState<Dossier | undefined>(undefined);
  const [openDossierId, setOpenDossierId] = useState<string | null>(null);
  
  const [isAboutItemModalOpen, setIsAboutItemModalOpen] = useState(false);
  const [editingAboutItem, setEditingAboutItem] = useState<import('../hooks/useAboutItems').AboutItem | undefined>(undefined);
  const [selectedAboutCategory, setSelectedAboutCategory] = useState<AboutItemCategory>('books');
  
  // Atributos
  const [isAttributeModalOpen, setIsAttributeModalOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<Attribute | undefined>(undefined);
  
  const [activeBiographyTab, setActiveBiographyTab] = useState<'timeline' | 'dossies' | 'about'>('about');
  
  // Legacy biography (manter para compatibilidade)
  const { getEntriesByYear, getAllEntries, addEntry, updateEntry, removeEntry } = useBiography();
  const [isBiographyModalOpen, setIsBiographyModalOpen] = useState(false);
  const [editingBiographyEntry, setEditingBiographyEntry] = useState<BiographyEntry | undefined>(undefined);
  
  // Seção ativa no board (controlada pela barra superior)
  const [activeBoardSection, setActiveBoardSection] = useState<BoardSection>('display');
  const { viewMode } = useUI();
  const prevViewModeRef = useRef(viewMode);
  
  // Scroll para o topo quando muda de modo contínuo para focado
  useEffect(() => {
    if (prevViewModeRef.current === 'continuous' && viewMode === 'focused') {
      // Aguardar um pouco para garantir que o DOM foi atualizado
      setTimeout(() => {
        // Scrollar para o topo absoluto, sem offset
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }, 100);
    }
    prevViewModeRef.current = viewMode;
  }, [viewMode]);
  
  // Prevenir scroll negativo que aumenta a distância (apenas mobile)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleScroll = () => {
      // Se tentar scrollar para cima além do topo, resetar para 0
      if (window.scrollY < 0) {
        window.scrollTo(0, 0);
      }
    };
    
    // Apenas no mobile
    if (window.innerWidth < 768) {
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);
  
  // Detectar seção ativa baseado no hash
  useEffect(() => {
    const updateSection = () => {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash.replace('#', '');
        const validSections: BoardSection[] = ['display', 'journal', 'habits', 'finances', 'goals', 'mapas', 'guides', 'biography', 'achievements', 'feedback'];
        if (hash && validSections.includes(hash as BoardSection)) {
          setActiveBoardSection(hash === 'map' ? 'mapas' : (hash as BoardSection));
        } else {
          setActiveBoardSection('display');
        }
      }
    };
    
    updateSection();
    
    // Escutar mudanças no hash
    window.addEventListener('hashchange', updateSection);
    
    // Escutar evento customizado de mudança de seção
    const handleSectionChange = (e: CustomEvent) => {
      const section = e.detail.section as BoardSection;
      if (['display', 'habits', 'journal', 'finances', 'goals', 'mapas', 'biography', 'feedback', 'guides', 'achievements'].includes(section)) {
        setActiveBoardSection(section);
      }
    };

    // Escutar evento para mudar aba da biografia
    const handleSetBiographyTab = (e: CustomEvent) => {
      const tab = e.detail.tab as 'timeline' | 'dossies' | 'about';
      if (['timeline', 'dossies', 'about'].includes(tab)) {
        setActiveBiographyTab(tab);
      }
    };
    window.addEventListener('boardSectionChange', handleSectionChange as EventListener);
    window.addEventListener('setBiographyTab', handleSetBiographyTab as EventListener);
    
    return () => {
      window.removeEventListener('hashchange', updateSection);
      window.removeEventListener('boardSectionChange', handleSectionChange as EventListener);
      window.removeEventListener('setBiographyTab', handleSetBiographyTab as EventListener);
    };
  }, []);
  
  // Modules states
  const { isModuleActive } = useUserModules();
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);

  // Listener para abrir modal de personalização
  useEffect(() => {
    const handleOpenCustomizeModal = () => {
      setIsCustomizeModalOpen(true);
    };
    window.addEventListener('openCustomizeModal', handleOpenCustomizeModal);
    return () => {
      window.removeEventListener('openCustomizeModal', handleOpenCustomizeModal);
    };
  }, []);

  // Abrir modal de biography quando query parameter estiver presente
  useEffect(() => {
    const openBiographyModal = searchParams.get('openBiographyModal');
    if (openBiographyModal === 'true') {
      setEditingBiographyEntry(undefined);
      setIsBiographyModalOpen(true);
      // Remover query parameter da URL
      router.replace('/board#biography');
    }
  }, [searchParams, router]);

  // Handler para abrir modal de personalização
  const handleOpenCustomize = () => {
    setIsCustomizeModalOpen(true);
  };

  // Atualizar os 7 dias
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
  }, []);

  // Scroll automático removido - não mover a tela ao abrir seção

  // Carregar dados
  useEffect(() => {
    setPossessions(getAllPossessions());
    setLeisureSkills(getLeisureSkills());
    setPersonalSkills(getPersonalSkills());
    
    // Atualizar progresso dos objetivos
    const today = new Date();
    const todayKey = formatDateKey(today);
    const accountMoney = getAccountMoney(todayKey);
    const reserve = getCurrentReserve();
    updateAllProgressFromAccountMoney(accountMoney, reserve);
    setTimeout(() => {
      setPossessions(getAllPossessions());
    }, 100);
  }, [getAllPossessions, getLeisureSkills, getPersonalSkills, formatDateKey, getAccountMoney, getCurrentReserve, updateAllProgressFromAccountMoney]);

  // Calcular dados mensais e diários
  useEffect(() => {
    const monthKey = formatMonthKey(selectedMonth);
    const desired = getDesiredMonthlyExpense(monthKey);
    const reset = getResetDate(monthKey);
    
    // Resetar estado de edição quando mês mudar
    setIsEditingMonthlyLimit(false);
    
    // Usar requestIdleCallback para cálculos pesados (se disponível)
    const calculateRows = () => {
    // CORREÇÃO: getMonth() retorna 0-11, não precisa somar 1
    const rows = calculateMonthlyData(selectedMonth.getFullYear(), selectedMonth.getMonth(), desired, reset, getEntriesForDate);
    setMonthlyRows(rows);
    
      setInitialReserve(getInitialReserve(monthKey));
      const monthSalary = getSalary(monthKey);
      setSalary(monthSalary);
      setDesiredMonthlyExpense(desired || '');
      setResetDate(reset || '');
      
      // Carregar accountMoney do dia 1 do mês selecionado para exibir no input
      // O input mostra o valor do dia 1, que é onde salvamos quando o usuário edita
      const day1Key = formatDateKey(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1));
      const day1Initial = getAccountMoneyInitialByDate(day1Key);
      
      if (day1Initial !== null) {
        // Se há valor inicial salvo no dia 1, mostrar o valor calculado (inicial + gastos do dia 1)
        const day1AccountMoney = getAccountMoney(day1Key);
        setAccountMoney(day1AccountMoney.toString());
      } else {
        // Se não há valor inicial, calcular o saldo do dia 1 usando getAccountMoney
        const day1AccountMoney = getAccountMoney(day1Key);
        setAccountMoney(day1AccountMoney.toString());
      }
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      requestIdleCallback(calculateRows, { timeout: 1000 });
    } else {
      // Fallback para navegadores sem requestIdleCallback
      setTimeout(calculateRows, 0);
    }
  }, [selectedMonth, formatMonthKey, getDesiredMonthlyExpense, getResetDate, calculateMonthlyData, saveInitialReserve, getInitialReserve, getSalary]);

  // Carregar dados do dia selecionado
  useEffect(() => {
    const dateKey = formatDateKey(selectedDate);
    const items = getDailyExpenses(dateKey);
    const rItems = getReserveMovements(dateKey);
    setDailyItems(items);
    setReserveItems(rItems);
    // Buscar valor inicial do dia 1 do mês selecionado (versão simplificada, igual ao modo pixel art)
    const day1Key = formatDateKey(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1));
    const day1Initial = getAccountMoneyInitialByDate(day1Key);
    const accountMoneyValue = day1Initial !== null ? day1Initial : getAccountMoney(day1Key);
    // Só atualizar o estado se ele ainda não foi editado pelo usuário
    setAccountMoney(prev => {
      if (prev === '' || prev === null || prev === undefined) {
        // Sempre mostrar o valor calculado, mesmo se for 0 (pode ser um saldo válido)
        return accountMoneyValue.toString();
      }
      return prev;
    });
    
    const budget = getBudget(dateKey);
    setAvailableMoney(budget);
    setReserve(getCurrentReserve());
    
    // Recarregar monthlyRows quando dailyItems ou reserveItems mudarem (atualização automática)
    const desired = getDesiredMonthlyExpense(formatMonthKey(selectedMonth));
    const reset = getResetDate(formatMonthKey(selectedMonth));
    const rows = calculateMonthlyData(selectedMonth.getFullYear(), selectedMonth.getMonth(), desired, reset, getEntriesForDate);
    setMonthlyRows(rows);
  }, [selectedDate, formatDateKey, getDailyExpenses, getReserveMovements, getAccountMoney, getBudget, getCurrentReserve, selectedMonth, formatMonthKey, getDesiredMonthlyExpense, getResetDate, calculateMonthlyData, dailyItems, reserveItems]);

  // Listener para atualizar monthlyRows quando o dinheiro em conta mudar
  useEffect(() => {
    const handleStorageChange = () => {
      const monthKey = formatMonthKey(selectedMonth);
      const desired = getDesiredMonthlyExpense(monthKey) || 0;
      const reset = getResetDate(monthKey) || 1;
      const rows = calculateMonthlyData(selectedMonth.getFullYear(), selectedMonth.getMonth(), desired, reset, getEntriesForDate);
      setMonthlyRows(rows);
      
      // Atualizar progresso dos objetivos baseado no dinheiro em conta atualizado
      const today = new Date();
      const todayKey = formatDateKey(today);
      const accountMoney = getAccountMoney(todayKey);
      const reserve = getCurrentReserve();
      updateAllProgressFromAccountMoney(accountMoney, reserve);
      setTimeout(() => {
        setPossessions(getAllPossessions());
      }, 100);
    };

    const handleFinancialEntriesUpdate = () => {
      // Forçar atualização quando entradas financeiras mudarem
      setRecurringEntriesUpdateKey(prev => prev + 1);
      // Recarregar dados do dia atual
      const dateKey = formatDateKey(selectedDate);
      const items = getDailyExpenses(dateKey);
      setDailyItems(items);
      // Recarregar dados mensais
      const monthKey = formatMonthKey(selectedMonth);
      const desired = getDesiredMonthlyExpense(monthKey) || 0;
      const reset = getResetDate(monthKey) || 1;
      const rows = calculateMonthlyData(selectedMonth.getFullYear(), selectedMonth.getMonth(), desired, reset, getEntriesForDate);
      setMonthlyRows(rows);
    };

    window.addEventListener('pixel-life-storage-change', handleStorageChange);
    window.addEventListener('financial-entries-updated', handleFinancialEntriesUpdate);
    
    return () => {
      window.removeEventListener('pixel-life-storage-change', handleStorageChange);
      window.removeEventListener('financial-entries-updated', handleFinancialEntriesUpdate);
    };
  }, [selectedMonth, selectedDate, formatMonthKey, formatDateKey, getDesiredMonthlyExpense, getResetDate, calculateMonthlyData, getEntriesForDate, getDailyExpenses, getAccountMoney, getCurrentReserve, updateAllProgressFromAccountMoney, getAllPossessions]);


  // Carregar todas as movimentações de reserva do mês
  useEffect(() => {
    const loadMonthlyReserveItems = () => {
    const year = selectedReserveMonth.getFullYear();
    const month = selectedReserveMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const allReserveItems: ReserveMovement[] = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = formatDateKey(date);
      const dayItems = getReserveMovements(dateKey);
      allReserveItems.push(...dayItems);
    }
    
    // Ordenar por data (mais recente primeiro)
    allReserveItems.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
    
    setMonthlyReserveItems(allReserveItems);
    };

    loadMonthlyReserveItems();

    // Listener para mudanças no localStorage (atualiza quando reserveItems mudam)
    const handleStorageChange = () => {
      loadMonthlyReserveItems();
    };

    window.addEventListener('pixel-life-storage-change', handleStorageChange);
    const interval = setInterval(loadMonthlyReserveItems, 1000);

    return () => {
      window.removeEventListener('pixel-life-storage-change', handleStorageChange);
      clearInterval(interval);
    };
    }, [selectedReserveMonth, formatDateKey, getReserveMovements, reserveItems]);

  const formatDateShort = (dateStr: string) => {
    return dateStr.substring(5).replace('-', '-');
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
      const dateStr = d.toISOString().substring(0, 10);
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

  const formatMonthYear = (date: Date): string => {
    const months = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];
    return `${months[date.getMonth()]} de ${date.getFullYear()}`;
  };

  const [newHabitName, setNewHabitName] = useState('');
  const [isAddingHabit, setIsAddingHabit] = useState(false);

  const handleAddHabit = () => {
    if (newHabitName.trim()) {
      const trimmedName = newHabitName.trim().substring(0, 32); // Limitar a 32 caracteres
      if (trimmedName) {
        addHabit(trimmedName);
      setNewHabitName('');
      setIsAddingHabit(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddHabit();
    }
  };

  const handleRenameHabit = (habitId: number, currentName: string) => {
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

  const handleDeleteHabit = (habitId: number, habitName: string) => {
    showConfirmation({
      message: `Tem certeza que deseja excluir o hábito "${habitName}"?`,
      onConfirm: () => {
    deleteHabit(habitId);
    if (selectedHabit && selectedHabit.id === habitId) {
      setSelectedHabit(null);
    }
      },
    });
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
    
    // Retornar apenas as semanas completas do mês (sem dias do próximo mês)
    return [...prevMonthDays, ...currentMonthDays];
  };

  const handlePossessionClick = (possession: AssetGoal) => {
    const expenses = getExpensesByGoalId(possession.id);
    setSelectedPossession(possession);
    setSelectedExpenses(expenses);
    setIsDetailsPossessionModalOpen(true);
  };

  const handleSkillClick = (skill: TreeSkill) => {
    setSelectedSkill(skill);
    setIsSkillModalOpen(true);
  };

  const handleToggleAction = (skillId: string, actionId: string) => {
    const skill = [...leisureSkills, ...personalSkills].find((s) => s.id === skillId);
    if (!skill) return;
    toggleAction(skillId, actionId, skill.type);
    setLeisureSkills(getLeisureSkills());
    setPersonalSkills(getPersonalSkills());
    if (selectedSkill && selectedSkill.id === skillId) {
      const updated = [...getLeisureSkills(), ...getPersonalSkills()].find((s) => s.id === skillId);
      if (updated) setSelectedSkill(updated);
    }
  };

  const handleResetSkill = (skillId: string) => {
    const skill = [...leisureSkills, ...personalSkills].find((s) => s.id === skillId);
    if (!skill) return;
    resetSkill(skillId, skill.type);
    setLeisureSkills(getLeisureSkills());
    setPersonalSkills(getPersonalSkills());
  };

  const handleDeleteSkill = (skillId: string) => {
    const skill = [...leisureSkills, ...personalSkills].find((s) => s.id === skillId);
    if (!skill) return;
    if (skill.type === "leisure") {
      removeLeisureSkill(skillId);
    } else {
      removePersonalSkill(skillId);
    }
    setLeisureSkills(getLeisureSkills());
    setPersonalSkills(getPersonalSkills());
    if (selectedSkill && selectedSkill.id === skillId) {
      setIsSkillModalOpen(false);
      setSelectedSkill(null);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      <PixelMenu onCustomizeClick={handleOpenCustomize} />
      
      <div className="w-full py-6 md:py-12 md:pt-4 board-main-container" style={{ paddingTop: viewMode === 'continuous' ? 'calc(max(env(safe-area-inset-top, 0px), 44px) + 50px - 20px)' : 'calc(max(env(safe-area-inset-top, 0px), 44px) + 50px - 15px)', paddingLeft: 'max(env(safe-area-inset-left), 16px)', paddingRight: 'max(env(safe-area-inset-right), 16px)' }}>
        <div className="max-w-6xl mx-auto w-full">
          {viewMode === 'focused' ? (
            <>
              {/* Modo Focado: Display sempre visível (exceto quando feedback ou guides estão ativos) */}
              {activeBoardSection !== 'feedback' && activeBoardSection !== 'guides' && (
                <section id="display" className="mb-8" style={{ scrollMarginTop: '10px' }}>
                  <div className="section-box">
                    <h1 className="font-pixel-bold mb-2 mobile-hide-title" style={{ color: '#333', fontSize: '24px' }}>
                      {t('sections.display')}
                    </h1>
                    <ProfileSection />
                  </div>
                </section>
              )}

              {/* Semi barra abaixo do Display no modo focado - sempre visível (exceto quando feedback ou guides estão ativos) */}
              {activeBoardSection !== 'feedback' && activeBoardSection !== 'guides' && (() => {
                // Helper function para evitar type narrowing
                const getButtonClass = (targetSection: BoardSection) => {
                  return activeBoardSection === targetSection ? 'bg-white border-2 border-black' : 'bg-transparent border border-transparent';
                };
                
                // Helper function para toggle: se já está ativo, volta para display
                const handleSectionClick = (section: BoardSection) => {
                  if (activeBoardSection === section) {
                    setActiveBoardSection('display');
                  } else {
                    setActiveBoardSection(section);
                  }
                };
                
                return (
              <div className="flex items-center gap-1 justify-center overflow-x-auto mb-8 py-4 semi-bar-below-display" style={{ borderTop: '1px solid #e0e0e0', borderBottom: '1px solid #e0e0e0' }}>
                {/* 1. Diário */}
                <button
                  onClick={() => handleSectionClick('journal')}
                  className={`flex flex-col items-center justify-center p-2 rounded-md transition-colors touch-manipulation min-h-[60px] min-w-[80px] ${getButtonClass('journal')}`}
                >
                  <div className="w-6 h-6 bg-black border-2 border-black relative" style={{ imageRendering: 'pixelated' }}>
                    <div className="absolute top-1 left-1 w-4 h-3 bg-white border border-black"></div>
                    <div className="absolute top-1.5 left-1.5 w-3 h-0.5 bg-black"></div>
                    <div className="absolute top-2 left-1.5 w-2.5 h-0.5 bg-black"></div>
                    <div className="absolute top-2.5 left-1.5 w-3 h-0.5 bg-black"></div>
                  </div>
                  <span className="font-pixel mt-1" style={{ fontSize: '13px' }}>{t('sections.journal')}</span>
                </button>
                {/* 2. Hábitos */}
                <button
                  onClick={() => handleSectionClick('habits')}
                  className={`flex flex-col items-center justify-center p-2 rounded-md transition-colors touch-manipulation min-h-[60px] min-w-[80px] ${getButtonClass('habits')}`}
                >
                  <div className="w-6 h-6 bg-black border-2 border-black relative" style={{ imageRendering: 'pixelated' }}>
                    <div className="absolute top-1 left-1.5 w-3 h-0.5 bg-white"></div>
                    <div className="absolute top-2.5 left-1.5 w-3 h-0.5 bg-white"></div>
                    <div className="absolute top-4 left-1.5 w-3 h-0.5 bg-white"></div>
                    <div className="absolute top-1 right-0.5 w-0.5 h-0.5 bg-white"></div>
                  </div>
                  <span className="font-pixel mt-1" style={{ fontSize: '13px' }}>{t('sections.habits')}</span>
                </button>
                {/* 3. Biografia */}
                <button
                  onClick={() => handleSectionClick('biography')}
                  className={`flex flex-col items-center justify-center p-2 rounded-md transition-colors touch-manipulation min-h-[60px] min-w-[80px] ${getButtonClass('biography')}`}
                >
                  <div className="w-6 h-6 bg-black border-2 border-black relative" style={{ imageRendering: 'pixelated' }}>
                    <div className="absolute top-1 left-1 w-4 h-3 bg-white border border-black"></div>
                    <div className="absolute top-1.5 left-1.5 w-3 h-0.5 bg-black"></div>
                    <div className="absolute top-2 left-1.5 w-2.5 h-0.5 bg-black"></div>
                    <div className="absolute top-2.5 left-1.5 w-3 h-0.5 bg-black"></div>
                    <div className="absolute top-1 right-1 w-1 h-3 bg-white border-l border-black"></div>
                  </div>
                  <span className="font-pixel mt-1" style={{ fontSize: '13px' }}>{t('sections.biography')}</span>
                </button>
                {/* 4. Mapas */}
                <button
                  onClick={() => handleSectionClick('mapas')}
                  className={`flex flex-col items-center justify-center p-2 rounded-md transition-colors touch-manipulation min-h-[60px] min-w-[80px] ${getButtonClass('mapas')}`}
                >
                  <div className="w-6 h-6 bg-black border-2 border-black relative" style={{ imageRendering: 'pixelated' }}>
                    <div className="absolute top-1 left-1 w-4 h-4 bg-white border border-black rounded-full"></div>
                    <div className="absolute top-2 left-1.5 w-3 h-0.5 bg-black"></div>
                    <div className="absolute top-3 left-1.5 w-3 h-0.5 bg-black"></div>
                    <div className="absolute top-2.5 left-2.5 w-0.5 h-0.5 bg-black"></div>
                  </div>
                  <span className="font-pixel mt-1" style={{ fontSize: '13px' }}>{t('sections.mapas')}</span>
                </button>
                {/* 5. Finanças */}
                <button
                  onClick={() => handleSectionClick('finances')}
                  className={`flex flex-col items-center justify-center p-2 rounded-md transition-colors touch-manipulation min-h-[60px] min-w-[80px] ${getButtonClass('finances')}`}
                >
                  <div className="w-6 h-6 bg-black border-2 border-black relative" style={{ imageRendering: 'pixelated' }}>
                    <div className="absolute top-1 left-1 w-4 h-3 bg-white border border-black"></div>
                    <div className="absolute top-1.5 left-1.5 w-3 h-0.5 bg-black"></div>
                    <div className="absolute top-2 left-1.5 w-2.5 h-0.5 bg-black"></div>
                    <div className="absolute top-2.5 left-1.5 w-3 h-0.5 bg-black"></div>
                  </div>
                  <span className="font-pixel mt-1" style={{ fontSize: '13px' }}>{t('sections.finances')}</span>
                </button>
                {/* 6. Objetivos */}
                <button
                  onClick={() => handleSectionClick('goals')}
                  className={`flex flex-col items-center justify-center p-2 rounded-md transition-colors touch-manipulation min-h-[60px] min-w-[80px] ${getButtonClass('goals')}`}
                >
                  <div className="w-6 h-6 bg-black border-2 border-black relative" style={{ imageRendering: 'pixelated' }}>
                    <div className="absolute top-1 left-1 w-4 h-3 bg-white border border-black"></div>
                    <div className="absolute top-1.5 left-1.5 w-3 h-0.5 bg-black"></div>
                    <div className="absolute top-2 left-1.5 w-2.5 h-0.5 bg-black"></div>
                    <div className="absolute top-2.5 left-1.5 w-3 h-0.5 bg-black"></div>
                    <div className="absolute top-1 right-1 w-1 h-3 bg-white border-l border-black"></div>
                  </div>
                  <span className="font-pixel mt-1" style={{ fontSize: '13px' }}>{t('sections.goals')}</span>
                </button>
              </div>
                );
              })()}

              {/* Seção X (dinâmica baseada em activeBoardSection) - abaixo da semi barra */}
              {activeBoardSection === 'habits' && isModuleActive('habits') && (
                <section id="habits" className="scroll-mt-8 mb-8">
                  <div className="section-box">
                    <h1 className="font-pixel-bold mb-2" style={{ color: '#333', fontSize: '24px' }}>
                      {t('sections.habits')}
                    </h1>
                    {/* Conteúdo de hábitos - copiar do modo contínuo */}
                    <div className="mb-4 rounded-md overflow-hidden" style={{ border: '1px solid #e0e0e0' }}>
                      <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                        <div className="grid grid-cols-[171px_repeat(7,0.729fr)] min-w-[600px] bg-[#e8e8e8] border-b border-[#e0e0e0]">
                          <div className="p-2 font-pixel font-pixel-bold border-r border-[#e0e0e0] flex items-center justify-center" style={{ color: '#333', fontSize: '16px' }}>
                            {t('sections.habits')}
                          </div>
                          {days.map((d) => (
                            <div key={d} className="text-center p-2 font-pixel font-pixel-bold border-r border-[#e0e0e0] last:border-r-0" style={{ color: '#333', fontSize: '16px' }}>
                              {formatDateShort(d)}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {habits.length === 0 ? (
                          <div className="p-4 text-center font-pixel" style={{ color: '#999', fontSize: '16px' }}>
                            Nenhum hábito ainda.
                          </div>
                        ) : (
                          <div>
                            {habits.map((habit) => (
                              <div
                                key={habit.id}
                                className="grid grid-cols-[171px_repeat(7,0.729fr)] min-w-[600px] border-b border-[#e0e0e0] last:border-b-0 hover:bg-white/50 transition-colors cursor-pointer"
                                onClick={() => setSelectedHabit(habit)}
                              >
                                <div className="p-2 font-pixel border-r border-[#e0e0e0] flex items-center" style={{ color: '#111', fontSize: '16px', gap: '8px' }}>
                                  <div 
                                    className="w-5 h-5 flex items-center justify-center rounded flex-shrink-0"
                                    style={{ 
                                      backgroundColor: '#FFFFFF',
                                      border: '1px solid #e0e0e0',
                                    }}
                                  >
                                    <span className="text-gray-400" style={{ fontSize: '16px' }}>+</span>
                                  </div>
                                  <span 
                                    className="flex-1 text-center block truncate"
                                    style={{ 
                                      maxWidth: '160px'
                                    }}
                                    title={habit.name}
                                  >
                                    {habit.name.length > 27 ? habit.name.substring(0, 27) + '...' : habit.name}
                                  </span>
                                </div>
                                {days.map((d) => (
                                  <div
                                    key={d}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleCheck(habit.id, d);
                                    }}
                                    className="flex items-center justify-center border-r border-[#e0e0e0] last:border-r-0 cursor-pointer p-2"
                                  >
                                    <img
                                      src={habit.checks[d] ? "/icon2.1.png" : "/icon2.2.png"}
                                      className="w-6 h-6 object-contain"
                                      style={{ imageRendering: 'pixelated' }}
                                      alt={habit.checks[d] ? "checked" : "unchecked"}
                                    />
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Input inline para adicionar hábito */}
                    <div className="flex gap-2 mt-4">
                      <div className="flex-1 relative" style={{ minWidth: '600px' }}>
                        <input
                          type="text"
                          value={newHabitName}
                          maxLength={32}
                          onChange={(e) => {
                            setNewHabitName(e.target.value);
                            if (e.target.value.trim()) {
                              setIsAddingHabit(true);
                            }
                          }}
                          onKeyPress={handleKeyPress}
                          onFocus={() => setIsAddingHabit(true)}
                          onBlur={() => {
                            if (!newHabitName.trim()) {
                              setIsAddingHabit(false);
                            }
                          }}
                          placeholder={`+ ${t('common.addHabit')}`}
                          className="w-full px-4 py-3 rounded-md font-pixel"
                          style={{
                            backgroundColor: '#9e9e9e',
                            border: '1px solid #9e9e9e',
                            color: '#FFFFFF',
                            fontSize: '16px',
                          }}
                        />
                      </div>
                      {isAddingHabit && newHabitName.trim() && (
                        <button
                          onClick={handleAddHabit}
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
                </section>
              )}
              {activeBoardSection === 'journal' && isModuleActive('journal') && (
                <section id="journal" className="scroll-mt-8 mb-8">
                  <div className="section-box">
                    <h1 className="font-pixel-bold mb-6" style={{ color: '#333', fontSize: '24px' }}>
                      {t('sections.journal')}
                    </h1>
                    <div className="max-w-5xl mx-auto">
                      <DailyOverview />
                    </div>
                  </div>
                </section>
              )}
              {activeBoardSection === 'finances' && isModuleActive('finances') && (
                <section id="finances" className="scroll-mt-8 mb-8">
                  <div className="section-box">
                    <h1 className="font-pixel-bold mb-6" style={{ color: '#333', fontSize: '24px' }}>
                      {t('sections.finances')}
                    </h1>
                    {/* Conteúdo de finanças - copiar do modo contínuo */}
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'thin' }}>
                      <button
                        onClick={() => setActiveFinanceTab('daily')}
                        className="px-4 py-2 font-pixel-bold transition-colors flex-shrink-0 touch-manipulation min-h-[44px]"
                        style={{
                          backgroundColor: activeFinanceTab === 'daily' ? '#FFFFFF' : '#f2f2f2',
                          border: activeFinanceTab === 'daily' ? '1px solid #e5e5e5' : '1px solid #e5e5e5',
                          color: activeFinanceTab === 'daily' ? '#111' : '#666',
                          fontSize: '16px',
                        }}
                      >
                        {t('finances.daily')}
                      </button>
                      <button
                        onClick={() => setActiveFinanceTab('monthly')}
                        className="px-4 py-2 font-pixel-bold transition-colors flex-shrink-0 touch-manipulation min-h-[44px]"
                        style={{
                          backgroundColor: activeFinanceTab === 'monthly' ? '#FFFFFF' : '#f2f2f2',
                          border: activeFinanceTab === 'monthly' ? '1px solid #e5e5e5' : '1px solid #e5e5e5',
                          color: activeFinanceTab === 'monthly' ? '#111' : '#666',
                          fontSize: '16px',
                        }}
                      >
                        {t('finances.monthly')}
                      </button>
                      <button
                        onClick={() => setActiveFinanceTab('reserve')}
                        className="px-4 py-2 font-pixel-bold transition-colors flex-shrink-0 touch-manipulation min-h-[44px]"
                        style={{
                          backgroundColor: activeFinanceTab === 'reserve' ? '#FFFFFF' : '#f2f2f2',
                          border: activeFinanceTab === 'reserve' ? '1px solid #e5e5e5' : '1px solid #e5e5e5',
                          color: activeFinanceTab === 'reserve' ? '#111' : '#666',
                          fontSize: '16px',
                        }}
                      >
                        {t('finances.reserve')}
                      </button>
                      <button
                        onClick={() => setActiveFinanceTab('analysis')}
                        className="px-4 py-2 font-pixel-bold transition-colors flex-shrink-0 touch-manipulation min-h-[44px]"
                        style={{
                          backgroundColor: activeFinanceTab === 'analysis' ? '#FFFFFF' : '#f2f2f2',
                          border: activeFinanceTab === 'analysis' ? '1px solid #e5e5e5' : '1px solid #e5e5e5',
                          color: activeFinanceTab === 'analysis' ? '#111' : '#666',
                          fontSize: '16px',
                        }}
                      >
                        Análise
                      </button>
                    </div>
                    {/* Conteúdo das abas - copiado do modo contínuo */}
                    {activeFinanceTab === 'daily' && (
                      <div>
                        {/* Data selecionada com setas de navegação */}
                        <div className="mb-4">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <button
                              onClick={() => {
                                const prevDate = new Date(selectedDate);
                                prevDate.setDate(prevDate.getDate() - 1);
                                setSelectedDate(prevDate);
                              }}
                              className="px-3 py-2 rounded font-pixel transition-all hover:opacity-90"
                              style={{
                                backgroundColor: '#9e9e9e',
                                border: '1px solid #9e9e9e',
                                color: '#FFFFFF',
                                fontSize: '16px',
                                width: '40px',
                                height: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              ←
                            </button>
                            <button
                              onClick={() => {
                                setFinanceDateCalendarMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
                                setShowFinanceDateCalendar(true);
                              }}
                              className="px-3 py-2 rounded font-pixel transition-all hover:opacity-90"
                              style={{ 
                                backgroundColor: '#FFFFFF', 
                                fontSize: '16px', 
                                border: '1px solid #e5e5e5',
                                cursor: 'pointer',
                                maxWidth: '200px',
                              }}
                            >
                              {formatDateKey(selectedDate)}
                            </button>
                            <button
                              onClick={() => {
                                const nextDate = new Date(selectedDate);
                                nextDate.setDate(nextDate.getDate() + 1);
                                setSelectedDate(nextDate);
                              }}
                              className="px-3 py-2 rounded font-pixel transition-all hover:opacity-90"
                              style={{
                                backgroundColor: '#9e9e9e',
                                border: '1px solid #9e9e9e',
                                color: '#FFFFFF',
                                fontSize: '16px',
                                width: '40px',
                                height: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              →
                            </button>
                          </div>
                          {/* Data por extenso */}
                          <p className="text-center font-pixel" style={{ color: '#666', fontSize: '14px' }}>
                            {(() => {
                              const days = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
                              const months = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
                              return `${days[selectedDate.getDay()]}, ${selectedDate.getDate()} de ${months[selectedDate.getMonth()]} de ${selectedDate.getFullYear()}`;
                            })()}
                          </p>
                        </div>

                        {/* Botão de adicionar - discreto */}
                        <div className="mb-4 flex justify-center">
                          <div className="relative" style={{ width: '80%' }}>
                          <button
                              onClick={() => setIsAddFinancialEntryModalOpen(true)}
                            className="w-full px-4 py-2 rounded font-pixel transition-all hover:opacity-90 tactile-button"
                            style={{
                              fontSize: '16px',
                              backgroundColor: '#9e9e9e',
                              border: '1px solid #9e9e9e',
                              color: '#FFFFFF',
                            }}
                          >
                            + {t('common.addEntry')}
                          </button>
                          </div>
                        </div>

                        {/* Lista de despesas do dia - cards discretos */}
                        <>
                        {(() => {
                          // Buscar entradas financeiras do novo sistema
                          const dateKey = formatDateKey(selectedDate);
                          const financialEntries = getEntriesForDate(dateKey);
                          
                          // Combinar gastos pontuais antigos (legado) e novas entradas financeiras
                          const allItems: Array<{
                            id: string;
                            description: string;
                            value: number;
                            category?: string;
                            relatedGoalId?: number;
                            frequency?: 'pontual' | 'recorrente';
                            installments?: { total: number; current: number };
                          }> = [];
                          
                          // Adicionar gastos pontuais antigos (legado)
                          dailyItems.forEach(item => {
                            allItems.push({
                              id: item.id,
                              description: item.description,
                              value: item.value,
                              category: item.category,
                              relatedGoalId: item.relatedGoalId,
                              frequency: 'pontual',
                            });
                          });
                          
                          // Adicionar entradas do novo sistema (pontuais e recorrentes)
                          financialEntries.forEach(entry => {
                            allItems.push({
                              id: entry.id,
                              description: entry.description,
                              value: entry.amount,
                              category: entry.category,
                              frequency: entry.frequency,
                              installments: entry.installments,
                            });
                          });
                          
                          return (
                        <div className="mb-4 space-y-3">
                              {allItems.length === 0 ? (
                            <div className="text-center py-8 px-4 rounded" style={{ backgroundColor: '#fafafa', border: '1px solid #e5e5e5' }}>
                              <p className="font-pixel" style={{ color: '#999', fontSize: '14px' }}>
                                {t('finances.noEntriesRegistered')}
                              </p>
                            </div>
                          ) : (
                                allItems.map((item) => (
                              <div
                                key={item.id}
                                    className="flex items-center justify-between py-2 px-3 rounded transition-all hover:bg-gray-50"
                                style={{ 
                                      backgroundColor: '#FFFFFF',
                                  cursor: 'pointer',
                                }}
                                    onDoubleClick={() => {
                                      // Editar entrada (double-click também funciona)
                                      const isLegacy = dailyItems.find(d => d.id === item.id);
                                      if (!isLegacy) {
                                        // Sistema novo: buscar e editar
                                        const entry = financialEntries.find(e => e.id === item.id);
                                        if (entry) {
                                          setEditingFinancialEntry(entry);
                                          setIsAddFinancialEntryModalOpen(true);
                                        }
                                      }
                                    }}
                                    onClick={(e) => {
                                      // Remover apenas com clique no botão X
                                      e.stopPropagation();
                                }}
                              >
                                <div className="flex items-center gap-2 flex-1">
                                      {item.frequency === 'recorrente' && (
                                        <span className="text-xs font-pixel" style={{ color: '#9ca3af' }}>↻</span>
                                      )}
                                      <span className="font-pixel" style={{ fontSize: '14px', color: '#666' }}>
                                    {item.value >= 0 ? '+' : '−'}
                                  </span>
                                      <span className="font-pixel" style={{ fontSize: '14px', color: '#111' }}>
                                      {item.description}
                                      </span>
                                  </div>
                                    <div className="flex items-center gap-2">
                                  <span 
                                        className="font-pixel" 
                                    style={{ 
                                      color: item.value >= 0 ? '#4caf50' : '#f44336', 
                                          fontSize: '14px' 
                                    }}
                                  >
                                    R$ {Math.abs(item.value).toFixed(2).replace('.', ',')}
                                  </span>
                                  <div className="flex items-center gap-1 ml-2">
                                    {/* Botão de Editar */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const isLegacy = dailyItems.find(d => d.id === item.id);
                                        if (!isLegacy) {
                                          // Sistema novo: buscar e editar
                                          const entry = financialEntries.find(e => e.id === item.id);
                                          if (entry) {
                                            setEditingFinancialEntry(entry);
                                            setIsAddFinancialEntryModalOpen(true);
                                          }
                                        }
                                      }}
                                      className="text-gray-500 hover:text-blue-600 transition-colors"
                                      style={{ fontSize: '12px', padding: '2px 6px' }}
                                      title="Editar"
                                    >
                                      ✏️
                                    </button>
                                    {/* Botão de Excluir */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const confirmMessage = item.frequency === 'recorrente' 
                                          ? `Encerrar recorrência "${item.description}"? (A entrada será removida apenas desta data)` 
                                          : `Remover "${item.description}"?`;
                                        if (confirm(confirmMessage)) {
                                          // Se for do sistema antigo, usar removeDailyExpense
                                          if (dailyItems.find(d => d.id === item.id)) {
                                            removeDailyExpense(formatDateKey(selectedDate), item.id);
                                            // Recarregar dados e recalcular monthlyRows após um pequeno delay
                                            setTimeout(() => {
                                              const dateKey = formatDateKey(selectedDate);
                                              const items = getDailyExpenses(dateKey);
                                              setDailyItems(items);
                                              const monthKey = formatMonthKey(selectedMonth);
                                              const desired = getDesiredMonthlyExpense(monthKey) || 0;
                                              const reset = getResetDate(monthKey) || 1;
                                              const rows = calculateMonthlyData(selectedMonth.getFullYear(), selectedMonth.getMonth(), desired, reset, getEntriesForDate);
                                              setMonthlyRows(rows);
                                              
                                              // Atualizar progresso dos objetivos baseado no dinheiro em conta atualizado
                                              const today = new Date();
                                              const todayKey = formatDateKey(today);
                                              const accountMoney = getAccountMoney(todayKey);
                                              const reserve = getCurrentReserve();
                                              updateAllProgressFromAccountMoney(accountMoney, reserve);
                                              setTimeout(() => {
                                                setPossessions(getAllPossessions());
                                              }, 100);
                                            }, 50);
                                          } else {
                                            // Se for do novo sistema
                                            const dateKey = formatDateKey(selectedDate);
                                            const financialEntries = getEntriesForDate(dateKey);
                                            const entryToRemove = financialEntries.find(e => e.id === item.id);
                                            
                                            if (entryToRemove && entryToRemove.frequency === 'recorrente') {
                                              // Se for recorrente, encerrar recorrência (definir endDate)
                                              endRecurrence(entryToRemove.id, dateKey);
                                              // Forçar atualização da lista de recorrentes
                                              setRecurringEntriesUpdateKey(prev => prev + 1);
                                            } else {
                                              // Se for pontual, remover completamente
                                              removeFinancialEntry(item.id);
                                            }
                                            // Recarregar dados após um delay maior para garantir que o localStorage foi atualizado
                                            setTimeout(() => {
                                              const items = getDailyExpenses(dateKey);
                                              setDailyItems(items);
                                              const monthKey = formatMonthKey(selectedMonth);
                                              const desired = getDesiredMonthlyExpense(monthKey) || 0;
                                              const reset = getResetDate(monthKey) || 1;
                                              const rows = calculateMonthlyData(selectedMonth.getFullYear(), selectedMonth.getMonth(), desired, reset, getEntriesForDate);
                                              setMonthlyRows(rows);
                                              
                                              // Atualizar progresso dos objetivos baseado no dinheiro em conta atualizado
                                              const today = new Date();
                                              const todayKey = formatDateKey(today);
                                              const accountMoney = getAccountMoney(todayKey);
                                              const reserve = getCurrentReserve();
                                              updateAllProgressFromAccountMoney(accountMoney, reserve);
                                              setTimeout(() => {
                                                setPossessions(getAllPossessions());
                                              }, 100);
                                            }, 200);
                                          }
                                        }
                                      }}
                                      className="text-gray-400 hover:text-red-600 transition-colors"
                                      style={{ fontSize: '16px', cursor: 'pointer', padding: '2px 6px' }}
                                      title="Excluir"
                                    >
                                      ×
                                    </button>
                                  </div>
                                    </div>
                              </div>
                            ))
                          )}
                        </div>
                          );
                        })()}

                        {/* Resumo do dia - card discreto */}
                        {(() => {
                          const dateKey = formatDateKey(selectedDate);
                          const financialEntries = getEntriesForDate(dateKey);
                          const allItemsForSummary = [
                            ...dailyItems,
                            ...financialEntries.map(e => ({ value: e.amount }))
                          ];
                          if (allItemsForSummary.length === 0) return null;
                          const totalGasto = allItemsForSummary.filter(item => item.value < 0).reduce((sum, item) => sum + Math.abs(item.value), 0);
                          const totalGanho = allItemsForSummary.filter(item => item.value > 0).reduce((sum, item) => sum + item.value, 0);
                          const totalLiquido = totalGanho - totalGasto;
                          
                          return (
                            <div className="mt-4 p-4 rounded" style={{ backgroundColor: '#FFFFFF', border: '1px solid #e5e5e5', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <div className="font-pixel text-xs mb-1" style={{ color: '#666' }}>Total Gasto</div>
                                  <div className="font-pixel-bold" style={{ color: '#f44336', fontSize: '16px' }}>
                                    R$ {totalGasto.toFixed(2).replace('.', ',')}
                                  </div>
                                </div>
                                <div>
                                  <div className="font-pixel text-xs mb-1" style={{ color: '#666' }}>Total Ganho</div>
                                  <div className="font-pixel-bold" style={{ color: '#4caf50', fontSize: '16px' }}>
                                    R$ {totalGanho.toFixed(2).replace('.', ',')}
                                  </div>
                                </div>
                                <div>
                                  <div className="font-pixel text-xs mb-1" style={{ color: '#666' }}>Total Líquido</div>
                                  <div className="font-pixel-bold" style={{ color: totalLiquido >= 0 ? '#4caf50' : '#f44336', fontSize: '16px' }}>
                                    {totalLiquido >= 0 ? '+' : ''}R$ {Math.abs(totalLiquido).toFixed(2).replace('.', ',')}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                        </>

                      </div>
                    )}

                    {activeFinanceTab === 'monthly' && (() => {
                      // Cálculos para o painel superior
                      const today = new Date();
                      const isCurrentMonth = selectedMonth.getMonth() === today.getMonth() && selectedMonth.getFullYear() === today.getFullYear();
                      const currentDay = isCurrentMonth ? today.getDate() : new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
                      const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
                      const daysRemaining = Math.max(0, daysInMonth - currentDay + 1);
                      
                      const totalSpent = monthlyRows.reduce((sum, row) => sum + (row.totalDaily < 0 ? Math.abs(row.totalDaily) : 0), 0);
                      const totalGained = monthlyRows.reduce((sum, row) => sum + (row.totalDaily > 0 ? row.totalDaily : 0), 0);
                      const monthlyLimit = (typeof desiredMonthlyExpense === 'number' ? desiredMonthlyExpense : (desiredMonthlyExpense === '' ? 0 : parseFloat(String(desiredMonthlyExpense)) || 0));
                      const availableNow = monthlyLimit - totalSpent;
                      const recommendedDaily = daysRemaining > 0 ? Math.max(0, availableNow / daysRemaining) : 0;
                      
                      // Status do mês
                      const spendingPercentage = monthlyLimit > 0 ? (totalSpent / monthlyLimit) * 100 : 0;
                      const statusText = spendingPercentage < 50 ? t('finances.statusBelowPace') : spendingPercentage < 80 ? t('finances.statusAttention') : t('finances.statusAboveLimit');
                      
                      return (
                      <div>
                        {/* SEÇÃO A — Cabeçalho do Mês */}
                        <div className="mb-4 p-4 rounded" style={{ backgroundColor: '#FFFFFF', border: '1px solid #e5e5e5', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="font-pixel-bold" style={{ color: '#111', fontSize: '20px' }}>
                              {formatMonthYear(selectedMonth)}
                            </h2>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1))}
                                className="px-3 py-1 rounded font-pixel transition-all hover:opacity-90"
                                style={{
                                  backgroundColor: '#fafafa',
                                  border: '1px solid #e5e5e5',
                                  color: '#111',
                                  fontSize: '16px',
                                }}
                              >
                                ←
                              </button>
                              <button
                                onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1))}
                                className="px-3 py-1 rounded font-pixel transition-all hover:opacity-90"
                                style={{
                                  backgroundColor: '#fafafa',
                                  border: '1px solid #e5e5e5',
                                  color: '#111',
                                  fontSize: '16px',
                                }}
                              >
                                →
                              </button>
                            </div>
                          </div>
                          
                          {/* 4 indicadores em cartões pequenos */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div className="p-3 rounded relative" style={{ backgroundColor: '#fafafa', border: '1px solid #e5e5e5' }}>
                              {/* Botão + no canto superior direito */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Abrir modal ou expandir card para edição
                                  const monthKey = formatMonthKey(selectedMonth);
                                  const currentLimit = getDesiredMonthlyExpense(monthKey) || 0;
                                  const currentReset = getResetDate(monthKey) || 1;
                                  setDesiredMonthlyExpense(currentLimit);
                                  setResetDate(currentReset);
                                  setIsEditingMonthlyLimit(true);
                                }}
                                className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded font-pixel-bold transition-all hover:opacity-90"
                                style={{
                                  backgroundColor: '#9e9e9e',
                                  border: '1px solid #9e9e9e',
                                  color: '#FFFFFF',
                                  fontSize: '16px',
                                }}
                                title={tString('common.edit')}
                              >
                                +
                              </button>
                              
                              {!isEditingMonthlyLimit ? (
                                <>
                                  <div className="font-pixel text-xs mb-1" style={{ color: '#666' }}>{t('finances.monthlyLimit')}</div>
                                  <div className="font-pixel-bold" style={{ color: '#111', fontSize: '16px' }}>
                                    R$ {monthlyLimit.toFixed(2).replace('.', ',')}
                                  </div>
                                  {resetDate && (
                                    <div className="font-pixel text-xs mt-1" style={{ color: '#999' }}>
                                      {t('finances.resetDay')}: {resetDate}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="space-y-2">
                                  <div>
                                    <label className="font-pixel text-xs block mb-1" style={{ color: '#666' }}>{t('finances.monthlyLimit')}</label>
                                    <input
                                      type="number"
                                      value={desiredMonthlyExpense === '' || desiredMonthlyExpense === null || desiredMonthlyExpense === undefined ? '' : desiredMonthlyExpense}
                                      placeholder="–"
                                      onChange={(e) => {
                                        const val = e.target.value === '' ? '' : parseFloat(e.target.value) || '';
                                        setDesiredMonthlyExpense(val);
                                      }}
                                      className="w-full px-2 py-1 rounded font-pixel"
                                      style={{
                                        backgroundColor: '#FFFFFF',
                                        border: '1px solid #e5e5e5',
                                        color: '#111',
                                        fontSize: '14px',
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                  <div>
                                    <label className="font-pixel text-xs block mb-1" style={{ color: '#666' }}>{t('finances.resetDay')}</label>
                                    <input
                                      type="number"
                                      value={resetDate === '' || resetDate === null || resetDate === undefined ? '' : resetDate}
                                      placeholder="–"
                                      onChange={(e) => {
                                        const val = e.target.value === '' ? '' : parseInt(e.target.value) || '';
                                        if (val === '' || (typeof val === 'number' && val >= 1 && val <= 31)) {
                                          setResetDate(val);
                                          if (typeof val === 'number' && val >= 1 && val <= 31) {
                                            const monthKey = formatMonthKey(selectedMonth);
                                            const desired = getDesiredMonthlyExpense(monthKey) || 0;
                                            const rows = calculateMonthlyData(selectedMonth.getFullYear(), selectedMonth.getMonth(), desired, val);
                                            setMonthlyRows(rows);
                                          }
                                        }
                                      }}
                                      min="1"
                                      max="31"
                                      className="w-full px-2 py-1 rounded font-pixel"
                                      style={{
                                        backgroundColor: '#FFFFFF',
                                        border: '1px solid #e5e5e5',
                                        color: '#111',
                                        fontSize: '14px',
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                          let limitVal: number;
                                          if (typeof desiredMonthlyExpense === 'number') {
                                            limitVal = desiredMonthlyExpense;
                                          } else if (desiredMonthlyExpense === '' || desiredMonthlyExpense === null || desiredMonthlyExpense === undefined) {
                                            limitVal = 0;
                                          } else {
                                            limitVal = parseFloat(String(desiredMonthlyExpense)) || 0;
                                          }
                                          
                                          let resetVal: number;
                                          if (typeof resetDate === 'number') {
                                            resetVal = resetDate;
                                          } else if (resetDate === '' || resetDate === null || resetDate === undefined) {
                                            resetVal = 1;
                                          } else {
                                            resetVal = parseInt(String(resetDate)) || 1;
                                          }
                                          
                                          if (resetVal >= 1 && resetVal <= 31) {
                                            const monthKey = formatMonthKey(selectedMonth);
                                            saveDesiredMonthlyExpense(monthKey, limitVal);
                                            saveResetDate(monthKey, resetVal);
                                            const rows = calculateMonthlyData(selectedMonth.getFullYear(), selectedMonth.getMonth(), limitVal, resetVal);
                                            setMonthlyRows(rows);
                                            setIsEditingMonthlyLimit(false);
                                            
                                            if (typeof window !== "undefined") {
                                              window.dispatchEvent(new Event("pixel-life-storage-change"));
                                            }
                                          } else {
                                            alert(t('finances.resetDayMustBe'));
                                          }
                                        } catch (error) {
                                          console.error('Erro ao salvar configurações:', error);
                                        }
                                      }}
                                      className="flex-1 px-2 py-1 rounded font-pixel text-xs transition-all hover:opacity-90"
                                      style={{
                                        backgroundColor: '#9e9e9e',
                                        border: '1px solid #9e9e9e',
                                        color: '#FFFFFF',
                                      }}
                                    >
                                      Salvar
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setIsEditingMonthlyLimit(false);
                                        const monthKey = formatMonthKey(selectedMonth);
                                        setDesiredMonthlyExpense(getDesiredMonthlyExpense(monthKey) || 0);
                                        setResetDate(getResetDate(monthKey) || 1);
                                      }}
                                      className="px-2 py-1 rounded font-pixel text-xs transition-all hover:opacity-90"
                                      style={{
                                        backgroundColor: '#f44336',
                                        border: '1px solid #f44336',
                                        color: '#FFFFFF',
                                      }}
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="p-3 rounded" style={{ backgroundColor: '#fafafa', border: '1px solid #e5e5e5' }}>
                              <div className="font-pixel text-xs mb-1" style={{ color: '#666' }}>{t('finances.accumulatedSpending')}</div>
                              <div className="font-pixel-bold" style={{ color: '#f44336', fontSize: '16px' }}>
                                R$ {totalSpent.toFixed(2).replace('.', ',')}
                              </div>
                            </div>
                            <div className="p-3 rounded" style={{ backgroundColor: '#fafafa', border: '1px solid #e5e5e5' }}>
                              <div className="font-pixel text-xs mb-1" style={{ color: '#666' }}>{t('finances.available')}</div>
                              <div className="font-pixel-bold" style={{ color: '#4caf50', fontSize: '16px' }}>
                                R$ {availableNow.toFixed(2).replace('.', ',')}
                              </div>
                            </div>
                            <div className="p-3 rounded relative" style={{ backgroundColor: '#fafafa', border: '1px solid #e5e5e5' }}>
                              <div className="font-pixel text-xs mb-1" style={{ color: '#666' }}>{t('finances.currentAccountMoney')}</div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={accountMoney ?? ""}
                                  placeholder="–"
                                  onChange={(e) => {
                                    setAccountMoney(e.target.value);
                                  }}
                                  className="flex-1 px-2 py-1 rounded font-pixel"
                                  style={{
                                    backgroundColor: '#FFFFFF',
                                    border: '1px solid #e5e5e5',
                                    color: '#111',
                                    fontSize: '14px',
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      if (!accountMoney || accountMoney.trim() === '') {
                                        return;
                                      }
                                      const parsed = parseFloat(accountMoney.replace(",", "."));
                                      if (isNaN(parsed)) {
                                        return;
                                      }
                                      
                                      const today = new Date();
                                      const isCurrentMonth = 
                                        selectedMonth.getFullYear() === today.getFullYear() &&
                                        selectedMonth.getMonth() === today.getMonth();
                                      
                                      if (!isCurrentMonth) {
                                        return;
                                      }
                                      
                                      const todayKey = formatDateKey(today);
                                      await saveAccountMoney(todayKey, parsed);
                                      setAccountMoney(parsed.toString());
                                      
                                      const monthKey = formatMonthKey(selectedMonth);
                                      const desired = getDesiredMonthlyExpense(monthKey) || 0;
                                      const reset = getResetDate(monthKey) || 1;
                                      const rows = calculateMonthlyData(selectedMonth.getFullYear(), selectedMonth.getMonth(), desired, reset, getEntriesForDate);
                                      setMonthlyRows(rows);
                                      
                                      // Atualizar progresso dos objetivos baseado no dinheiro em conta atualizado
                                      const savedAccountMoney = getAccountMoney(todayKey);
                                      const reserve = getCurrentReserve();
                                      updateAllProgressFromAccountMoney(savedAccountMoney, reserve);
                                      setTimeout(() => {
                                        setPossessions(getAllPossessions());
                                      }, 100);
                                      
                                      if (typeof window !== "undefined") {
                                        window.dispatchEvent(new Event("pixel-life-storage-change"));
                                      }
                                    } catch (error) {
                                      console.error('Erro ao salvar dinheiro em conta:', error);
                                    }
                                  }}
                                  className="px-2 py-1 rounded font-pixel text-xs transition-all hover:opacity-90"
                                  style={{
                                    backgroundColor: '#9e9e9e',
                                    border: '1px solid #9e9e9e',
                                    color: '#FFFFFF',
                                  }}
                                >
                                  Salvar
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          {/* Status do mês - barra horizontal fina */}
                          <div className="mt-4 pt-4 border-t" style={{ borderColor: '#e5e5e5' }}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-pixel text-sm" style={{ color: '#666' }}>{t('common.status')} {statusText}</span>
                              <span className="font-pixel text-xs" style={{ color: '#666' }}>
                                {spendingPercentage.toFixed(1)}% {t('finances.utilized')}
                              </span>
                            </div>
                            <div className="w-full h-2 rounded" style={{ backgroundColor: '#e5e5e5' }}>
                              <div 
                                className="h-full rounded transition-all" 
                                style={{ 
                                  width: `${Math.min(spendingPercentage, 100)}%`, 
                                  backgroundColor: spendingPercentage < 50 ? '#4caf50' : spendingPercentage < 80 ? '#ff9800' : '#f44336'
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* SEÇÃO C — Plano Mensal (Prancheta) */}
                        <div className="mb-4 rounded overflow-hidden mx-auto" style={{ border: '1px solid #e5e5e5', backgroundColor: '#FFFFFF', maxWidth: '900px' }}>
                          {/* Cabeçalho da tabela */}
                          <div className="grid grid-cols-[50px_350px_110px_110px_110px_90px] md:grid-cols-[50px_350px_110px_110px_110px_90px] border-b overflow-x-auto" style={{ borderColor: '#e5e5e5', backgroundColor: '#FFFFFF' }}>
                            <div className="py-2 px-3 font-pixel-bold text-center" style={{ color: '#666', fontSize: '15px', fontWeight: 600, textRendering: 'optimizeLegibility' }}>{t('finances.day')}</div>
                            <div className="py-2 px-3 font-pixel-bold text-center" style={{ color: '#666', fontSize: '15px', fontWeight: 600, textRendering: 'optimizeLegibility' }}>{t('finances.details')}</div>
                            <div className="py-2 px-3 font-pixel-bold text-right" style={{ color: '#666', fontSize: '15px', fontWeight: 600, textRendering: 'optimizeLegibility' }}>{t('finances.dailyTotal')}</div>
                            <div className="py-2 px-3 font-pixel-bold text-right" style={{ color: '#666', fontSize: '15px', fontWeight: 600, textRendering: 'optimizeLegibility' }}>{t('finances.remainingLimit')}</div>
                            <div className="py-2 px-3 font-pixel-bold text-right" style={{ color: '#666', fontSize: '15px', fontWeight: 600, textRendering: 'optimizeLegibility' }}>{t('finances.accountMoney')}</div>
                            <div className="py-2 px-3 font-pixel-bold text-right" style={{ color: '#666', fontSize: '15px', fontWeight: 600, textRendering: 'optimizeLegibility' }}>{t('finances.reserve')}</div>
                          </div>
                          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                            {monthlyRows.length === 0 ? (
                              <div className="p-4 text-center font-pixel" style={{ color: '#999', fontSize: '13px' }}>
                                Nenhum dado disponível.
                              </div>
                            ) : (
                              monthlyRows.map((row, idx) => {
                                const today = new Date();
                                const isToday = 
                                  today.getFullYear() === selectedMonth.getFullYear() &&
                                  today.getMonth() === selectedMonth.getMonth() &&
                                  today.getDate() === row.day;
                                
                                // Calcular Limite Restante: LimiteMensal - gastosAcumulados desde o resetDay do ciclo
                                // INVARIANTE: resetDay afeta apenas orçamento, não saldo
                                // O ciclo de orçamento pode atravessar meses
                                // IMPORTANTE: O limite usado deve ser o do mês onde o ciclo começou, não do mês atual
                                const resetDay = (typeof resetDate === 'number' ? resetDate : parseInt(String(resetDate)) || 1);
                                
                                // Data do dia da linha para cálculo
                                const rowDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), row.day);
                                const rowDateKey = formatDateKey(rowDate);
                                
                                var limiteRestante = 0;
                                if (resetDay > 0) {
                                  // Usar getCycleDates para calcular corretamente o início do ciclo
                                  // Isso garante que o ciclo atravessa meses corretamente
                                  const { cycleStart } = getCycleDates(rowDateKey, resetDay);
                                  
                                  // Buscar o limite mensal do mês onde o ciclo começou (não do mês atual)
                                  // Se o ciclo começou em dezembro, usar o limite de dezembro, mesmo estando em janeiro
                                  const cycleStartMonthKey = formatMonthKey(cycleStart);
                                  const monthlyLimitDoCiclo = getDesiredMonthlyExpense(cycleStartMonthKey) || 0;
                                  
                                  if (monthlyLimitDoCiclo > 0) {
                                    // Calcular gastos acumulados desde o início do ciclo até o dia da linha
                                    // IMPORTANTE: Soma apenas valores negativos (gastos), não ganhos
                                    let gastosAcumulados = 0;
                                    let currentDate = new Date(cycleStart);
                                    currentDate.setHours(0, 0, 0, 0);
                                    const targetDate = new Date(rowDate);
                                    targetDate.setHours(0, 0, 0, 0);
                                    
                                    while (currentDate <= targetDate) {
                                      const checkDateKey = formatDateKey(currentDate);
                                      const dailyTotal = calculateDailyTotal(checkDateKey);
                                      // Soma apenas valores negativos (gastos), não ganhos
                                      if (dailyTotal < 0) {
                                        gastosAcumulados += Math.abs(dailyTotal);
                                      }
                                      // Avançar para o próximo dia
                                      currentDate.setDate(currentDate.getDate() + 1);
                                      currentDate.setHours(0, 0, 0, 0);
                                    }
                                    
                                    // Limite Restante = Limite Mensal (do ciclo) - Gastos Acumulados (desde início do ciclo)
                                    limiteRestante = Math.max(0, monthlyLimitDoCiclo - gastosAcumulados);
                                  }
                                }
                                
                                // Total diário (igual ao Total Líquido do diário): ganhos - gastos
                                const totalDiario = row.totalDaily;
                                
                                // Buscar itens do dia para formatar detalhes
                                const dateKey = formatDateKey(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), row.day));
                                const dayItems = getDailyExpenses(dateKey);
                                
                                // Buscar entradas financeiras do novo sistema para esta data
                                const financialEntries = getEntriesForDate(dateKey);
                                
                                // Combinar itens do dia e entradas financeiras
                                const allItems: Array<{
                                  description: string;
                                  value: number;
                                  isFinancialEntry?: boolean;
                                  frequency?: 'pontual' | 'recorrente';
                                  nature?: 'gasto' | 'ganho';
                                  currentInstallment?: number;
                                  totalInstallments?: number;
                                }> = [];
                                
                                // Adicionar gastos pontuais (sistema legado)
                                dayItems.forEach(item => {
                                  allItems.push({
                                    description: item.description,
                                    value: item.value,
                                    isFinancialEntry: false,
                                  });
                                });
                                
                                // Adicionar entradas financeiras do novo sistema
                                financialEntries.forEach(entry => {
                                  // Calcular parcela atual se for parcelado
                                  let currentInstallment: number | undefined = undefined;
                                  if (entry.frequency === 'recorrente' && entry.installments?.total && entry.startDate) {
                                    const startDate = new Date(entry.startDate + 'T00:00:00');
                                    const targetDate = new Date(dateKey + 'T00:00:00');
                                    const monthsDiff = (targetDate.getFullYear() - startDate.getFullYear()) * 12 +
                                      (targetDate.getMonth() - startDate.getMonth());
                                    if (monthsDiff >= 0 && monthsDiff < entry.installments.total) {
                                      currentInstallment = monthsDiff + 1;
                                    }
                                  }
                                  
                                  allItems.push({
                                    description: entry.description,
                                    value: entry.amount,
                                    isFinancialEntry: true,
                                    frequency: entry.frequency,
                                    nature: entry.nature,
                                    currentInstallment,
                                    totalInstallments: entry.installments?.total,
                                  });
                                });
                                
                                // Formatar detalhes: "Descrição 1 (Valor1) + Descrição 2 (Valor 2)"
                                let detalhesFormatados = '-';
                                if (allItems.length > 0) {
                                  detalhesFormatados = allItems.map(item => {
                                    const valorFormatado = `R$ ${Math.abs(item.value).toFixed(2).replace('.', ',')}`;
                                    let desc = item.description;
                                    
                                    // Adicionar informações de entrada financeira recorrente/parcelada
                                    if (item.isFinancialEntry) {
                                      if (item.frequency === 'recorrente') {
                                        if (item.currentInstallment && item.totalInstallments) {
                                          desc = `${item.description} (Parcela ${item.currentInstallment}/${item.totalInstallments})`;
                                        } else {
                                          desc = `${item.description} (recorrente)`;
                                        }
                                      }
                                    }
                                    
                                    return `${desc} (${valorFormatado})`;
                                  }).join(' + ');
                                }
                                
                                // Dinheiro em conta: usar getAccountMoney (versão simplificada que busca o último valor salvo no mês)
                                const dinheiroEmConta = getAccountMoney(dateKey);
                                
                                return (
                                  <div
                                    key={idx}
                                    className="grid grid-cols-[50px_350px_110px_110px_110px_90px] md:grid-cols-[50px_350px_110px_110px_110px_90px] border-b last:border-b-0 transition-colors hover:bg-gray-50"
                                    style={{
                                      backgroundColor: isToday ? '#fff9e6' : '#ffffff',
                                      borderBottomColor: '#eeeeee',
                                    }}
                                  >
                                    <div className="py-2 px-3 font-pixel text-center flex items-center justify-center" style={{ color: '#333', fontSize: '15px', fontWeight: 400, textRendering: 'optimizeLegibility' }}>
                                      {String(row.day).padStart(2, '0')}
                                    </div>
                                    <div className="py-2 px-3 font-pixel text-center flex items-center flex-wrap gap-x-1 gap-y-0.5 justify-center" style={{ color: '#333', fontSize: '15px', fontWeight: 400, textRendering: 'optimizeLegibility' }}>
                                      {allItems.length > 0 ? (
                                        <>
                                          {allItems.map((item, itemIdx) => {
                                            const valorFormatado = `R$ ${Math.abs(item.value).toFixed(2).replace('.', ',')}`;
                                            const valorColor = item.value >= 0 ? '#4caf50' : '#f44336';
                                            const financialEntryBadge = item.isFinancialEntry && item.frequency === 'recorrente'
                                              ? (item.currentInstallment && item.totalInstallments ? '📆' : '🔁')
                                              : null;
                                            
                                            return (
                                              <span key={itemIdx} className="whitespace-nowrap">
                                                {itemIdx > 0 && <span className="mx-0.5">+</span>}
                                                {financialEntryBadge && <span className="mr-1">{financialEntryBadge}</span>}
                                                <span>{item.description}</span>
                                                {item.isFinancialEntry && item.frequency === 'recorrente' && item.currentInstallment && item.totalInstallments && (
                                                  <span className="text-xs ml-1" style={{ color: '#666' }}>
                                                    ({item.currentInstallment}/{item.totalInstallments})
                                                  </span>
                                                )}
                                                <span className="ml-1">(</span>
                                                <span style={{ color: valorColor }}>{valorFormatado}</span>
                                                <span>)</span>
                                              </span>
                                            );
                                          })}
                                        </>
                                      ) : (
                                        '-'
                                      )}
                                    </div>
                                    <div className="py-2 px-3 font-pixel text-right flex items-center justify-end" style={{ 
                                      color: totalDiario > 0 ? '#4caf50' : totalDiario < 0 ? '#f44336' : '#999',
                                      fontSize: '15px',
                                      fontWeight: 400,
                                      textRendering: 'optimizeLegibility'
                                    }}>
                                      {totalDiario !== 0 ? `${totalDiario >= 0 ? '+' : ''}R$ ${totalDiario.toFixed(2).replace('.', ',')}` : 'R$ 0,00'}
                                    </div>
                                    <div className="py-2 px-3 font-pixel text-right flex items-center justify-end" style={{ 
                                      color: '#2196f3',
                                      fontSize: '15px',
                                      fontWeight: 400,
                                      textRendering: 'optimizeLegibility'
                                    }}>
                                      R$ {limiteRestante.toFixed(2).replace('.', ',')}
                                    </div>
                                    <div 
                                      className="py-2 px-3 font-pixel text-right flex items-center justify-end" 
                                      style={{ 
                                        color: '#666',
                                        fontSize: '15px',
                                        fontWeight: 400,
                                        textRendering: 'optimizeLegibility'
                                      }}
                                    >
                                      R$ {dinheiroEmConta.toFixed(2).replace('.', ',')}
                                    </div>
                                    <div className="py-2 px-3 font-pixel text-right flex items-center justify-end" style={{ 
                                      color: '#999',
                                      fontSize: '15px',
                                      fontWeight: 400,
                                      textRendering: 'optimizeLegibility'
                                    }}>
                                      R$ {row.reserve.toFixed(2).replace('.', ',')}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>
                      );
                    })()}

                    {activeFinanceTab === 'reserve' && (
                      <div>
                        {/* Navegação por mês */}
                        <div className="mb-4 flex items-center justify-center gap-4">
                          <button
                            onClick={() => {
                              const newDate = new Date(selectedReserveMonth);
                              newDate.setMonth(newDate.getMonth() - 1);
                              setSelectedReserveMonth(newDate);
                            }}
                            className="px-3 py-2 rounded font-pixel transition-all hover:opacity-90"
                            style={{
                              backgroundColor: '#f5f5f5',
                              border: '1px solid #d6d6d6',
                              color: '#111',
                              fontSize: '14px',
                              cursor: 'pointer',
                            }}
                          >
                            ←
                          </button>
                          <div className="font-pixel-bold text-center" style={{ color: '#111', fontSize: '16px', minWidth: '200px' }}>
                            {selectedReserveMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                          </div>
                          <button
                            onClick={() => {
                              const newDate = new Date(selectedReserveMonth);
                              newDate.setMonth(newDate.getMonth() + 1);
                              setSelectedReserveMonth(newDate);
                            }}
                            className="px-3 py-2 rounded font-pixel transition-all hover:opacity-90"
                            style={{
                              backgroundColor: '#f5f5f5',
                              border: '1px solid #d6d6d6',
                              color: '#111',
                              fontSize: '14px',
                              cursor: 'pointer',
                            }}
                          >
                            →
                          </button>
                        </div>

                        {/* Total da reserva no topo */}
                        <div className="mb-4 p-4 rounded text-center" style={{ backgroundColor: '#fafafa', border: '1px solid #e5e5e5', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                          <div className="font-pixel text-xs mb-1" style={{ color: '#666' }}>{t('finances.totalReserve')}</div>
                          <div className="font-pixel-bold text-2xl" style={{ color: '#111' }}>
                            R$ {reserve.toFixed(2).replace('.', ',')}
                          </div>
                        </div>

                        {/* Botão de adicionar - discreto */}
                        <div className="mb-4">
                          <button
                            onClick={() => setIsAddReserveModalOpen(true)}
                            className="w-full px-4 py-2 rounded font-pixel transition-all hover:opacity-90 tactile-button"
                            style={{
                              backgroundColor: '#9e9e9e',
                              border: '1px solid #9e9e9e',
                              color: '#FFFFFF',
                              fontSize: '16px',
                            }}
                          >
                            + {t('finances.addMovement')}
                          </button>
                        </div>

                        {/* Lista de movimentações - cards limpos */}
                        <div className="mb-4 space-y-2">
                          {monthlyReserveItems.length === 0 ? (
                            <div className="text-center py-8 px-4 rounded" style={{ backgroundColor: '#fafafa', border: '1px solid #e5e5e5' }}>
                              <p className="font-pixel" style={{ color: '#999', fontSize: '14px' }}>
                                Nenhuma movimentação registrada
                              </p>
                            </div>
                          ) : (
                            monthlyReserveItems.map((item) => {
                              const itemDate = new Date(item.createdAt + 'T00:00:00');
                              const itemDateKey = formatDateKey(itemDate);
                              const isDeposit = item.value >= 0;
                              return (
                                <div
                                  key={item.id}
                                  className="p-3 rounded flex justify-between items-center transition-all hover:shadow-sm"
                                  style={{ 
                                    backgroundColor: '#fafafa', 
                                    border: '1px solid #e5e5e5',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                  }}
                                >
                                  <div className="flex items-center gap-2 flex-1">
                                    <span className="font-pixel" style={{ fontSize: '16px' }}>
                                      {isDeposit ? '+' : '−'}
                                    </span>
                                    <div className="flex-1">
                                      <div className="font-pixel-bold" style={{ color: '#111', fontSize: '14px' }}>
                                        {item.description ? item.description : (isDeposit ? t('common.deposit') : t('common.withdrawal'))}
                                      </div>
                                      <div className="font-pixel text-xs mt-1" style={{ color: '#666' }}>
                                        {itemDateKey}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right ml-4">
                                    <span 
                                      className="font-pixel-bold block" 
                                      style={{ 
                                        color: isDeposit ? '#4caf50' : '#f44336',
                                        fontSize: '14px'
                                      }}
                                    >
                                      R$ {Math.abs(item.value).toFixed(2).replace('.', ',')}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => {
                                      showConfirmation({
                                        message: `Tem certeza que deseja excluir esta movimentação de reserva?`,
                                        onConfirm: () => {
                                          removeReserveMovement(itemDateKey, item.id);
                                          
                                          // Atualizar reserveItems para disparar o useEffect de monthlyReserveItems
                                          const dateKey = formatDateKey(selectedDate);
                                          const rItems = getReserveMovements(dateKey);
                                          setReserveItems(rItems);
                                          
                                          // Atualizar monthlyReserveItems imediatamente
                                          const year = selectedMonth.getFullYear();
                                          const month = selectedMonth.getMonth();
                                          const daysInMonth = new Date(year, month + 1, 0).getDate();
                                          const allReserveItems: ReserveMovement[] = [];
                                          
                                          for (let day = 1; day <= daysInMonth; day++) {
                                            const date = new Date(year, month, day);
                                            const dateKey = formatDateKey(date);
                                            const dayItems = getReserveMovements(dateKey);
                                            allReserveItems.push(...dayItems);
                                          }
                                          
                                          allReserveItems.sort((a, b) => {
                                            const dateA = new Date(a.createdAt).getTime();
                                            const dateB = new Date(b.createdAt).getTime();
                                            return dateB - dateA;
                                          });
                                          
                                          setMonthlyReserveItems(allReserveItems);
                                          
                                          // Atualizar progresso dos objetivos baseado no dinheiro em conta atualizado
                                          const today = new Date();
                                          const todayKey = formatDateKey(today);
                                          const accountMoney = getAccountMoney(todayKey);
                                          const reserve = getCurrentReserve();
                                          updateAllProgressFromAccountMoney(accountMoney, reserve);
                                          setTimeout(() => {
                                            setPossessions(getAllPossessions());
                                          }, 100);
                                        },
                                      });
                                    }}
                                    className="ml-3 transition-colors"
                                    style={{ 
                                      fontSize: '24px',
                                      color: '#999',
                                      cursor: 'pointer',
                                      lineHeight: '1',
                                      fontWeight: 'bold',
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.color = '#f44336';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.color = '#999';
                                    }}
                                  >
                                    ×
                                  </button>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}

                    {activeFinanceTab === 'analysis' && (() => {
                      // Forçar atualização quando recurringEntriesUpdateKey mudar
                      const activeRecurring = getActiveRecurringEntries();
                      const today = new Date().toISOString().substring(0, 10);
                      // Usar recurringEntriesUpdateKey para forçar re-render quando mudar
                      const _ = recurringEntriesUpdateKey;
                      const currentMonthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1).toISOString().substring(0, 10);
                      const currentMonthEnd = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).toISOString().substring(0, 10);
                      const categoryAnalysis = getCategoryAnalysis(currentMonthStart, currentMonthEnd);
                      
                      return (
                        <div className="space-y-6">
                          {/* Recorrentes Ativos */}
                          <div className="p-4 rounded" style={{ backgroundColor: '#FFFFFF', border: '1px solid #e5e5e5' }}>
                            <h3 className="font-pixel-bold mb-4" style={{ color: '#333', fontSize: '18px' }}>
                              Recorrentes Ativos
                            </h3>
                            {activeRecurring.length === 0 ? (
                              <p className="font-pixel text-center py-8" style={{ color: '#999', fontSize: '14px' }}>
                                Nenhum lançamento recorrente ativo
                              </p>
                            ) : (
                              <div className="grid grid-cols-2 gap-3">
                                {activeRecurring.map((entry) => {
                                  const startDate = new Date(entry.startDate + 'T00:00:00');
                                  const frequencyLabel = entry.recurrence === 'mensal' ? 'Mensal' : entry.recurrence === 'quinzenal' ? 'Quinzenal' : 'Anual';
                                  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                                  const startDateLabel = `${monthNames[startDate.getMonth()]}/${startDate.getFullYear()}`;
                                  const metadata = `${frequencyLabel} · desde ${startDateLabel}`;
                                  
                                  return (
                                    <div
                                      key={entry.id}
                                      className="p-3 rounded"
                                      style={{ 
                                        backgroundColor: '#fafafa', 
                                        border: '1px solid #e5e5e5',
                                      }}
                                    >
                                      {/* Linha 1: Ícone + Nome + Categoria */}
                                      <div className="flex items-center gap-2 mb-1.5">
                                        <span className="text-xs font-pixel" style={{ color: '#9ca3af' }}>↻</span>
                                        <span className="font-pixel-bold flex-1" style={{ color: '#111', fontSize: '14px' }}>
                                          {entry.description}
                                        </span>
                                        {entry.category && (
                                          <span 
                                            className="px-2 py-[2px] text-xs rounded font-pixel"
                                            style={{ 
                                              backgroundColor: '#f3f4f6',
                                              color: '#4b5563',
                                              border: '1px solid #e5e7eb'
                                            }}
                                          >
                                            {entry.category}
                                          </span>
                                        )}
                                      </div>
                                      
                                      {/* Linha 2: Valor + Metadados + Botão Encerrar */}
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 flex-1">
                                          <span 
                                            className="font-pixel-bold text-sm"
                                            style={{ 
                                              color: entry.amount >= 0 ? '#10b981' : '#ef4444'
                                            }}
                                          >
                                            R$ {Math.abs(entry.amount).toFixed(2).replace('.', ',')}
                                          </span>
                                          <span className="text-xs font-pixel" style={{ color: '#6b7280' }}>
                                            {metadata}
                                          </span>
                                        </div>
                                        <button
                                          onClick={() => {
                                            if (confirm(`Encerrar recorrência "${entry.description}" a partir de hoje? Isso não afetará registros passados.`)) {
                                              endRecurrence(entry.id, today);
                                              // Forçar atualização da lista de recorrentes
                                              setRecurringEntriesUpdateKey(prev => prev + 1);
                                              // Recarregar dados mensais
                                              const monthKey = formatMonthKey(selectedMonth);
                                              const desired = getDesiredMonthlyExpense(monthKey) || 0;
                                              const reset = getResetDate(monthKey) || 1;
                                              const rows = calculateMonthlyData(selectedMonth.getFullYear(), selectedMonth.getMonth(), desired, reset, getEntriesForDate);
                                              setMonthlyRows(rows);
                                            }
                                          }}
                                          className="text-xs font-pixel hover:underline transition-colors"
                                          style={{
                                            color: '#ef4444',
                                            fontSize: '12px',
                                          }}
                                        >
                                          Encerrar
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Análise por Categoria */}
                          <div className="p-4 rounded" style={{ backgroundColor: '#FFFFFF', border: '1px solid #e5e5e5', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <h3 className="font-pixel-bold mb-4" style={{ color: '#333', fontSize: '18px' }}>
                              Análise por Categoria ({new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })})
                            </h3>
                            {categoryAnalysis.length === 0 ? (
                              <p className="font-pixel text-center py-8" style={{ color: '#999', fontSize: '14px' }}>
                                Nenhum lançamento registrado neste período
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {categoryAnalysis.map((item) => (
                                  <div
                                    key={item.category}
                                    className="p-3 rounded flex items-center justify-between"
                                    style={{ backgroundColor: '#fafafa', border: '1px solid #e5e5e5' }}
                                  >
                                    <span className="font-pixel-bold" style={{ color: '#111', fontSize: '16px' }}>
                                      {item.category}
                                    </span>
                                    <span 
                                      className="font-pixel-bold"
                                      style={{ 
                                        color: item.total >= 0 ? '#4caf50' : '#f44336',
                                        fontSize: '16px'
                                      }}
                                    >
                                      {item.total >= 0 ? '+' : ''}R$ {item.total.toFixed(2).replace('.', ',')}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </section>
              )}
              {activeBoardSection === 'goals' && (
                <section id="goals" className="scroll-mt-8 mb-8">
                  <div className="section-box">
                    <h1 className="font-pixel-bold mb-4" style={{ color: '#333', fontSize: '24px' }}>
                      {t('sections.goals')}
                    </h1>
                    {/* Ordenação */}
                    {possessions.length > 0 && (
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2 gap-4">
                          <div className="flex gap-2 flex-wrap items-center">
                            <span className="font-pixel-bold" style={{ color: '#333', fontSize: '14px' }}>{t('goals.orderBy')}:</span>
                            {(['value', 'status', 'date'] as const).map((criteria) => {
                              const existing = sortCriteria.find(s => s.by === criteria);
                              return (
                                <button
                                  key={criteria}
                                  onClick={() => {
                                    const index = sortCriteria.findIndex(s => s.by === criteria);
                                    if (index >= 0) {
                                      if (sortCriteria[index].order === 'desc') {
                                        const newCriteria = [...sortCriteria];
                                        newCriteria[index] = { by: criteria, order: 'asc' };
                                        setSortCriteria(newCriteria);
                                      } else {
                                        setSortCriteria(sortCriteria.filter((_, i) => i !== index));
                                      }
                                    } else {
                                      setSortCriteria([...sortCriteria, { by: criteria, order: 'desc' }]);
                                    }
                                  }}
                                  className="px-3 py-2 rounded font-pixel text-xs transition-colors touch-manipulation min-h-[44px] min-w-[60px]"
                                  style={{
                                    backgroundColor: existing ? '#6daffe' : '#f5f5f5',
                                    border: `1px solid ${existing ? '#1b5cff' : '#d4d4d4'}`,
                                    color: existing ? '#fff' : '#555',
                                    borderRadius: '6px',
                                  }}
                                >
                                  {criteria === 'value' ? t('goals.orderByValue') : criteria === 'status' ? t('goals.orderByStatus') : t('goals.orderByDate')} {existing && (existing.order === 'asc' ? '↑' : '↓')}
                                </button>
                              );
                            })}
                            {sortCriteria.length > 0 && (
                              <button
                                onClick={() => setSortCriteria([])}
                                className="px-3 py-1 rounded font-pixel text-xs transition-colors"
                                style={{
                                  backgroundColor: '#f5f5f5',
                                  border: '1px solid #d4d4d4',
                                  color: '#555',
                                  borderRadius: '6px',
                                }}
                              >
                                Limpar
                              </button>
                            )}
                          </div>
                          <div className="font-pixel text-right" style={{ color: '#333', fontSize: '14px', whiteSpace: 'nowrap' }}>
                            {t('goals.accumulatedValue')}{' '}
                            <span className="font-pixel-bold" style={{ color: '#111' }}>
                              {new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(
                                possessions
                                  .filter(p => p.status === 'completed')
                                  .reduce((sum, p) => sum + p.targetValue, 0)
                              )}
                            </span>
                          </div>
                        </div>
                        {sortCriteria.length > 1 && (
                          <p className="font-pixel text-xs" style={{ color: '#666' }}>
                            {t('goals.orderBy')}: {sortCriteria.map(s => `${s.by === 'value' ? t('goals.orderByValue') : s.by === 'status' ? t('goals.orderByStatus') : t('goals.orderByDate')} (${s.order === 'asc' ? t('goals.orderAsc') : t('goals.orderDesc')})`).join(' → ')}
                          </p>
                        )}
                      </div>
                    )}
                    {possessions.length === 0 ? (
                      <p className="font-pixel text-center py-8" style={{ color: '#999', fontSize: '16px' }}>
                        {t('goals.noGoalsYet')}
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 gap-4">
                        {[...possessions].sort((a, b) => {
                          if (sortCriteria.length === 0) return 0;
                          for (const { by, order } of sortCriteria) {
                            let comparison = 0;
                            if (by === 'value') {
                              comparison = a.targetValue - b.targetValue;
                            } else if (by === 'status') {
                              const statusOrder: Record<'completed' | 'in-progress' | 'locked' | 'legal-issues', number> = { 
                                'completed': 1, 
                                'legal-issues': 1, 
                                'in-progress': 2, 
                                'locked': 3 
                              };
                              comparison = statusOrder[a.status] - statusOrder[b.status];
                            } else if (by === 'date') {
                              comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                            }
                            if (comparison !== 0) {
                              return order === 'asc' ? comparison : -comparison;
                            }
                          }
                          return 0;
                        }).map((possession, index) => {
                          const isEndOfRow = (index + 1) % 3 === 0;
                          const isLastItem = index === possessions.length - 1;
                          return (
                            <>
                              <div
                                key={possession.id}
                                style={{
                                  backgroundColor: index % 2 === 0 ? '#ffffff' : '#f6f6f6',
                                }}
                              >
                                <PossessionCard
                                  possession={possession}
                                  onClick={() => {
                                    setSelectedPossession(possession);
                                    setIsDetailsPossessionModalOpen(true);
                                  }}
                                  onBuy={(id) => {
                                    updatePossession(id, { status: 'completed' });
                                    const updated = getAllPossessions();
                                    setPossessions(updated);
                                  }}
                                />
                              </div>
                              {isEndOfRow && !isLastItem && (
                                <div key={`divider-${possession.id}`} className="col-span-3 flex justify-center my-2">
                                  <div 
                                    style={{ 
                                      width: '100px', 
                                      height: '1px', 
                                      backgroundColor: '#e5e5e5' 
                                    }} 
                                  />
                                </div>
                              )}
                            </>
                          );
                        })}
                      </div>
                    )}
                    <div className="mt-6">
                      <div className="flex justify-end">
                        <button
                          onClick={() => setIsCreatePossessionModalOpen(true)}
                          className="px-4 py-2 rounded font-pixel-bold transition-colors hover:bg-gray-50"
                          style={{
                            backgroundColor: '#fff',
                            border: '1px solid #333',
                            color: '#111',
                            fontSize: '14px',
                            borderRadius: '4px',
                          }}
                        >
                          + {t('goals.newGoal')}
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              )}
              {activeBoardSection === 'mapas' && (
                <section id="mapas" className="scroll-mt-8 mb-8">
                  <div className="section-box">
                    <h1 className="font-pixel-bold mb-4" style={{ color: '#333', fontSize: '24px' }}>
                      {t('sections.mapas')}
                    </h1>
                    <MapasSection />
                  </div>
                </section>
              )}
              {activeBoardSection === 'feedback' && (
                <section id="feedback" className="scroll-mt-8 mb-8">
                  <div className="section-box">
                    <h1 className="font-pixel-bold mb-4" style={{ color: '#333', fontSize: '24px' }}>
                      {t('sections.feedback')}
                    </h1>
                    
                    {/* Tabs para diferentes visualizações */}
                    <FeedbackSection />
                  </div>
                </section>
              )}
              {activeBoardSection === 'guides' && (
                <section id="guides" className="scroll-mt-8 mb-8">
                  <div className="section-box">
                    <h1 className="font-pixel-bold mb-4" style={{ color: '#333', fontSize: '24px' }}>
                      {t('sections.guides')}
                    </h1>
                    <GuidesSection />
                  </div>
                </section>
              )}
              {activeBoardSection === 'biography' && isModuleActive('biography') && (
                <section id="biography" className="scroll-mt-8 mb-8">
                  <div className="section-box">
                    <div className="flex justify-between items-center mb-4">
                      <h1 className="font-pixel-bold" style={{ color: '#333', fontSize: '24px' }}>
                        {t('sections.biography')}
                      </h1>
                      {activeBiographyTab === 'timeline' && (
                        <button
                          onClick={() => {
                            setEditingTimelineEvent(undefined);
                            setIsTimelineModalOpen(true);
                          }}
                          className="px-4 py-2 rounded font-pixel-bold transition-colors hover:opacity-90 tactile-button"
                          style={{
                            backgroundColor: '#7aff7a',
                            border: '1px solid #0f9d58',
                            color: '#111',
                            fontSize: '16px',
                            borderRadius: '8px',
                          }}
                        >
                          + {t('biography.addEvent')}
                        </button>
                      )}
                      {activeBiographyTab === 'dossies' && (
                        <button
                          onClick={() => {
                            setEditingDossier(undefined);
                            setIsDossierModalOpen(true);
                          }}
                          className="px-4 py-2 rounded font-pixel-bold transition-colors hover:opacity-90 tactile-button"
                          style={{
                            backgroundColor: '#6daffe',
                            border: '1px solid #1b5cff',
                            color: '#111',
                            fontSize: '16px',
                            borderRadius: '8px',
                          }}
                        >
                          + Criar pasta
                        </button>
                      )}
                    </div>
                    {/* Conteúdo de biografia - copiar do modo contínuo */}
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'thin' }}>
                      <button
                        onClick={() => setActiveBiographyTab('about')}
                        className="px-4 py-2 font-pixel-bold transition-colors flex-shrink-0 touch-manipulation min-h-[44px]"
                        style={{
                          backgroundColor: activeBiographyTab === 'about' ? '#FFFFFF' : '#f2f2f2',
                          border: activeBiographyTab === 'about' ? '1px solid #e5e5e5' : '1px solid #e5e5e5',
                          color: activeBiographyTab === 'about' ? '#111' : '#666',
                          fontSize: '16px',
                        }}
                      >
                        {t('biography.aboutMe')}
                      </button>
                      <button
                        onClick={() => setActiveBiographyTab('dossies')}
                        className="px-4 py-2 font-pixel-bold transition-colors flex-shrink-0 touch-manipulation min-h-[44px]"
                        style={{
                          backgroundColor: activeBiographyTab === 'dossies' ? '#FFFFFF' : '#f2f2f2',
                          border: activeBiographyTab === 'dossies' ? '1px solid #e5e5e5' : '1px solid #e5e5e5',
                          color: activeBiographyTab === 'dossies' ? '#111' : '#666',
                          fontSize: '16px',
                        }}
                      >
                        {t('biography.dossiers')}
                      </button>
                      <button
                        onClick={() => setActiveBiographyTab('timeline')}
                        className="px-4 py-2 font-pixel-bold transition-colors flex-shrink-0 touch-manipulation min-h-[44px]"
                        style={{
                          backgroundColor: activeBiographyTab === 'timeline' ? '#FFFFFF' : '#f2f2f2',
                          border: activeBiographyTab === 'timeline' ? '1px solid #e5e5e5' : '1px solid #e5e5e5',
                          color: activeBiographyTab === 'timeline' ? '#111' : '#666',
                          fontSize: '16px',
                        }}
                      >
                        {t('biography.timeline')}
                      </button>
                    </div>
                    {activeBiographyTab === 'timeline' && (
                      <TimelineView
                        onEdit={(event) => {
                          setEditingTimelineEvent(event);
                          setIsTimelineModalOpen(true);
                        }}
                        onDelete={(id) => {
                          showConfirmation({
                            message: 'Tem certeza que deseja excluir este evento?',
                            onConfirm: () => removeEvent(id),
                          });
                        }}
                      />
                    )}
                    {activeBiographyTab === 'dossies' && (
                      <div>
                        {openDossierId ? (
                          (() => {
                            const openDossier = getAllDossiers().find(d => d.id === openDossierId);
                            if (!openDossier) {
                              setOpenDossierId(null);
                              return null;
                            }
                            return (
                              <DossierView
                                dossier={openDossier}
                                onClose={() => setOpenDossierId(null)}
                                onUpdate={(id, updates) => updateDossier(id, updates)}
                                onDelete={(id) => {
                                  showConfirmation({
                                    message: `Tem certeza que deseja excluir "${openDossier.title}"?`,
                                    onConfirm: () => {
                                      removeDossier(id);
                                      setOpenDossierId(null);
                                    },
                                  });
                                }}
                                onRename={(id, newTitle) => updateDossier(id, { title: newTitle })}
                              />
                            );
                          })()
                        ) : (
                          <>
                            {getAllDossiers().length === 0 ? (
                              <div className="text-center py-12 px-4">
                                <div className="mb-4" style={{ fontSize: '48px', lineHeight: '1' }}>📁</div>
                                <p className="font-pixel-bold mb-2" style={{ color: '#111', fontSize: '18px' }}>
                                  Nenhum dossiê ainda
                                </p>
                                <p className="font-pixel" style={{ color: '#666', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
                                  Crie pastas para guardar histórias, ideias ou fases da sua vida.
                                </p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {getAllDossiers().map((dossier) => (
                                  <DossierCard
                                    key={dossier.id}
                                    dossier={dossier}
                                    onDoubleClick={() => setOpenDossierId(dossier.id)}
                                    onTogglePin={() => togglePin(dossier.id)}
                                  />
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                    {activeBiographyTab === 'about' && (
                      <>
                      <AboutItemsSection
                        onAddItem={(category) => {
                          setSelectedAboutCategory(category);
                          setEditingAboutItem(undefined);
                          setIsAboutItemModalOpen(true);
                        }}
                        onEditItem={(item) => {
                          setEditingAboutItem(item);
                          setSelectedAboutCategory(item.category);
                          setIsAboutItemModalOpen(true);
                        }}
                        onDeleteItem={(id) => {
                          showConfirmation({
                            message: 'Tem certeza que deseja excluir este item?',
                            onConfirm: () => removeItem(id),
                          });
                        }}
                      />
                        {/* Atributos dentro de Sobre mim */}
                        <div className="mt-8">
                          <AttributesView
                            onEdit={(attribute) => {
                              setEditingAttribute(attribute);
                              setIsAttributeModalOpen(true);
                            }}
                            onDelete={(id) => {
                              showConfirmation({
                                message: 'Tem certeza que deseja excluir este atributo?',
                                onConfirm: () => removeAttribute(id),
                              });
                            }}
                            onAdd={() => {
                              setEditingAttribute(undefined);
                              setIsAttributeModalOpen(true);
                            }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </section>
              )}
            </>
          ) : (
            <>
              {/* Modo Contínuo: todas as seções em ordem */}
              {/* DISPLAY - Sempre visível no topo */}
              <section id="display" className="mb-8" style={{ scrollMarginTop: '10px' }}>
                <div className="section-box">
                  <h1 className="font-pixel-bold mb-2 mobile-hide-title" style={{ color: '#333', fontSize: '24px' }}>
                    {t('sections.display')}
                  </h1>
                  <ProfileSection />
                </div>
              </section>

              {/* FEEDBACK - Modo contínuo: sempre visível após Display */}
              <section id="feedback" className="scroll-mt-8 mb-8">
                <div className="section-box">
                  <h1 className="font-pixel-bold mb-4" style={{ color: '#333', fontSize: '24px' }}>
                    {t('sections.feedback')}
                  </h1>
                  
                  {/* Tabs para diferentes visualizações */}
                  <FeedbackSection />
                </div>
              </section>
            </>
          )}

          {/* ACHIEVEMENTS - Mostra apenas quando achievements estiver ativo (via botão) */}
          {activeBoardSection === 'achievements' && (
            <section id="achievements" className="scroll-mt-8 mb-8">
              <div className="section-box">
              <h1 className="font-pixel-bold mb-2" style={{ color: '#333', fontSize: '24px' }}>
                Metas e Conquistas
              </h1>
              <div className="grid grid-cols-2 gap-2">
                {(() => {
                  const journalDates = getAllDates();
                  const possessions = getAllPossessions();
                  const completedGoals = possessions.filter(p => p.status === 'completed').length;
                  
                  // Calcular streak atual
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  let currentStreak = 0;
                  for (let i = 0; i < 365; i++) {
                    const date = new Date(today);
                    date.setDate(today.getDate() - i);
                    const dateStr = date.toISOString().substring(0, 10);
                    const hasAnyHabit = habits.some(habit => habit.checks[dateStr]);
                    if (hasAnyHabit) {
                      currentStreak++;
                    } else if (i > 0) {
                      break;
                    }
                  }

                  const achievements = [
                    {
                      title: 'First Week',
                      description: 'Complete 7 days of habits',
                      icon: '📅',
                      completed: currentStreak >= 7,
                    },
                    {
                      title: 'Goal Master',
                      description: 'Complete 3 objectives',
                      icon: '🎯',
                      completed: completedGoals >= 3,
                    },
                    {
                      title: 'Journal Keeper',
                      description: 'Write 30 journal entries',
                      icon: '📔',
                      completed: journalDates.length >= 30,
                    },
                    {
                      title: 'Habit Builder',
                      description: 'Create 5 habits',
                      icon: '✅',
                      completed: habits.length >= 5,
                    },
                  ];

                  return achievements.map((achievement, index) => (
                    <div
                      key={index}
                      className="p-4 rounded border-2"
                      style={{
                        backgroundColor: achievement.completed ? '#e8f5e9' : '#f5f5f5',
                        borderColor: achievement.completed ? '#4caf50' : '#e0e0e0',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{achievement.icon}</span>
                        <h3 className="font-pixel-bold" style={{ color: '#333', fontSize: '16px' }}>
                          {achievement.title}
                        </h3>
                      </div>
                      <p className="font-pixel text-sm" style={{ color: '#666' }}>
                        {achievement.description}
                      </p>
                      {achievement.completed && (
                        <div className="mt-2 text-right">
                          <span className="font-pixel-bold text-sm" style={{ color: '#4caf50' }}>
                            ✓ {t('goals.completed')}
                          </span>
                        </div>
                      )}
                    </div>
                  ));
                })()}
              </div>
            </div>
          </section>
          )}

          {/* HÁBITOS - Modo contínuo: sempre visível após Feedback */}
          {viewMode === 'continuous' && isModuleActive('habits') && (
            <section id="habits" className="scroll-mt-8 mb-8">
            <div className="section-box">
              <h1 className="font-pixel-bold mb-2" style={{ color: '#333', fontSize: '24px' }}>
                {t('sections.habits')}
              </h1>
              {/* Tabela de hábitos */}
              <div className="mb-4 rounded-md overflow-hidden" style={{ border: '1px solid #e0e0e0' }}>
                <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <div className="grid grid-cols-[180px_repeat(7,0.765fr)] min-w-[600px] bg-[#e8e8e8] border-b border-[#e0e0e0]">
                    <div className="p-2 font-pixel font-pixel-bold border-r border-[#e0e0e0] flex items-center justify-center" style={{ color: '#333', fontSize: '16px' }}>
                      {t('sections.habits')}
                    </div>
                    {days.map((d) => (
                      <div key={d} className="text-center p-2 font-pixel font-pixel-bold border-r border-[#e0e0e0] last:border-r-0" style={{ color: '#333', fontSize: '16px' }}>
                        {formatDateShort(d)}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {habits.length === 0 ? (
                    <div className="p-4 text-center font-pixel" style={{ color: '#999', fontSize: '16px' }}>
                      Nenhum hábito ainda.
                    </div>
                  ) : (
                    <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                      {habits.map((habit) => (
                        <div
                          key={habit.id}
                          className="grid grid-cols-[180px_repeat(7,0.765fr)] min-w-[600px] border-b border-[#e0e0e0] last:border-b-0 hover:bg-white/50 transition-colors cursor-pointer"
                          onClick={() => setSelectedHabit(habit)}
                        >
                        <div className="p-2 font-pixel border-r border-[#e0e0e0] flex items-center justify-between" style={{ color: '#111', fontSize: '16px' }}>
                          <span 
                            className="flex-1 text-center block truncate"
                            style={{ 
                              maxWidth: '150px'
                            }}
                            title={habit.name}
                          >
                            {habit.name.length > 27 ? habit.name.substring(0, 27) + '...' : habit.name}
                          </span>
                          <div 
                            className="w-5 h-5 flex items-center justify-center rounded"
                            style={{ 
                              backgroundColor: '#FFFFFF',
                              border: '1px solid #e0e0e0',
                            }}
                          >
                            <span className="text-gray-400" style={{ fontSize: '16px' }}>+</span>
                          </div>
                        </div>
                        {days.map((d) => (
                          <div
                            key={d}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCheck(habit.id, d);
                            }}
                            className="flex items-center justify-center border-r border-[#e0e0e0] last:border-r-0 cursor-pointer p-2"
                          >
                            <img
                              src={habit.checks[d] ? "/icon2.1.png" : "/icon2.2.png"}
                              className="w-6 h-6 object-contain"
                              style={{ imageRendering: 'pixelated' }}
                              alt={habit.checks[d] ? "checked" : "unchecked"}
                            />
                          </div>
                        ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {/* Input inline para adicionar hábito */}
              <div className="flex gap-2 mt-4">
                <div className="flex-1 relative" style={{ minWidth: '600px' }}>
                  <input
                    type="text"
                    value={newHabitName}
                    onChange={(e) => {
                      setNewHabitName(e.target.value);
                      if (e.target.value.trim()) {
                        setIsAddingHabit(true);
                      }
                    }}
                    onKeyPress={handleKeyPress}
                    onFocus={() => setIsAddingHabit(true)}
                    onBlur={() => {
                      if (!newHabitName.trim()) {
                        setIsAddingHabit(false);
                      }
                    }}
                    maxLength={30}
                    placeholder="+ Adicionar Hábito"
                    className="w-full px-4 py-3 rounded-md font-pixel"
                    style={{
                      backgroundColor: '#9e9e9e',
                      border: '1px solid #9e9e9e',
                      color: '#FFFFFF',
                      fontSize: '16px',
                    }}
                  />
                </div>
                {isAddingHabit && newHabitName.trim() && (
                  <button
                    onClick={handleAddHabit}
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
              </section>
          )}

          {/* DIÁRIO - Modo contínuo: sempre visível após Hábitos */}
          {viewMode === 'continuous' && isModuleActive('journal') && (
            <section id="journal" className="scroll-mt-8 mb-8">
              <div className="section-box">
                <h1 className="font-pixel-bold mb-6" style={{ color: '#333', fontSize: '24px' }}>
                  {t('sections.journal')}
                </h1>
                <div className="max-w-5xl mx-auto">
                  <DailyOverview />
                </div>
              </div>
            </section>
          )}

          {/* FINANÇAS - Modo contínuo: sempre visível após Diário */}
          {viewMode === 'continuous' && isModuleActive('finances') && (
            <>
              {/* Finanças */}
              <section id="finances" className="scroll-mt-8 mb-8">
            <div className="section-box">
              <h1 className="font-pixel-bold mb-6" style={{ color: '#333', fontSize: '24px' }}>
                {t('sections.finances')}
              </h1>

              {/* Abas */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'thin' }}>
                <button
                  onClick={() => setActiveFinanceTab('daily')}
                  className="px-4 py-2 font-pixel-bold transition-colors flex-shrink-0 touch-manipulation min-h-[44px]"
                  style={{
                    backgroundColor: activeFinanceTab === 'daily' ? '#FFFFFF' : '#f2f2f2',
                    border: activeFinanceTab === 'daily' ? '1px solid #e5e5e5' : '1px solid #e5e5e5',
                    color: activeFinanceTab === 'daily' ? '#111' : '#666',
                    fontSize: '16px',
                  }}
                >
                  Diário
                </button>
                <button
                  onClick={() => setActiveFinanceTab('monthly')}
                  className="px-4 py-2 font-pixel-bold transition-colors flex-shrink-0 touch-manipulation min-h-[44px]"
                  style={{
                    backgroundColor: activeFinanceTab === 'monthly' ? '#FFFFFF' : '#f2f2f2',
                    border: activeFinanceTab === 'monthly' ? '1px solid #e5e5e5' : '1px solid #e5e5e5',
                    color: activeFinanceTab === 'monthly' ? '#111' : '#666',
                    fontSize: '16px',
                  }}
                >
                  Mensal
                </button>
                <button
                  onClick={() => setActiveFinanceTab('reserve')}
                  className="px-4 py-2 font-pixel-bold transition-colors flex-shrink-0 touch-manipulation min-h-[44px]"
                  style={{
                    backgroundColor: activeFinanceTab === 'reserve' ? '#FFFFFF' : '#f2f2f2',
                    border: activeFinanceTab === 'reserve' ? '1px solid #e5e5e5' : '1px solid #e5e5e5',
                    color: activeFinanceTab === 'reserve' ? '#111' : '#666',
                    fontSize: '16px',
                  }}
                >
                  Reserva
                </button>
                <button
                  onClick={() => setActiveFinanceTab('analysis')}
                  className="px-4 py-2 font-pixel-bold transition-colors flex-shrink-0 touch-manipulation min-h-[44px]"
                  style={{
                    backgroundColor: activeFinanceTab === 'analysis' ? '#FFFFFF' : '#f2f2f2',
                    border: activeFinanceTab === 'analysis' ? '1px solid #e5e5e5' : '1px solid #e5e5e5',
                    color: activeFinanceTab === 'analysis' ? '#111' : '#666',
                    fontSize: '16px',
                  }}
                >
                  Análise
                </button>
              </div>

              {/* Conteúdo das abas */}
              {activeFinanceTab === 'daily' && (
                <div>
                  {/* Data selecionada com setas de navegação */}
                  <div className="mb-4">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <button
                        onClick={() => {
                          const prevDate = new Date(selectedDate);
                          prevDate.setDate(prevDate.getDate() - 1);
                          setSelectedDate(prevDate);
                        }}
                        className="px-3 py-2 rounded font-pixel transition-all hover:opacity-90"
                        style={{
                          backgroundColor: '#9e9e9e',
                          border: '1px solid #9e9e9e',
                          color: '#FFFFFF',
                          fontSize: '16px',
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        ←
                      </button>
                      <button
                        onClick={() => {
                          setFinanceDateCalendarMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
                          setShowFinanceDateCalendar(true);
                        }}
                        className="px-3 py-2 rounded font-pixel transition-all hover:opacity-90"
                        style={{ 
                          backgroundColor: '#FFFFFF', 
                          fontSize: '16px', 
                          border: '1px solid #e5e5e5',
                          cursor: 'pointer',
                          maxWidth: '200px',
                        }}
                      >
                        {formatDateKey(selectedDate)}
                      </button>
                      <button
                        onClick={() => {
                          const nextDate = new Date(selectedDate);
                          nextDate.setDate(nextDate.getDate() + 1);
                          setSelectedDate(nextDate);
                        }}
                        className="px-3 py-2 rounded font-pixel transition-all hover:opacity-90"
                        style={{
                          backgroundColor: '#9e9e9e',
                          border: '1px solid #9e9e9e',
                          color: '#FFFFFF',
                          fontSize: '16px',
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        →
                      </button>
                    </div>
                    {/* Data por extenso */}
                    <p className="text-center font-pixel" style={{ color: '#666', fontSize: '14px' }}>
                      {(() => {
                        const days = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
                        const months = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
                        return `${days[selectedDate.getDay()]}, ${selectedDate.getDate()} de ${months[selectedDate.getMonth()]} de ${selectedDate.getFullYear()}`;
                      })()}
                    </p>
                  </div>

                  {/* Botão de adicionar centralizado */}
                  <div className="mb-4 flex justify-center">
                    <div className="relative" style={{ width: '80%', margin: '0 auto' }}>
                    <button
                        onClick={() => setIsAddFinancialEntryModalOpen(true)}
                        className="w-full px-4 py-2 rounded font-pixel transition-all hover:opacity-90"
                      style={{
                        fontSize: '16px',
                        backgroundColor: '#9e9e9e',
                        border: '1px solid #9e9e9e',
                        color: '#FFFFFF',
                      }}
                    >
                      + Adicionar Entrada
                    </button>
                    </div>
                  </div>

                  {/* Lista de despesas do dia - cards discretos */}
                  {(() => {
                    // Buscar entradas financeiras do novo sistema
                    const dateKey = formatDateKey(selectedDate);
                    const financialEntries = getEntriesForDate(dateKey);
                    
                    // Combinar gastos pontuais antigos (legado) e novas entradas financeiras
                    const allItems: Array<{
                      id: string;
                      description: string;
                      value: number;
                      category?: string;
                      relatedGoalId?: number;
                      frequency?: 'pontual' | 'recorrente';
                      installments?: { total: number; current?: number };
                      nature?: 'gasto' | 'ganho';
                    }> = [];
                    
                    // Adicionar gastos pontuais antigos (legado)
                    dailyItems.forEach(item => {
                      const entry: {
                        id: string;
                        description: string;
                        value: number;
                        category?: string;
                        relatedGoalId?: number;
                        frequency: 'pontual';
                      } = {
                        id: item.id,
                        description: item.description,
                        value: item.value,
                        category: item.category,
                        relatedGoalId: item.relatedGoalId,
                        frequency: 'pontual',
                      };
                      allItems.push(entry);
                    });
                    
                    // Adicionar entradas do novo sistema (pontuais e recorrentes)
                    financialEntries.forEach(entry => {
                      allItems.push({
                        id: entry.id,
                        description: entry.description,
                        value: entry.amount,
                        category: entry.category,
                        frequency: entry.frequency,
                        installments: entry.installments,
                        nature: entry.nature,
                      });
                    });
                    
                    return (
                  <div className="mb-4 space-y-3">
                        {allItems.length === 0 ? (
                      <div className="text-center py-8 px-4 rounded" style={{ backgroundColor: '#fafafa', border: '1px solid #e5e5e5' }}>
                        <p className="font-pixel" style={{ color: '#999', fontSize: '14px' }}>
                          Nenhuma entrada registrada
                        </p>
                      </div>
                    ) : (
                          allItems.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 rounded flex justify-between items-start transition-all hover:shadow-sm"
                          style={{ 
                            backgroundColor: '#fafafa', 
                            border: '1px solid #e5e5e5',
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                          }}
                              onDoubleClick={() => {
                                // Abrir modal de edição (double-click também funciona)
                                const isLegacy = dailyItems.find(d => d.id === item.id);
                                if (!isLegacy) {
                                  // Sistema novo: buscar e editar
                                  const financialEntries = getEntriesForDate(dateKey);
                                  const entryToEdit = financialEntries.find(e => e.id === item.id);
                                  if (entryToEdit) {
                                    setEditingFinancialEntry(entryToEdit);
                                    setIsAddFinancialEntryModalOpen(true);
                                  }
                                }
                          }}
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <span className="font-pixel" style={{ fontSize: '16px' }}>
                              {item.value >= 0 ? '+' : '−'}
                            </span>
                            <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    {item.frequency === 'recorrente' && (
                                      <span className="text-xs font-pixel" style={{ color: '#9ca3af' }}>↻</span>
                                    )}
                                    {item.installments && item.installments.total > 1 && (
                                      <span className="text-base">📆</span>
                                    )}
                              <p className="font-pixel-bold" style={{ color: '#111', fontSize: '16px' }}>
                                {item.description}
                              </p>
                                    {item.installments && item.installments.total > 1 && (
                                      <span className="font-pixel text-xs ml-1" style={{ color: '#666' }}>
                                        ({item.installments.current}/{item.installments.total})
                                      </span>
                                    )}
                                  </div>
                              <div className="flex items-center gap-2 mt-1">
                                {item.category && (
                                  <span 
                                    className="font-pixel text-xs px-2 py-0.5 rounded"
                                    style={{ 
                                      backgroundColor: '#e0e0e0',
                                      color: '#666',
                                    }}
                                  >
                                    {item.category}
                                  </span>
                                )}
                                    {item.frequency === 'recorrente' && (
                                      <span 
                                        className="font-pixel text-xs px-2 py-0.5 rounded"
                                        style={{ 
                                          backgroundColor: item.installments && item.installments.total > 1 ? '#fff3e0' : '#e3f2fd',
                                          color: item.installments && item.installments.total > 1 ? '#f57c00' : '#1976d2',
                                        }}
                                      >
                                        {item.installments && item.installments.total > 1 ? 'Parcelado' : 'Recorrente'}
                                  </span>
                                )}
                                {item.relatedGoalId && (
                                  <p className="font-pixel text-xs" style={{ color: '#666' }}>
                                        {possessions.find(p => p.id === item.relatedGoalId)?.title || 'Objetivo'}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <span 
                              className="font-pixel-bold block" 
                              style={{ 
                                color: item.value >= 0 ? '#4caf50' : '#f44336', 
                                fontSize: '16px' 
                              }}
                            >
                              R$ {Math.abs(item.value).toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            {/* Botão de Editar */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Verificar se é do sistema antigo ou novo
                                const isLegacy = dailyItems.find(d => d.id === item.id);
                                if (isLegacy) {
                                  // Sistema antigo: converter para formato de edição (não suportado ainda)
                                  alert('Edição de entradas do sistema antigo: use o modal de adicionar gasto para criar uma nova entrada');
                                } else {
                                  // Sistema novo: buscar e editar
                                  const financialEntries = getEntriesForDate(dateKey);
                                  const entryToEdit = financialEntries.find(e => e.id === item.id);
                                  if (entryToEdit) {
                                    setEditingFinancialEntry(entryToEdit);
                                    setIsAddFinancialEntryModalOpen(true);
                                  }
                                }
                              }}
                              className="text-gray-500 hover:text-blue-600 transition-colors"
                              style={{ fontSize: '14px', padding: '4px 8px' }}
                              title="Editar"
                            >
                              ✏️
                            </button>
                            {/* Botão de Excluir */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const confirmMessage = item.frequency === 'recorrente' 
                                  ? `Encerrar recorrência "${item.description}"? (A entrada será removida apenas desta data)` 
                                  : `Remover "${item.description}"?`;
                                if (confirm(confirmMessage)) {
                                  // Se for do sistema antigo, usar removeDailyExpense
                                  if (dailyItems.find(d => d.id === item.id)) {
                                    removeDailyExpense(dateKey, item.id);
                                  } else {
                                    // Se for do novo sistema
                                    const financialEntries = getEntriesForDate(dateKey);
                                    const entryToRemove = financialEntries.find(e => e.id === item.id);
                                    
                                    if (entryToRemove && entryToRemove.frequency === 'recorrente') {
                                      // Se for recorrente, encerrar recorrência (definir endDate)
                                      endRecurrence(entryToRemove.id, dateKey);
                                      // Forçar atualização da lista de recorrentes
                                      setRecurringEntriesUpdateKey(prev => prev + 1);
                                    } else {
                                      // Se for pontual, remover completamente
                                      removeFinancialEntry(item.id);
                                    }
                                  }
                                  // Recarregar dados após um delay maior para garantir que o localStorage foi atualizado
                                  setTimeout(() => {
                                    const items = getDailyExpenses(dateKey);
                                    setDailyItems(items);
                                    const monthKey = formatMonthKey(selectedMonth);
                                    const desired = getDesiredMonthlyExpense(monthKey) || 0;
                                    const reset = getResetDate(monthKey) || 1;
                                    const rows = calculateMonthlyData(selectedMonth.getFullYear(), selectedMonth.getMonth(), desired, reset, getEntriesForDate);
                                    setMonthlyRows(rows);
                                    
                                    // Atualizar progresso dos objetivos baseado no dinheiro em conta atualizado
                                    const today = new Date();
                                    const todayKey = formatDateKey(today);
                                    const accountMoney = getAccountMoney(todayKey);
                                    const reserve = getCurrentReserve();
                                    updateAllProgressFromAccountMoney(accountMoney, reserve);
                                    setTimeout(() => {
                                      setPossessions(getAllPossessions());
                                    }, 100);
                                  }, 200);
                                }
                              }}
                              className="text-gray-400 hover:text-red-600 transition-colors"
                              style={{ fontSize: '18px', padding: '4px 8px' }}
                              title="Excluir"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                    );
                  })()}

                  {/* Resumo do dia - card discreto */}
                  {(() => {
                    // Buscar entradas financeiras para a data selecionada
                    const dateKey = formatDateKey(selectedDate);
                    const financialEntries = getEntriesForDate(dateKey);
                    
                    // Combinar gastos pontuais e entradas financeiras para cálculo
                    const allItemsForCalculation = [
                      ...dailyItems,
                      ...financialEntries.map(entry => ({
                        id: entry.id,
                        description: entry.description,
                        value: entry.amount,
                      }))
                    ];
                    
                    if (allItemsForCalculation.length === 0) return null;
                    
                    const totalGasto = allItemsForCalculation.filter(item => item.value < 0).reduce((sum, item) => sum + Math.abs(item.value), 0);
                    const totalGanho = allItemsForCalculation.filter(item => item.value > 0).reduce((sum, item) => sum + item.value, 0);
                    const totalLiquido = totalGanho - totalGasto;
                    
                    return (
                      <div className="mt-4 p-4 rounded" style={{ backgroundColor: '#FFFFFF', border: '1px solid #e5e5e5', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <div className="font-pixel text-xs mb-1" style={{ color: '#666' }}>Total Gasto</div>
                            <div className="font-pixel-bold" style={{ color: '#f44336', fontSize: '16px' }}>
                              R$ {totalGasto.toFixed(2).replace('.', ',')}
                            </div>
                          </div>
                          <div>
                            <div className="font-pixel text-xs mb-1" style={{ color: '#666' }}>Total Ganho</div>
                            <div className="font-pixel-bold" style={{ color: '#4caf50', fontSize: '16px' }}>
                              R$ {totalGanho.toFixed(2).replace('.', ',')}
                            </div>
                          </div>
                          <div>
                            <div className="font-pixel text-xs mb-1" style={{ color: '#666' }}>Total Líquido</div>
                            <div className="font-pixel-bold" style={{ color: totalLiquido >= 0 ? '#4caf50' : '#f44336', fontSize: '16px' }}>
                              {totalLiquido >= 0 ? '+' : ''}R$ {Math.abs(totalLiquido).toFixed(2).replace('.', ',')}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                </div>
              )}

              {activeFinanceTab === 'monthly' && (() => {
                // Cálculos para o painel superior
                const today = new Date();
                const isCurrentMonth = selectedMonth.getMonth() === today.getMonth() && selectedMonth.getFullYear() === today.getFullYear();
                const currentDay = isCurrentMonth ? today.getDate() : new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
                const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
                const daysRemaining = Math.max(0, daysInMonth - currentDay + 1);
                
                const totalSpent = monthlyRows.reduce((sum, row) => sum + (row.totalDaily < 0 ? Math.abs(row.totalDaily) : 0), 0);
                const totalGained = monthlyRows.reduce((sum, row) => sum + (row.totalDaily > 0 ? row.totalDaily : 0), 0);
                const monthlyLimit = (typeof desiredMonthlyExpense === 'number' ? desiredMonthlyExpense : (desiredMonthlyExpense === '' ? 0 : parseFloat(String(desiredMonthlyExpense)) || 0));
                const availableNow = monthlyLimit - totalSpent;
                const recommendedDaily = daysRemaining > 0 ? Math.max(0, availableNow / daysRemaining) : 0;
                
                // Status do mês
                const spendingPercentage = monthlyLimit > 0 ? (totalSpent / monthlyLimit) * 100 : 0;
                const statusText = spendingPercentage < 50 ? 'Abaixo do ritmo' : spendingPercentage < 80 ? 'Atenção' : 'Acima do limite';
                
                return (
                <div>
                  {/* SEÇÃO A — Cabeçalho do Mês */}
                  <div className="mb-4 p-4 rounded" style={{ backgroundColor: '#FFFFFF', border: '1px solid #e5e5e5', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-pixel-bold" style={{ color: '#111', fontSize: '20px' }}>
                        {formatMonthYear(selectedMonth)}
                      </h2>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1))}
                          className="px-3 py-1 rounded font-pixel transition-all hover:opacity-90"
                          style={{
                            backgroundColor: '#fafafa',
                            border: '1px solid #e5e5e5',
                            color: '#111',
                            fontSize: '16px',
                          }}
                        >
                          ←
                        </button>
                        <button
                          onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1))}
                          className="px-3 py-1 rounded font-pixel transition-all hover:opacity-90"
                          style={{
                            backgroundColor: '#fafafa',
                            border: '1px solid #e5e5e5',
                            color: '#111',
                            fontSize: '16px',
                          }}
                        >
                          →
                        </button>
                      </div>
                    </div>
                    
                    {/* 4 indicadores em cartões pequenos */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="p-3 rounded" style={{ backgroundColor: '#fafafa', border: '1px solid #e5e5e5' }}>
                        <div className="font-pixel text-xs mb-1" style={{ color: '#666' }}>Limite Mensal</div>
                        <div className="font-pixel-bold" style={{ color: '#111', fontSize: '16px' }}>
                          R$ {monthlyLimit.toFixed(2).replace('.', ',')}
                        </div>
                      </div>
                      <div className="p-3 rounded" style={{ backgroundColor: '#fafafa', border: '1px solid #e5e5e5' }}>
                        <div className="font-pixel text-xs mb-1" style={{ color: '#666' }}>Gasto Acumulado</div>
                        <div className="font-pixel-bold" style={{ color: '#f44336', fontSize: '16px' }}>
                          R$ {totalSpent.toFixed(2).replace('.', ',')}
                        </div>
                      </div>
                      <div className="p-3 rounded" style={{ backgroundColor: '#fafafa', border: '1px solid #e5e5e5' }}>
                        <div className="font-pixel text-xs mb-1" style={{ color: '#666' }}>Disponível</div>
                        <div className="font-pixel-bold" style={{ color: '#4caf50', fontSize: '16px' }}>
                          R$ {availableNow.toFixed(2).replace('.', ',')}
                        </div>
                      </div>
                      <div className="p-3 rounded" style={{ backgroundColor: '#fafafa', border: '1px solid #e5e5e5' }}>
                        <div className="font-pixel text-xs mb-1" style={{ color: '#666' }}>Diário Recomendado</div>
                        <div className="font-pixel-bold" style={{ color: '#111', fontSize: '16px' }}>
                          R$ {recommendedDaily.toFixed(2).replace('.', ',')}/dia
                        </div>
                      </div>
                    </div>
                    
                    {/* Status do mês - barra horizontal fina */}
                    <div className="mt-4 pt-4 border-t" style={{ borderColor: '#e5e5e5' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-pixel text-sm" style={{ color: '#666' }}>Status: {statusText}</span>
                        <span className="font-pixel text-xs" style={{ color: '#666' }}>
                          {spendingPercentage.toFixed(1)}% utilizado
                        </span>
                      </div>
                      <div className="w-full h-2 rounded" style={{ backgroundColor: '#e5e5e5' }}>
                        <div 
                          className="h-full rounded transition-all" 
                          style={{ 
                            width: `${Math.min(spendingPercentage, 100)}%`, 
                            backgroundColor: spendingPercentage < 50 ? '#4caf50' : spendingPercentage < 80 ? '#ff9800' : '#f44336'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* SEÇÃO B — Configurações do Mês */}
                  <div className="mb-4 p-4 rounded" style={{ backgroundColor: '#fafafa', border: '1px solid #e5e5e5' }}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="font-pixel text-xs block mb-1" style={{ color: '#666' }}>Limite mensal</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={desiredMonthlyExpense === '' || desiredMonthlyExpense === null || desiredMonthlyExpense === undefined ? '' : desiredMonthlyExpense}
                            placeholder="–"
                            onChange={(e) => {
                              const val = e.target.value === '' ? '' : parseFloat(e.target.value) || '';
                              setDesiredMonthlyExpense(val);
                            }}
                            className="flex-1 px-2 py-1 rounded font-pixel"
                            style={{
                              backgroundColor: '#FFFFFF',
                              border: '1px solid #e5e5e5',
                              color: '#111',
                              fontSize: '14px',
                            }}
                          />
                          <button
                            onClick={() => {
                              try {
                                let val: number;
                                if (typeof desiredMonthlyExpense === 'number') {
                                  val = desiredMonthlyExpense;
                                } else if (desiredMonthlyExpense === '' || desiredMonthlyExpense === null || desiredMonthlyExpense === undefined) {
                                  val = 0;
                                } else {
                                  val = parseFloat(String(desiredMonthlyExpense)) || 0;
                                }
                                
                                const monthKey = formatMonthKey(selectedMonth);
                                saveDesiredMonthlyExpense(monthKey, val);
                                // Recarregar monthlyRows após salvar
                                const reset = getResetDate(monthKey) || 1;
                                const rows = calculateMonthlyData(selectedMonth.getFullYear(), selectedMonth.getMonth(), val, reset);
                                setMonthlyRows(rows);
                                // Disparar evento para atualizar Display
                                if (typeof window !== "undefined") {
                                  window.dispatchEvent(new Event("pixel-life-storage-change"));
                                }
                              } catch (error) {
                                console.error('Erro ao salvar limite mensal:', error);
                                alert('Erro ao salvar limite mensal. Verifique o console para mais detalhes.');
                              }
                            }}
                            className="px-2 py-1 rounded font-pixel text-xs transition-all hover:opacity-90"
                            style={{
                              backgroundColor: '#9e9e9e',
                              border: '1px solid #9e9e9e',
                              color: '#FFFFFF',
                            }}
                          >
                            Salvar
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="font-pixel text-xs block mb-1" style={{ color: '#666' }}>Dia de reset</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={resetDate === '' || resetDate === null || resetDate === undefined ? '' : resetDate}
                            placeholder="–"
                            onChange={async (e) => {
                              const val = e.target.value === '' ? '' : parseInt(e.target.value) || '';
                              if (val === '' || (typeof val === 'number' && val >= 1 && val <= 31)) {
                                setResetDate(val);
                                // Atualizar tabela em tempo real enquanto edita
                                if (typeof val === 'number' && val >= 1 && val <= 31) {
                                  try {
                                    const monthKey = formatMonthKey(selectedMonth);
                                    const desired = getDesiredMonthlyExpense(monthKey) || 0;
                                    const rows = calculateMonthlyData(selectedMonth.getFullYear(), selectedMonth.getMonth(), desired, val);
                                    setMonthlyRows(rows);
                                  } catch (error) {
                                    console.error('Erro ao atualizar tabela:', error);
                                  }
                                }
                              }
                            }}
                            min="1"
                            max="31"
                            className="flex-1 px-2 py-1 rounded font-pixel"
                            style={{
                              backgroundColor: '#FFFFFF',
                              border: '1px solid #e5e5e5',
                              color: '#111',
                              fontSize: '14px',
                            }}
                          />
                          <button
                            onClick={async () => {
                              try {
                                let val: number;
                                if (typeof resetDate === 'number') {
                                  val = resetDate;
                                } else if (resetDate === '' || resetDate === null || resetDate === undefined) {
                                  val = 1;
                                } else {
                                  val = parseInt(String(resetDate)) || 1;
                                }
                                
                                if (val >= 1 && val <= 31) {
                                  const monthKey = formatMonthKey(selectedMonth);
                                  saveResetDate(monthKey, val);
                                  // Recarregar monthlyRows após salvar
                                  const desired = getDesiredMonthlyExpense(monthKey) || 0;
                                  const rows = calculateMonthlyData(selectedMonth.getFullYear(), selectedMonth.getMonth(), desired, val);
                                  setMonthlyRows(rows);
                                  // Disparar evento para atualizar Display
                                  if (typeof window !== "undefined") {
                                    window.dispatchEvent(new Event("pixel-life-storage-change"));
                                  }
                                } else {
                                  alert('Dia de reset deve estar entre 1 e 31.');
                                }
                              } catch (error) {
                                console.error('Erro ao salvar dia de reset:', error);
                                alert('Erro ao salvar dia de reset. Verifique o console para mais detalhes.');
                              }
                            }}
                            className="px-2 py-1 rounded font-pixel text-xs transition-all hover:opacity-90"
                            style={{
                              backgroundColor: '#9e9e9e',
                              border: '1px solid #9e9e9e',
                              color: '#FFFFFF',
                            }}
                          >
                            Salvar
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="font-pixel text-xs block mb-1" style={{ color: '#666' }}>Dinheiro atual em conta</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={accountMoney ?? ""}
                            placeholder="–"
                            onChange={(e) => {
                              // Permite apagar completamente (string vazia)
                              setAccountMoney(e.target.value);
                            }}
                            className="flex-1 px-2 py-1 rounded font-pixel"
                            style={{
                              backgroundColor: '#FFFFFF',
                              border: '1px solid #e5e5e5',
                              color: '#111',
                              fontSize: '14px',
                            }}
                          />
                          <button
                            onClick={async () => {
                              try {
                                // Converter string para número ao salvar
                                if (!accountMoney || accountMoney.trim() === '') {
                                  return;
                                }
                                const parsed = parseFloat(accountMoney.replace(",", "."));
                                if (isNaN(parsed)) {
                                  // Se inválido, não salva
                                  return;
                                }
                                
                                // Salvar APENAS para o dia atual (hoje) - só funciona para mês e dia atual
                                const today = new Date();
                                const isCurrentMonth = 
                                  selectedMonth.getFullYear() === today.getFullYear() &&
                                  selectedMonth.getMonth() === today.getMonth();
                                
                                // Só permite salvar se estiver no mês atual - retorna silenciosamente se não for
                                if (!isCurrentMonth) {
                                  return;
                                }
                                
                                // Salvar para o dia de hoje
                                const todayKey = formatDateKey(today);
                                
                                // Salva o valor FINAL do dia (o que o usuário digitou)
                                // Os dias seguintes calcularão incrementalmente: dia+1 = dia + totalDiário_dia+1
                                await saveAccountMoney(todayKey, parsed);
                                
                                // Atualizar o valor exibido
                                setAccountMoney(parsed.toString());
        
                                // Recarregar monthlyRows após salvar (rebuild completo)
                                // Isso garante que todos os dias do mês mostrem os valores recalculados
                                const monthKey = formatMonthKey(selectedMonth);
                                const desired = getDesiredMonthlyExpense(monthKey) || 0;
                                const reset = getResetDate(monthKey) || 1;
                                
                                // Recalcular mês atual
                                const rows = calculateMonthlyData(selectedMonth.getFullYear(), selectedMonth.getMonth(), desired, reset, getEntriesForDate);
                                setMonthlyRows(rows);
                                
                                // Atualizar progresso dos objetivos baseado no dinheiro em conta atualizado
                                const savedAccountMoney = getAccountMoney(todayKey);
                                const reserve = getCurrentReserve();
                                updateAllProgressFromAccountMoney(savedAccountMoney, reserve);
                                setTimeout(() => {
                                  setPossessions(getAllPossessions());
                                }, 100);
                                
                                // Disparar evento para atualizar Display e outros componentes
                                if (typeof window !== "undefined") {
                                  window.dispatchEvent(new Event("pixel-life-storage-change"));
                                }
                              } catch (error) {
                                console.error('Erro ao salvar dinheiro em conta:', error);
                                alert('Erro ao salvar dinheiro em conta. Verifique o console para mais detalhes.');
                              }
                            }}
                            className="px-2 py-1 rounded font-pixel text-xs transition-all hover:opacity-90"
                            style={{
                              backgroundColor: '#9e9e9e',
                              border: '1px solid #9e9e9e',
                              color: '#FFFFFF',
                            }}
                          >
                            Salvar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SEÇÃO C — Plano Mensal (Prancheta) */}
                  <div className="mb-4 rounded overflow-hidden" style={{ border: '1px solid #e5e5e5', backgroundColor: '#FFFFFF' }}>
                    {/* Cabeçalho da tabela */}
                    <div className="grid grid-cols-[50px_1.05fr_110px_110px_110px_90px] md:grid-cols-[50px_1.05fr_110px_110px_110px_90px] border-b overflow-x-auto min-w-[600px]" style={{ borderColor: '#e5e5e5', backgroundColor: '#fafafa' }}>
                      <div className="py-2 px-3 font-pixel-bold text-center" style={{ color: '#666', fontSize: '12px' }}>Dia</div>
                      <div className="py-2 px-3 font-pixel-bold text-left" style={{ color: '#666', fontSize: '12px' }}>Detalhes</div>
                      <div className="py-2 px-3 font-pixel-bold text-right" style={{ color: '#666', fontSize: '12px' }}>Total diário</div>
                      <div className="py-2 px-3 font-pixel-bold text-right" style={{ color: '#666', fontSize: '12px' }}>Limite</div>
                      <div className="py-2 px-3 font-pixel-bold text-right" style={{ color: '#666', fontSize: '12px' }}>Em conta</div>
                      <div className="py-2 px-3 font-pixel-bold text-right" style={{ color: '#666', fontSize: '12px' }}>Reserva</div>
                    </div>
                    <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                      {monthlyRows.length === 0 ? (
                        <div className="p-4 text-center font-pixel" style={{ color: '#999', fontSize: '13px' }}>
                          Nenhum dado disponível.
                        </div>
                      ) : (
                        monthlyRows.map((row, idx) => {
                          const today = new Date();
                          const isToday = 
                            today.getFullYear() === selectedMonth.getFullYear() &&
                            today.getMonth() === selectedMonth.getMonth() &&
                            today.getDate() === row.day;
                          
                          // Calcular Limite Restante: LimiteMensal - gastosAcumulados desde o resetDay do ciclo
                          // INVARIANTE: resetDay afeta apenas orçamento, não saldo
                          // O ciclo de orçamento pode atravessar meses
                          // IMPORTANTE: O limite usado deve ser o do mês onde o ciclo começou, não do mês atual
                          const resetDay = (typeof resetDate === 'number' ? resetDate : parseInt(String(resetDate)) || 1);
                          
                          // Data do dia da linha para cálculo
                          const rowDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), row.day);
                          const rowDateKey = formatDateKey(rowDate);
                          
                          var limiteRestante = 0;
                          if (resetDay > 0) {
                            // Usar getCycleDates para calcular corretamente o início do ciclo
                            // Isso garante que o ciclo atravessa meses corretamente
                            const { cycleStart } = getCycleDates(rowDateKey, resetDay);
                            
                            // Buscar o limite mensal do mês onde o ciclo começou (não do mês atual)
                            // Se o ciclo começou em dezembro, usar o limite de dezembro, mesmo estando em janeiro
                            const cycleStartMonthKey = formatMonthKey(cycleStart);
                            const monthlyLimitDoCiclo = getDesiredMonthlyExpense(cycleStartMonthKey) || 0;
                            
                            if (monthlyLimitDoCiclo > 0) {
                              // Calcular gastos acumulados desde o início do ciclo até o dia da linha
                              // IMPORTANTE: Soma apenas valores negativos (gastos), não ganhos
                              let gastosAcumulados = 0;
                              let currentDate = new Date(cycleStart);
                              currentDate.setHours(0, 0, 0, 0);
                              const targetDate = new Date(rowDate);
                              targetDate.setHours(0, 0, 0, 0);
                              
                              while (currentDate <= targetDate) {
                                const checkDateKey = formatDateKey(currentDate);
                                const dailyTotal = calculateDailyTotal(checkDateKey);
                                // Incluir recorrentes do novo sistema
                                const financialEntries = getEntriesForDate(checkDateKey);
                                const recurringTotal = financialEntries.reduce((sum, entry) => sum + entry.amount, 0);
                                const totalWithRecurring = dailyTotal + recurringTotal;
                                // Soma apenas valores negativos (gastos), não ganhos
                                if (totalWithRecurring < 0) {
                                  gastosAcumulados += Math.abs(totalWithRecurring);
                                }
                                // Avançar para o próximo dia
                                currentDate.setDate(currentDate.getDate() + 1);
                                currentDate.setHours(0, 0, 0, 0);
                              }
                              
                              // Limite Restante = Limite Mensal (do ciclo) - Gastos Acumulados (desde início do ciclo)
                              limiteRestante = Math.max(0, monthlyLimitDoCiclo - gastosAcumulados);
                            }
                          }
                          
                          // Buscar itens do dia para formatar detalhes
                          const dateKey = formatDateKey(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), row.day));
                          
                          // Total diário (igual ao Total Líquido do diário): ganhos - gastos
                          // Incluir recorrentes do novo sistema que aparecem neste dia
                          const financialEntriesForDay = getEntriesForDate(dateKey);
                          const recurringTotalForDay = financialEntriesForDay.reduce((sum, entry) => sum + entry.amount, 0);
                          const totalDiario = row.totalDaily + recurringTotalForDay;
                          const dayItems = getDailyExpenses(dateKey);
                          
                          // Buscar entradas financeiras do novo sistema (pontuais + recorrentes válidos para este dia)
                          const financialEntries = getEntriesForDate(dateKey);
                          
                          // Combinar itens do dia e entradas financeiras
                          const allItems: Array<{
                            description: string;
                            value: number;
                            frequency?: 'pontual' | 'recorrente';
                            installments?: { total: number; current: number };
                          }> = [];
                          
                          // Adicionar gastos pontuais antigos (legado)
                          dayItems.forEach(item => {
                            allItems.push({
                              description: item.description,
                              value: item.value,
                              frequency: 'pontual',
                            });
                          });
                          
                          // Adicionar entradas do novo sistema (pontuais e recorrentes válidos para este dia)
                          financialEntries.forEach(entry => {
                            allItems.push({
                              description: entry.description,
                              value: entry.amount,
                              frequency: entry.frequency,
                              installments: entry.installments,
                            });
                          });
                          
                          // IMPORTANTE: Recorrentes são UMA entidade que aparece dinamicamente
                          // Não são duplicados - apenas interpretados para cada dia
                          
                          // Formatar detalhes: "Descrição 1 (Valor1) + Descrição 2 (Valor 2)"
                          let detalhesFormatados = '-';
                          if (allItems.length > 0) {
                            detalhesFormatados = allItems.map(item => {
                              const valorFormatado = `R$ ${Math.abs(item.value).toFixed(2).replace('.', ',')}`;
                              return `${item.description} (${valorFormatado})`;
                            }).join(' + ');
                          }
                          
                          // Dinheiro em conta: usar getAccountMoney (versão simplificada que busca o último valor salvo no mês)
                          const dinheiroEmConta = getAccountMoney(dateKey);
                          
                          return (
                            <div
                              key={idx}
                              className="grid grid-cols-[50px_1.05fr_110px_110px_110px_90px] md:grid-cols-[50px_1.05fr_110px_110px_110px_90px] border-b last:border-b-0 transition-colors hover:bg-gray-50 min-w-[600px]"
                              style={{
                                backgroundColor: isToday ? '#fff9e6' : idx % 2 === 0 ? '#ffffff' : '#f6f6f6',
                                borderBottomColor: '#eeeeee',
                                height: '38px',
                              }}
                            >
                              <div className="py-2 px-3 font-pixel text-center flex items-center justify-center" style={{ color: '#333', fontSize: '12px' }}>
                                {String(row.day).padStart(2, '0')}
                              </div>
                              <div className="py-2 px-3 font-pixel text-left flex items-center flex-wrap gap-x-1 gap-y-0.5" style={{ color: '#333', fontSize: '12px' }}>
                                {allItems.length > 0 ? (
                                  <>
                                    {allItems.map((item, itemIdx) => {
                                      const valorFormatado = `R$ ${Math.abs(item.value).toFixed(2).replace('.', ',')}`;
                                      const valorColor = item.value >= 0 ? '#4caf50' : '#f44336';
                                      // Badge para recorrente
                                      const isRecurring = item.frequency === 'recorrente';
                                      // Badge para parcelado
                                      const isInstallment = item.installments && item.installments.total > 1;
                                      
                                      return (
                                        <span key={itemIdx} className="whitespace-nowrap">
                                          {itemIdx > 0 && <span className="mx-0.5">+</span>}
                                          {isRecurring && <span className="mr-1">🔁</span>}
                                          {isInstallment && <span className="mr-1">📆</span>}
                                          <span>{item.description}</span>
                                          {isInstallment && item.installments && (
                                            <span className="text-xs ml-1" style={{ color: '#666' }}>
                                              ({item.installments.current}/{item.installments.total})
                                            </span>
                                          )}
                                          <span className="ml-1">(</span>
                                          <span style={{ color: valorColor }}>{valorFormatado}</span>
                                          <span>)</span>
                                        </span>
                                      );
                                    })}
                                  </>
                                ) : (
                                  '-'
                                )}
                              </div>
                              <div className="py-2 px-3 font-pixel text-right flex items-center justify-end" style={{ 
                                color: totalDiario > 0 ? '#4caf50' : totalDiario < 0 ? '#f44336' : '#999',
                                fontSize: '12px',
                              }}>
                                {totalDiario !== 0 ? `${totalDiario >= 0 ? '+' : ''}R$ ${totalDiario.toFixed(2).replace('.', ',')}` : 'R$ 0,00'}
                              </div>
                              <div className="py-2 px-3 font-pixel text-right flex items-center justify-end" style={{ 
                                color: '#2196f3',
                                fontSize: '12px',
                              }}>
                                R$ {limiteRestante.toFixed(2).replace('.', ',')}
                              </div>
                              <div 
                                className="py-2 px-3 font-pixel text-right flex items-center justify-end cursor-pointer hover:bg-gray-100 transition-colors" 
                                style={{ 
                                  color: '#666',
                                  fontSize: '12px',
                                }}
                                onClick={() => {
                                  const editDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), row.day);
                                  setEditingAccountMoneyDate(editDate);
                                  setEditingAccountMoneyValue(dinheiroEmConta);
                                  setIsEditAccountMoneyModalOpen(true);
                                }}
                                title={tString('common.clickToEdit')}
                              >
                                R$ {dinheiroEmConta.toFixed(2).replace('.', ',')}
                              </div>
                              <div className="py-2 px-3 font-pixel text-right flex items-center justify-end" style={{ 
                                color: '#999',
                                fontSize: '12px',
                              }}>
                                R$ {row.reserve.toFixed(2).replace('.', ',')}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
                );
              })()}

              {activeFinanceTab === 'reserve' && (
                <div>
                  {/* Navegação por mês */}
                  <div className="mb-4 flex items-center justify-center gap-4">
                    <button
                      onClick={() => {
                        const newDate = new Date(selectedReserveMonth);
                        newDate.setMonth(newDate.getMonth() - 1);
                        setSelectedReserveMonth(newDate);
                      }}
                      className="px-3 py-2 rounded font-pixel transition-all hover:opacity-90"
                      style={{
                        backgroundColor: '#f5f5f5',
                        border: '1px solid #d6d6d6',
                        color: '#111',
                        fontSize: '14px',
                        cursor: 'pointer',
                      }}
                    >
                      ←
                    </button>
                    <div className="font-pixel-bold text-center" style={{ color: '#111', fontSize: '16px', minWidth: '200px' }}>
                      {selectedReserveMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </div>
                    <button
                      onClick={() => {
                        const newDate = new Date(selectedReserveMonth);
                        newDate.setMonth(newDate.getMonth() + 1);
                        setSelectedReserveMonth(newDate);
                      }}
                      className="px-3 py-2 rounded font-pixel transition-all hover:opacity-90"
                      style={{
                        backgroundColor: '#f5f5f5',
                        border: '1px solid #d6d6d6',
                        color: '#111',
                        fontSize: '14px',
                        cursor: 'pointer',
                      }}
                    >
                      →
                    </button>
                  </div>

                  {/* Total da reserva no topo */}
                  <div className="mb-4 p-4 rounded text-center" style={{ backgroundColor: '#fafafa', border: '1px solid #e5e5e5', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div className="font-pixel text-xs mb-1" style={{ color: '#666' }}>Total da Reserva</div>
                    <div className="font-pixel-bold text-2xl" style={{ color: '#111' }}>
                      R$ {reserve.toFixed(2).replace('.', ',')}
                    </div>
                  </div>

                  {/* Botão de adicionar - discreto */}
                  <div className="mb-4">
                    <button
                      onClick={() => setIsAddReserveModalOpen(true)}
                      className="w-full px-4 py-2 rounded font-pixel transition-all hover:opacity-90 tactile-button"
                      style={{
                        backgroundColor: '#9e9e9e',
                        border: '1px solid #9e9e9e',
                        color: '#FFFFFF',
                        fontSize: '16px',
                      }}
                    >
                      + Adicionar Movimentação
                    </button>
                  </div>

                  {/* Lista de movimentações - cards limpos */}
                  <div className="mb-4 space-y-2">
                    {monthlyReserveItems.length === 0 ? (
                      <div className="text-center py-8 px-4 rounded" style={{ backgroundColor: '#fafafa', border: '1px solid #e5e5e5' }}>
                        <p className="font-pixel" style={{ color: '#999', fontSize: '14px' }}>
                          Nenhuma movimentação registrada
                        </p>
                      </div>
                    ) : (
                      monthlyReserveItems.map((item) => {
                        const itemDate = new Date(item.createdAt + 'T00:00:00');
                        const itemDateKey = formatDateKey(itemDate);
                        const isDeposit = item.value >= 0;
                        return (
                          <div
                            key={item.id}
                            className="p-3 rounded flex justify-between items-center transition-all hover:shadow-sm"
                            style={{ 
                              backgroundColor: '#fafafa', 
                              border: '1px solid #e5e5e5',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                            }}
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <span className="font-pixel" style={{ fontSize: '16px' }}>
                                {isDeposit ? '+' : '−'}
                              </span>
                              <div className="flex-1">
                                <div className="font-pixel-bold" style={{ color: '#111', fontSize: '14px' }}>
                                  {item.description ? item.description : (isDeposit ? 'Depósito' : 'Retirada')}
                                </div>
                                <div className="font-pixel text-xs mt-1" style={{ color: '#666' }}>
                                  {itemDateKey}
                                </div>
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <span 
                                className="font-pixel-bold block" 
                                style={{ 
                                  color: isDeposit ? '#4caf50' : '#f44336',
                                  fontSize: '14px'
                                }}
                              >
                                R$ {Math.abs(item.value).toFixed(2).replace('.', ',')}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                showConfirmation({
                                  message: `Tem certeza que deseja excluir esta movimentação de reserva?`,
                                  onConfirm: () => {
                                    removeReserveMovement(itemDateKey, item.id);
                                    
                                    // Atualizar reserveItems para disparar o useEffect de monthlyReserveItems
                                    const dateKey = formatDateKey(selectedDate);
                                    const rItems = getReserveMovements(dateKey);
                                    setReserveItems(rItems);
                                    
                                    // Atualizar monthlyReserveItems imediatamente
                                    const year = selectedMonth.getFullYear();
                                    const month = selectedMonth.getMonth();
                                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                                    const allReserveItems: ReserveMovement[] = [];
                                    
                                    for (let day = 1; day <= daysInMonth; day++) {
                                      const date = new Date(year, month, day);
                                      const dateKey = formatDateKey(date);
                                      const dayItems = getReserveMovements(dateKey);
                                      allReserveItems.push(...dayItems);
                                    }
                                    
                                    allReserveItems.sort((a, b) => {
                                      const dateA = new Date(a.createdAt).getTime();
                                      const dateB = new Date(b.createdAt).getTime();
                                      return dateB - dateA;
                                    });
                                    
                                    setMonthlyReserveItems(allReserveItems);
                                    
                                    // Atualizar progresso dos objetivos baseado no dinheiro em conta atualizado
                                    const today = new Date();
                                    const todayKey = formatDateKey(today);
                                    const accountMoney = getAccountMoney(todayKey);
                                    const reserve = getCurrentReserve();
                                    updateAllProgressFromAccountMoney(accountMoney, reserve);
                                    setTimeout(() => {
                                      setPossessions(getAllPossessions());
                                    }, 100);
                                  },
                                });
                              }}
                              className="ml-3 transition-colors"
                              style={{ 
                                fontSize: '24px',
                                color: '#999',
                                cursor: 'pointer',
                                lineHeight: '1',
                                fontWeight: 'bold',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = '#f44336';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = '#999';
                              }}
                            >
                              ×
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {activeFinanceTab === 'analysis' && (() => {
                // Forçar atualização quando recurringEntriesUpdateKey mudar
                const activeRecurring = getActiveRecurringEntries();
                const today = new Date().toISOString().substring(0, 10);
                // Usar recurringEntriesUpdateKey para forçar re-render quando mudar
                const _ = recurringEntriesUpdateKey;
                const currentMonthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1).toISOString().substring(0, 10);
                const currentMonthEnd = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).toISOString().substring(0, 10);
                const categoryAnalysis = getCategoryAnalysis(currentMonthStart, currentMonthEnd);
                
                return (
                  <div className="space-y-6">
                    {/* Recorrentes Ativos */}
                    <div className="p-4 rounded" style={{ backgroundColor: '#FFFFFF', border: '1px solid #e5e5e5' }}>
                      <h3 className="font-pixel-bold mb-4" style={{ color: '#333', fontSize: '18px' }}>
                        Recorrentes Ativos
                      </h3>
                      {activeRecurring.length === 0 ? (
                        <p className="font-pixel text-center py-8" style={{ color: '#999', fontSize: '14px' }}>
                          Nenhum lançamento recorrente ativo
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          {activeRecurring.map((entry) => {
                            const startDate = new Date(entry.startDate + 'T00:00:00');
                            const frequencyLabel = entry.recurrence === 'mensal' ? 'Mensal' : entry.recurrence === 'quinzenal' ? 'Quinzenal' : 'Anual';
                            const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                            const startDateLabel = `${monthNames[startDate.getMonth()]}/${startDate.getFullYear()}`;
                            const metadata = `${frequencyLabel} · desde ${startDateLabel}`;
                            
                            return (
                              <div
                                key={entry.id}
                                className="p-3 rounded border"
                                style={{ 
                                  backgroundColor: '#fafafa', 
                                  border: '1px solid #e5e5e5',
                                }}
                              >
                                {/* Linha 1: Ícone + Nome + Categoria */}
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className="text-xs font-pixel" style={{ color: '#9ca3af' }}>↻</span>
                                  <span className="font-pixel-bold flex-1" style={{ color: '#111', fontSize: '14px' }}>
                                    {entry.description}
                                  </span>
                                  {entry.category && (
                                    <span 
                                      className="px-2 py-[2px] text-xs rounded font-pixel"
                                      style={{ 
                                        backgroundColor: '#f3f4f6',
                                        color: '#4b5563',
                                        border: '1px solid #e5e7eb'
                                      }}
                                    >
                                      {entry.category}
                                    </span>
                                  )}
                                </div>
                                
                                {/* Linha 2: Valor + Metadados + Botão Encerrar */}
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 flex-1">
                                    <span 
                                      className="font-pixel-bold text-sm"
                                      style={{ 
                                        color: entry.amount >= 0 ? '#10b981' : '#ef4444'
                                      }}
                                    >
                                      R$ {Math.abs(entry.amount).toFixed(2).replace('.', ',')}
                                    </span>
                                    <span className="text-xs font-pixel" style={{ color: '#6b7280' }}>
                                      {metadata}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => {
                                      if (confirm(`Encerrar recorrência "${entry.description}" a partir de hoje? Isso não afetará registros passados.`)) {
                                        endRecurrence(entry.id, today);
                                        // Forçar atualização da lista de recorrentes
                                        setRecurringEntriesUpdateKey(prev => prev + 1);
                                        // Recarregar dados mensais
                                        const monthKey = formatMonthKey(selectedMonth);
                                        const desired = getDesiredMonthlyExpense(monthKey) || 0;
                                        const reset = getResetDate(monthKey) || 1;
                                        const rows = calculateMonthlyData(selectedMonth.getFullYear(), selectedMonth.getMonth(), desired, reset, getEntriesForDate);
                                        setMonthlyRows(rows);
                                      }
                                    }}
                                    className="text-xs font-pixel hover:underline transition-colors"
                                    style={{
                                      color: '#ef4444',
                                      fontSize: '12px',
                                    }}
                                  >
                                    Encerrar
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Análise por Categoria */}
                    <div className="p-4 rounded" style={{ backgroundColor: '#FFFFFF', border: '1px solid #e5e5e5', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                      <h3 className="font-pixel-bold mb-4" style={{ color: '#333', fontSize: '18px' }}>
                        Análise por Categoria ({new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })})
                      </h3>
                      {categoryAnalysis.length === 0 ? (
                        <p className="font-pixel text-center py-8" style={{ color: '#999', fontSize: '14px' }}>
                          Nenhum lançamento registrado neste período
                        </p>
                      ) : (
                      <div className="space-y-2">
                          {categoryAnalysis.map((item) => (
                            <div
                              key={item.category}
                              className="p-3 rounded flex items-center justify-between"
                              style={{ backgroundColor: '#fafafa', border: '1px solid #e5e5e5' }}
                            >
                              <span className="font-pixel-bold" style={{ color: '#111', fontSize: '16px' }}>
                                {item.category}
                              </span>
                              <span 
                                className="font-pixel-bold"
                                style={{ 
                                  color: item.total >= 0 ? '#4caf50' : '#f44336',
                                  fontSize: '16px'
                                }}
                              >
                                {item.total >= 0 ? '+' : ''}R$ {item.total.toFixed(2).replace('.', ',')}
                              </span>
                          </div>
                          ))}
                          </div>
                        )}
                    </div>
                  </div>
                );
              })()}
            </div>
              </section>

          {/* MAPAS - Modo contínuo: sempre visível após Finanças; Modo focado: apenas quando ativo */}
          {viewMode === 'continuous' && (
            <section id="map" className="scroll-mt-8 mb-8">
            <div className="section-box">
              <h1 className="font-pixel-bold mb-4" style={{ color: '#333', fontSize: '24px' }}>
                Mapas
              </h1>
              <p className="font-pixel text-center py-8 mb-4" style={{ color: '#666', fontSize: '16px' }}>
                Acesse a página de Mapas para explorar experiências da vida.
              </p>
              <div className="text-center">
                <button
                  onClick={() => router.push('/mapas')}
                  className="inline-block px-6 py-3 rounded font-pixel-bold transition-colors hover:opacity-90 cursor-pointer"
                  style={{
                    backgroundColor: '#7aff7a',
                    border: '1px solid #0f9d58',
                    color: '#111',
                    fontSize: '16px',
                    borderRadius: '8px',
                  }}
                >
                  Abrir Mapas
                </button>
              </div>
              
            </div>
          </section>
          )}

          {/* GUIAS - Modo contínuo: sempre visível após Mapas; Modo focado: apenas quando ativo */}
          {viewMode === 'continuous' && (
            <section id="guides" className="scroll-mt-8 mb-8">
              <div className="section-box">
                <h1 className="font-pixel-bold mb-4" style={{ color: '#333', fontSize: '24px' }}>
                  Guias
                </h1>
                <GuidesSection />
              </div>
            </section>
          )}

          {/* BIOGRAFIA - Modo contínuo: sempre visível após Guias; Modo focado: apenas quando ativo */}
          {viewMode === 'continuous' && isModuleActive('biography') && (
            <section id="biography" className="scroll-mt-8 mb-8">
            <div className="section-box">
              <div className="flex justify-between items-center mb-4">
                <h1 className="font-pixel-bold" style={{ color: '#333', fontSize: '24px' }}>
                  {t('sections.biography')}
                </h1>
                {activeBiographyTab === 'timeline' && (
                  <button
                    onClick={() => {
                      setEditingTimelineEvent(undefined);
                      setIsTimelineModalOpen(true);
                    }}
                    className="px-4 py-2 rounded font-pixel-bold transition-colors hover:opacity-90"
                    style={{
                      backgroundColor: '#7aff7a',
                      border: '1px solid #0f9d58',
                      color: '#111',
                      fontSize: '16px',
                      borderRadius: '8px',
                    }}
                  >
                    + Novo Evento
                  </button>
                )}
                {activeBiographyTab === 'dossies' && (
                  <button
                    onClick={() => {
                      setEditingDossier(undefined);
                      setIsDossierModalOpen(true);
                    }}
                    className="px-4 py-2 rounded font-pixel-bold transition-colors hover:opacity-90"
                    style={{
                      backgroundColor: '#6daffe',
                      border: '1px solid #1b5cff',
                      color: '#111',
                      fontSize: '16px',
                      borderRadius: '8px',
                    }}
                  >
                    + Novo Dossiê
                  </button>
                )}
              </div>

              {/* Abas */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'thin' }}>
                <button
                  onClick={() => setActiveBiographyTab('about')}
                  className="px-4 py-2 font-pixel-bold transition-colors flex-shrink-0 touch-manipulation min-h-[44px]"
                  style={{
                    backgroundColor: activeBiographyTab === 'about' ? '#FFFFFF' : '#d0d0d0',
                    border: activeBiographyTab === 'about' ? '1px solid #000' : '1px solid #d0d0d0',
                    color: activeBiographyTab === 'about' ? '#111' : '#666',
                    fontSize: '16px',
                    borderRadius: '6px',
                  }}
                >
                  Sobre Mim
                </button>
                <button
                  onClick={() => setActiveBiographyTab('dossies')}
                  className="px-4 py-2 font-pixel-bold transition-colors flex-shrink-0 touch-manipulation min-h-[44px]"
                  style={{
                    backgroundColor: activeBiographyTab === 'dossies' ? '#FFFFFF' : '#d0d0d0',
                    border: activeBiographyTab === 'dossies' ? '1px solid #000' : '1px solid #d0d0d0',
                    color: activeBiographyTab === 'dossies' ? '#111' : '#666',
                    fontSize: '16px',
                    borderRadius: '6px',
                  }}
                >
                  Dossiês
                </button>
                <button
                  onClick={() => setActiveBiographyTab('timeline')}
                  className="px-4 py-2 font-pixel-bold transition-colors flex-shrink-0 touch-manipulation min-h-[44px]"
                  style={{
                    backgroundColor: activeBiographyTab === 'timeline' ? '#FFFFFF' : '#d0d0d0',
                    border: activeBiographyTab === 'timeline' ? '1px solid #000' : '1px solid #d0d0d0',
                    color: activeBiographyTab === 'timeline' ? '#111' : '#666',
                    fontSize: '16px',
                    borderRadius: '6px',
                  }}
                >
                  Timeline
                </button>
              </div>

              {/* Conteúdo das abas */}
              {activeBiographyTab === 'timeline' && (
                <TimelineView
                  onEdit={(event) => {
                    setEditingTimelineEvent(event);
                    setIsTimelineModalOpen(true);
                  }}
                  onDelete={(id) => {
                    showConfirmation({
                      message: 'Tem certeza que deseja excluir este evento?',
                      onConfirm: () => removeEvent(id),
                    });
                  }}
                />
              )}

              {activeBiographyTab === 'dossies' && (
                <div>
                  {openDossierId ? (
                    (() => {
                      const openDossier = getAllDossiers().find(d => d.id === openDossierId);
                      if (!openDossier) {
                        setOpenDossierId(null);
                        return null;
                      }
                      return (
                        <DossierView
                          dossier={openDossier}
                          onClose={() => setOpenDossierId(null)}
                          onUpdate={(id, updates) => updateDossier(id, updates)}
                          onDelete={(id) => {
                            showConfirmation({
                              message: `Tem certeza que deseja excluir "${openDossier.title}"?`,
                              onConfirm: () => {
                                removeDossier(id);
                                setOpenDossierId(null);
                              },
                            });
                          }}
                          onRename={(id, newTitle) => updateDossier(id, { title: newTitle })}
                        />
                      );
                    })()
                  ) : (
                    <>
                      {getAllDossiers().length === 0 ? (
                        <div className="text-center py-12 px-4">
                          <div className="mb-4" style={{ fontSize: '48px', lineHeight: '1' }}>📁</div>
                          <p className="font-pixel-bold mb-2" style={{ color: '#111', fontSize: '18px' }}>
                            Nenhum dossiê ainda
                          </p>
                          <p className="font-pixel" style={{ color: '#666', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
                            Crie pastas para guardar histórias, ideias ou fases da sua vida.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {getAllDossiers().map((dossier) => (
                            <DossierCard
                              key={dossier.id}
                              dossier={dossier}
                              onDoubleClick={() => setOpenDossierId(dossier.id)}
                              onTogglePin={() => togglePin(dossier.id)}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {activeBiographyTab === 'about' && (
                <AboutItemsSection
                  onAddItem={(category) => {
                    setSelectedAboutCategory(category);
                    setEditingAboutItem(undefined);
                    setIsAboutItemModalOpen(true);
                  }}
                  onEditItem={(item) => {
                    setEditingAboutItem(item);
                    setSelectedAboutCategory(item.category);
                    setIsAboutItemModalOpen(true);
                  }}
                  onDeleteItem={(id) => {
                    showConfirmation({
                      message: 'Tem certeza que deseja excluir este item?',
                      onConfirm: () => removeItem(id),
                    });
                  }}
                />
              )}
            </div>
          </section>
          )}
            </>
          )}
        </div>
      </div>

      {/* Modal de Personalização */}
      <CustomizeAppModal
        isOpen={isCustomizeModalOpen}
        onClose={() => setIsCustomizeModalOpen(false)}
      />

      {/* Modal de calendário de hábito */}
      {selectedHabit && (() => {
        const monthlyProgress = calculateMonthlyProgress(selectedHabit, calendarMonth);
        const progressColor = getProgressColor(monthlyProgress);
        const progressPercent = Math.round(monthlyProgress * 100);
        
        return (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"
          onClick={() => setSelectedHabit(null)}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 shadow-lg relative"
            style={{ border: '1px solid #e0e0e0' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <h3 className="font-pixel-bold" style={{ color: '#333', fontSize: '24px' }}>
                  {selectedHabit.name}
                </h3>
                <button
                  onClick={() => {
                    handleRenameHabit(selectedHabit.id, selectedHabit.name);
                  }}
                  className="px-2 py-1 rounded font-pixel border border-[#e0e0e0] hover:bg-[#f0f0f0] transition-colors"
                  style={{ color: '#111', fontSize: '16px' }}
                >
                  ✎ Renomear
                </button>
                <button
                  onClick={() => {
                    handleDeleteHabit(selectedHabit.id, selectedHabit.name);
                  }}
                  className="px-2 py-1 rounded font-pixel border border-[#e0e0e0] hover:bg-red-50 transition-colors"
                  style={{ color: '#C62828', fontSize: '16px' }}
                >
                  🗑 Excluir
                </button>
              </div>
              <button
                onClick={() => setSelectedHabit(null)}
                className="text-gray-400 hover:text-gray-600"
                style={{ fontSize: '24px' }}
              >
                ×
              </button>
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                className="px-3 py-1 rounded border border-[#e0e0e0] hover:bg-[#f0f0f0] transition-colors font-pixel-bold"
                style={{ color: '#111', fontSize: '16px' }}
              >
                ↑
              </button>
              <span className="font-pixel-bold" style={{ color: '#333', fontSize: '16px' }}>
                {formatMonthYear(calendarMonth)}
              </span>
              <button
                onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                className="px-3 py-1 rounded border border-[#e0e0e0] hover:bg-[#f0f0f0] transition-colors font-pixel-bold"
                style={{ color: '#111', fontSize: '16px' }}
              >
                ↓
              </button>
            </div>

            {/* Calendário e barra de progresso lado a lado */}
            <div className="flex gap-4">
              {/* Grid do calendário */}
              <div className="flex-1 grid grid-cols-7 gap-1">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day) => (
                  <div 
                    key={day} 
                    className="text-center font-pixel-bold p-2 rounded"
                    style={{ 
                      backgroundColor: '#e8e8e8',
                      border: '1px solid #e0e0e0',
                      color: '#333',
                      fontSize: '16px'
                    }}
                  >
                    {day}
                  </div>
                ))}
                {getMonthCalendarDays().map(({ date, isCurrentMonth, isToday }) => {
                  const dateStr = date.toISOString().substring(0, 10);
                  const checked = selectedHabit.checks[dateStr];
                  const dayNumber = date.getDate();
                  const isCreatedDate = selectedHabit.createdAt && dateStr === selectedHabit.createdAt.substring(0, 10);

                  return (
                    <div
                      key={dateStr}
                      onClick={() => {
                        toggleCheck(selectedHabit.id, dateStr);
                      }}
                      className={`
                        aspect-square flex flex-col items-center justify-center
                        rounded border p-1 transition-colors cursor-pointer
                        ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
                        ${isToday ? 'ring-2 ring-[#111]' : ''}
                        ${checked ? 'bg-green-50' : ''}
                        hover:bg-blue-50
                      `}
                      style={{
                        borderColor: '#e0e0e0',
                      }}
                    >
                      <span className={`font-pixel ${!isCurrentMonth ? 'text-gray-400' : ''}`} style={{ fontSize: '16px' }}>
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

      {/* Modais de Expenses */}
      {isAddExpenseModalOpen && (
        <AddExpenseModal
          isOpen={isAddExpenseModalOpen}
          onClose={() => setIsAddExpenseModalOpen(false)}
          onSave={(description, value, relatedGoalId, category) => {
            addDailyExpense(formatDateKey(selectedDate), description, value, relatedGoalId, category);
            setIsAddExpenseModalOpen(false);
            
            // Forçar atualização do estado após um pequeno delay para garantir que o localStorage foi atualizado
            setTimeout(() => {
              const dateKey = formatDateKey(selectedDate);
              const items = getDailyExpenses(dateKey);
              setDailyItems(items);
              
              // Recalcular monthlyRows imediatamente após adicionar gasto
              const monthKey = formatMonthKey(selectedMonth);
              const desired = getDesiredMonthlyExpense(monthKey) || 0;
              const reset = getResetDate(monthKey) || 1;
              const rows = calculateMonthlyData(selectedMonth.getFullYear(), selectedMonth.getMonth(), desired, reset, getEntriesForDate);
              setMonthlyRows(rows);
              
              // Atualizar progresso dos objetivos baseado no dinheiro em conta atualizado
              const today = new Date();
              const todayKey = formatDateKey(today);
              const accountMoney = getAccountMoney(todayKey);
              const reserve = getCurrentReserve();
              updateAllProgressFromAccountMoney(accountMoney, reserve);
              setTimeout(() => {
                setPossessions(getAllPossessions());
              }, 100);
            }, 50);
          }}
        />
      )}


      {/* Modal de Adicionar/Editar Entrada Financeira (Novo Sistema) */}
      {isAddFinancialEntryModalOpen && (
        <AddFinancialEntryModal
          isOpen={isAddFinancialEntryModalOpen}
          onClose={() => {
            setIsAddFinancialEntryModalOpen(false);
            setEditingFinancialEntry(undefined);
          }}
          onSave={(entry) => {
            if (editingFinancialEntry) {
              // Modo edição: atualizar entrada existente
              updateFinancialEntry(editingFinancialEntry.id, entry);
              setEditingFinancialEntry(undefined);
            } else {
              // Modo criação: adicionar nova entrada
              addFinancialEntry(entry);
            }
            setIsAddFinancialEntryModalOpen(false);
            // Forçar atualização do estado
            setTimeout(() => {
              const dateKey = formatDateKey(selectedDate);
              const items = getDailyExpenses(dateKey);
              setDailyItems(items);
              const monthKey = formatMonthKey(selectedMonth);
              const desired = getDesiredMonthlyExpense(monthKey) || 0;
              const reset = getResetDate(monthKey) || 1;
              const rows = calculateMonthlyData(selectedMonth.getFullYear(), selectedMonth.getMonth(), desired, reset, getEntriesForDate);
              setMonthlyRows(rows);
              
              // Atualizar progresso dos objetivos baseado no dinheiro em conta atualizado
              const today = new Date();
              const todayKey = formatDateKey(today);
              const accountMoney = getAccountMoney(todayKey);
              const reserve = getCurrentReserve();
              updateAllProgressFromAccountMoney(accountMoney, reserve);
              setTimeout(() => {
                setPossessions(getAllPossessions());
              }, 100);
              
              // Disparar evento para atualizar outros componentes
              if (typeof window !== "undefined") {
                window.dispatchEvent(new Event("pixel-life-storage-change"));
              }
            }, 100);
          }}
          initialDate={formatDateKey(selectedDate)}
          editingEntry={editingFinancialEntry}
        />
      )}

      {/* Modal de Calendário para Finanças Diário */}
      {showFinanceDateCalendar && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"
          onClick={() => setShowFinanceDateCalendar(false)}
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
                Selecionar Data
              </h2>
              <button
                onClick={() => setShowFinanceDateCalendar(false)}
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
                onClick={() => {
                  setFinanceDateCalendarMonth(new Date(financeDateCalendarMonth.getFullYear(), financeDateCalendarMonth.getMonth() - 1, 1));
                }}
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
                {(() => {
                  const months = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
                  return `${months[financeDateCalendarMonth.getMonth()]} de ${financeDateCalendarMonth.getFullYear()}`;
                })()}
              </span>
              <button
                onClick={() => {
                  setFinanceDateCalendarMonth(new Date(financeDateCalendarMonth.getFullYear(), financeDateCalendarMonth.getMonth() + 1, 1));
                }}
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
              {(() => {
                const year = financeDateCalendarMonth.getFullYear();
                const month = financeDateCalendarMonth.getMonth();
                const firstDay = new Date(year, month, 1);
                const lastDay = new Date(year, month + 1, 0);
                const firstDayOfWeek = firstDay.getDay();
                const daysInMonth = lastDay.getDate();
                const today = new Date();
                const selectedDateStr = formatDateKey(selectedDate);
                
                const days: React.ReactElement[] = [];
                
                // Dias do mês anterior
                const prevMonthLastDay = new Date(year, month, 0).getDate();
                for (let i = firstDayOfWeek - 1; i >= 0; i--) {
                  const day = prevMonthLastDay - i;
                  const date = new Date(year, month - 1, day);
                  const dateStr = formatDateKey(date);
                  const isSelected = dateStr === selectedDateStr;
                  
                  days.push(
                    <div
                      key={`prev-${day}`}
                      onClick={() => {
                        setSelectedDate(date);
                        setShowFinanceDateCalendar(false);
                      }}
                      className="aspect-square flex flex-col items-center justify-center rounded border p-1 transition-colors cursor-pointer bg-gray-50 text-gray-400 hover:bg-gray-100"
                      style={{
                        borderColor: isSelected ? '#2563eb' : '#e0e0e0',
                      }}
                    >
                      <span className="text-sm font-pixel">{day}</span>
                    </div>
                  );
                }
                
                // Dias do mês atual
                for (let day = 1; day <= daysInMonth; day++) {
                  const date = new Date(year, month, day);
                  const dateStr = formatDateKey(date);
                  const isSelected = dateStr === selectedDateStr;
                  const isToday = dateStr === formatDateKey(today);
                  
                  days.push(
                    <div
                      key={day}
                      onClick={() => {
                        setSelectedDate(date);
                        setShowFinanceDateCalendar(false);
                      }}
                      className={`aspect-square flex flex-col items-center justify-center rounded border p-1 transition-colors cursor-pointer ${
                        isSelected ? 'bg-blue-400 text-white' : 'bg-white'
                      } hover:bg-gray-100`}
                      style={{
                        borderColor: isSelected ? '#2563eb' : '#e0e0e0',
                      }}
                    >
                      <span className={`text-sm font-pixel ${isSelected ? 'text-white' : ''}`}>
                        {day}
                      </span>
                      {isToday && !isSelected && (
                        <div className="w-1.5 h-1.5 rounded-full mt-0.5 bg-blue-400" />
                      )}
                    </div>
                  );
                }
                
                // Dias do próximo mês para completar a grade
                const totalCells = days.length;
                const remainingCells = 42 - totalCells;
                for (let day = 1; day <= remainingCells; day++) {
                  const date = new Date(year, month + 1, day);
                  const dateStr = formatDateKey(date);
                  const isSelected = dateStr === selectedDateStr;
                  
                  days.push(
                    <div
                      key={`next-${day}`}
                      onClick={() => {
                        setSelectedDate(date);
                        setShowFinanceDateCalendar(false);
                      }}
                      className="aspect-square flex flex-col items-center justify-center rounded border p-1 transition-colors cursor-pointer bg-gray-50 text-gray-400 hover:bg-gray-100"
                      style={{
                        borderColor: isSelected ? '#2563eb' : '#e0e0e0',
                      }}
                    >
                      <span className="text-sm font-pixel">{day}</span>
                    </div>
                  );
                }
                
                return days;
              })()}
            </div>
          </div>
        </div>
      )}

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
          const items = getDailyExpenses(formatDateKey(selectedDate));
          setDailyItems(items);
          
          setIsCSVImporterOpen(false);
          
          // Atualizar progresso dos objetivos baseado no dinheiro em conta atualizado
          const today = new Date();
          const todayKey = formatDateKey(today);
          const accountMoney = getAccountMoney(todayKey);
          const reserve = getCurrentReserve();
          updateAllProgressFromAccountMoney(accountMoney, reserve);
          setTimeout(() => {
            setPossessions(getAllPossessions());
          }, 100);
        }}
      />

      {isAddReserveModalOpen && (
        <AddReserveModal
          isOpen={isAddReserveModalOpen}
          onClose={() => setIsAddReserveModalOpen(false)}
          initialDate={formatDateKey(selectedDate)}
          onSave={(description, value, dateKey) => {
            addReserveMovement(dateKey, description, value);
            const items = getReserveMovements(dateKey);
            setReserveItems(items);
            
            // Atualizar monthlyReserveItems
            const year = selectedMonth.getFullYear();
            const month = selectedMonth.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const allReserveItems: ReserveMovement[] = [];
            
            for (let day = 1; day <= daysInMonth; day++) {
              const date = new Date(year, month, day);
              const dateKey = formatDateKey(date);
              const dayItems = getReserveMovements(dateKey);
              allReserveItems.push(...dayItems);
            }
            
            allReserveItems.sort((a, b) => {
              const dateA = new Date(a.createdAt).getTime();
              const dateB = new Date(b.createdAt).getTime();
              return dateB - dateA;
            });
            
            setMonthlyReserveItems(allReserveItems);
            setIsAddReserveModalOpen(false);
            
            // Atualizar progresso dos objetivos baseado no dinheiro em conta atualizado
            const today = new Date();
            const todayKey = formatDateKey(today);
            const accountMoney = getAccountMoney(todayKey);
            const reserve = getCurrentReserve();
            updateAllProgressFromAccountMoney(accountMoney, reserve);
            setTimeout(() => {
              setPossessions(getAllPossessions());
            }, 100);
          }}
        />
      )}

      {isEditAccountMoneyModalOpen && editingAccountMoneyDate && (
        <EditAccountMoneyModal
          isOpen={isEditAccountMoneyModalOpen}
          onClose={() => {
            setIsEditAccountMoneyModalOpen(false);
            setEditingAccountMoneyDate(null);
          }}
          onSave={async (dateKey, value) => {
            await saveAccountMoney(dateKey, value);
            
            // Recarregar monthlyRows após salvar
            const monthKey = formatMonthKey(selectedMonth);
            const desired = getDesiredMonthlyExpense(monthKey) || 0;
            const reset = getResetDate(monthKey) || 1;
            const rows = calculateMonthlyData(selectedMonth.getFullYear(), selectedMonth.getMonth(), desired, reset, getEntriesForDate);
            setMonthlyRows(rows);
            
            // Atualizar progresso dos objetivos baseado no dinheiro em conta atualizado
            const today = new Date();
            const todayKey = formatDateKey(today);
            const accountMoney = getAccountMoney(todayKey);
            const reserve = getCurrentReserve();
            updateAllProgressFromAccountMoney(accountMoney, reserve);
            setTimeout(() => {
              setPossessions(getAllPossessions());
            }, 100);
            
            // Disparar evento para atualizar Display e outros componentes
            if (typeof window !== "undefined") {
              window.dispatchEvent(new Event("pixel-life-storage-change"));
            }
            
            setIsEditAccountMoneyModalOpen(false);
            setEditingAccountMoneyDate(null);
          }}
          initialDate={editingAccountMoneyDate}
          initialValue={editingAccountMoneyValue}
        />
      )}

      {/* Modais de Possessions */}
      {isCreatePossessionModalOpen && (
        <CreatePossessionModal
          isOpen={isCreatePossessionModalOpen}
          onClose={() => setIsCreatePossessionModalOpen(false)}
          onCreate={(possession) => {
            // Obter dinheiro em conta ANTES de criar para calcular progresso inicial
            const today = new Date();
            const todayKey = formatDateKey(today);
            const accountMoney = getAccountMoney(todayKey);
            const reserve = getCurrentReserve();
            
            // Criar posse com progresso inicial calculado baseado no dinheiro em conta
            addPossession(possession, accountMoney);
            
            // Atualizar progresso imediatamente após criar (garante sincronização)
            updateAllProgressFromAccountMoney(accountMoney, reserve);
            
            // Atualizar lista com os valores atualizados
            setTimeout(() => {
              setPossessions(getAllPossessions());
            }, 150);
            
            setIsCreatePossessionModalOpen(false);
            
            // Disparar evento para sincronizar
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event('pixel-life-storage-change'));
            }
          }}
        />
      )}

      {isDetailsPossessionModalOpen && selectedPossession && (
        <PossessionDetailsModal
          isOpen={isDetailsPossessionModalOpen}
          onClose={() => {
            setIsDetailsPossessionModalOpen(false);
            setSelectedPossession(null);
          }}
          possession={selectedPossession}
          expenses={selectedExpenses}
          onEdit={() => {
            setIsDetailsPossessionModalOpen(false);
            setIsEditPossessionModalOpen(true);
          }}
          onDelete={() => {
            deletePossession(selectedPossession.id);
            setPossessions(getAllPossessions());
            setIsDetailsPossessionModalOpen(false);
            setSelectedPossession(null);
          }}
          onAddContribution={() => {
            setIsDetailsPossessionModalOpen(false);
            setIsAddExpenseModalOpen(true);
          }}
          onRemoveExpense={(expenseId, dateKey) => {
            removeDailyExpense(dateKey, expenseId);
            const expenses = getExpensesByGoalId(selectedPossession.id);
            setSelectedExpenses(expenses);
            
            // Recalcular monthlyRows após remover gasto
            const monthKey = formatMonthKey(selectedMonth);
            const desired = getDesiredMonthlyExpense(monthKey) || 0;
            const reset = getResetDate(monthKey) || 1;
            const rows = calculateMonthlyData(selectedMonth.getFullYear(), selectedMonth.getMonth(), desired, reset, getEntriesForDate);
            setMonthlyRows(rows);
            
            // Atualizar progresso dos objetivos baseado no dinheiro em conta atualizado
            const today = new Date();
            const todayKey = formatDateKey(today);
            const accountMoney = getAccountMoney(todayKey);
            const reserve = getCurrentReserve();
            updateAllProgressFromAccountMoney(accountMoney, reserve);
            setTimeout(() => {
              setPossessions(getAllPossessions());
            }, 100);
          }}
        />
      )}

      {isEditPossessionModalOpen && selectedPossession && (
        <EditPossessionModal
          isOpen={isEditPossessionModalOpen}
          onClose={() => {
            setIsEditPossessionModalOpen(false);
            setSelectedPossession(null);
          }}
          possession={selectedPossession}
          onUpdate={(id, updates) => {
            updatePossession(id, updates);
            setPossessions(getAllPossessions());
            setIsEditPossessionModalOpen(false);
            setSelectedPossession(null);
          }}
        />
      )}

      {/* Modal de Skill */}
      {isSkillModalOpen && selectedSkill && (
        <SkillModal
          isOpen={isSkillModalOpen}
          onClose={() => {
            setIsSkillModalOpen(false);
            setSelectedSkill(null);
          }}
          skill={selectedSkill}
          onToggleAction={handleToggleAction}
          onReset={handleResetSkill}
          onDelete={handleDeleteSkill}
        />
      )}

      {/* Modal de Biografia - Legacy (manter para compatibilidade) */}
      <BiographyModal
        isOpen={isBiographyModalOpen}
        onClose={() => {
          setIsBiographyModalOpen(false);
          setEditingBiographyEntry(undefined);
        }}
        onSave={(entry) => {
          if (editingBiographyEntry) {
            updateEntry(editingBiographyEntry.id, entry);
          } else {
            addEntry(entry);
          }
          setIsBiographyModalOpen(false);
          setEditingBiographyEntry(undefined);
        }}
        editingEntry={editingBiographyEntry}
      />

      {/* Modal de Timeline */}
      <TimelineModal
        isOpen={isTimelineModalOpen}
        onClose={() => {
          setIsTimelineModalOpen(false);
          setEditingTimelineEvent(undefined);
        }}
        onSave={(event) => {
          if (editingTimelineEvent) {
            updateEvent(editingTimelineEvent.id, event);
          } else {
            addEvent(event);
          }
          setIsTimelineModalOpen(false);
          setEditingTimelineEvent(undefined);
        }}
        editingEvent={editingTimelineEvent}
      />

      {/* Modal de Dossiê */}
      <DossierModal
        isOpen={isDossierModalOpen}
        onClose={() => {
          setIsDossierModalOpen(false);
          setEditingDossier(undefined);
        }}
        onSave={(dossier) => {
          if (editingDossier) {
            updateDossier(editingDossier.id, dossier);
          } else {
            addDossier(dossier);
          }
          setIsDossierModalOpen(false);
          setEditingDossier(undefined);
        }}
        editingDossier={editingDossier}
      />

      {/* Modal de About Item */}
      <AboutItemModal
        isOpen={isAboutItemModalOpen}
        onClose={() => {
          setIsAboutItemModalOpen(false);
          setEditingAboutItem(undefined);
        }}
        onSave={(item) => {
          if (editingAboutItem) {
            updateItem(editingAboutItem.id, item);
          } else {
            addItem(item);
          }
          setIsAboutItemModalOpen(false);
          setEditingAboutItem(undefined);
        }}
        editingItem={editingAboutItem}
        category={selectedAboutCategory}
      />

      {/* Modal de Atributo */}
      <AttributeModal
        isOpen={isAttributeModalOpen}
        onClose={() => {
          setIsAttributeModalOpen(false);
          setEditingAttribute(undefined);
        }}
        onSave={(attribute) => {
          if (editingAttribute) {
            updateAttribute(editingAttribute.id, attribute);
          } else {
            addAttribute(attribute);
          }
          setIsAttributeModalOpen(false);
          setEditingAttribute(undefined);
        }}
        editingAttribute={editingAttribute}
      />

      {/* Modais de Finanças */}
      {isIncomeConfigModalOpen && (
        <IncomeConfigModal
          isOpen={isIncomeConfigModalOpen}
          onClose={() => setIsIncomeConfigModalOpen(false)}
          onSave={(value, paymentDay, type) => {
            const monthKey = formatMonthKey(selectedMonth);
            saveSalary(monthKey, value);
            setSalary(value);
            setIsIncomeConfigModalOpen(false);
          }}
          initialValue={salary || undefined}
        />
      )}

      {isExpensePlanningModalOpen && (
        <ExpensePlanningModal
          isOpen={isExpensePlanningModalOpen}
          onClose={() => setIsExpensePlanningModalOpen(false)}
          onSave={(limit, resetDay) => {
            const monthKey = formatMonthKey(selectedMonth);
            saveDesiredMonthlyExpense(monthKey, limit);
            saveResetDate(monthKey, resetDay);
            setDesiredMonthlyExpense(limit);
            setResetDate(resetDay);
            setIsExpensePlanningModalOpen(false);
          }}
          initialLimit={desiredMonthlyExpense || undefined}
          initialResetDay={resetDate || undefined}
        />
      )}

      {/* Modal de Edição/Renomear Hábito */}
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

export default function BoardPage() {
  return (
    <Suspense fallback={
      <div className="relative w-full h-screen overflow-hidden flex items-center justify-center">
        <div className="font-mono text-lg">Carregando...</div>
      </div>
    }>
      <BoardPageInner />
    </Suspense>
  );
}


