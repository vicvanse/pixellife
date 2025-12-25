/**
 * Utilitários para sincronização de dados com Supabase
 * Salva dados no banco de dados para sincronização entre dispositivos
 */

import { supabase } from "./supabaseClient";
import { exportExpensesData, importExpensesData, exportTreeData, importTreeData, exportFinancialEntriesData, importFinancialEntriesData } from "./sync-helpers";
import type { PostgrestError } from "@supabase/supabase-js";
import { withRetry } from "./retry";

// Tipos de dados que podem ser sincronizados
export type SyncDataType = "habits" | "journal" | "expenses" | "financial_entries" | "possessions" | "tree" | "cosmetics" | "profile" | "user_modules" | "lifedex_categories" | "lifedex_items" | "lifedex_future_lists" | "lifedex_future_list_items" | "biography";

/**
 * Valida dados antes de salvar no Supabase
 * Retorna true se os dados são válidos, false caso contrário
 */
function validateDataBeforeSave(dataType: SyncDataType, data: unknown): { valid: boolean; error?: string } {
  try {
    switch (dataType) {
      case "habits":
        if (!Array.isArray(data)) {
          return { valid: false, error: "Habits deve ser um array" };
        }
        // Validar estrutura básica de cada hábito
        if (data.length > 0 && !data.every((item: any) => typeof item === "object" && item !== null)) {
          return { valid: false, error: "Habits deve conter objetos válidos" };
        }
        break;

      case "journal":
        if (typeof data !== "object" || data === null) {
          return { valid: false, error: "Journal deve ser um objeto" };
        }
        break;

      case "expenses":
        if (typeof data !== "object" || data === null) {
          return { valid: false, error: "Expenses deve ser um objeto" };
        }
        break;

      case "financial_entries":
        if (!Array.isArray(data)) {
          return { valid: false, error: "Financial_entries deve ser um array" };
        }
        // Validar estrutura básica de cada entrada financeira
        if (data.length > 0 && !data.every((item: any) => typeof item === "object" && item !== null && typeof item.id === "string" && typeof item.amount === "number")) {
          return { valid: false, error: "Financial_entries deve conter objetos válidos com id e amount" };
        }
        break;

      case "possessions":
        if (!Array.isArray(data)) {
          return { valid: false, error: "Possessions deve ser um array" };
        }
        // Validar que cada possession tem title (não name)
        if (data.length > 0) {
          const invalidItems = data.filter((item: any) => {
            if (typeof item !== "object" || item === null) return true;
            // Deve ter title, não name
            if (item.name && !item.title) return true;
            return false;
          });
          if (invalidItems.length > 0) {
            return { valid: false, error: "Possessions deve usar 'title' ao invés de 'name'" };
          }
        }
        break;

      case "tree":
        if (typeof data !== "object" || data === null) {
          return { valid: false, error: "Tree deve ser um objeto" };
        }
        break;

      case "cosmetics":
        if (typeof data !== "object" || data === null) {
          return { valid: false, error: "Cosmetics deve ser um objeto" };
        }
        break;

      case "profile":
        if (typeof data !== "object" || data === null) {
          return { valid: false, error: "Profile deve ser um objeto" };
        }
        break;

      case "user_modules":
        if (typeof data !== "object" || data === null) {
          return { valid: false, error: "User_modules deve ser um objeto" };
        }
        break;

      case "lifedex_categories":
      case "lifedex_items":
      case "lifedex_future_lists":
      case "lifedex_future_list_items":
        if (!Array.isArray(data)) {
          return { valid: false, error: `${dataType} deve ser um array` };
        }
        break;

      case "biography":
        if (!Array.isArray(data)) {
          return { valid: false, error: "Biography deve ser um array" };
        }
        break;

      default:
        // Para tipos desconhecidos, apenas verificar se não é null/undefined
        if (data === null || data === undefined) {
          return { valid: false, error: "Dados não podem ser null ou undefined" };
        }
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: `Erro ao validar dados: ${(error as Error).message}` };
  }
}

/**
 * Sanitiza dados removendo campos undefined e null desnecessários
 * Também remove campos vazios de strings e normaliza estruturas
 */
function sanitizeData(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }

  if (typeof data === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      // Pular campos undefined
      if (value === undefined) continue;
      
      // Para strings vazias em campos opcionais, converter para undefined
      if (typeof value === "string" && value.trim() === "" && key !== "text" && key !== "title") {
        continue; // Pular strings vazias em campos opcionais
      }
      
      // Sanitizar recursivamente
      const sanitizedValue = sanitizeData(value);
      if (sanitizedValue !== undefined) {
        sanitized[key] = sanitizedValue;
      }
    }
    return sanitized;
  }

  return data;
}

/**
 * Compara timestamps e retorna qual versão usar em caso de conflito
 * Retorna 'local' se local é mais recente, 'remote' se remote é mais recente
 */
function resolveConflict(localUpdatedAt: string | null, remoteUpdatedAt: string | null): "local" | "remote" {
  if (!remoteUpdatedAt) return "local";
  if (!localUpdatedAt) return "remote";
  
  const localTime = new Date(localUpdatedAt).getTime();
  const remoteTime = new Date(remoteUpdatedAt).getTime();
  
  // Se a diferença for menor que 1 segundo, considerar como simultâneo e usar local
  if (Math.abs(localTime - remoteTime) < 1000) {
    return "local";
  }
  
  return remoteTime > localTime ? "remote" : "local";
}

/**
 * Salva dados no Supabase para sincronização
 */
/**
 * Helper genérico para salvar dados com sincronização automática
 * Usa retry logic e tratamento de erros
 */
async function saveWithSync(
  userId: string,
  dataType: SyncDataType,
  data: unknown
): Promise<{ error: Error | null }> {
  const startTime = Date.now();
  
  try {
    // Verificar se há sessão válida antes de tentar salvar
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.warn(`⚠️ [${dataType}] Sem sessão válida para salvar. Usuário precisa fazer login.`);
      return { error: new Error("Sessão não encontrada. Por favor, faça login novamente.") };
    }

    // Verificar se o userId da sessão corresponde ao userId passado
    if (session.user.id !== userId) {
      console.warn(`⚠️ [${dataType}] userId da sessão (${session.user.id}) não corresponde ao userId fornecido (${userId})`);
      return { error: new Error("Sessão inválida. Por favor, faça login novamente.") };
    }

    // Para expenses, tree e financial_entries, exportar todos os dados do localStorage
    let dataToSave = data;
    if (dataType === "expenses") {
      dataToSave = exportExpensesData();
      console.log(`📊 [${dataType}] Dados exportados do localStorage`);
    } else if (dataType === "tree") {
      dataToSave = exportTreeData();
      console.log(`📊 [${dataType}] Dados exportados do localStorage`);
    } else if (dataType === "financial_entries") {
      dataToSave = exportFinancialEntriesData();
      console.log(`📊 [${dataType}] Dados exportados do localStorage`);
    }

    // Validar dados antes de salvar
    const validation = validateDataBeforeSave(dataType, dataToSave);
    if (!validation.valid) {
      console.error(`❌ [${dataType}] Validação falhou:`, validation.error);
      return { error: new Error(`Dados inválidos: ${validation.error}`) };
    }
    console.log(`✅ [${dataType}] Validação passou`);

    // Sanitizar dados (remover undefined, null desnecessários)
    const sanitizedData = sanitizeData(dataToSave);
    const dataSize = JSON.stringify(sanitizedData).length;
    console.log(`🧹 [${dataType}] Dados sanitizados (tamanho: ${(dataSize / 1024).toFixed(2)} KB)`);

    // Verificar se há dados remotos para comparar timestamps
    let remoteUpdatedAt: string | null = null;
    try {
      const { data: existingData } = await supabase
        .from("user_data")
        .select("updated_at")
        .eq("user_id", userId)
        .eq("data_type", dataType)
        .maybeSingle();
      
      if (existingData) {
        remoteUpdatedAt = existingData.updated_at;
        console.log(`🔄 [${dataType}] Dados remotos encontrados (última atualização: ${remoteUpdatedAt})`);
      }
    } catch (err) {
      // Ignorar erros ao buscar dados existentes
      console.warn(`⚠️ [${dataType}] Não foi possível verificar dados remotos:`, err);
    }

    // Usar retry logic para falhas de rede
    await withRetry(
      async () => {
        const { error, data: result } = await supabase
          .from("user_data")
          .upsert({
            user_id: userId,
            data_type: dataType,
            data: sanitizedData,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: "user_id,data_type"
          })
          .select("updated_at")
          .single();

        if (error) {
          // Se for erro 42501 (RLS), não tentar novamente
          if (error.code === "42501") {
            console.error(`❌ [${dataType}] Erro RLS (42501):`, error.message);
            console.error("Isso geralmente significa que as políticas RLS não estão configuradas corretamente.");
            console.error("Verifique se executou o SQL em SUPABASE_DATABASE_SETUP.md");
            throw new Error("Política de segurança bloqueou a operação. Verifique as políticas RLS no Supabase.");
          }
          // Se for erro 401, sessão expirada
          if (error.code === "PGRST301" || (error as any).status === 401) {
            console.error(`❌ [${dataType}] Erro 401: Sessão expirada`);
            throw new Error("Sessão expirada. Por favor, faça login novamente.");
          }
          throw error;
        }

        if (result) {
          console.log(`💾 [${dataType}] Dados salvos com sucesso (updated_at: ${result.updated_at})`);
        }
      },
      {
        maxRetries: 3,
        initialDelay: 1000,
        onRetry: (attempt, error) => {
          console.warn(`⚠️ [${dataType}] Tentativa ${attempt}/3 falhou:`, error instanceof Error ? error.message : error);
        },
      }
    );

    const duration = Date.now() - startTime;
    console.log(`✅ [${dataType}] Salvamento completo em ${duration}ms`);
    return { error: null };
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`❌ [${dataType}] Erro após ${duration}ms e múltiplas tentativas:`, err);
    return { error: err as Error };
  }
}

export async function saveToSupabase(
  userId: string,
  dataType: SyncDataType,
  data: unknown
): Promise<{ error: Error | null }> {
  return saveWithSync(userId, dataType, data);
}

/**
 * Carrega dados do Supabase
 */
export async function loadFromSupabase(
  userId: string,
  dataType: SyncDataType
): Promise<{ data: unknown | null; error: PostgrestError | null }> {
  const startTime = Date.now();
  
  try {
    // Verificar se há sessão válida antes de tentar carregar
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.warn(`⚠️ [${dataType}] Sem sessão válida para carregar. Usuário precisa fazer login.`);
      return { data: null, error: { code: "PGRST301", message: "Sessão não encontrada", details: "", hint: "" } as PostgrestError };
    }

    // Verificar se o userId da sessão corresponde ao userId passado
    if (session.user.id !== userId) {
      console.warn(`⚠️ [${dataType}] userId da sessão (${session.user.id}) não corresponde ao userId fornecido (${userId})`);
      return { data: null, error: { code: "PGRST301", message: "Sessão inválida", details: "", hint: "" } as PostgrestError };
    }

    console.log(`🔄 [${dataType}] Carregando do Supabase para usuário ${userId}...`);
    
    const { data, error } = await supabase
      .from("user_data")
      .select("data, updated_at")
      .eq("user_id", userId)
      .eq("data_type", dataType)
      .single();

    if (error) {
      // Se não encontrar dados, não é um erro (pode ser primeira vez)
      if (error.code === "PGRST116") {
        console.log(`ℹ️ [${dataType}] Nenhum dado encontrado (primeira vez ou dados não sincronizados)`);
        return { data: null, error: null };
      }
      console.error(`❌ [${dataType}] Erro ao carregar:`, error.code, error.message);
      return { data: null, error };
    }

    const loadedData = data?.data || null;
    const remoteUpdatedAt = data?.updated_at || null;
    
    if (loadedData) {
      const dataSize = JSON.stringify(loadedData).length;
      console.log(`📥 [${dataType}] Dados carregados (tamanho: ${(dataSize / 1024).toFixed(2)} KB, updated_at: ${remoteUpdatedAt})`);
      
      // Validar dados carregados
      const validation = validateDataBeforeSave(dataType, loadedData);
      if (!validation.valid) {
        console.warn(`⚠️ [${dataType}] Dados carregados não passaram na validação:`, validation.error);
        console.warn(`⚠️ [${dataType}] Continuando mesmo assim, mas pode haver problemas...`);
      } else {
        console.log(`✅ [${dataType}] Dados carregados passaram na validação`);
      }
    }
    
    // Para expenses, tree e financial_entries, importar para o localStorage
    if (dataType === "expenses" && loadedData && typeof loadedData === "object") {
      console.log(`📥 [${dataType}] Importando para localStorage...`);
      importExpensesData(loadedData as Record<string, unknown>);
      const duration = Date.now() - startTime;
      console.log(`✅ [${dataType}] Carregamento completo em ${duration}ms`);
      return { data: loadedData, error: null };
    } else if (dataType === "tree" && loadedData && typeof loadedData === "object") {
      console.log(`📥 [${dataType}] Importando para localStorage...`);
      const treeData = loadedData as { leisure: unknown; personal: unknown };
      importTreeData(treeData);
      const duration = Date.now() - startTime;
      console.log(`✅ [${dataType}] Carregamento completo em ${duration}ms`);
      return { data: loadedData, error: null };
    } else if (dataType === "financial_entries" && loadedData && Array.isArray(loadedData)) {
      console.log(`📥 [${dataType}] Importando para localStorage...`);
      importFinancialEntriesData(loadedData);
      const duration = Date.now() - startTime;
      console.log(`✅ [${dataType}] Carregamento completo em ${duration}ms`);
      return { data: loadedData, error: null };
    }

    const duration = Date.now() - startTime;
    console.log(`✅ [${dataType}] Carregamento completo em ${duration}ms`);
    return { data: loadedData, error: null };
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`❌ [${dataType}] Erro após ${duration}ms:`, err);
    // Converter erro genérico para PostgrestError se necessário
    const postgresError = err as PostgrestError;
    return { data: null, error: postgresError };
  }
}

/**
 * Carrega todos os dados do usuário do Supabase
 */
export async function loadAllUserData(userId: string): Promise<{
  habits: unknown | null;
  journal: unknown | null;
  expenses: unknown | null;
  financial_entries: unknown | null;
  possessions: unknown | null;
  tree: unknown | null;
  cosmetics: unknown | null;
  profile: unknown | null;
  user_modules: unknown | null;
  lifedex_categories: unknown | null;
  lifedex_items: unknown | null;
  lifedex_future_lists: unknown | null;
  lifedex_future_list_items: unknown | null;
  biography: unknown | null;
  error: Error | null;
}> {
  const startTime = Date.now();
  console.log(`🔄 [loadAllUserData] Carregando todos os dados do usuário ${userId}...`);
  
  try {
    const { data, error } = await supabase
      .from("user_data")
      .select("data_type, data, updated_at")
      .eq("user_id", userId);

    if (error) {
      console.error(`❌ [loadAllUserData] Erro ao carregar:`, error.code, error.message);
      return {
        habits: null,
        journal: null,
        expenses: null,
        financial_entries: null,
        possessions: null,
        tree: null,
        cosmetics: null,
        profile: null,
        user_modules: null,
        lifedex_categories: null,
        lifedex_items: null,
        lifedex_future_lists: null,
        lifedex_future_list_items: null,
        biography: null,
        error,
      };
    }

    const result = {
      habits: null,
      journal: null,
      expenses: null,
      financial_entries: null,
      possessions: null,
      tree: null,
      cosmetics: null,
      profile: null,
      user_modules: null,
      lifedex_categories: null,
      lifedex_items: null,
      lifedex_future_lists: null,
      lifedex_future_list_items: null,
      biography: null,
      error: null as Error | null,
    };

    if (data && data.length > 0) {
      console.log(`📥 [loadAllUserData] ${data.length} tipo(s) de dados encontrado(s)`);
      
      data.forEach((item) => {
        const type = item.data_type as SyncDataType;
        if (type in result) {
          (result as any)[type] = item.data;
          const dataSize = JSON.stringify(item.data).length;
          console.log(`  ✓ ${type} (${(dataSize / 1024).toFixed(2)} KB, atualizado em ${item.updated_at})`);
        } else {
          console.warn(`  ⚠ Tipo desconhecido ignorado: ${type}`);
        }
      });
    } else {
      console.log(`ℹ️ [loadAllUserData] Nenhum dado encontrado (primeira vez?)`);
    }

    const duration = Date.now() - startTime;
    console.log(`✅ [loadAllUserData] Carregamento completo em ${duration}ms`);
    return result;
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`❌ [loadAllUserData] Erro após ${duration}ms:`, err);
    return {
      habits: null,
      journal: null,
      expenses: null,
      financial_entries: null,
      possessions: null,
      tree: null,
      cosmetics: null,
      profile: null,
      user_modules: null,
      lifedex_categories: null,
      lifedex_items: null,
      lifedex_future_lists: null,
      lifedex_future_list_items: null,
      biography: null,
      error: err as Error,
    };
  }
}

/**
 * Função de teste para verificar se a tabela user_data existe e está acessível
 */
export async function testSupabaseConnection(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("🧪 Testando conexão com Supabase...");
    
    // Verificar se há sessão válida
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error("❌ Conexão com Supabase: FALHOU");
      console.error("❌ Erro: Sessão não encontrada. Por favor, faça login novamente.");
      console.error("\n💡 POSSÍVEIS CAUSAS:");
      console.error("1. Você não está logado");
      console.error("2. A sessão expirou");
      console.error("3. Problema de autenticação no Supabase");
      console.error("\n📖 Veja SUPABASE_DATABASE_SETUP.md para instruções");
      return { success: false, error: "Sessão não encontrada" };
    }

    if (session.user.id !== userId) {
      console.error("❌ Conexão com Supabase: FALHOU");
      console.error("❌ Erro: ID do usuário não corresponde à sessão");
      return { success: false, error: "ID do usuário inválido" };
    }

    // Tentar inserir um registro de teste
    const testData = { test: true, timestamp: new Date().toISOString() };
    const { data: insertData, error: insertError } = await supabase
      .from("user_data")
      .upsert({
        user_id: userId,
        data_type: "_test",
        data: testData,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id,data_type"
      })
      .select();

    if (insertError) {
      console.error("❌ Conexão com Supabase: FALHOU");
      console.error("❌ Erro:", insertError.message);
      console.error("\n💡 POSSÍVEIS CAUSAS:");
      
      if (insertError.code === 'PGRST116' || insertError.message.includes('does not exist')) {
        console.error("1. A tabela 'user_data' não foi criada no Supabase");
        console.error("2. Execute o SQL em SUPABASE_DATABASE_SETUP.md");
      } else if (insertError.code === '42501' || insertError.message.includes('permission denied') || insertError.message.includes('row-level security')) {
        console.error("1. As políticas RLS não foram configuradas corretamente");
        console.error("2. Execute o SQL em SUPABASE_DATABASE_SETUP.md (parte das políticas)");
      } else if (insertError.message.includes('JWT') || insertError.message.includes('token')) {
        console.error("1. Problema de autenticação");
        console.error("2. As variáveis de ambiente não estão configuradas no Vercel");
      } else {
        console.error("1. A tabela 'user_data' não foi criada no Supabase");
        console.error("2. As políticas RLS não foram configuradas corretamente");
        console.error("3. As variáveis de ambiente não estão configuradas no Vercel");
      }
      console.error("\n📖 Veja SUPABASE_DATABASE_SETUP.md para instruções");
      return { success: false, error: insertError.message };
    }

    // Aguardar um pouco para garantir que o registro foi propagado
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Tentar ler o registro de teste com retry
    let data = null;
    let selectError = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const result = await supabase
        .from("user_data")
        .select("data, updated_at")
        .eq("user_id", userId)
        .eq("data_type", "_test")
        .maybeSingle();
      
      data = result.data;
      selectError = result.error;
      
      if (data || (selectError && selectError.code !== 'PGRST116')) {
        break;
      }
      
      // Aguardar antes de tentar novamente
      if (attempt < 2) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    if (selectError) {
      console.error("❌ Conexão com Supabase: FALHOU");
      console.error("❌ Erro:", selectError.message);
      console.error("\n💡 POSSÍVEIS CAUSAS:");
      
      if (selectError.code === 'PGRST116' || selectError.message.includes('does not exist')) {
        console.error("1. A tabela 'user_data' não foi criada no Supabase");
      } else if (selectError.code === '42501' || selectError.message.includes('permission denied') || selectError.message.includes('row-level security')) {
        console.error("1. As políticas RLS não foram configuradas corretamente");
        console.error("2. A política SELECT pode estar faltando ou incorreta");
      } else {
        console.error("1. A tabela 'user_data' não foi criada no Supabase");
        console.error("2. As políticas RLS não foram configuradas corretamente");
      }
      console.error("\n📖 Veja SUPABASE_DATABASE_SETUP.md para instruções");
      return { success: false, error: selectError.message };
    }

    if (!data) {
      console.warn("⚠️ Registro de teste não encontrado após inserção (pode ser delay de propagação ou problema de RLS)");
      console.error("❌ Conexão com Supabase: FALHOU");
      console.error("❌ Erro: Registro de teste não encontrado");
      console.error("\n💡 POSSÍVEIS CAUSAS:");
      console.error("1. A tabela 'user_data' não foi criada no Supabase");
      console.error("2. As políticas RLS não foram configuradas corretamente");
      console.error("3. As variáveis de ambiente não estão configuradas no Vercel");
      console.error("\n📖 Veja SUPABASE_DATABASE_SETUP.md para instruções");
      return { success: false, error: "Registro de teste não encontrado" };
    }

    // Limpar o registro de teste
    await supabase
      .from("user_data")
      .delete()
      .eq("user_id", userId)
      .eq("data_type", "_test");

    console.log("✅ Teste de conexão bem-sucedido!");
    return { success: true };
  } catch (err) {
    console.error("❌ Conexão com Supabase: FALHOU");
    console.error("❌ Erro:", (err as Error).message);
    console.error("\n💡 POSSÍVEIS CAUSAS:");
    console.error("1. A tabela 'user_data' não foi criada no Supabase");
    console.error("2. As políticas RLS não foram configuradas corretamente");
    console.error("3. As variáveis de ambiente não estão configuradas no Vercel");
    console.error("\n📖 Veja SUPABASE_DATABASE_SETUP.md para instruções");
    return { success: false, error: (err as Error).message };
  }
}

