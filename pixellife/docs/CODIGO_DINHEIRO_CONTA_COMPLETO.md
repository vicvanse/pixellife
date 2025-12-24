# CÓDIGO COMPLETO: CORREÇÃO DO DINHEIRO EM CONTA

## 🔴 PROBLEMA ATUAL

O "Dinheiro em Conta" não está funcionando:

1. **Botão "Salvar" não atualiza a UI** - Clicar em salvar não atualiza os valores na tela
2. **Valor salvo não propaga** - Quando salva um valor X no dia Y, os dias seguintes não são recalculados
3. **Não é soma contínua** - Deveria ser soma contínua baseada nos totais diários

## ✅ COMPORTAMENTO ESPERADO

### Regra Fundamental (SIGUE O MODELO DA RESERVA):
**"Dinheiro em Conta" funciona EXATAMENTE como "Reserva", mas considerando os totais diários**

### Como funciona (IGUAL À RESERVA):
- Quando você **muda o valor de um dia**, esse valor se torna o novo ponto de base
- **Todos os dias seguintes** são automaticamente recalculados baseados nesse novo valor
- A propagação é contínua através de todos os meses (não reseta ao mudar de mês)

### Exemplo Prático:
**Cenário:** Usuário edita "Dinheiro em conta" para **99** no dia 5 de janeiro

1. **Salvar valor no dia 5:**
   - Valor **99** é salvo como ponto de base para o dia 5
   - Este valor é **ANTES** dos gastos/reserva do dia 5

2. **Cálculo do dia 5:**
   - `dinheiroEmConta[05/jan] = 99 + totalDiário_dia5 + reserveDelta_dia5`
   - Se dia 5 tem gastos de -30: `99 - 30 = 69` ✅

3. **Cálculo do dia 6 (e todos os seguintes):**
   - `dinheiroEmConta[06/jan] = 99 + totalDiário_dia5 + reserveDelta_dia5 + totalDiário_dia6 + reserveDelta_dia6`
   - Continua acumulando até o final do mês ✅

4. **Cálculo do dia 1 de fevereiro:**
   - `dinheiroEmConta[01/fev] = 99 + soma(todos os totais desde 05/jan até 01/fev)`
   - Continua através dos meses ✅

### Comportamento Específico (IGUAL À RESERVA):

**Ao salvar um valor no dia X:**
- O valor salvo é para o dia X e **TODOS os dias seguintes** (até encontrar outro valor salvo)
- Se você salvar outro valor no dia Y (Y > X), esse novo valor substitui o anterior a partir do dia Y
- O sistema sempre usa o **último valor salvo** encontrado retroativamente

### Fórmula:
```
PASSO 1: Buscar último valor salvo (retroativamente)
  lastSaved = buscar_último_accountMoneyInitial_salvo(até dataTarget)

PASSO 2: Se encontrou valor salvo no dia X:
  dinheiroEmConta[diaY] = valor_salvo_diaX + soma(totalDiário + reserveDelta desde dia X até dia Y)

PASSO 3: Se não encontrou valor salvo:
  dinheiroEmConta[diaY] = soma(totalDiário + reserveDelta desde sempre até dia Y)
```

### Diferença em relação à Reserva:
- **Reserva**: Considera apenas movimentações de reserva (`reserveDelta`)
- **Dinheiro em Conta**: Considera movimentações de reserva **+ totais diários** (ganhos - gastos)

---

## 📋 CÓDIGO COMPLETO ATUAL

### app/hooks/useExpenses.ts

#### getAccountMoney (ATUAL - PRECISA CORRIGIR)

```typescript
// Calcula o dinheiro em conta para uma data específica de forma acumulativa
// CORREÇÃO DEFINITIVA: Funciona EXATAMENTE como getCurrentReserve
// REGRA DE OURO: Saldo não tem reset. Saldo só soma.
// INVARIANTES:
// 1. Saldo é contínuo no tempo, independente de mês
// 2. Saldo(dia N) = Saldo(dia N−1) + TotalDiário(dia N) + MovimentaçõesReserva(dia N)
// 3. Saldo não tem reset - saldo só soma
// 4. Troca de mês NÃO reseta saldo - o saldo continua de mês para mês
// MODELO: Igual getCurrentReserve - começa do zero, acumula desde sempre
// Se houver ajuste manual (accountMoneyInitial): aplicar como delta artificial apenas naquele dia
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
  // Fórmula: saldo[dia] = saldo[dia-1] + totalDiário[dia] + movimentaçõesReserva[dia]
  // Se houver ajuste manual, aplicar como delta artificial apenas naquele dia
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
    // O ajuste manual não é reset, é apenas um ajuste do valor calculado
    // accountMoneyInitial contém o valor desejado ANTES dos gastos/reserva do dia
    // Então: saldo_final = saldo_antes + gastos + reserva + ajuste
    // onde ajuste = initialValue - (saldo_antes)
    const manualInitial = getAccountMoneyInitialByDate(calcKey);
    if (manualInitial !== null && !isNaN(manualInitial)) {
      // Calcular o saldo ANTES de aplicar este dia para obter o ajuste
      const saldoAntesDesteDia = saldo - dailyTotal - reserveDelta;
      // O ajuste é a diferença entre o valor manual e o que calculamos
      const ajuste = manualInitial - saldoAntesDesteDia;
      // Aplicar o ajuste
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
// Salva o valor inicial de dinheiro em conta para UMA data específica
// INVARIANTES:
// 1. Salvar apenas o ponto inicial (override manual) para uma data específica
// 2. NUNCA propagar para dias futuros - isso quebra continuidade
// 3. O valor salvo é o saldo ANTES de aplicar gastos e movimentações daquele dia
// 4. getAccountMoney recalcula todos os dias seguintes automaticamente
// MODELO: Quando o usuário edita "Dinheiro atual em conta" no dia X, salva apenas o valor inicial do dia X
// Todos os dias após X são recalculados automaticamente por getAccountMoney usando acumulação incremental
const saveAccountMoney = useCallback(async (dateKey: string, value: number) => {
  if (isNaN(value) || !isFinite(value)) {
    console.error("saveAccountMoney: valor inválido", value);
    return;
  }
  
  // Remover qualquer valor inicial salvo anteriormente para esta data
  // Isso garante que apenas um valor inicial existe por data
  if (typeof window !== "undefined") {
    const key = k(`accountMoneyInitial:${dateKey}`);
    window.localStorage.removeItem(key);
  }
  
  // Salvar APENAS o valor inicial para esta data específica
  // Este valor será usado por getAccountMoney como ponto de partida para cálculos futuros
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
    
    // Próximo dia
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return totalReserve;
}, [formatDateKey, calculateDailyReserveDelta]);
```

#### Funções Auxiliares

```typescript
// Formata data como "YYYY-MM-DD"
const formatDateKey = useCallback((date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}, []);

// Calcula total diário (ganhos - gastos)
const calculateDailyTotal = useCallback(
  (dateKey: string): number => {
    const items = getDailyExpenses(dateKey);
    return items.reduce((sum, it) => sum + it.value, 0);
  },
  [getDailyExpenses]
);

// Obter movimentações de reserva
const getReserveMovements = useCallback(
  (dateKey: string): ReserveMovement[] => {
    return readJSON<ReserveMovement[]>(k(`reserve:${dateKey}`), []);
  },
  []
);
```

---

### app/board/page.tsx - Botão Salvar e Estados

#### Estados

```typescript
const [accountMoney, setAccountMoney] = useState<string>('');
const [monthlyRows, setMonthlyRows] = useState<MonthlyRow[]>([]);
const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
```

#### useEffect para Carregar accountMoney

```typescript
useEffect(() => {
  // Carregar accountMoney do dia 1 do mês selecionado para exibir no input
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
}, [selectedMonth, formatDateKey, getAccountMoneyInitialByDate, getAccountMoney]);
```

#### Botão Salvar (ATUAL - PRECISA CORRIGIR)

```typescript
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
      
      // Salvar para o dia 1 do mês selecionado
      // O usuário digita o valor TOTAL que quer no dia 1
      const day1Key = formatDateKey(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1));
      
      // Para garantir que o valor TOTAL do dia 1 seja o que o usuário digitou (parsed),
      // precisamos calcular o valor INICIAL (antes dos gastos e movimentações do dia 1)
      // Fórmula: valor_total[dia1] = valor_inicial[dia1] + gastos_diários[dia1] + movimentações_reserva[dia1]
      // Portanto: valor_inicial[dia1] = valor_total[dia1] - gastos_diários[dia1] - movimentações_reserva[dia1]
      const day1DailyTotal = calculateDailyTotal(day1Key);
      const day1ReserveMovements = getReserveMovements(day1Key);
      const day1ReserveDelta = day1ReserveMovements.reduce((sum, m) => sum + m.value, 0);
      
      // Calcular o valor inicial: valor total desejado menos os gastos e movimentações do dia 1
      // Isso garante que: getAccountMoney(day1Key) retornará exatamente o valor digitado pelo usuário
      const initialValue = parsed - day1DailyTotal - day1ReserveDelta;
      
      // Salva o valor inicial para o dia 1 do mês selecionado
      // IMPORTANTE: getAccountMoney recalculará AUTOMATICAMENTE todos os dias seguintes
      // usando este valor como ponto de partida
      await saveAccountMoney(day1Key, initialValue);
      
      // Atualizar o valor exibido
      setAccountMoney(parsed.toString());

      // Recarregar monthlyRows após salvar (rebuild completo)
      // Isso garante que todos os dias do mês mostrem os valores recalculados
      const monthKey = formatMonthKey(selectedMonth);
      const desired = getDesiredMonthlyExpense(monthKey) || 0;
      const reset = getResetDate(monthKey) || 1;
      
      // Recalcular mês atual
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
>
  Salvar
</button>
```

---

## ✅ COMO DEVERIA FUNCIONAR

### Lógica Correta do getAccountMoney (MODELO RESERVA):

**IMPORTANTE:** Funciona EXATAMENTE como `getCurrentReserve`, mas considerando `totalDiário` também.

1. **Buscar último valor salvo retroativamente (IGUAL À RESERVA)**
   - Caminhar para trás no tempo desde `targetDate` até encontrar um `accountMoneyInitial` salvo
   - Buscar em todos os dias até encontrar um valor salvo
   - Se encontrar no dia X com valor V: usar V como **ponto de base**
   - Se não encontrar: começar do **zero**

2. **Acumular desde o ponto de base até targetDate (IGUAL À RESERVA)**
   - Se encontrou valor V no dia X:
     - Começar com V (valor salvo ANTES dos gastos/reserva do dia X)
     - Acumular desde o dia X: `V + dailyTotal_diaX + reserveDelta_diaX + dailyTotal_diaX+1 + reserveDelta_diaX+1 + ... + dailyTotal_targetDate + reserveDelta_targetDate`
   - Se não encontrou:
     - Começar do zero
     - Acumular desde sempre (2020 ou 2 anos atrás)

3. **Fórmula Matemática (IGUAL À RESERVA):**
   ```
   PASSO 1: Buscar último valor salvo retroativamente
     lastSaved = null
     searchDate = targetDate
     enquanto searchDate >= dataMínima:
       se existe accountMoneyInitial[searchDate]:
         lastSaved = { date: searchDate, value: accountMoneyInitial[searchDate] }
         PARAR busca
       senão:
         searchDate = dia anterior
   
   PASSO 2: Determinar ponto de partida
     se lastSaved existe:
       saldo_inicial = lastSaved.value  // valor ANTES dos gastos/reserva daquele dia
       startDate = lastSaved.date
     senão:
       saldo_inicial = 0
       startDate = 2020-01-01 (ou 2 anos atrás)
   
   PASSO 3: Acumular desde startDate até targetDate (AMBOS inclusivos)
     saldo = saldo_inicial
     currentDate = startDate
     enquanto currentDate <= targetDate:
       dailyTotal = calculateDailyTotal(currentDate)  // ganhos - gastos
       reserveDelta = calculateDailyReserveDelta(currentDate)  // movimentações reserva
       saldo = saldo + dailyTotal + reserveDelta
       currentDate = próximo dia
   
   RETORNAR saldo
   ```

### Exemplo Prático Detalhado (SIGUE MODELO DA RESERVA):

**Cenário:** Usuário edita "Dinheiro em conta" para **99** no dia 5 de janeiro

**Passo 1: Usuário edita e clica em "Salvar" no dia 5**
```
Input no dia 5: "99"
Calcula: initialValue = 99 - totalDiário_dia5 - reserveDelta_dia5
Salva: accountMoneyInitial["2025-01-05"] = initialValue
```

**Passo 2: getAccountMoney("2025-01-05")**
```
1. Busca retroativamente: encontra accountMoneyInitial["2025-01-05"] = initialValue
2. Ponto de base: saldo = initialValue, startDate = 2025-01-05
3. Acumula dia 5: saldo = initialValue + totalDiário_dia5 + reserveDelta_dia5 = 99 ✅
4. Retorna: 99
```

**Passo 3: getAccountMoney("2025-01-06")**
```
1. Busca retroativamente: encontra accountMoneyInitial["2025-01-05"] = initialValue
2. Ponto de base: saldo = initialValue, startDate = 2025-01-05
3. Acumula dia 5: saldo = initialValue + totalDiário_dia5 + reserveDelta_dia5 = 99
4. Acumula dia 6: saldo = 99 + totalDiário_dia6 + reserveDelta_dia6
   Se dia6 tem gastos de -34: saldo = 99 - 34 = 65 ✅
5. Retorna: 65
```

**Passo 4: getAccountMoney("2025-01-04") (dia anterior ao salvo)**
```
1. Busca retroativamente: NÃO encontra accountMoneyInitial antes do dia 5
2. Ponto de base: saldo = 0, startDate = 2020-01-01 (ou 2 anos atrás)
3. Acumula desde início até dia 4: saldo = soma histórica até dia 4
4. Retorna: valor histórico (não afetado pelo valor salvo no dia 5) ✅
```

**Passo 5: getAccountMoney("2025-02-01") (fevereiro)**
```
1. Busca retroativamente: encontra accountMoneyInitial["2025-01-05"] = initialValue
2. Ponto de base: saldo = initialValue, startDate = 2025-01-05
3. Acumula todos os dias desde 5/jan até 1/fev:
   saldo = initialValue + soma(todos os totais desde 5/jan até 1/fev)
4. Retorna: valor contínuo através dos meses ✅
```

**Passo 6: Usuário edita para 200 no dia 10 de janeiro**
```
1. Salva: accountMoneyInitial["2025-01-10"] = novoInitialValue (200 - gastos_dia10 - reserva_dia10)
2. getAccountMoney("2025-01-11"):
   - Busca retroativamente: encontra accountMoneyInitial["2025-01-10"] (mais recente)
   - Usa novo valor como base, ignora o valor do dia 5 ✅
3. O valor do dia 5 agora só afeta dias 5-9 ✅
```

---

## ❌ PROBLEMAS IDENTIFICADOS

### Problema 1: getAccountMoney não funciona como a Reserva

**Erro atual:**
- Não busca retroativamente o último valor salvo corretamente
- Tenta aplicar como "delta artificial" dia a dia (INCORRETO)
- Não usa o valor salvo como ponto de base para acumulação contínua
- Não segue o modelo da Reserva

**Deve fazer (IGUAL À RESERVA):**
- Buscar retroativamente até encontrar último `accountMoneyInitial` salvo
- Usar esse valor como **ponto de base inicial**
- Acumular desde esse ponto base até targetDate: `valor_base + soma(totalDiário + reserveDelta)`
- Quando encontrar valor salvo no dia X, todos os dias após X usam esse valor como base

### Problema 2: saveAccountMoney não propaga para dias seguintes

**Erro atual:**
- Salva apenas para o dia específico
- Não afeta os dias seguintes automaticamente

**Deve fazer (OPCIONAL - pode ser apenas cálculo):**
- Quando salvar no dia X, o `getAccountMoney` deve automaticamente usar esse valor para todos os dias >= X
- Não precisa salvar para múltiplos dias (getAccountMoney resolve retroativamente)
- O comportamento deve ser: "último valor salvo encontrado retroativamente"

### Problema 3: Botão não atualiza UI

**Possíveis causas:**
- `monthlyRows` não está sendo recalculado corretamente
- Evento `pixel-life-storage-change` não está disparando
- Estado `accountMoney` não está sendo atualizado
- `useEffect` de `monthlyRows` não está sendo acionado

**Deve garantir:**
- Após salvar, `monthlyRows` deve ser recalculado
- UI deve atualizar imediatamente
- Display deve ser atualizado via evento
- Input deve mostrar o valor correto após salvar

---

## ✅ SOLUÇÃO COMPLETA ESPERADA

### getAccountMoney CORRIGIDO (MODELO RESERVA):

```typescript
const getAccountMoney = useCallback((dateKey: string): number => {
  const [yearStr, monthStr, dayStr] = dateKey.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);
  const targetDate = new Date(year, month, day);
  targetDate.setHours(0, 0, 0, 0);
  
  // PASSO 1: Buscar último valor salvo retroativamente (IGUAL À RESERVA)
  // Buscar desde targetDate para trás até encontrar um accountMoneyInitial salvo
  let lastSavedValue: { date: Date; value: number } | null = null;
  let searchDate = new Date(targetDate);
  searchDate.setHours(0, 0, 0, 0);
  
  const maxSearchDays = 730; // ~2 anos (proteção)
  const minDate = new Date(2020, 0, 1);
  minDate.setHours(0, 0, 0, 0);
  let searchDays = 0;
  
  while (searchDays < maxSearchDays && searchDate >= minDate) {
    const checkKey = formatDateKey(searchDate);
    const savedValue = getAccountMoneyInitialByDate(checkKey);
    
    if (savedValue !== null && !isNaN(savedValue)) {
      // Encontrou o último valor salvo antes ou no targetDate
      lastSavedValue = {
        date: new Date(searchDate),
        value: savedValue
      };
      break; // Usa o último encontrado (mais próximo do targetDate)
    }
    
    // Ir para o dia anterior
    searchDate.setDate(searchDate.getDate() - 1);
    searchDays++;
  }
  
  // PASSO 2: Determinar ponto de partida e valor inicial
  let saldo: number;
  let startDate: Date;
  
  if (lastSavedValue !== null) {
    // Há valor salvo: usar como ponto de base (IGUAL À RESERVA)
    // O valor salvo é ANTES dos gastos/reserva daquele dia
    saldo = lastSavedValue.value;
    startDate = new Date(lastSavedValue.date);
    startDate.setHours(0, 0, 0, 0);
  } else {
    // Sem valor salvo: começar do zero desde sempre (IGUAL À RESERVA)
    saldo = 0;
    startDate = new Date(targetDate);
    startDate.setFullYear(Math.max(2020, targetDate.getFullYear() - 2));
    startDate.setMonth(0);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
  }
  
  // PASSO 3: Acumular desde startDate até targetDate (AMBOS inclusivos)
  // Fórmula (IGUAL À RESERVA, mas com totalDiário também):
  // saldo[dia] = saldo[dia-1] + totalDiário[dia] + movimentaçõesReserva[dia]
  let currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);
  
  while (currentDate <= targetDate) {
    const calcKey = formatDateKey(currentDate);
    
    // Obter total diário (ganhos - gastos) - DIFERENÇA DA RESERVA
    const dailyTotal = calculateDailyTotal(calcKey);
    
    // Obter movimentações de reserva do dia (IGUAL À RESERVA)
    const reserveMovements = getReserveMovements(calcKey);
    const reserveDelta = reserveMovements.reduce((sum, m) => sum + m.value, 0);
    
    // Acumular: saldo atual + mudanças do dia (totalDiário + reserveDelta)
    saldo = saldo + dailyTotal + reserveDelta;
    
    // Avançar para o próximo dia
    currentDate.setDate(currentDate.getDate() + 1);
    currentDate.setHours(0, 0, 0, 0);
  }
  
  return saldo;
}, [formatDateKey, getAccountMoneyInitialByDate, calculateDailyTotal, getReserveMovements]);
```

### Botão Salvar CORRIGIDO (garantir atualização):

```typescript
<button
  onClick={async () => {
    try {
      if (!accountMoney || accountMoney.trim() === '') {
        return;
      }
      const parsed = parseFloat(accountMoney.replace(",", "."));
      if (isNaN(parsed)) {
        return;
      }
      
      const day1Key = formatDateKey(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1));
      const day1DailyTotal = calculateDailyTotal(day1Key);
      const day1ReserveMovements = getReserveMovements(day1Key);
      const day1ReserveDelta = day1ReserveMovements.reduce((sum, m) => sum + m.value, 0);
      
      // Calcular valor inicial (ANTES dos gastos/reserva do dia 1)
      const initialValue = parsed - day1DailyTotal - day1ReserveDelta;
      
      // Salvar valor inicial
      await saveAccountMoney(day1Key, initialValue);
      
      // Atualizar estado local
      setAccountMoney(parsed.toString());
      
      // Recarregar monthlyRows IMEDIATAMENTE
      const monthKey = formatMonthKey(selectedMonth);
      const desired = getDesiredMonthlyExpense(monthKey) || 0;
      const reset = getResetDate(monthKey) || 1;
      const rows = calculateMonthlyData(selectedMonth.getFullYear(), selectedMonth.getMonth(), desired, reset);
      setMonthlyRows(rows);
      
      // Disparar evento para atualizar outros componentes
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("pixel-life-storage-change"));
      }
      
      // Forçar atualização do input também
      const updatedDay1Money = getAccountMoney(day1Key);
      setAccountMoney(updatedDay1Money.toString());
      
    } catch (error) {
      console.error('Erro ao salvar dinheiro em conta:', error);
      alert('Erro ao salvar dinheiro em conta. Verifique o console para mais detalhes.');
    }
  }}
>
  Salvar
</button>
```

---

## 🎯 TESTES DE VALIDAÇÃO

### Teste 1: Salvar valor e verificar propagação
1. Salvar 99 no dia 1 de janeiro
2. Verificar: Dia 1 mostra 99 ✅
3. Verificar: Dia 2 mostra 99 + totalDiário_dia2 ✅
4. Verificar: Dia 1 de fevereiro mostra 99 + soma de todos os totais desde 1/jan ✅

### Teste 2: Botão atualiza UI
1. Clicar em "Salvar"
2. Verificar: Tabela mensal atualiza imediatamente ✅
3. Verificar: Input mostra valor atualizado ✅
4. Verificar: Display atualiza (via evento) ✅

### Teste 3: Continuidade entre meses
1. Salvar valor em dezembro
2. Navegar para janeiro
3. Verificar: Valores continuam corretamente ✅
4. Verificar: Não há reset ao mudar de mês ✅

---

## 📝 RESUMO FINAL

**O que o GPT precisa fazer:**

1. **Corrigir getAccountMoney:**
   - Buscar retroativamente o último `accountMoneyInitial` salvo
   - Usar esse valor como ponto de base inicial
   - Acumular desde o ponto base até targetDate
   - Remover lógica de "delta artificial" - usar valor direto como base

2. **Corrigir botão Salvar:**
   - Garantir que `monthlyRows` é recalculado e atualizado
   - Garantir que estado `accountMoney` é atualizado
   - Garantir que evento dispara corretamente
   - Forçar atualização da UI após salvar

3. **Garantir comportamento:**
   - Valor X salvo no dia Y propaga para todos os dias seguintes
   - Soma contínua através de todos os meses
   - Botão atualiza UI imediatamente

