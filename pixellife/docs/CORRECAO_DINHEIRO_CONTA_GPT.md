# CORREÇÃO: DINHEIRO EM CONTA - CÓDIGO PARA GPT

## 🔴 PROBLEMA ATUAL

O "Dinheiro em Conta" não está funcionando corretamente:

1. **Botão não atualiza** - Quando o usuário salva um valor, a UI não atualiza
2. **Valor salvo não propaga** - Quando salva um valor X no dia Y, os dias seguintes não são recalculados baseados nesse valor
3. **Não é soma contínua** - Deveria ser uma soma contínua baseada nos totais diários

## ✅ COMPORTAMENTO ESPERADO

### Regra de Ouro:
**"Dinheiro em Conta" é um valor X que é modificado pelos próximos "totais diários"**

### Exemplo:
- Usuário salva **99** no dia 1 de janeiro
- Dia 1: mostra **99**
- Dia 2: mostra **99 + totalDiário_dia2**
- Dia 3: mostra **99 + totalDiário_dia2 + totalDiário_dia3**
- E assim por diante através de todos os meses

### Quando salvar um valor:
- O valor salvo se torna o **ponto de base** para aquele dia
- Todos os dias **seguintes** são recalculados como: `valor_salvo + soma_dos_totais_diários_desde_esse_dia`
- O valor deve **propagar continuamente** através de todos os meses

---

## 📋 CÓDIGO ATUAL

### app/hooks/useExpenses.ts

#### getAccountMoney (ATUAL - PRECISA CORRIGIR)

```typescript
// Calcula o dinheiro em conta para uma data específica de forma acumulativa
const getAccountMoney = useCallback((dateKey: string): number => {
  const [yearStr, monthStr, dayStr] = dateKey.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);
  const targetDate = new Date(year, month, day);
  targetDate.setHours(0, 0, 0, 0);
  
  // Começar do zero e acumular desde sempre (IGUAL getCurrentReserve)
  let saldo = 0;
  
  // Data inicial: 2 anos atrás ou 2020, o que for mais recente
  const startDate = new Date(targetDate);
  startDate.setFullYear(Math.max(2020, targetDate.getFullYear() - 2));
  startDate.setMonth(0);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);
  
  // Acumular incrementalmente desde startDate até targetDate (AMBOS inclusivos)
  let currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);
  
  while (currentDate <= targetDate) {
    const calcKey = formatDateKey(currentDate);
    
    // Obter total diário (ganhos - gastos)
    const dailyTotal = calculateDailyTotal(calcKey);
    
    // Obter movimentações de reserva do dia
    const reserveMovements = getReserveMovements(calcKey);
    const reserveDelta = reserveMovements.reduce((sum, m) => sum + m.value, 0);
    
    // Acumular normalmente
    saldo = saldo + dailyTotal + reserveDelta;
    
    // Se houver ajuste manual neste dia, aplicar como delta artificial
    const manualInitial = getAccountMoneyInitialByDate(calcKey);
    if (manualInitial !== null && !isNaN(manualInitial)) {
      const saldoAntesDesteDia = saldo - dailyTotal - reserveDelta;
      const ajuste = manualInitial - saldoAntesDesteDia;
      saldo = saldo + ajuste;
    }
    
    // Avançar para o próximo dia
    currentDate.setDate(currentDate.getDate() + 1);
    currentDate.setHours(0, 0, 0, 0);
  }
  
  return saldo;
}, [formatDateKey, getAccountMoneyInitialByDate, calculateDailyTotal, getReserveMovements]);
```

#### saveAccountMoney (ATUAL)

```typescript
const saveAccountMoney = useCallback(async (dateKey: string, value: number) => {
  if (isNaN(value) || !isFinite(value)) {
    console.error("saveAccountMoney: valor inválido", value);
    return;
  }
  
  // Remover qualquer valor inicial salvo anteriormente para esta data
  if (typeof window !== "undefined") {
    const key = k(`accountMoneyInitial:${dateKey}`);
    window.localStorage.removeItem(key);
  }
  
  // Salvar APENAS o valor inicial para esta data específica
  writeJSON(k(`accountMoneyInitial:${dateKey}`), value);
  
  // Sincronizar com Supabase
  syncToSupabase();
  
  // Disparar evento para atualizar UI em outros componentes
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("pixel-life-storage-change"));
  }
}, [syncToSupabase]);
```

#### getAccountMoneyInitialByDate

```typescript
const getAccountMoneyInitialByDate = useCallback((dateKey: string): number | null => {
  const stored = readJSON<number | null>(k(`accountMoneyInitial:${dateKey}`), null);
  return stored;
}, []);
```

#### getCurrentReserve (FUNCIONA CORRETAMENTE - USAR COMO REFERÊNCIA)

```typescript
const getCurrentReserve = useCallback((dateKey?: string): number => {
  const targetDate = dateKey ? (() => {
    const [yearStr, monthStr, dayStr] = dateKey.split("-");
    return new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, parseInt(dayStr, 10));
  })() : new Date();
  
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

---

### app/board/page.tsx - Botão Salvar

```typescript
onClick={async () => {
  try {
    if (!accountMoney || accountMoney.trim() === '') {
      return;
    }
    const parsed = parseFloat(accountMoney.replace(",", "."));
    if (isNaN(parsed)) {
      return;
    }
    
    // Salvar para o dia 1 do mês selecionado
    const day1Key = formatDateKey(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1));
    
    // Calcular o valor inicial (antes dos gastos e movimentações do dia 1)
    const day1DailyTotal = calculateDailyTotal(day1Key);
    const day1ReserveMovements = getReserveMovements(day1Key);
    const day1ReserveDelta = day1ReserveMovements.reduce((sum, m) => sum + m.value, 0);
    
    // Calcular o valor inicial: valor total desejado menos os gastos e movimentações do dia 1
    const initialValue = parsed - day1DailyTotal - day1ReserveDelta;
    
    // Salva o valor inicial para o dia 1 do mês selecionado
    await saveAccountMoney(day1Key, initialValue);
    
    // Atualizar o valor exibido
    setAccountMoney(parsed.toString());

    // Recarregar monthlyRows após salvar
    const monthKey = formatMonthKey(selectedMonth);
    const desired = getDesiredMonthlyExpense(monthKey) || 0;
    const reset = getResetDate(monthKey) || 1;
    
    const rows = calculateMonthlyData(selectedMonth.getFullYear(), selectedMonth.getMonth(), desired, reset);
    setMonthlyRows(rows);
    
    // Disparar evento para atualizar Display e outros componentes
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("pixel-life-storage-change"));
    }
  } catch (error) {
    console.error('Erro ao salvar dinheiro em conta:', error);
    alert('Erro ao salvar dinheiro em conta. Verifique o console para mais detalhes.');
  }
}}
```

---

## ✅ COMO DEVERIA FUNCIONAR

### Lógica Correta:

1. **Buscar último valor salvo (se houver)**
   - Caminhar para trás no tempo até encontrar um `accountMoneyInitial` salvo
   - Se encontrar no dia X com valor V: usar V como ponto de base
   - Se não encontrar: começar do zero

2. **Acumular desde o ponto de base**
   - Se encontrou valor V no dia X:
     - Começar com V no dia X
     - Acumular: `V + totalDiário_diaX + totalDiário_diaX+1 + ... + totalDiário_diaTarget`
   - Se não encontrou:
     - Começar do zero
     - Acumular desde sempre (2020 ou 2 anos atrás)

3. **Fórmula:**
   ```
   Se há valor salvo no dia X:
     saldo[diaTarget] = valor_salvo_diaX + soma(totalDiário + reserveDelta desde dia X até diaTarget)
   
   Se não há valor salvo:
     saldo[diaTarget] = soma(totalDiário + reserveDelta desde início até diaTarget)
   ```

### Exemplo Prático:

**Cenário:** Usuário salva 99 no dia 1 de janeiro

1. `saveAccountMoney("2025-01-01", 99 - gastos_dia1 - reserva_dia1)` salva o valor inicial
2. `getAccountMoney("2025-01-01")`:
   - Busca e encontra valor inicial salvo no dia 1
   - Retorna: `valor_inicial + gastos_dia1 + reserva_dia1 = 99` ✅
3. `getAccountMoney("2025-01-02")`:
   - Busca e encontra valor inicial salvo no dia 1
   - Retorna: `valor_inicial + gastos_dia1 + reserva_dia1 + gastos_dia2 + reserva_dia2`
   - Se dia2 tem -34: `99 - 34 = 65` ✅
4. `getAccountMoney("2025-02-01")` (fevereiro):
   - Busca e encontra valor inicial salvo no dia 1 de janeiro
   - Retorna: `valor_inicial + soma de todos os totais desde 1/jan até 1/fev` ✅

---

## 🔧 FUNÇÕES AUXILIARES DISPONÍVEIS

```typescript
formatDateKey(date: Date): string // "YYYY-MM-DD"
formatMonthKey(date: Date): string // "YYYY-MM"
calculateDailyTotal(dateKey: string): number // ganhos - gastos
getReserveMovements(dateKey: string): ReserveMovement[]
getAccountMoneyInitialByDate(dateKey: string): number | null
readJSON<T>(key: string, defaultValue: T): T
writeJSON<T>(key: string, value: T): void
k(suffix: string): string // `${STORAGE_PREFIX}:${suffix}`
```

---

## ❌ PROBLEMAS IDENTIFICADOS NO CÓDIGO ATUAL

1. **getAccountMoney não busca corretamente o último valor salvo**
   - Deveria caminhar para trás e encontrar o último `accountMoneyInitial`
   - Atualmente tenta aplicar como "delta artificial" dia a dia, o que está errado

2. **Lógica de ajuste manual está incorreta**
   - O ajuste deveria ser um **ponto de base**, não um delta aplicado dia a dia
   - Se salvo no dia X, todos os dias após X devem usar esse valor como base

3. **Botão não atualiza a UI**
   - Pode ser problema de estado ou evento não disparando corretamente

---

## ✅ SOLUÇÃO ESPERADA

### getAccountMoney deve:

1. **Buscar último valor salvo retroativamente**
   ```typescript
   let lastSavedValue: { date: Date; value: number } | null = null;
   let searchDate = new Date(targetDate);
   
   while (searchDate >= minDate) {
     const checkKey = formatDateKey(searchDate);
     const savedValue = getAccountMoneyInitialByDate(checkKey);
     if (savedValue !== null) {
       lastSavedValue = { date: searchDate, value: savedValue };
       break; // Encontrou o último valor salvo
     }
     searchDate.setDate(searchDate.getDate() - 1);
   }
   ```

2. **Acumular desde o ponto de base**
   ```typescript
   let saldo: number;
   let startDate: Date;
   
   if (lastSavedValue !== null) {
     // Usar valor salvo como ponto de base
     saldo = lastSavedValue.value;
     startDate = lastSavedValue.date;
   } else {
     // Sem valor salvo: começar do zero desde sempre
     saldo = 0;
     startDate = new Date(2020, 0, 1); // ou 2 anos atrás
   }
   
   // Acumular desde startDate até targetDate
   while (currentDate <= targetDate) {
     saldo = saldo + calculateDailyTotal(calcKey) + reserveDelta;
     currentDate.setDate(currentDate.getDate() + 1);
   }
   ```

3. **Garantir que o botão atualiza a UI**
   - Disparar evento `pixel-life-storage-change`
   - Recarregar `monthlyRows`
   - Atualizar estado `accountMoney`

---

## 🎯 TESTE DE VALIDAÇÃO

1. **Salvar 99 no dia 1 de janeiro**
   - Dia 1 deve mostrar 99 ✅
   - Dia 2 deve mostrar 99 + totalDiário_dia2 ✅
   - Dia 1 de fevereiro deve mostrar 99 + soma de todos os totais desde 1/jan ✅

2. **Botão Salvar**
   - Deve atualizar a UI imediatamente ✅
   - Deve recalcular todos os dias do mês ✅
   - Deve disparar evento para atualizar Display ✅

3. **Continuidade entre meses**
   - Janeiro → Fevereiro: valores devem continuar ✅
   - Não deve resetar ao mudar de mês ✅

---

## 📝 RESUMO

**O que precisa ser corrigido:**

1. `getAccountMoney`: Buscar último valor salvo e usar como ponto de base para acumulação
2. Remover lógica de "delta artificial" - usar valor salvo como base direta
3. Garantir que botão atualiza UI corretamente
4. Fazer funcionar exatamente como descrito: valor X modificado pelos totais diários seguintes

