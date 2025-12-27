import { createClient } from "@supabase/supabase-js";

// IMPORTANTE: No Vercel, variáveis NEXT_PUBLIC_* são injetadas em BUILD TIME
// Se você adicionou variáveis depois do build, precisa fazer um novo deployment
// No localhost, o Next.js lê automaticamente do arquivo .env.local

// Remover espaços em branco (trim) para evitar problemas com espaços no Vercel
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

// Debug: verificar se estamos em produção
const isProduction = process.env.NODE_ENV === "production";
const isVercel = process.env.VERCEL === "1";

// Validação básica da URL
const isValidUrl = (url: string): boolean => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

// Avisos apenas em runtime (não durante build)
if (typeof window !== "undefined") {
  console.log("🔍 Ambiente:", isVercel ? "Vercel" : isProduction ? "Produção" : "Desenvolvimento");
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("❌ Variáveis de ambiente do Supabase não configuradas!");
    if (isVercel) {
      console.error("📍 Você está no Vercel. Configure as variáveis em:");
      console.error("   Vercel Dashboard → Settings → Environment Variables");
      console.error("   Depois faça um NOVO DEPLOYMENT (Redeploy)");
    } else {
      console.error("📍 Você está em localhost. Configure no arquivo .env.local");
    }
    console.error("URL atual:", supabaseUrl || "undefined");
    console.error("Key atual:", supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : "undefined");
  } else {
    console.log("✅ Variáveis de ambiente do Supabase encontradas!");
    console.log("URL:", supabaseUrl.substring(0, 40) + "...");
    console.log("Key:", supabaseAnonKey.substring(0, 20) + "...");
  }
}

// Verificação mais robusta de valores placeholder
const placeholderPatterns = [
  "xxxxx",
  "coloque",
  "seu-projeto",
  "sua_chave",
  "your-project",
  "your-key",
  "placeholder",
  "...",
  "YOUR_",
  "REPLACE",
];

const hasPlaceholder = (value: string | undefined): boolean => {
  if (!value) return false;
  const lowerValue = value.toLowerCase();
  return placeholderPatterns.some(pattern => lowerValue.includes(pattern.toLowerCase()));
};

// Verificar formato de JWT (chaves do Supabase são JWTs que começam com "eyJ")
const isValidJWTFormat = (key: string | undefined): boolean => {
  if (!key) return false;
  // JWT válido tem 3 partes separadas por pontos e começa com "eyJ"
  const parts = key.split(".");
  return parts.length === 3 && key.startsWith("eyJ");
};

// Avisos apenas em runtime (não durante build)
if (typeof window !== "undefined") {
  if (hasPlaceholder(supabaseUrl) || hasPlaceholder(supabaseAnonKey)) {
    console.warn("⚠️ As variáveis de ambiente do Supabase ainda estão com valores placeholder!");
    console.warn("Configure as variáveis corretas no arquivo .env.local ou no Vercel");
    console.warn("NEXT_PUBLIC_SUPABASE_URL deve ser uma URL válida (ex: https://xxxxx.supabase.co)");
    console.warn("NEXT_PUBLIC_SUPABASE_ANON_KEY deve ser uma chave válida do Supabase");
  } else if (supabaseAnonKey && !isValidJWTFormat(supabaseAnonKey)) {
    console.warn("⚠️ NEXT_PUBLIC_SUPABASE_ANON_KEY não está no formato correto!");
    console.warn("A chave deve ser um JWT válido que começa com 'eyJ' e tem 3 partes separadas por pontos");
    console.warn("Verifique se você copiou a chave completa do dashboard do Supabase");
    console.warn(`Chave atual (primeiros 50 chars): ${supabaseAnonKey.substring(0, 50)}...`);
  }
}

// Criar cliente Supabase com configurações otimizadas
// Usando fluxo padrão (não PKCE) para evitar problemas com code_verifier
// Sempre usar uma URL válida para evitar erros de validação do Supabase
// Se as variáveis não estiverem disponíveis, usar placeholder válido
const isServer = typeof window === "undefined";

// URL placeholder válida para quando as variáveis não estão disponíveis
const PLACEHOLDER_URL = "https://placeholder.supabase.co";
const PLACEHOLDER_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTIwMDAsImV4cCI6MTk2MDc2ODAwMH0.placeholder";

// Determinar URL e chave finais
// Se as variáveis estiverem disponíveis e válidas, usar elas
// Caso contrário, usar placeholder válido (evita erro de validação durante build)
// IMPORTANTE: Em produção, as variáveis DEVEM estar configuradas no Vercel
const isUsingRealValues = supabaseUrl && isValidUrl(supabaseUrl) && !hasPlaceholder(supabaseUrl) && 
                          supabaseAnonKey && supabaseAnonKey.length > 100 && !hasPlaceholder(supabaseAnonKey);

const finalUrl = isUsingRealValues ? supabaseUrl : PLACEHOLDER_URL;
const finalKey = isUsingRealValues ? supabaseAnonKey : PLACEHOLDER_KEY;

// Log em runtime para debug
if (typeof window !== "undefined") {
  if (!isUsingRealValues) {
    console.error("❌ ERRO: Usando valores placeholder do Supabase!");
    console.error("As variáveis de ambiente não foram encontradas ou são inválidas.");
    console.error("URL recebida:", supabaseUrl || "undefined");
    console.error("Key recebida:", supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : "undefined");
    console.error("");
    console.error("🔧 SOLUÇÃO:");
    console.error("1. Vá em Vercel Dashboard → Settings → Environment Variables");
    console.error("2. Adicione NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY");
    console.error("3. IMPORTANTE: Faça um NOVO DEPLOYMENT (as variáveis só são aplicadas em novos builds)");
    console.error("4. Vá em Deployments → três pontos → Redeploy");
  } else {
    console.log("✅ Usando variáveis reais do Supabase");
    console.log("URL:", finalUrl.substring(0, 40) + "...");
  }
}

export const supabase = createClient(
  finalUrl,
  finalKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      // Removendo PKCE para usar fluxo padrão mais simples
      // flowType: 'pkce'
    }
  }
);

// Função helper para verificar se as variáveis estão configuradas
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && isValidUrl(supabaseUrl) && supabaseAnonKey && supabaseAnonKey.length > 100);
}




