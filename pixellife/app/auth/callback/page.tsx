"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";

export const dynamic = "force-dynamic";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const { refreshSession } = useAuth();

  useEffect(() => {
    async function handleCallback() {
      try {
        const code = searchParams.get("code");
        const error = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");
        const next = searchParams.get("next") || "/display";

        if (error) {
          console.error("❌ Erro no callback:", error, errorDescription);
          setStatus("error");
          setTimeout(() => {
            router.push("/auth/login?error=" + encodeURIComponent(errorDescription || error));
          }, 2000);
          return;
        }

        if (!code) {
          console.error("❌ Código não encontrado na URL");
          setStatus("error");
          setTimeout(() => {
            router.push("/auth/login?error=no_code");
          }, 2000);
          return;
        }

        // Trocar código pelo token (PKCE)
        console.log("🔄 Trocando código por sessão...");
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          console.error("❌ Erro ao trocar código por sessão:", exchangeError);
          
          // Se o erro for relacionado a código inválido/expirado, tentar obter a sessão atual
          if (exchangeError.message.includes("code") || exchangeError.message.includes("expired") || exchangeError.message.includes("invalid")) {
            console.log("⚠️ Código inválido/expirado, tentando obter sessão atual...");
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError) {
              console.error("❌ Erro ao obter sessão:", sessionError);
              setStatus("error");
              setTimeout(() => {
                router.push("/auth/login?error=" + encodeURIComponent(exchangeError.message));
              }, 2000);
              return;
            }
            
            if (sessionData.session) {
              console.log("✅ Sessão encontrada! Continuando...");
              setStatus("success");
              // Não chamar refreshSession aqui para evitar loops
              router.replace(next);
              return;
            }
          }
          
          setStatus("error");
          setTimeout(() => {
            router.push("/auth/login?error=" + encodeURIComponent(exchangeError.message));
          }, 2000);
          return;
        }

        if (data.session) {
          console.log("✅ Sessão criada com sucesso!");
          console.log("👤 Usuário:", data.session.user.email);
          console.log("🆔 User ID:", data.session.user.id);
          
          // Verificar se há preferência de "Lembrar de mim" na URL
          const rememberMe = searchParams.get("remember_me") === "true";
          if (rememberMe && typeof window !== "undefined") {
            localStorage.setItem("pixel-life-remember-me", "true");
          }

          // Aguardar um pouco para garantir que a sessão foi salva no localStorage
          await new Promise(resolve => setTimeout(resolve, 300));

          setStatus("success");
          // Usar replace em vez de push para evitar histórico duplicado
          router.replace(next);
        } else {
          console.error("❌ Sessão não criada");
          setStatus("error");
          setTimeout(() => {
            router.push("/auth/login?error=no_session");
          }, 2000);
        }
      } catch (err) {
        console.error("❌ Erro inesperado no callback:", err);
        setStatus("error");
        setTimeout(() => {
          router.push("/auth/login?error=unexpected_error");
        }, 2000);
      }
    }

    handleCallback();
  }, [searchParams, router, refreshSession]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-xl font-bold mb-2">Autenticando...</p>
          <p className="text-sm text-gray-600">Aguarde um momento</p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-xl font-bold mb-2 text-green-600">✅ Login realizado!</p>
          <p className="text-sm text-gray-600">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <p className="text-xl font-bold mb-2 text-red-600">❌ Erro na autenticação</p>
        <p className="text-sm text-gray-600">Redirecionando para login...</p>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-bold">Carregando...</p>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
