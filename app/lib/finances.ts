import { supabase } from "./supabase";

/**
 * Obtém o usuário autenticado atual
 * Garante que sempre usamos o usuário correto da sessão
 */
async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    console.error("❌ Erro ao obter usuário autenticado:", error);
    return null;
  }

  return user;
}

/**
 * Busca finance por data para o usuário autenticado
 * A RLS garante que só retorna dados do próprio usuário
 */
export async function getFinanceByDate(date: string) {
  const user = await getCurrentUser();
  if (!user) {
    console.error("❌ Usuário não autenticado");
    return null;
  }

  // RLS automaticamente filtra por auth.uid(), não precisamos filtrar por user_id
  const { data, error } = await supabase
    .from("finances")
    .select("*")
    .eq("date", date)
    .single();

  if (error) {
    // PGRST116 = nenhum resultado encontrado (não é erro)
    if (error.code === "PGRST116") {
      return null;
    }
    // 406 = RLS bloqueando - políticas não configuradas ou incorretas
    if (error.code === "PGRST301" || error.message?.includes("406")) {
      console.warn("⚠️ RLS bloqueando acesso à tabela finances. Verifique se as políticas RLS foram configuradas.");
      console.warn("📖 Execute o SQL do arquivo SUPABASE_RLS_FINANCES.md no Supabase SQL Editor");
      return null;
    }
    console.error("❌ Erro ao buscar finanças:", error);
    return null;
  }

  return data;
}

/**
 * Salva o saldo (balance) na tabela finances para uma data específica
 * Esta função é usada para salvar o saldo calculado do dia, permitindo acesso rápido
 * sem precisar recalcular todos os expenses.
 * 
 * A RLS garante que só podemos inserir/atualizar nossos próprios dados.
 */
export async function saveFinance(date: string, balance: number) {
  
  const user = await getCurrentUser();
  if (!user) {
    console.error("❌ Usuário não autenticado - não é possível salvar");
    return null;
  }

  // Verifica se já existe registro no dia para este usuário
  const existing = await getFinanceByDate(date);

  if (existing) {
    // Atualiza registro existente
    // A RLS garante que só podemos atualizar nossos próprios dados
    // RLS automaticamente garante que só atualizamos nossos próprios dados
    const { data, error } = await supabase
      .from("finances")
      .update({ 
        balance, 
        updated_at: new Date().toISOString(),
        // user_id não precisa ser atualizado, mas garantimos que está correto
        user_id: user.id 
      })
      .eq("date", date);
      // RLS garante que só atualizamos registros do próprio usuário

    if (error) {
      // 406 = RLS bloqueando
      if (error.code === "PGRST301" || error.message?.includes("406")) {
        console.warn("⚠️ RLS bloqueando atualização na tabela finances. Verifique se as políticas RLS foram configuradas.");
        console.warn("📖 Execute o SQL do arquivo SUPABASE_RLS_FINANCES.md no Supabase SQL Editor");
      } else {
        console.error("❌ Erro ao atualizar finance:", error);
      }
      return null;
    }
    return data;
  }

  // Se não existir, insere novo
  // A RLS garante que só podemos inserir com nosso próprio user_id
  const { data, error } = await supabase
    .from("finances")
    .insert({
      date,
      balance,
      user_id: user.id, // Sempre usar o user_id do usuário autenticado
    });

  if (error) {
    // 406 = RLS bloqueando
    if (error.code === "PGRST301" || error.message?.includes("406")) {
      console.warn("⚠️ RLS bloqueando inserção na tabela finances. Verifique se as políticas RLS foram configuradas.");
      console.warn("📖 Execute o SQL do arquivo SUPABASE_RLS_FINANCES.md no Supabase SQL Editor");
    } else {
      console.error("❌ Erro ao salvar finance:", error);
    }
    return null;
  }

  return data;
}

/**
 * Busca histórico de finances do usuário autenticado
 * A RLS garante que só retorna dados do próprio usuário
 */
export async function getFinancesHistory() {
  const user = await getCurrentUser();
  if (!user) {
    console.error("❌ Usuário não autenticado");
    return [];
  }

  // RLS automaticamente filtra por auth.uid(), não precisamos filtrar por user_id
  const { data, error } = await supabase
    .from("finances")
    .select("*")
    .order("date", { ascending: true });

  if (error) {
    // 406 = RLS bloqueando
    if (error.code === "PGRST301" || error.message?.includes("406")) {
      console.warn("⚠️ RLS bloqueando acesso à tabela finances. Verifique se as políticas RLS foram configuradas.");
      console.warn("📖 Execute o SQL do arquivo SUPABASE_RLS_FINANCES.md no Supabase SQL Editor");
    } else {
      console.error("Erro ao buscar histórico:", error);
    }
    return [];
  }

  return data || [];
}







