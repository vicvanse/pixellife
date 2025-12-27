/**
 * Cliente Supabase otimizado para autenticação
 * Suporta PKCE para OAuth e sessões persistentes
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

// Validação de URL
const isValidUrl = (url: string): boolean => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

// Cliente para componentes do servidor (Server Components)
// Nota: Para server components, use createClient diretamente com cookies
export function createServerClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Cliente direto para uso em hooks e utilitários
// Usa PKCE para OAuth seguro (Apple, etc)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "pkce", // PKCE para OAuth seguro
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    storageKey: "pixel-life-auth",
  },
});

// Verificar se Supabase está configurado
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && isValidUrl(supabaseUrl) && supabaseAnonKey && supabaseAnonKey.length > 100);
}
