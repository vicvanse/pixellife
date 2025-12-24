/**
 * Funções auxiliares para exportar/importar dados do localStorage
 * Necessário para sincronizar dados complexos como expenses que usam múltiplas chaves
 */

/**
 * Exporta todos os dados de expenses do localStorage
 * Expenses usa múltiplas chaves (uma para cada dia/mês), então precisamos exportar todas
 */
export function exportExpensesData(): Record<string, unknown> {
  if (typeof window === "undefined") return {};
  
  const data: Record<string, unknown> = {};
  const prefix = "pixel-life-expenses-v1:";
  
  // Iterar sobre todas as chaves do localStorage
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      try {
        const value = window.localStorage.getItem(key);
        if (value) {
          data[key] = JSON.parse(value);
        }
      } catch (error) {
        console.error(`Erro ao exportar chave ${key}:`, error);
      }
    }
  }
  
  return data;
}

/**
 * Importa dados de expenses para o localStorage
 */
export function importExpensesData(data: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  
  const prefix = "pixel-life-expenses-v1:";
  
  // Limpar todas as chaves antigas de expenses
  const keysToRemove: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => window.localStorage.removeItem(key));
  
  // Importar novos dados
  Object.entries(data).forEach(([key, value]) => {
    if (key.startsWith(prefix)) {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error(`Erro ao importar chave ${key}:`, error);
      }
    }
  });
  
  // Disparar evento para notificar componentes sobre mudanças
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"));
    // Também disparar evento customizado para expenses
    window.dispatchEvent(new CustomEvent("expenses-updated"));
  }
}

/**
 * Exporta dados de tree (leisure e personal skills)
 */
export function exportTreeData(): { leisure: unknown; personal: unknown } {
  if (typeof window === "undefined") return { leisure: null, personal: null };
  
  const leisureKey = "pixel-life-tree-v1:leisure-skills";
  const personalKey = "pixel-life-tree-v1:personal-skills";
  
  let leisure = null;
  let personal = null;
  
  try {
    const leisureRaw = window.localStorage.getItem(leisureKey);
    if (leisureRaw) leisure = JSON.parse(leisureRaw);
  } catch (error) {
    console.error("Erro ao exportar leisure skills:", error);
  }
  
  try {
    const personalRaw = window.localStorage.getItem(personalKey);
    if (personalRaw) personal = JSON.parse(personalRaw);
  } catch (error) {
    console.error("Erro ao exportar personal skills:", error);
  }
  
  return { leisure, personal };
}

/**
 * Importa dados de tree
 */
export function importTreeData(data: { leisure: unknown; personal: unknown }): void {
  if (typeof window === "undefined") return;
  
  const leisureKey = "pixel-life-tree-v1:leisure-skills";
  const personalKey = "pixel-life-tree-v1:personal-skills";
  
  try {
    if (data.leisure !== null && data.leisure !== undefined) {
      window.localStorage.setItem(leisureKey, JSON.stringify(data.leisure));
    }
  } catch (error) {
    console.error("Erro ao importar leisure skills:", error);
  }
  
  try {
    if (data.personal !== null && data.personal !== undefined) {
      window.localStorage.setItem(personalKey, JSON.stringify(data.personal));
    }
  } catch (error) {
    console.error("Erro ao importar personal skills:", error);
  }
}



