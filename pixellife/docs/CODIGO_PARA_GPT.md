# CÓDIGO PARA CORREÇÃO - GPT

## PROBLEMA ATUAL

Dois problemas críticos:

### 1. LIMITE RESTANTE
**Requisito:**
- Se o limite é 3000 e estamos no dia 6 de dezembro, no mês seguinte (janeiro, dia 1) o "Limite Restante" deve ser o limite restante do dia 1 de dezembro.
- O limite mensal começa a contar do início do dia de reset.
- Exemplo: Ciclo começou em dezembro com limite 3000. Em janeiro dia 1 (antes do resetDay), o limite restante deve ser calculado usando o limite de 3000 de dezembro, não o limite de janeiro.

### 2. DINHEIRO EM CONTA
**Requisito:**
- Deve ser um cálculo contínuo, uma soma constante dos totais diários, mesmo passando para os próximos meses.
- Deve funcionar exatamente como a reserva (que está correta).
- Se não houver reset manual, deve acumular desde sempre (2 anos atrás ou 2020).

---

## CÓDIGO ATUAL

### app/hooks/useExpenses.ts

```typescript
// Função getCycleDates
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

// Função getAccountMoney (ATUAL - PRECISA CORRIGIR)
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

// Função getCurrentReserve (ESTÁ CORRETA - USAR COMO REFERÊNCIA)
const getCurrentReserve = useCallback((dateKey?: string): number => {
  const targetDate = dateKey ? (() => {
    const [yearStr, monthStr, dayStr] = dateKey.split("-");
    return new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, parseInt(dayStr, 10));
  })() : new Date();
  const targetKey = dateKey || formatDateKey(targetDate);
  
  let totalReserve = 0;
  
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

### app/board/page.tsx - Cálculo de Limite Restante

```typescript
// Calcular Limite Restante: LimiteMensal - gastosAcumulados desde o resetDay do ciclo
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

## REQUISITOS DETALHADOS

### PROBLEMA 1: LIMITE RESTANTE

**Cenário de Teste:**
- Dezembro: Limite mensal = 3000, resetDay = 6
- Dia 6 de dezembro: ciclo começa com limite 3000
- Janeiro dia 1: ainda estamos no ciclo que começou em dezembro (dia 6)
- **Resultado esperado:** Limite Restante em janeiro dia 1 deve usar o limite de 3000 de dezembro, não o limite de janeiro

**Problema atual:**
O código parece estar correto, mas pode estar usando o `resetDay` errado ou o cálculo de `cycleStart` não está correto quando atravessa meses.

### PROBLEMA 2: DINHEIRO EM CONTA

**Requisito:**
- Deve funcionar EXATAMENTE como `getCurrentReserve`
- Se não houver reset manual, deve acumular desde sempre (2020 ou 2 anos atrás)
- Soma constante de todos os `dailyTotal` através de todos os meses
- NUNCA resetar por mês

**Problema atual:**
O código atual já tenta fazer isso, mas pode não estar funcionando corretamente.

---

## FUNÇÕES AUXILIARES DISPONÍVEIS

- `formatDateKey(date: Date): string` - Formata data como "YYYY-MM-DD"
- `formatMonthKey(date: Date): string` - Formata mês como "YYYY-MM"
- `getDesiredMonthlyExpense(monthKey: string): number` - Retorna limite mensal
- `getAccountMoneyInitialByDate(dateKey: string): number | null` - Retorna valor inicial salvo
- `calculateDailyTotal(dateKey: string): number` - Retorna total diário (ganhos - gastos)
- `getReserveMovements(dateKey: string): ReserveMovement[]` - Retorna movimentações de reserva
- `calculateDailyReserveDelta(dateKey: string): number` - Retorna delta de reserva do dia
- `getResetDate(monthKey: string): number` - Retorna dia de reset do mês

---

## SOLUÇÃO ESPERADA

### 1. getAccountMoney deve:
- Se houver reset manual: usar como ponto inicial e acumular desde lá
- Se não houver reset manual: acumular desde sempre (2020 ou 2 anos atrás) igual `getCurrentReserve`
- Nunca resetar por mês
- Somar todos os `dailyTotal + reserveDelta` desde o início até a data alvo

### 2. Limite Restante deve:
- Sempre usar o limite do mês onde o ciclo começou
- Calcular gastos acumulados desde o início do ciclo
- Funcionar corretamente quando o ciclo atravessa meses

---

## TESTE DE VALIDAÇÃO

1. **Teste Limite Restante:**
   - Dezembro: limite 3000, resetDay 6
   - Janeiro dia 1: deve mostrar limite restante usando 3000 de dezembro

2. **Teste Dinheiro em Conta:**
   - Sem reset manual: deve acumular desde sempre
   - Com reset manual: deve acumular desde o reset
   - Deve funcionar igual `getCurrentReserve`

