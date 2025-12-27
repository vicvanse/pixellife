# CÓDIGO ATUAL - SISTEMA FINANCEIRO

## 📁 ARQUIVOS PRINCIPAIS

### 1. `app/hooks/useExpenses.ts` - Função `getCycleDates`

```typescript
// Linha ~691-723
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
    // Fim do ciclo: dia anterior ao próximo reset (mês seguinte)
    const nextMonth = month + 1;
    const nextYear = nextMonth > 11 ? year + 1 : year;
    const nextMonthIndex = nextMonth > 11 ? 0 : nextMonth;
    cycleEnd = new Date(nextYear, nextMonthIndex, resetDay - 1);
  } else {
    // Ciclo começou no resetDay do mês anterior
    const prevMonth = month - 1;
    const prevYear = prevMonth < 0 ? year - 1 : year;
    const prevMonthIndex = prevMonth < 0 ? 11 : prevMonth;
    cycleStart = new Date(prevYear, prevMonthIndex, resetDay);
    // Fim do ciclo: dia anterior ao reset deste mês
    cycleEnd = new Date(year, month, resetDay - 1);
  }
  
  return { cycleStart, cycleEnd };
}, []);
```

---

### 2. `app/hooks/useExpenses.ts` - Função `getAccountMoney`

```typescript
// Linha ~730-807
const getAccountMoney = useCallback((dateKey: string, resetDay?: number, depth: number = 0): number => {
  // Proteção contra recursão infinita
  if (depth > 24) return 0;
  
  const [yearStr, monthStr, dayStr] = dateKey.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);
  
  // Se resetDay não foi fornecido, tentar obter do mês atual
  let actualResetDay = resetDay;
  if (actualResetDay === undefined) {
    const monthKey = formatMonthKey(new Date(year, month, 1));
    actualResetDay = getResetDate(monthKey);
  }
  
  // Calcular o ciclo desta data
  const { cycleStart, cycleEnd } = getCycleDates(dateKey, actualResetDay);
  
  // Buscar o último valor inicial salvo desde o início do ciclo até a data solicitada
  let lastInitialValue: number = 0;
  let lastInitialDate: Date | null = null;
  
  // Buscar valor inicial desde o cycleStart até a data solicitada
  let currentDate = new Date(cycleStart);
  currentDate.setHours(0, 0, 0, 0);
  const targetDate = new Date(year, month, day);
  targetDate.setHours(0, 0, 0, 0);
  
  while (currentDate <= targetDate) {
    const checkKey = formatDateKey(currentDate);
    const initialValue = getAccountMoneyInitialByDate(checkKey);
    if (initialValue !== null) {
      lastInitialValue = initialValue;
      lastInitialDate = new Date(currentDate);
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Se não encontrou valor inicial salvo, calcular recursivamente do ciclo anterior
  if (lastInitialDate === null) {
    // Calcular o último dia do ciclo anterior
    const prevCycleEnd = new Date(cycleStart);
    prevCycleEnd.setDate(prevCycleEnd.getDate() - 1);
    
    // Se o ciclo anterior ainda é válido (não é antes de 2020 por exemplo), calcular recursivamente
    if (prevCycleEnd.getFullYear() >= 2020) {
      const prevCycleEndKey = formatDateKey(prevCycleEnd);
      const prevMonthKey = formatMonthKey(prevCycleEnd);
      const prevResetDay = getResetDate(prevMonthKey);
      lastInitialValue = getAccountMoney(prevCycleEndKey, prevResetDay, depth + 1);
      lastInitialDate = prevCycleEnd;
    } else {
      // Se chegou muito longe no passado, usar 0 como base
      lastInitialValue = 0;
      lastInitialDate = cycleStart;
    }
  }
  
  // Calcular extrato acumulado: dinheiro inicial + soma de dailyTotals desde lastInitialDate até dateKey
  let accountMoney = lastInitialValue;
  
  if (lastInitialDate !== null) {
    // Somar desde o dia seguinte ao lastInitialDate até a data solicitada
    let currentSumDate = new Date(lastInitialDate);
    currentSumDate.setDate(currentSumDate.getDate() + 1);
    currentSumDate.setHours(0, 0, 0, 0);
    
    while (currentSumDate <= targetDate) {
      const checkKey = formatDateKey(currentSumDate);
      const dailyTotal = calculateDailyTotal(checkKey);
      accountMoney += dailyTotal;
      currentSumDate.setDate(currentSumDate.getDate() + 1);
    }
  }
  
  return accountMoney;
}, [formatDateKey, getAccountMoneyInitialByDate, calculateDailyTotal, getCycleDates, formatMonthKey, getResetDate]);
```

---

### 3. `app/hooks/useExpenses.ts` - Função `saveAccountMoney`

```typescript
// Linha ~813-921
const saveAccountMoney = useCallback(async (dateKey: string, value: number) => {
  // Parse da data de forma segura (YYYY-MM-DD)
  const [yearStr, monthStr, dayStr] = dateKey.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // month é 0-indexed
  const selectedDay = parseInt(dayStr, 10);
  
  // Calcular quantos dias tem no mês atual
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Salvar para todos os dias futuros do mês atual
  for (let d = selectedDay; d <= daysInMonth; d++) {
    const saveDate = new Date(year, month, d);
    const saveKey = formatDateKey(saveDate);
    // Remove o valor anterior se existir
    if (typeof window !== "undefined") {
      const key = k(`accountMoneyInitial:${saveKey}`);
      window.localStorage.removeItem(key);
    }
    // Salva o novo valor para o dia selecionado e todos os dias futuros do mês
    writeJSON(k(`accountMoneyInitial:${saveKey}`), value);
  }
  
  // Calcular o saldo final do mês atual (valor inicial + soma de todos os dailyTotals)
  // O valor salvo é ANTES dos gastos do dia selectedDay, então precisamos somar desde selectedDay
  let currentMonthFinalBalance = value;
  for (let d = selectedDay; d <= daysInMonth; d++) {
    const checkDate = new Date(year, month, d);
    const checkKey = formatDateKey(checkDate);
    const dailyTotal = calculateDailyTotal(checkKey);
    currentMonthFinalBalance += dailyTotal;
  }
  
  // Salvar o saldo final do mês atual como saldo inicial do primeiro dia do próximo mês
  // E propagar para todos os meses seguintes (até 24 meses à frente)
  for (let monthOffset = 1; monthOffset <= 24; monthOffset++) {
    const futureMonth = month + monthOffset;
    const futureYear = year + Math.floor((futureMonth) / 12);
    const futureMonthIndex = (futureMonth % 12);
    const futureDaysInMonth = new Date(futureYear, futureMonthIndex + 1, 0).getDate();
    
    // Calcular saldo final do mês anterior (que será o saldo inicial deste mês)
    let initialBalanceForMonth: number;
    
    if (monthOffset === 1) {
      // Primeiro mês futuro: usar o saldo final do mês atual que acabamos de calcular
      initialBalanceForMonth = currentMonthFinalBalance;
    } else {
      // Para meses posteriores, calcular o saldo final do mês anterior
      const prevMonthOffset = monthOffset - 1;
      const prevMonth = month + prevMonthOffset;
      const prevYear = year + Math.floor((prevMonth) / 12);
      const prevMonthIndex = (prevMonth % 12);
      const prevDaysInMonth = new Date(prevYear, prevMonthIndex + 1, 0).getDate();
      
      // Buscar o valor inicial salvo do primeiro dia do mês anterior
      const prevFirstDayKey = formatDateKey(new Date(prevYear, prevMonthIndex, 1));
      const prevInitial = getAccountMoneyInitialByDate(prevFirstDayKey);
      
      if (prevInitial !== null) {
        // Se há valor inicial salvo, usar ele e somar todos os dailyTotals
        let prevMonthFinal = prevInitial;
        for (let d = 1; d <= prevDaysInMonth; d++) {
          const checkDate = new Date(prevYear, prevMonthIndex, d);
          const checkKey = formatDateKey(checkDate);
          const dailyTotal = calculateDailyTotal(checkKey);
          prevMonthFinal += dailyTotal;
        }
        initialBalanceForMonth = prevMonthFinal;
      } else {
        // Se não há valor inicial salvo, usar 0 como fallback
        initialBalanceForMonth = 0;
      }
    }
    
    // Salvar para o primeiro dia do mês futuro e todos os dias seguintes
    for (let d = 1; d <= futureDaysInMonth; d++) {
      const saveDate = new Date(futureYear, futureMonthIndex, d);
      const saveKey = formatDateKey(saveDate);
      // Remove o valor anterior se existir
      if (typeof window !== "undefined") {
        const key = k(`accountMoneyInitial:${saveKey}`);
        window.localStorage.removeItem(key);
      }
      // Salva o novo valor (saldo inicial do mês = saldo final do mês anterior)
      writeJSON(k(`accountMoneyInitial:${saveKey}`), initialBalanceForMonth);
    }
    
    // Calcular saldo final deste mês futuro para usar no próximo loop
    currentMonthFinalBalance = initialBalanceForMonth;
    for (let d = 1; d <= futureDaysInMonth; d++) {
      const checkDate = new Date(futureYear, futureMonthIndex, d);
      const checkKey = formatDateKey(checkDate);
      const dailyTotal = calculateDailyTotal(checkKey);
      currentMonthFinalBalance += dailyTotal;
    }
  }
  
  // syncToSupabase() já salva todos os expenses (incluindo saldos) via user_data
  syncToSupabase();
  
  // Disparar evento customizado para atualizar outros componentes
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("pixel-life-storage-change"));
  }
}, [formatDateKey, syncToSupabase, calculateDailyTotal, getAccountMoneyInitialByDate, user?.id]);
```

---

### 4. `app/board/page.tsx` - Inicialização de accountMoney quando mês muda

```typescript
// Linha ~234-246
// Carregar accountMoney inicial do mês (valor salvo no dia 1 ou calcular do mês anterior)
const day1Key = formatDateKey(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1));
const day1Initial = getAccountMoneyInitialByDate(day1Key);
const monthKeyForInit = formatMonthKey(selectedMonth);
const resetDayForInit = getResetDate(monthKeyForInit) || 1;

// Se não há valor inicial salvo, calcular usando getAccountMoney com o resetDay correto
if (day1Initial === null || day1Initial === undefined) {
  const accountMoneyValue = getAccountMoney(day1Key, resetDayForInit);
  setAccountMoney(accountMoneyValue !== 0 ? accountMoneyValue.toString() : '');
} else {
  setAccountMoney(String(day1Initial));
}
```

---

### 5. `app/board/page.tsx` - Campo "Dia de reset" (ATUALIZA AUTOMATICAMENTE)

```typescript
// Linha ~1027-1065
<input
  type="number"
  value={resetDate === '' || resetDate === null || resetDate === undefined ? '' : resetDate}
  placeholder="–"
  onChange={async (e) => {
    const val = e.target.value === '' ? '' : parseInt(e.target.value) || '';
    if (val === '' || (typeof val === 'number' && val >= 1 && val <= 31)) {
      setResetDate(val);
      // Atualizar automaticamente sem precisar clicar "Salvar"
      if (typeof val === 'number' && val >= 1 && val <= 31) {
        try {
          const monthKey = formatMonthKey(selectedMonth);
          saveResetDate(monthKey, val);
          // Recarregar monthlyRows após salvar
          const desired = getDesiredMonthlyExpense(monthKey) || 0;
          const reset = val;
          const rows = calculateMonthlyData(selectedMonth.getFullYear(), selectedMonth.getMonth(), desired, reset);
          setMonthlyRows(rows);
          // Disparar evento para atualizar Display
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("pixel-life-storage-change"));
          }
        } catch (error) {
          console.error('Erro ao salvar dia de reset:', error);
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
```

---

### 6. `app/board/page.tsx` - Campo "Dinheiro atual em conta"

```typescript
// Linha ~1067-1134
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
        const day1Key = formatDateKey(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1));
        await saveAccountMoney(day1Key, parsed);
        
        // Recarregar monthlyRows após salvar (rebuild completo)
        const monthKey = formatMonthKey(selectedMonth);
        const desired = getDesiredMonthlyExpense(monthKey) || 0;
        const reset = getResetDate(monthKey) || 1;
        
        // Recalcular mês atual
        const rows = calculateMonthlyData(selectedMonth.getFullYear(), selectedMonth.getMonth(), desired, reset);
        setMonthlyRows(rows);
        
        // Atualizar accountMoney do input com valor recalculado
        const day1Initial = getAccountMoneyInitialByDate(day1Key);
        const accountMoneyValue = day1Initial !== null ? day1Initial : getAccountMoney(day1Key);
        setAccountMoney(accountMoneyValue !== 0 ? accountMoneyValue.toString() : '');
        
        // Disparar evento para atualizar Display
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
```

---

### 7. `app/board/page.tsx` - Cálculo do Plano Diário na tabela

```typescript
// Linha ~1163-1211
// Calcular Plano Diário: LimiteMensal - gastosAcumulados desde o resetDay do ciclo
// Buscar o valor diretamente do mês para garantir que está atualizado
const monthKeyForRow = formatMonthKey(selectedMonth);
const desiredMonthlyFromStore = getDesiredMonthlyExpense(monthKeyForRow);
const monthlyLimitRow = desiredMonthlyFromStore || 0;
const resetDay = (typeof resetDate === 'number' ? resetDate : parseInt(String(resetDate)) || 1);

// Data do dia da linha para cálculo - SEMPRE usar rowDate
const rowDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), row.day);

var planoDiario = 0;
if (monthlyLimitRow > 0 && resetDay > 0) {
  const rowYear = rowDate.getFullYear();
  const rowMonth = rowDate.getMonth(); // 0-11
  const rowDay = rowDate.getDate();
  
  // Calcular ciclo usando a lógica correta
  let cycleStart: Date;
  if (rowDay >= resetDay) {
    // Ciclo começou no resetDay deste mês
    cycleStart = new Date(rowYear, rowMonth, resetDay);
  } else {
    // Ciclo começou no resetDay do mês anterior
    const prevMonth = rowMonth - 1;
    const prevYear = prevMonth < 0 ? rowYear - 1 : rowYear;
    const prevMonthIndex = prevMonth < 0 ? 11 : prevMonth;
    cycleStart = new Date(prevYear, prevMonthIndex, resetDay);
  }
  
  // Calcular gastos acumulados desde o início do ciclo até o dia da linha
  let gastosAcumulados = 0;
  let currentDate = new Date(cycleStart);
  currentDate.setHours(0, 0, 0, 0);
  const targetDate = new Date(rowYear, rowMonth, rowDay);
  targetDate.setHours(0, 0, 0, 0);
  
  while (currentDate <= targetDate) {
    const checkDateKey = formatDateKey(currentDate);
    const dailyTotal = calculateDailyTotal(checkDateKey);
    // Soma apenas valores negativos (gastos), não ganhos
    if (dailyTotal < 0) {
      gastosAcumulados += Math.abs(dailyTotal);
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Plano Diário = Limite Mensal - Gastos Acumulados (desde início do ciclo)
  planoDiario = Math.max(0, monthlyLimitRow - gastosAcumulados);
}
```

---

### 8. `app/board/page.tsx` - Dinheiro em Conta na tabela

```typescript
// Linha ~1229-1230
// Dinheiro em conta: usar getAccountMoney que já calcula corretamente considerando mês anterior
const dinheiroEmConta = getAccountMoney(dateKey);
```

**PROBLEMA**: Não está passando `resetDay`! Deveria ser:
```typescript
const monthKey = formatMonthKey(selectedMonth);
const resetDay = getResetDate(monthKey) || 1;
const dinheiroEmConta = getAccountMoney(dateKey, resetDay);
```

---

### 9. `app/board/page.tsx` - useEffect que atualiza accountMoney quando selectedDate muda

```typescript
// Linha ~258-270
useEffect(() => {
  const dateKey = formatDateKey(selectedDate);
  const items = getDailyExpenses(dateKey);
  const rItems = getReserveMovements(dateKey);
  setDailyItems(items);
  setReserveItems(rItems);
  // Buscar valor inicial do dia 1 do mês selecionado (ou o valor calculado se não houver)
  const day1Key = formatDateKey(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1));
  const day1Initial = getAccountMoneyInitialByDate(day1Key);
  const monthKeyForAccount = formatMonthKey(selectedMonth);
  const resetDayForAccount = getResetDate(monthKeyForAccount) || 1;
  const accountMoneyValue = day1Initial !== null ? day1Initial : getAccountMoney(day1Key, resetDayForAccount);
  // Só atualizar o estado se ele ainda não foi editado pelo usuário
  setAccountMoney(prev => {
    if (prev === '' || prev === null || prev === undefined) {
      return accountMoneyValue !== 0 ? accountMoneyValue.toString() : '';
    }
    return prev;
  });
  
  const budget = getBudget(dateKey);
  setAvailableMoney(budget);
  setReserve(getCurrentReserve());
}, [selectedDate, selectedMonth, ...]);
```

---

### 10. `app/habits/page.tsx` - Calendário (já corrigido)

```typescript
// Linha ~131-175
const getMonthCalendarDays = (): Array<{ date: Date; isCurrentMonth: boolean; isToday: boolean }> => {
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
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
  
  // Retornar apenas as semanas completas do mês (sem dias do próximo mês)
  return [...prevMonthDays, ...currentMonthDays];
};
```

---

### 11. `app/board/page.tsx` - Calendário (já corrigido)

```typescript
// Linha ~365-414
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
```

---

### 12. `app/display/DisplayPageInner.tsx` - Cálculo do Plano Diário

```typescript
// Linha ~92-149 (após correções)
// Calcular Plano Diário: LimiteMensal - gastosAcumulados desde o resetDay do ciclo
const monthKey = formatMonthKey(today);
const monthlyLimit = getDesiredMonthlyExpense(monthKey) || 0;
const resetDay = getResetDate(monthKey) || 1;
const currentDay = today.getDate();
const todayYear = today.getFullYear();
const todayMonth = today.getMonth(); // 0-11

let planoDiario = 0;
if (monthlyLimit > 0 && resetDay > 0) {
  // Calcular ciclo usando a lógica correta
  let cycleStart: Date;
  if (currentDay >= resetDay) {
    // Ciclo começou no resetDay deste mês
    cycleStart = new Date(todayYear, todayMonth, resetDay);
  } else {
    // Ciclo começou no resetDay do mês anterior
    const prevMonth = todayMonth - 1;
    const prevYear = prevMonth < 0 ? todayYear - 1 : todayYear;
    const prevMonthIndex = prevMonth < 0 ? 11 : prevMonth;
    cycleStart = new Date(prevYear, prevMonthIndex, resetDay);
  }
  
  // Calcular gastos acumulados desde o início do ciclo até hoje
  let gastosAcumulados = 0;
  let currentDate = new Date(cycleStart);
  currentDate.setHours(0, 0, 0, 0);
  const targetDate = new Date(todayYear, todayMonth, currentDay);
  targetDate.setHours(0, 0, 0, 0);
  
  while (currentDate <= targetDate) {
    const checkDateKey = formatDateKey(currentDate);
    const dailyTotal = calculateDailyTotal(checkDateKey);
    // Soma apenas valores negativos (gastos), não ganhos
    if (dailyTotal < 0) {
      gastosAcumulados += Math.abs(dailyTotal);
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Plano Diário = Limite Mensal - Gastos Acumulados (desde início do ciclo)
  planoDiario = Math.max(0, monthlyLimit - gastosAcumulados);
}
```

---

## 🔴 PROBLEMAS IDENTIFICADOS

### Problema 1: `getAccountMoney` na tabela não passa `resetDay`

**Localização**: `app/board/page.tsx` linha ~1230

**Código atual (ERRADO):**
```typescript
const dinheiroEmConta = getAccountMoney(dateKey);
```

**Código correto:**
```typescript
const monthKey = formatMonthKey(selectedMonth);
const resetDay = getResetDate(monthKey) || 1;
const dinheiroEmConta = getAccountMoney(dateKey, resetDay);
```

---

### Problema 2: `saveAccountMoney` linha 1113 não usa `resetDay`

**Localização**: `app/board/page.tsx` linha ~1113

**Código atual:**
```typescript
const accountMoneyValue = day1Initial !== null ? day1Initial : getAccountMoney(day1Key);
```

**Código correto:**
```typescript
const reset = getResetDate(monthKey) || 1;
const accountMoneyValue = day1Initial !== null ? day1Initial : getAccountMoney(day1Key, reset);
```

---

### Problema 3: `getAccountMoney` pode retornar 0 incorretamente

**Localização**: `app/hooks/useExpenses.ts` linha ~730-807

**Problema**: Se não encontra valor inicial, calcula recursivamente, mas pode retornar 0 se não houver valores salvos anteriores.

**Solução**: Garantir que quando calcula recursivamente do ciclo anterior, está usando o resetDay correto daquele ciclo.

---

### Problema 4: `saveAccountMoney` propaga para meses futuros sem considerar ciclo

**Localização**: `app/hooks/useExpenses.ts` linha ~813-921

**Problema**: Quando salva para meses futuros, não está considerando que cada mês pode ter resetDay diferente.

**Solução**: Usar `getAccountMoney` com o resetDay correto de cada mês ao propagar.

