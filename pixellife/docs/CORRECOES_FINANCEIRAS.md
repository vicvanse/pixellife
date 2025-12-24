# CORREÇÕES NECESSÁRIAS - SISTEMA FINANCEIRO

## 🎯 PROBLEMA CENTRAL

O sistema financeiro tem 3 problemas críticos:

1. **"Dia de reset" não atualiza automaticamente a tabela** - Usuário precisa clicar "Salvar"
2. **"Dinheiro atual em conta" retorna a 0** quando não deveria
3. **Lógica do ciclo ainda não está 100% correta** - O ciclo deve ser: resetDay/mêsAtual → resetDay-1/mêsSeguinte

---

## 📋 COMO DEVE FUNCIONAR

### 1. DIA DE RESET

**Comportamento esperado:**
- Usuário digita um número (1-31) no campo "Dia de reset"
- **A tabela atualiza AUTOMATICAMENTE** sem precisar clicar "Salvar"
- O cálculo do "Plano Diário" deve usar o novo resetDay imediatamente

**Código atual (ERRADO):**
```typescript
// app/board/page.tsx linha ~1031
<input
  type="number"
  value={resetDate}
  onChange={(e) => {
    setResetDate(val);
    // ❌ FALTA: Atualizar tabela automaticamente
  }}
/>
<button onClick={...}>Salvar</button> // ❌ Não deve existir
```

**Código correto:**
```typescript
<input
  type="number"
  value={resetDate}
  onChange={async (e) => {
    const val = parseInt(e.target.value) || '';
    if (val >= 1 && val <= 31) {
      setResetDate(val);
      // ✅ Atualizar automaticamente
      const monthKey = formatMonthKey(selectedMonth);
      saveResetDate(monthKey, val);
      const desired = getDesiredMonthlyExpense(monthKey) || 0;
      const rows = calculateMonthlyData(selectedMonth.getFullYear(), selectedMonth.getMonth(), desired, val);
      setMonthlyRows(rows);
      window.dispatchEvent(new Event("pixel-life-storage-change"));
    }
  }}
/>
// ✅ SEM botão "Salvar"
```

---

### 2. DINHEIRO ATUAL EM CONTA

**Comportamento esperado:**
- Quando o mês muda, o campo deve mostrar o saldo do dia 1 do mês atual
- Se não há valor salvo, deve calcular usando `getAccountMoney(day1Key, resetDay)`
- **NUNCA deve retornar 0** se há saldo do mês anterior

**Problema atual:**
```typescript
// app/board/page.tsx linha ~234-237
const day1Key = formatDateKey(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1));
const day1Initial = getAccountMoneyInitialByDate(day1Key);
// ❌ Se day1Initial é null, retorna '' (vazio), mas deveria calcular
setAccountMoney(day1Initial !== null && day1Initial !== undefined ? String(day1Initial) : '');
```

**Código correto:**
```typescript
const day1Key = formatDateKey(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1));
const day1Initial = getAccountMoneyInitialByDate(day1Key);
const monthKey = formatMonthKey(selectedMonth);
const resetDay = getResetDate(monthKey) || 1;

// ✅ Se não há valor inicial, calcular usando getAccountMoney com resetDay
if (day1Initial === null || day1Initial === undefined) {
  const accountMoneyValue = getAccountMoney(day1Key, resetDay);
  setAccountMoney(accountMoneyValue !== 0 ? accountMoneyValue.toString() : '');
} else {
  setAccountMoney(String(day1Initial));
}
```

---

### 3. LÓGICA DO CICLO

**Regra universal:**
```
Se resetDay = R:
  Ciclo = R/mêsAtual → (R-1)/mêsSeguinte
```

**Exemplos:**
- Reset = 7, hoje = 20/jan → Ciclo = 07/jan → 06/fev
- Reset = 7, hoje = 3/jan → Ciclo = 07/dez → 06/jan
- Reset = 4, hoje = 5/dez → Ciclo = 04/dez → 03/jan

**Código atual (PARCIALMENTE CORRETO):**
```typescript
// app/hooks/useExpenses.ts - getCycleDates
const getCycleDates = useCallback((dateKey: string, resetDay: number): { cycleStart: Date; cycleEnd: Date } => {
  const [yearStr, monthStr, dayStr] = dateKey.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);
  
  let cycleStart: Date;
  let cycleEnd: Date;
  
  if (day >= resetDay) {
    cycleStart = new Date(year, month, resetDay);
    const nextMonth = month + 1;
    const nextYear = nextMonth > 11 ? year + 1 : year;
    const nextMonthIndex = nextMonth > 11 ? 0 : nextMonth;
    cycleEnd = new Date(nextYear, nextMonthIndex, resetDay - 1);
  } else {
    const prevMonth = month - 1;
    const prevYear = prevMonth < 0 ? year - 1 : year;
    const prevMonthIndex = prevMonth < 0 ? 11 : prevMonth;
    cycleStart = new Date(prevYear, prevMonthIndex, resetDay);
    cycleEnd = new Date(year, month, resetDay - 1);
  }
  
  return { cycleStart, cycleEnd };
}, []);
```

**✅ Este código está CORRETO!** O problema é que não está sendo usado em todos os lugares.

---

### 4. GETACCOUNTMONEY - PROBLEMA DE RECURSÃO

**Problema atual:**
```typescript
// app/hooks/useExpenses.ts linha ~730
const getAccountMoney = useCallback((dateKey: string, resetDay?: number, depth: number = 0): number => {
  if (depth > 24) return 0;
  
  // ... busca valor inicial desde cycleStart ...
  
  // ❌ PROBLEMA: Se não encontra, chama recursivamente
  if (lastInitialDate === null) {
    const prevCycleEnd = new Date(cycleStart);
    prevCycleEnd.setDate(prevCycleEnd.getDate() - 1);
    const prevCycleEndKey = formatDateKey(prevCycleEnd);
    // ❌ Pode entrar em loop se não houver valores salvos
    lastInitialValue = getAccountMoney(prevCycleEndKey, prevResetDay, depth + 1);
  }
  
  // ... soma dailyTotals ...
}, []);
```

**Código correto:**
```typescript
const getAccountMoney = useCallback((dateKey: string, resetDay?: number, depth: number = 0, visited: Set<string> = new Set()): number => {
  // Proteção contra loops
  if (depth > 24) return 0;
  if (visited.has(dateKey)) return 0;
  visited.add(dateKey);
  
  const [yearStr, monthStr, dayStr] = dateKey.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);
  
  // Obter resetDay se não fornecido
  let actualResetDay = resetDay;
  if (actualResetDay === undefined) {
    const monthKey = formatMonthKey(new Date(year, month, 1));
    actualResetDay = getResetDate(monthKey);
  }
  
  // Calcular ciclo
  const { cycleStart, cycleEnd } = getCycleDates(dateKey, actualResetDay);
  
  // Buscar valor inicial desde cycleStart até dateKey
  let lastInitialValue: number = 0;
  let lastInitialDate: Date | null = null;
  
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
  
  // Se não encontrou, calcular do último dia do ciclo anterior
  if (lastInitialDate === null) {
    const prevCycleEnd = new Date(cycleStart);
    prevCycleEnd.setDate(prevCycleEnd.getDate() - 1);
    
    if (prevCycleEnd.getFullYear() >= 2020) { // Limite de segurança
      const prevCycleEndKey = formatDateKey(prevCycleEnd);
      const prevMonthKey = formatMonthKey(prevCycleEnd);
      const prevResetDay = getResetDate(prevMonthKey);
      lastInitialValue = getAccountMoney(prevCycleEndKey, prevResetDay, depth + 1, visited);
      lastInitialDate = prevCycleEnd;
    } else {
      lastInitialValue = 0;
      lastInitialDate = cycleStart;
    }
  }
  
  // Calcular extrato acumulado
  let accountMoney = lastInitialValue;
  
  if (lastInitialDate !== null) {
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

### 5. PLANO DIÁRIO - DEVE USAR CICLO CORRETO

**Código atual (PARCIALMENTE CORRETO):**
```typescript
// app/board/page.tsx linha ~1170
var planoDiario = 0;
if (monthlyLimitRow > 0 && resetDay > 0) {
  const rowYear = rowDate.getFullYear();
  const rowMonth = rowDate.getMonth();
  const rowDay = rowDate.getDate();
  
  let cycleStart: Date;
  if (rowDay >= resetDay) {
    cycleStart = new Date(rowYear, rowMonth, resetDay);
  } else {
    const prevMonth = rowMonth - 1;
    const prevYear = prevMonth < 0 ? rowYear - 1 : rowYear;
    const prevMonthIndex = prevMonth < 0 ? 11 : prevMonth;
    cycleStart = new Date(prevYear, prevMonthIndex, resetDay);
  }
  
  // Calcular gastos desde cycleStart até rowDate
  let gastosAcumulados = 0;
  let currentDate = new Date(cycleStart);
  const targetDate = new Date(rowYear, rowMonth, rowDay);
  
  while (currentDate <= targetDate) {
    const checkDateKey = formatDateKey(currentDate);
    const dailyTotal = calculateDailyTotal(checkDateKey);
    if (dailyTotal < 0) {
      gastosAcumulados += Math.abs(dailyTotal);
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  planoDiario = Math.max(0, monthlyLimitRow - gastosAcumulados);
}
```

**✅ Este código está CORRETO!** Mas precisa garantir que está usando o resetDay correto do mês.

---

## 🔧 CHECKLIST DE CORREÇÕES

### Arquivo: `app/board/page.tsx`

1. **Linha ~1031 - Campo "Dia de reset":**
   - [ ] Remover botão "Salvar"
   - [ ] Adicionar lógica de atualização automática no `onChange`
   - [ ] Garantir que `setMonthlyRows` é chamado automaticamente

2. **Linha ~234 - Inicialização de accountMoney:**
   - [ ] Usar `getAccountMoney(day1Key, resetDay)` quando `day1Initial` é null
   - [ ] Garantir que não retorna 0 se há saldo do mês anterior

3. **Linha ~258 - Atualização de accountMoney:**
   - [ ] Usar `getAccountMoney(day1Key, resetDay)` com resetDay correto
   - [ ] Não sobrescrever se usuário está editando

### Arquivo: `app/hooks/useExpenses.ts`

1. **Linha ~730 - getAccountMoney:**
   - [ ] Adicionar proteção contra loops com `visited` Set
   - [ ] Garantir que busca valor inicial desde `cycleStart` (não apenas do mês)
   - [ ] Usar `getCycleDates` corretamente

2. **Linha ~808 - saveAccountMoney:**
   - [ ] Garantir que propaga corretamente para meses seguintes
   - [ ] Calcular saldo final do mês corretamente
   - [ ] Salvar como saldo inicial do próximo mês

---

## 📝 RESUMO TÉCNICO

### Estrutura de Dados

**LocalStorage Keys:**
- `desiredMonthly:YYYY-MM` - Limite mensal
- `resetDate:YYYY-MM` - Dia de reset
- `accountMoneyInitial:YYYY-MM-DD` - Valor inicial de dinheiro em conta para uma data

### Fluxo de Cálculo

1. **Plano Diário:**
   ```
   ciclo = getCycleDates(dateKey, resetDay)
   gastosAcumulados = soma(dailyTotal < 0 desde cycleStart até dateKey)
   planoDiario = limiteMensal - gastosAcumulados
   ```

2. **Dinheiro em Conta:**
   ```
   ciclo = getCycleDates(dateKey, resetDay)
   valorInicial = buscar desde cycleStart até dateKey
   se não encontrar: valorInicial = getAccountMoney(cycleStart - 1, resetDay)
   dinheiro = valorInicial + soma(dailyTotal desde valorInicial até dateKey)
   ```

3. **Propagação entre Meses:**
   ```
   saldoFinalMes = getAccountMoney(ultimoDiaMes, resetDay)
   salvar accountMoneyInitial(primeiroDiaProximoMes) = saldoFinalMes
   ```

---

## ⚠️ PONTOS DE ATENÇÃO

1. **resetDay pode ser diferente entre meses** - Cada mês usa seu próprio resetDay
2. **Ciclo sempre atravessa meses** - resetDay/mêsAtual → resetDay-1/mêsSeguinte
3. **accountMoney é acumulado** - Não é resetado no resetDay, continua acumulando
4. **Plano Diário é resetado** - Volta ao limite mensal no resetDay

---

## 🧪 TESTES SUGERIDOS

1. **Teste 1 - Reset Day:**
   - Definir reset = 7
   - Verificar que Plano Diário no dia 7 = Limite Mensal
   - Verificar que Plano Diário no dia 6 = Limite Mensal - gastos desde 7/mêsAnterior

2. **Teste 2 - Dinheiro em Conta:**
   - Adicionar gasto no dia 5
   - Mudar mês
   - Verificar que "Dinheiro atual em conta" mostra saldo do dia 1 (não 0)

3. **Teste 3 - Propagação:**
   - Editar "Dinheiro atual em conta" no dia 10
   - Verificar que dias 11-31 são recalculados
   - Mudar para próximo mês
   - Verificar que dia 1 do próximo mês = saldo final do mês anterior

