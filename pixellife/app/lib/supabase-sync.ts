/**
 * Utilitários para sincronização de dados com Supabase
 * Salva dados no banco de dados para sincronização entre dispositivos
 */

import { supabase } from "./supabaseClient";
import { exportExpensesData, importExpensesData, exportTreeData, importTreeData } from "./sync-helpers";
import type { PostgrestError } from "@supabase/supabase-js";
import { withRetry } from "./retry";

// Tipos de dados que podem ser sincronizados
export type SyncDataType = "habits" | "journal" | "expenses" | "possessions" | "tree" | "cosmetics" | "profile" | "user_modules" | "lifedex_categories" | "lifedex_items" | "lifedex_future_lists" | "lifedex_future_list_items" | "biography";

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
  try {
    // Verificar se há sessão válida antes de tentar salvar
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.warn(`⚠️ Sem sessão válida para salvar ${dataType}. Usuário precisa fazer login.`);
      return { error: new Error("Sessão não encontrada. Por favor, faça login novamente.") };
    }

    // Verificar se o userId da sessão corresponde ao userId passado
    if (session.user.id !== userId) {
      console.warn(`⚠️ userId da sessão (${session.user.id}) não corresponde ao userId fornecido (${userId})`);
      return { error: new Error("Sessão inválida. Por favor, faça login novamente.") };
    }

    // Para expenses, exportar todos os dados do localStorage
    let dataToSave = data;
    if (dataType === "expenses") {
      dataToSave = exportExpensesData();
    } else if (dataType === "tree") {
      dataToSave = exportTreeData();
    }

    // Usar retry logic para falhas de rede
    await withRetry(
      async () => {
        const { error } = await supabase
          .from("user_data")
          .upsert({
            user_id: userId,
            data_type: dataType,
            data: dataToSave,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: "user_id,data_type"
          });

        if (error) {
          // Se for erro 42501 (RLS), não tentar novamente
          if (error.code === "42501") {
            console.error(`❌ Erro RLS (42501) ao salvar ${dataType}:`, error.message);
            console.error("Isso geralmente significa que as políticas RLS não estão configuradas corretamente.");
            console.error("Verifique se executou o SQL em SUPABASE_DATABASE_SETUP.md");
            throw new Error("Política de segurança bloqueou a operação. Verifique as políticas RLS no Supabase.");
          }
          // Se for erro 401, sessão expirada
          if (error.code === "PGRST301" || (error as any).status === 401) {
            console.error(`❌ Erro 401 ao salvar ${dataType}: Sessão expirada`);
            throw new Error("Sessão expirada. Por favor, faça login novamente.");
          }
          throw error;
        }
      },
      {
        maxRetries: 3,
        initialDelay: 1000,
        onRetry: (attempt, error) => {
          console.warn(`⚠️ Tentativa ${attempt} de salvar ${dataType} falhou:`, error);
        },
      }
    );

    console.log(`✅ ${dataType} salvo no Supabase`);
    return { error: null };
  } catch (err) {
    console.error(`❌ Erro ao salvar ${dataType} no Supabase após retries:`, err);
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
  try {
    // Verificar se há sessão válida antes de tentar carregar
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.warn(`⚠️ Sem sessão válida para carregar ${dataType}. Usuário precisa fazer login.`);
      return { data: null, error: { code: "PGRST301", message: "Sessão não encontrada", details: "", hint: "" } as PostgrestError };
    }

    // Verificar se o userId da sessão corresponde ao userId passado
    if (session.user.id !== userId) {
      console.warn(`⚠️ userId da sessão (${session.user.id}) não corresponde ao userId fornecido (${userId})`);
      return { data: null, error: { code: "PGRST301", message: "Sessão inválida", details: "", hint: "" } as PostgrestError };
    }

    console.log(`🔄 Carregando ${dataType} do Supabase para usuário ${userId}...`);
    
    const { data, error } = await supabase
      .from("user_data")
      .select("data")
      .eq("user_id", userId)
      .eq("data_type", dataType)
      .single();

    if (error) {
      // Se não encontrar dados, não é um erro (pode ser primeira vez)
      if (error.code === "PGRST116") {
        console.log(`ℹ️ Nenhum dado encontrado para ${dataType} (primeira vez?)`);
        return { data: null, error: null };
      }
      console.error(`❌ Erro ao carregar ${dataType} do Supabase:`, error);
      console.error("Código do erro:", error.code);
      console.error("Mensagem:", error.message);
      return { data: null, error };
    }

    const loadedData = data?.data || null;
    
    // Para expenses e tree, importar para o localStorage
    if (dataType === "expenses" && loadedData && typeof loadedData === "object") {
      console.log(`📥 Importando expenses para localStorage...`);
      importExpensesData(loadedData as Record<string, unknown>);
      return { data: loadedData, error: null };
    } else if (dataType === "tree" && loadedData && typeof loadedData === "object") {
      console.log(`📥 Importando tree para localStorage...`);
      const treeData = loadedData as { leisure: unknown; personal: unknown };
      importTreeData(treeData);
      return { data: loadedData, error: null };
    }

    console.log(`✅ ${dataType} carregado do Supabase`);
    return { data: loadedData, error: null };
  } catch (err) {
    console.error(`❌ Erro ao carregar ${dataType} do Supabase:`, err);
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
  try {
    const { data, error } = await supabase
      .from("user_data")
      .select("data_type, data")
      .eq("user_id", userId);

    if (error) {
      console.error("Erro ao carregar dados do Supabase:", error);
      return {
        habits: null,
        journal: null,
        expenses: null,
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

    if (data) {
      data.forEach((item) => {
        const type = item.data_type as SyncDataType;
        if (type in result) {
          (result as any)[type] = item.data;
        }
      });
    }

    return result;
  } catch (err) {
    console.error("Erro ao carregar dados do Supabase:", err);
    return {
      habits: null,
      journal: null,
      expenses: null,
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
    
    // Tentar inserir um registro de teste
    const { error: insertError } = await supabase
      .from("user_data")
      .upsert({
        user_id: userId,
        data_type: "_test",
        data: { test: true, timestamp: new Date().toISOString() },
      }, {
        onConflict: "user_id,data_type"
      });

    if (insertError) {
      console.error("❌ Erro ao inserir teste:", insertError);
      return { success: false, error: insertError.message };
    }

    // Tentar ler o registro de teste
    const { data, error: selectError } = await supabase
      .from("user_data")
      .select("data")
      .eq("user_id", userId)
      .eq("data_type", "_test")
      .maybeSingle();

    if (selectError) {
      console.error("❌ Erro ao ler teste:", selectError);
      return { success: false, error: selectError.message };
    }

    if (!data) {
      console.warn("⚠️ Registro de teste não encontrado após inserção");
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
    console.error("❌ Erro no teste de conexão:", err);
    return { success: false, error: (err as Error).message };
  }
}

