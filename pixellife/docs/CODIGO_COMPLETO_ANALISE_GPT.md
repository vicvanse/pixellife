# CÓDIGO COMPLETO PARA ANÁLISE - O QUE ESTÁ ERRADO?

## 🔴 PROBLEMAS REPORTADOS

### Problema 1: LIMITE RESTANTE
**Requisito:**
- Se o limite é 3000 e estamos no dia 6 de dezembro, no mês seguinte (janeiro, dia 1) o "Limite Restante" deve ser o limite restante do dia 1 de dezembro.
- O limite mensal começa a contar do início do dia de reset.
- O limite usado deve ser o do mês onde o ciclo começou, não do mês atual.

**Exemplo:**
- Dezembro: limite 3000, resetDay 6 → ciclo começa no dia 6 de dezembro
- Janeiro dia 1: ainda estamos no ciclo que começou em dezembro dia 6
- **Resultado esperado:** Limite Restante em janeiro dia 1 deve usar limite 3000 de dezembro, não o limite de janeiro

### Problema 2: DINHEIRO EM CONTA
**Requisito:**
- Deve ser um cálculo contínuo, uma soma constante dos totais diários, mesmo passando para os próximos meses.
- Deve funcionar EXATAMENTE como a reserva (que está correta).
- Se não houver reset manual, deve acumular desde sempre (2 anos atrás ou 2020).
- Nunca resetar por mês.

---

## 📋 CÓDIGO COMPLETO

### app/hooks/useExpenses.ts

#### Funções Helper Básicas

```typescript
// Formata data como "YYYY-MM-DD"
const formatDateKey = useCallback((date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}, []);

// Formata mês como "YYYY-MM"
const formatMonthKey = useCallback((date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}, []);

// Calcula total diário (ganhos - gastos)
const calculateDailyTotal = useCallback(
  (dateKey: string): number => {
    const expenses = getDailyExpenses(dateKey);
    return expenses.reduce((sum, item) => sum + item.value, 0);
  },
  [getDailyExpenses]
);

// Calcula apenas gastos (valores negativos)
const calculateDailyExpensesOnly = useCallback(
  (dateKey: string): number => {
    const expenses = getDailyExpenses(dateKey);
    return expenses
      .filter(item => item.value < 0)
      .reduce((sum, item) => sum + Math.abs(item.value), 0);
  },
  [getDailyExpenses]
);

// Obtém limite mensal desejado (com herança do mês anterior)
const getDesiredMonthlyExpense = useCallback((monthKey: string): number => {
  const stored = readJSON<number | null>(k(`desiredMonthly:${monthKey}`), null);
  if (stored !== null) return stored;
  
  // Buscar do mês anterior recursivamente
  const parts = monthKey.split("-");
  if (parts.length === 2) {
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    
    if (!isNaN(year) && !isNaN(month) && month >= 1 && month <= 12) {
      let currentYear = year;
      let currentMonth = month;
      let attempts = 0;
      const maxAttempts = 24;
      
      while (attempts < maxAttempts) {
        currentMonth--;
        if (currentMonth < 1) {
          currentMonth = 12;
          currentYear--;
        }
        
        const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
        const prevMonthKey = formatMonthKey(prevMonthDate);
        const prevStored = readJSON<number | null>(k(`desiredMonthly:${prevMonthKey}`), null);
        
        if (prevStored !== null) {
          return prevStored;
        }
        
        attempts++;
      }
    }
  }
  
  return 0;
}, [formatMonthKey]);

// Obtém dia de reset (com herança do mês anterior)
const getResetDate = useCallback((monthKey: string): number => {
  const stored = readJSON<number | null>(k(`resetDate:${monthKey}`), null);
  if (stored !== null) return stored;
  
  // Buscar do mês anterior recursivamente
  const parts = monthKey.split("-");
  if (parts.length === 2) {
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    
    if (!isNaN(year) && !isNaN(month) && month >= 1 && month <= 12) {
      let currentYear = year;
      let currentMonth = month;
      let attempts = 0;
      const maxAttempts = 24;
      
      while (attempts < maxAttempts) {
        currentMonth--;
        if (currentMonth < 1) {
          currentMonth = 12;
          currentYear--;
        }
        
        const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
        const prevMonthKey = formatMonthKey(prevMonthDate);
        const prevStored = readJSON<number | null>(k(`resetDate:${prevMonthKey}`), null);
        
        if (prevStored !== null && prevStored >= 1 && prevStored <= 31) {
          return prevStored;
        }
        
        attempts++;
      }
    }
  }
  
  return 1; // Padrão: dia 1
}, [formatMonthKey]);
```

#### getCycleDates - Calcula início e fim do ciclo

```typescript
// Calcula as datas de início e fim do ciclo de orçamento para uma data específica
// INVARIANTE: resetDay afeta apenas orçamento, não saldo
// O ciclo pode atravessar meses (ex: dia 5 de um mês até dia 4 do próximo)
const getCycleDates = useCallback((dateKey: string, resetDay: number): { cycleStart: Date; cycleEnd: Date } => {
  const [yearStr, monthStr, dayStr] = dateKey.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // 0-indexed
  const day = parseInt(dayStr, 10);
  
  let cycleStart: Date;
  let cycleEnd: Date;
  
  if (day >= resetDay) {
    // Ciclo começou no resetDay deste mês
    cycleStart = new Date(year, month, resetDay);
    cycleStart.setHours(0, 0, 0, 0);
    
    // Fim do ciclo: dia anterior ao próximo reset (mês seguinte)
    const nextMonth = month + 1;
    const nextYear = nextMonth > 11 ? year + 1 : year;
    const nextMonthIndex = nextMonth > 11 ? 0 : nextMonth;
    
    // Ajustar resetDay se o próximo mês não tiver esse dia (ex: dia 31 em fevereiro)
    const nextMonthDays = new Date(nextYear, nextMonthIndex + 1, 0).getDate();
    const adjustedResetDay = Math.min(resetDay, nextMonthDays);
    cycleEnd = new Date(nextYear, nextMonthIndex, adjustedResetDay - 1);
    cycleEnd.setHours(0, 0, 0, 0);
  } else {
    // Ciclo começou no resetDay do mês anterior
    const prevMonth = month - 1;
    const prevYear = prevMonth < 0 ? year - 1 : year;
    const prevMonthIndex = prevMonth < 0 ? 11 : prevMonth;
    
    // Ajustar resetDay se o mês anterior não tiver esse dia
    const prevMonthDays = new Date(prevYear, prevMonthIndex + 1, 0).getDate();
    const adjustedResetDay = Math.min(resetDay, prevMonthDays);
    cycleStart = new Date(prevYear, prevMonthIndex, adjustedResetDay);
    cycleStart.setHours(0, 0, 0, 0);
    
    // Fim do ciclo: dia anterior ao reset deste mês
    cycleEnd = new Date(year, month, resetDay - 1);
    cycleEnd.setHours(0, 0, 0, 0);
  }
  
  return { cycleStart, cycleEnd };
}, []);
```

#### getAccountMoney - PROBLEMA 2

```typescript
// Calcula o dinheiro em conta para uma data específica de forma acumulativa
const getAccountMoney = useCallback((dateKey: string): number => {
  const [yearStr, monthStr, dayStr] = dateKey.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);
  const targetDate = new Date(year, month, day);
  targetDate.setHours(0, 0, 0, 0);
  
  // Buscar o último valor inicial salvo ANTES ou NA data especificada
  let lastManualReset: { dateKey: string; value: number; date: Date } | null = null;
  let searchDate = new Date(targetDate);
  searchDate.setHours(0, 0, 0, 0);
  
  const maxSearchDays = 730; // ~2 anos
  const minDate = new Date(2020, 0, 1);
  minDate.setHours(0, 0, 0, 0);
  let searchDays = 0;
  
  while (searchDays < maxSearchDays && searchDate >= minDate) {
    const checkKey = formatDateKey(searchDate);
    const initialValue = getAccountMoneyInitialByDate(checkKey);
    
    if (initialValue !== null && !isNaN(initialValue)) {
      lastManualReset = {
        dateKey: checkKey,
        value: initialValue,
        date: new Date(searchDate)
      };
      break;
    }
    
    searchDate.setDate(searchDate.getDate() - 1);
    searchDays++;
  }
  
  let saldo: number;
  let startDate: Date;
  
  if (lastManualReset !== null) {
    saldo = lastManualReset.value;
    startDate = new Date(lastManualReset.date);
    startDate.setHours(0, 0, 0, 0);
  } else {
    saldo = 0;
    const startYear = Math.max(2020, targetDate.getFullYear() - 2);
    startDate = new Date(startYear, 0, 1);
    startDate.setHours(0, 0, 0, 0);
  }
  
  let currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);
  
  while (currentDate <= targetDate) {
    const calcKey = formatDateKey(currentDate);
    const dailyTotal = calculateDailyTotal(calcKey);
    const reserveMovements = getReserveMovements(calcKey);
    const reserveDelta = reserveMovements.reduce((sum, m) => sum + m.value, 0);
    
    saldo = saldo + dailyTotal + reserveDelta;
    
    currentDate.setDate(currentDate.getDate() + 1);
    currentDate.setHours(0, 0, 0, 0);
  }
  
  return saldo;
}, [formatDateKey, getAccountMoneyInitialByDate, calculateDailyTotal, getReserveMovements]);
```

#### getCurrentReserve - FUNCIONA CORRETAMENTE (USAR COMO REFERÊNCIA)

```typescript
// Obter reserva atual (do dia de hoje)
// MODELO CORRETO: Reserva é contínua, não mensal - acumula desde sempre
const getCurrentReserve = useCallback((dateKey?: string): number => {
  const targetDate = dateKey ? (() => {
    const [yearStr, monthStr, dayStr] = dateKey.split("-");
    return new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, parseInt(dayStr, 10));
  })() : new Date();
  const targetKey = dateKey || formatDateKey(targetDate);
  
  let totalReserve = 0;
  
  // Calcular todas as movimentações desde sempre até a data alvo
  // Limitar a busca a 2 anos atrás (proteção)
  const startDate = new Date(targetDate);
  startDate.setFullYear(Math.max(2020, targetDate.getFullYear() - 2));
  startDate.setMonth(0);
  startDate.setDate(1);
  
  let currentDate = new Date(startDate);
  while (currentDate <= targetDate) {
    const dayKey = formatDateKey(currentDate);
    const delta = calculateDailyReserveDelta(dayKey);
    totalReserve += delta;
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return totalReserve;
}, [formatDateKey, calculateDailyReserveDelta]);
```

#### getAccountMoneyInitialByDate

```typescript
// Busca valor inicial salvo para uma data específica
const getAccountMoneyInitialByDate = useCallback((dateKey: string): number | null => {
  const stored = readJSON<number | null>(k(`accountMoneyInitial:${dateKey}`), null);
  return stored;
}, []);
```

---

### app/board/page.tsx - Cálculo de Limite Restante (PROBLEMA 1)

```typescript
// Dentro do map de monthlyRows
const resetDay = (typeof resetDate === 'number' ? resetDate : parseInt(String(resetDate)) || 1);

// Data do dia da linha para cálculo
const rowDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), row.day);
const rowDateKey = formatDateKey(rowDate);

var limiteRestante = 0;
if (resetDay > 0) {
  // Usar getCycleDates para calcular corretamente o início do ciclo
  const { cycleStart } = getCycleDates(rowDateKey, resetDay);
  
  // Buscar o limite mensal do mês onde o ciclo começou (não do mês atual)
  const cycleStartMonthKey = formatMonthKey(cycleStart);
  const monthlyLimitDoCiclo = getDesiredMonthlyExpense(cycleStartMonthKey) || 0;
  
  if (monthlyLimitDoCiclo > 0) {
    // Calcular gastos acumulados desde o início do ciclo até o dia da linha
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
      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(0, 0, 0, 0);
    }
    
    // Limite Restante = Limite Mensal (do ciclo) - Gastos Acumulados (desde início do ciclo)
    limiteRestante = Math.max(0, monthlyLimitDoCiclo - gastosAcumulados);
  }
}
```

---

## 🔍 ANÁLISE NECESSÁRIA

### Questões para o GPT:

1. **Limite Restante:** O código parece buscar o limite do mês onde o ciclo começou, mas está funcionando corretamente? Verifique se `getCycleDates` está retornando a data correta e se `getDesiredMonthlyExpense` está buscando o valor correto.

2. **Dinheiro em Conta:** O código tenta acumular desde sempre quando não há reset manual, mas está funcionando igual a `getCurrentReserve`? Compare as duas funções e identifique diferenças.

3. **Continuidade entre meses:** Ambos os cálculos estão respeitando a continuidade entre meses ou há algum ponto que reseta incorretamente?

4. **Lógica do ciclo:** A lógica de `getCycleDates` está correta para ciclos que atravessam meses?

---

## ✅ COMPORTAMENTO ESPERADO

### Limite Restante:
- Ciclo começou em dezembro dia 6 com limite 3000
- Janeiro dia 1 (antes do resetDay de janeiro): deve mostrar limite restante usando 3000 de dezembro
- O cálculo deve: limite 3000 - gastos acumulados desde dia 6 de dezembro até dia 1 de janeiro

### Dinheiro em Conta:
- Deve funcionar EXATAMENTE como `getCurrentReserve`
- Se não houver reset manual: acumular desde 2020 ou 2 anos atrás
- Soma constante de todos os `dailyTotal + reserveDelta` através de todos os meses
- Nunca resetar por mês

