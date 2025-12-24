"use client";

import { useState, useCallback, useEffect } from "react";
import { useExpenses, type DailyExpenseItem, type ReserveMovement } from "./useExpenses";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

export type DailyTotals = {
  day: number;
  totalExpense: number;
  totalGain: number;
  dailyBalance: number;
  details: string;
};

export type MonthBalance = {
  initialBalance: number;
  finalBalance: number;
};

export type MonthlySummary = {
  totalExpense: number;
  totalGain: number;
  totalReserved: number;
  dayWithMostExpense: number;
  dayWithMostGain: number;
  positiveDays: number;
  negativeDays: number;
};

export type BudgetTip = {
  type: "limit" | "warning" | "suggestion" | "alert";
  message: string;
};

export type MonthData = {
  year: number;
  month: number;
  dailyExpenses: Record<number, DailyExpenseItem[]>;
  dailyGains: Record<number, DailyExpenseItem[]>;
  reserveMovements: Record<number, ReserveMovement[]>;
  dailyTotals: DailyTotals[];
  reserveAccumulated: Record<number, number>;
  monthBalance: MonthBalance;
  summary: MonthlySummary;
  predictedEndBalance: number;
  budgetTips: BudgetTip[];
};

export function useMonthlyFinance() {
  const { user } = useAuth();
  const {
    getDailyExpenses,
    getReserveMovements,
    formatDateKey,
    formatMonthKey,
    getInitialReserve,
    getAccountMoney,
  } = useExpenses();

  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth() + 1);
  const [monthData, setMonthData] = useState<MonthData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const formatDateKeyFromParts = useCallback(
    (year: number, month: number, day: number): string => {
      const date = new Date(year, month - 1, day);
      return formatDateKey(date);
    },
    [formatDateKey]
  );

  const goToPreviousMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      if (prev === 1) {
        setCurrentYear((y) => y - 1);
        return 12;
      }
      return prev - 1;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      if (prev === 12) {
        setCurrentYear((y) => y + 1);
        return 1;
      }
      return prev + 1;
    });
  }, []);

  const loadMonthlyData = useCallback(
    async (year: number, month: number) => {
      setIsLoading(true);
      try {
        const daysInMonth = new Date(year, month, 0).getDate();
        const dailyExpenses: Record<number, DailyExpenseItem[]> = {};
        const dailyGains: Record<number, DailyExpenseItem[]> = {};
        const reserveMovements: Record<number, ReserveMovement[]> = {};

        if (user?.id) {
          try {
            const startDate = formatDateKeyFromParts(year, month, 1);
            const endDate = formatDateKeyFromParts(year, month, daysInMonth);

            const { data: entriesData, error: entriesError } = await supabase
              .from("finance_entries")
              .select("*")
              .eq("user_id", user.id)
              .gte("date", startDate)
              .lte("date", endDate)
              .order("date", { ascending: true });

            const { data: reserveData, error: reserveError } = await supabase
              .from("finance_reserve")
              .select("*")
              .eq("user_id", user.id)
              .gte("date", startDate)
              .lte("date", endDate)
              .order("date", { ascending: true });

            if (!entriesError && entriesData) {
              entriesData.forEach((entry: any) => {
                const date = new Date(entry.date + "T00:00:00");
                const day = date.getDate();
                if (!dailyExpenses[day]) dailyExpenses[day] = [];
                if (!dailyGains[day]) dailyGains[day] = [];

                const item: DailyExpenseItem = {
                  id: entry.id,
                  description: entry.description,
                  value: entry.value,
                  createdAt: entry.date,
                  relatedGoalId: entry.related_goal_id,
                };

                if (entry.type === "expense" || entry.value < 0) {
                  dailyExpenses[day].push(item);
                } else if (entry.type === "gain" || entry.value > 0) {
                  dailyGains[day].push(item);
                }
              });
            }

            if (!reserveError && reserveData) {
              reserveData.forEach((movement: any) => {
                const date = new Date(movement.date + "T00:00:00");
                const day = date.getDate();
                if (!reserveMovements[day]) reserveMovements[day] = [];

                reserveMovements[day].push({
                  id: movement.id,
                  description: movement.description,
                  value: movement.value,
                  createdAt: movement.date,
                });
              });
            }
          } catch (supabaseError) {
            console.warn("Erro ao buscar do Supabase, usando localStorage:", supabaseError);
          }
        }

        for (let day = 1; day <= daysInMonth; day++) {
          const dateKey = formatDateKeyFromParts(year, month, day);

          if (!dailyExpenses[day]) {
            const expenses = getDailyExpenses(dateKey);
            dailyExpenses[day] = expenses.filter((e) => e.value < 0);
          }

          if (!dailyGains[day]) {
            const gains = getDailyExpenses(dateKey);
            dailyGains[day] = gains.filter((e) => e.value > 0);
          }

          if (!reserveMovements[day]) {
            reserveMovements[day] = getReserveMovements(dateKey);
          }
        }

        const dailyTotals = calculateDailyTotals(
          year,
          month,
          dailyExpenses,
          dailyGains,
          daysInMonth
        );

        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;
        const prevMonthKey = formatMonthKey(new Date(prevYear, prevMonth - 1, 1));
        const previousMonthReserve = getInitialReserve(prevMonthKey);

        const prevMonthDays = new Date(prevYear, prevMonth, 0).getDate();
        let previousMonthFinalReserve = previousMonthReserve;
        
        for (let prevDay = 1; prevDay <= prevMonthDays; prevDay++) {
          const prevDateKey = formatDateKeyFromParts(prevYear, prevMonth, prevDay);
          const prevReserveMovements = getReserveMovements(prevDateKey);
          const prevReserveDelta = prevReserveMovements.reduce((sum, m) => sum + m.value, 0);
          previousMonthFinalReserve += prevReserveDelta;
        }

        const reserveAccumulated = calculateReserveAccumulated(
          reserveMovements,
          previousMonthFinalReserve,
          daysInMonth
        );

        const prevMonthLastDayKey = formatDateKeyFromParts(prevYear, prevMonth, prevMonthDays);
        const previousMonthFinalBalance = getAccountMoney(prevMonthLastDayKey);
        const monthBalance = calculateMonthBalance(dailyTotals, previousMonthFinalBalance);

        const summary = generateMonthlySummary(
          dailyTotals,
          reserveMovements,
          reserveAccumulated,
          daysInMonth
        );

        const predictedEndBalance = predictEndOfMonthBalance(monthBalance, dailyTotals, daysInMonth);

        const budgetTips = generateBudgetTips({
          year,
          month,
          dailyTotals,
          reserveAccumulated,
          monthBalance,
          summary,
        });

        setMonthData({
          year,
          month,
          dailyExpenses,
          dailyGains,
          reserveMovements,
          dailyTotals,
          reserveAccumulated,
          monthBalance,
          summary,
          predictedEndBalance,
          budgetTips,
        });
      } catch (error) {
        console.error("Erro ao carregar dados mensais:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [user?.id, getDailyExpenses, getReserveMovements, formatDateKeyFromParts, formatMonthKey, getInitialReserve, getAccountMoney]
  );

  const calculateDailyTotals = useCallback(
    (
      year: number,
      month: number,
      dailyExpenses: Record<number, DailyExpenseItem[]>,
      dailyGains: Record<number, DailyExpenseItem[]>,
      daysInMonth: number
    ): DailyTotals[] => {
      const totals: DailyTotals[] = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const expenses = dailyExpenses[day] || [];
        const gains = dailyGains[day] || [];
        const allItems = [...expenses, ...gains];

        const totalExpense = expenses.reduce((sum, e) => sum + Math.abs(e.value), 0);
        const totalGain = gains.reduce((sum, g) => sum + g.value, 0);
        const dailyBalance = totalGain - totalExpense;

        let details = "–";
        if (allItems.length === 1) {
          details = allItems[0].description;
        } else if (allItems.length > 1) {
          const gainsCount = gains.length;
          const expensesCount = expenses.length;
          details = `${allItems.length} entradas • ganhos: ${gainsCount} • gastos: ${expensesCount}`;
        }

        totals.push({
          day,
          totalExpense,
          totalGain,
          dailyBalance,
          details,
        });
      }

      return totals;
    },
    []
  );

  const calculateReserveAccumulated = useCallback(
    (
      dailyReserveMovements: Record<number, ReserveMovement[]>,
      previousMonthReserve: number,
      daysInMonth: number
    ): Record<number, number> => {
      const reserve: Record<number, number> = {};
      let currentReserve = previousMonthReserve;

      for (let day = 1; day <= daysInMonth; day++) {
        const movements = dailyReserveMovements[day] || [];
        const dayDelta = movements.reduce((sum, m) => sum + m.value, 0);

        if (day === 1) {
          currentReserve = previousMonthReserve + dayDelta;
        } else {
          currentReserve = reserve[day - 1] + dayDelta;
        }

        reserve[day] = currentReserve;
      }

      return reserve;
    },
    []
  );

  const calculateMonthBalance = useCallback(
    (dailyTotals: DailyTotals[], previousMonthFinalBalance: number): MonthBalance => {
      const totalBalance = dailyTotals.reduce((sum, day) => sum + day.dailyBalance, 0);
      const finalBalance = previousMonthFinalBalance + totalBalance;

      return {
        initialBalance: previousMonthFinalBalance,
        finalBalance,
      };
    },
    []
  );

  const generateMonthlySummary = useCallback(
    (
      dailyTotals: DailyTotals[],
      reserveMovements: Record<number, ReserveMovement[]>,
      reserveAccumulated: Record<number, number>,
      daysInMonth: number
    ): MonthlySummary => {
      const totalExpense = dailyTotals.reduce((sum, day) => sum + day.totalExpense, 0);
      const totalGain = dailyTotals.reduce((sum, day) => sum + day.totalGain, 0);

      let totalReserved = 0;
      for (let day = 1; day <= daysInMonth; day++) {
        const movements = reserveMovements[day] || [];
        totalReserved += movements.reduce((sum, m) => sum + (m.value > 0 ? m.value : 0), 0);
      }

      let dayWithMostExpense = 1;
      let maxExpense = dailyTotals[0]?.totalExpense || 0;
      let dayWithMostGain = 1;
      let maxGain = dailyTotals[0]?.totalGain || 0;

      dailyTotals.forEach((day) => {
        if (day.totalExpense > maxExpense) {
          maxExpense = day.totalExpense;
          dayWithMostExpense = day.day;
        }
        if (day.totalGain > maxGain) {
          maxGain = day.totalGain;
          dayWithMostGain = day.day;
        }
      });

      const positiveDays = dailyTotals.filter((day) => day.dailyBalance > 0).length;
      const negativeDays = dailyTotals.filter((day) => day.dailyBalance < 0).length;

      return {
        totalExpense,
        totalGain,
        totalReserved,
        dayWithMostExpense,
        dayWithMostGain,
        positiveDays,
        negativeDays,
      };
    },
    []
  );

  const predictEndOfMonthBalance = useCallback(
    (
      monthBalance: MonthBalance,
      dailyTotals: DailyTotals[],
      daysInMonth: number
    ): number => {
      const today = new Date();
      const currentDay = today.getDate();
      const isCurrentMonth =
        today.getFullYear() === currentYear && today.getMonth() + 1 === currentMonth;

      if (!isCurrentMonth || currentDay === 0) {
        return monthBalance.finalBalance;
      }

      const accumulatedBalance = dailyTotals
        .filter((day) => day.day <= currentDay)
        .reduce((sum, day) => sum + day.dailyBalance, monthBalance.initialBalance);

      const averageDaily = accumulatedBalance / currentDay;
      const predictedEnd = averageDaily * daysInMonth;

      return predictedEnd;
    },
    [currentYear, currentMonth]
  );

  const generateBudgetTips = useCallback(
    (monthData: {
      year: number;
      month: number;
      dailyTotals: DailyTotals[];
      reserveAccumulated: Record<number, number>;
      monthBalance: MonthBalance;
      summary: MonthlySummary;
    }): BudgetTip[] => {
      const tips: BudgetTip[] = [];
      const { dailyTotals, reserveAccumulated, monthBalance, summary } = monthData;

      const today = new Date();
      const currentDay = today.getDate();
      const isCurrentMonth =
        today.getFullYear() === monthData.year && today.getMonth() + 1 === monthData.month;

      if (isCurrentMonth && currentDay > 0) {
        const avgDailyExpense = summary.totalExpense / currentDay;
        const remainingDays = new Date(monthData.year, monthData.month, 0).getDate() - currentDay;
        const suggestedDailyLimit = avgDailyExpense * 1.1;

        tips.push({
          type: "limit",
          message: `Limite diário sugerido: R$ ${suggestedDailyLimit.toFixed(2)}`,
        });

        const recentDays = dailyTotals
          .filter((d) => d.day <= currentDay && d.day > currentDay - 7)
          .slice(-7);
        if (recentDays.length > 0) {
          const recentAvg = recentDays.reduce((sum, d) => sum + d.totalExpense, 0) / recentDays.length;
          const todayExpense = dailyTotals.find((d) => d.day === currentDay)?.totalExpense || 0;

          if (todayExpense > recentAvg * 1.2) {
            tips.push({
              type: "warning",
              message: `Gasto hoje está ${((todayExpense / recentAvg - 1) * 100).toFixed(0)}% acima da média dos últimos 7 dias`,
            });
          }
        }

        const initialReserve = reserveAccumulated[1] || 0;
        const currentReserve = reserveAccumulated[currentDay] || initialReserve;
        const reserveDrop = initialReserve - currentReserve;

        if (reserveDrop > initialReserve * 0.2 && initialReserve > 0) {
          tips.push({
            type: "alert",
            message: `Atenção: Reserva caiu ${((reserveDrop / initialReserve) * 100).toFixed(0)}% este mês`,
          });
        }

        if (summary.negativeDays > summary.positiveDays * 1.5) {
          tips.push({
            type: "suggestion",
            message: `Dias negativos (${summary.negativeDays}) superam dias positivos (${summary.positiveDays}). Considere reduzir gastos.`,
          });
        }
      }

      if (tips.length === 0) {
        tips.push({
          type: "suggestion",
          message: "Mantenha o controle dos seus gastos e continue registrando suas movimentações.",
        });
      }

      return tips;
    },
    []
  );

  useEffect(() => {
    loadMonthlyData(currentYear, currentMonth);
  }, [currentYear, currentMonth, loadMonthlyData]);

  useEffect(() => {
    const handleDataChange = () => {
      loadMonthlyData(currentYear, currentMonth);
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && (e.key.includes("daily:") || e.key.includes("reserveMovements:"))) {
        loadMonthlyData(currentYear, currentMonth);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("financesUpdated", handleDataChange);

    const intervalId = setInterval(() => {
      loadMonthlyData(currentYear, currentMonth);
    }, 5000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("financesUpdated", handleDataChange);
      clearInterval(intervalId);
    };
  }, [currentYear, currentMonth, loadMonthlyData]);

  return {
    currentYear,
    currentMonth,
    monthData,
    isLoading,
    goToPreviousMonth,
    goToNextMonth,
    loadMonthlyData,
    calculateDailyTotals,
    calculateReserveAccumulated,
    calculateMonthBalance,
    generateMonthlySummary,
    predictEndOfMonthBalance,
    generateBudgetTips,
  };
}

