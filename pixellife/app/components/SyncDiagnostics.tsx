/**
 * Componente de diagnóstico para verificar status da sincronização
 * Mostra informações úteis no console sobre o estado da sincronização
 */

"use client";

import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { testSupabaseConnection } from "../lib/supabase-sync";

export function SyncDiagnostics() {
  const { user, loading } = useAuth();

  // Log imediato para confirmar que o componente está sendo renderizado
  useEffect(() => {
    console.log("🔧 SyncDiagnostics: Componente montado");
  }, []);

  useEffect(() => {
    async function runDiagnostics() {
      console.log("🔍 ===== DIAGNÓSTICO DE SINCRONIZAÇÃO =====");
      console.log("📍 Localização: SyncDiagnostics component");
      
      // 1. Verificar autenticação
      if (loading) {
        console.log("⏳ Status: Aguardando autenticação...");
        return;
      }

      if (!user) {
        console.warn("❌ Status: Usuário NÃO está logado!");
        console.warn("💡 Solução: Faça login para habilitar a sincronização");
        return;
      }

      console.log("✅ Status: Usuário logado");
      console.log("📋 User ID:", user.id);
      console.log("📧 Email:", user.email);

      // 2. Testar conexão com Supabase (apenas em modo desenvolvimento ou se configurado)
      const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!isSupabaseConfigured) {
        // Supabase não configurado - isso é normal em desenvolvimento
        console.log("ℹ️ Supabase não configurado (modo desenvolvimento/local)");
        console.log("📝 Os dados serão salvos apenas no localStorage");
      } else {
        console.log("\n🧪 Testando conexão com Supabase...");
        const testResult = await testSupabaseConnection(user.id);
        
        if (testResult.success) {
          console.log("✅ Conexão com Supabase: OK");
          console.log("✅ Tabela 'user_data' existe e está acessível");
        } else {
          // Verificar se é um erro esperado (tabela não existe, RLS, etc)
          const isExpectedError = testResult.error?.includes('does not exist') || 
                                  testResult.error?.includes('permission denied') ||
                                  testResult.error?.includes('PGRST116');
          
          if (isExpectedError) {
            console.warn("⚠️ Supabase configurado mas tabela/políticas não estão prontas");
            console.warn("📖 Veja SUPABASE_DATABASE_SETUP.md para instruções");
          } else {
            console.error("❌ Conexão com Supabase: FALHOU");
            console.error("❌ Erro:", testResult.error);
            console.error("\n💡 POSSÍVEIS CAUSAS:");
            console.error("1. A tabela 'user_data' não foi criada no Supabase");
            console.error("2. As políticas RLS não foram configuradas corretamente");
            console.error("3. As variáveis de ambiente não estão configuradas no Vercel");
            console.error("\n📖 Veja SUPABASE_DATABASE_SETUP.md para instruções");
          }
        }
      }

      console.log("🔍 ===== FIM DO DIAGNÓSTICO =====\n");
    }

    // Executar diagnóstico após um pequeno delay para garantir que tudo está carregado
    const timeoutId = setTimeout(runDiagnostics, 1000);
    return () => clearTimeout(timeoutId);
  }, [user, loading]);

  // Este componente não renderiza nada visualmente
  return null;
}

