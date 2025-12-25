"use client";

import { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import type { User, Session, AuthError } from "@supabase/supabase-js";
import { useToastContext } from "./ToastContext";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  loginEmail: (email: string, rememberMe?: boolean) => Promise<{ error: AuthError | null }>;
  loginPassword: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: AuthError | null }>;
  loginApple: (rememberMe?: boolean) => Promise<{ error: AuthError | null }>;
  loginGoogle: (rememberMe?: boolean) => Promise<{ error: AuthError | null }>;
  register: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: AuthError | null }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { showToast } = useToastContext();
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Parar verificação periódica
  const stopPeriodicSessionCheck = useCallback(() => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }
  }, []);

  // Verificação periódica da sessão (a cada 30 segundos)
  const startPeriodicSessionCheck = useCallback(() => {
    // Limpar intervalo anterior se existir
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }

    // Verificar sessão a cada 60 segundos (menos agressivo)
    checkIntervalRef.current = setInterval(async () => {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("❌ Erro ao verificar sessão:", error);
        // Não fazer logout imediatamente em caso de erro de rede
        return;
      }

      if (!currentSession) {
        // Sessão expirou, fazer logout apenas se realmente não houver sessão
        // Verificar novamente antes de fazer logout para evitar falsos positivos
        const { data: { session: doubleCheckSession } } = await supabase.auth.getSession();
        if (!doubleCheckSession) {
          console.log("⚠️ Sessão não encontrada após verificação dupla, fazendo logout...");
          stopPeriodicSessionCheck();
          setUser(null);
          setSession(null);
          showToast("Sua sessão expirou. Por favor, faça login novamente.", "error");
          router.push("/auth/login");
        }
        return;
      }

      // Atualizar sessão se necessário
      if (currentSession.expires_at) {
        const expiresIn = currentSession.expires_at * 1000 - Date.now();
        
        // Se expirar em menos de 15 minutos, renovar imediatamente
        if (expiresIn < 15 * 60 * 1000 && expiresIn > 0) {
          console.log("🔄 Sessão próxima de expirar, renovando...");
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            console.error("❌ Erro ao renovar sessão na verificação periódica:", refreshError);
          } else {
            // Atualizar estado após refresh bem-sucedido
            const { data: { session: refreshedSession } } = await supabase.auth.getSession();
            if (refreshedSession) {
              setSession(refreshedSession);
              setUser(refreshedSession.user);
            }
          }
        }
      }

      // Atualizar estado se a sessão mudou
      if (currentSession.access_token !== session?.access_token) {
        setSession(currentSession);
        setUser(currentSession.user);
      }
    }, 60 * 1000); // 60 segundos (menos agressivo)
  }, [session, stopPeriodicSessionCheck, showToast, router]);

  // Logout (precisa ser definido antes de setupAutoRefresh)
  const logout = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("❌ Erro no logout:", error);
        showToast("Erro ao fazer logout", "error");
        return;
      }

      // Limpar localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("pixel-life-auth");
        localStorage.removeItem("pixel-life-remember-me");
      }

      stopPeriodicSessionCheck();
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }

      setUser(null);
      setSession(null);
      router.push("/auth/login");
      // Toast removido - não mostrar mensagem de logout
    } catch (err) {
      console.error("❌ Erro inesperado no logout:", err);
      showToast("Erro ao fazer logout", "error");
    }
  }, [showToast, router, stopPeriodicSessionCheck]);

  // Configurar refresh automático do token
  const setupAutoRefresh = useCallback((session: Session) => {
    // Limpar timeout anterior se existir
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }

    // Renovar token 10 minutos antes de expirar (mais seguro)
    const expiresAt = session.expires_at;
    if (!expiresAt) return;

    const expiresIn = expiresAt * 1000 - Date.now();
    const refreshIn = Math.max(expiresIn - 10 * 60 * 1000, 60 * 1000); // 10 minutos antes, mínimo 1 minuto

    if (refreshIn > 0 && refreshIn < expiresIn) {
      const timeout = setTimeout(async () => {
        console.log("🔄 Renovando sessão automaticamente...");
        const { data, error } = await supabase.auth.refreshSession();
        if (error) {
          console.error("❌ Erro ao renovar sessão:", error);
          // Tentar verificar se ainda há sessão válida
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (!currentSession) {
            showToast("Sua sessão expirou. Por favor, faça login novamente.", "error");
            await logout();
          }
        } else {
          console.log("✅ Sessão renovada com sucesso");
          if (data.session) {
            setSession(data.session);
            setUser(data.session.user);
            setupAutoRefresh(data.session);
          }
        }
      }, refreshIn);

      // Armazenar timeout na ref
      refreshTimeoutRef.current = timeout;
    }
  }, [showToast, logout]);

  // Escutar evento customizado de erro de autenticação do Supabase
  const handleAuthError = useCallback(async (event: CustomEvent) => {
    console.warn("🔐 Erro de autenticação detectado, fazendo logout...", event.detail);
    // Fazer logout diretamente quando detectar erro de autenticação
    try {
      await supabase.auth.signOut();
      stopPeriodicSessionCheck();
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      setUser(null);
      setSession(null);
      showToast("Sua sessão expirou. Por favor, faça login novamente.", "error");
      router.push("/auth/login");
    } catch (err) {
      console.error("❌ Erro ao fazer logout após erro de autenticação:", err);
    }
  }, [stopPeriodicSessionCheck, showToast, router]);

  // Escutar eventos de erro de autenticação
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.addEventListener("supabase-auth-error", handleAuthError as EventListener);
      return () => {
        window.removeEventListener("supabase-auth-error", handleAuthError as EventListener);
      };
    }
  }, [handleAuthError]);

  // Carregar sessão inicial
  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("❌ Erro ao carregar sessão:", error);
          if (mounted) {
            setUser(null);
            setSession(null);
            setLoading(false);
          }
          return;
        }

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }

        // Configurar refresh automático se houver sessão
        if (session) {
          setupAutoRefresh(session);
          startPeriodicSessionCheck();
        }
      } catch (err) {
        console.error("❌ Erro inesperado ao carregar sessão:", err);
        if (mounted) {
          setUser(null);
          setSession(null);
          setLoading(false);
        }
      }
    }

    loadSession();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("🔄 Auth state changed:", event, session?.user?.email);
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }

        if (event === "SIGNED_IN" && session) {
          setupAutoRefresh(session);
          startPeriodicSessionCheck();
          // Toast removido - não mostrar mensagem de login automático
        } else if (event === "SIGNED_OUT") {
          stopPeriodicSessionCheck();
          if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
            refreshTimeoutRef.current = null;
          }
          showToast("Você foi desconectado", "info");
        } else if (event === "TOKEN_REFRESHED" && session) {
          console.log("✅ Token renovado automaticamente");
          setupAutoRefresh(session);
        } else if (event === "USER_UPDATED") {
          console.log("✅ Dados do usuário atualizados");
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
      stopPeriodicSessionCheck();
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [stopPeriodicSessionCheck, setupAutoRefresh, startPeriodicSessionCheck]);


  // Login por email (magic link)
  const loginEmail = useCallback(async (
    email: string,
    rememberMe: boolean = false
  ): Promise<{ error: AuthError | null }> => {
    try {
      const redirectUrl = typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : `${process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000"}/auth/callback`;

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
          shouldCreateUser: true,
        },
      });

      if (error) {
        console.error("❌ Erro no login por email:", error);
        showToast(error.message || "Erro ao enviar link de autenticação", "error");
        return { error };
      }

      showToast("Link de autenticação enviado! Verifique seu e-mail.", "success");
      return { error: null };
    } catch (err) {
      const error = err as AuthError;
      console.error("❌ Erro inesperado no login por email:", error);
      showToast("Erro inesperado. Tente novamente.", "error");
      return { error };
    }
  }, [showToast]);

  // Login por senha
  const loginPassword = useCallback(async (
    email: string,
    password: string,
    rememberMe: boolean = false
  ): Promise<{ error: AuthError | null }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("❌ Erro no login por senha:", error);
        showToast(error.message || "Email ou senha incorretos", "error");
        return { error };
      }

      if (data.session) {
        // Configurar persistência baseada em "Lembrar de mim"
        if (rememberMe) {
          // Sessão longa - refresh automático já está configurado
          console.log("✅ Login com 'Lembrar de mim' ativado");
        } else {
          // Sessão curta de 24h - ajustar expiração
          const expiresAt = Math.floor(Date.now() / 1000) + 24 * 60 * 60; // 24 horas
          // O Supabase gerencia isso automaticamente, mas podemos forçar refresh mais cedo
        }

        // Toast removido - não mostrar mensagem de login automático
        router.push("/board");
      }

      return { error: null };
    } catch (err) {
      const error = err as AuthError;
      console.error("❌ Erro inesperado no login por senha:", error);
      showToast("Erro inesperado. Tente novamente.", "error");
      return { error };
    }
  }, [showToast, router]);

  // Login via Apple
  const loginApple = useCallback(async (
    rememberMe: boolean = false
  ): Promise<{ error: AuthError | null }> => {
    try {
      const redirectUrl = typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : `${process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000"}/auth/callback`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            // Armazenar preferência de "Lembrar de mim" na URL (será processada no callback)
            remember_me: rememberMe ? "true" : "false",
          },
        },
      });

      if (error) {
        console.error("❌ Erro no login via Apple:", error);
        showToast(error.message || "Erro ao iniciar login com Apple", "error");
        return { error };
      }

      // O redirecionamento será feito automaticamente
      return { error: null };
    } catch (err) {
      const error = err as AuthError;
      console.error("❌ Erro inesperado no login via Apple:", error);
      showToast("Erro inesperado. Tente novamente.", "error");
      return { error };
    }
  }, [showToast]);

  // Login via Google
  const loginGoogle = useCallback(async (
    rememberMe: boolean = false
  ): Promise<{ error: AuthError | null }> => {
    try {
      const redirectUrl = typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : `${process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000"}/auth/callback`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            // Armazenar preferência de "Lembrar de mim" na URL (será processada no callback)
            remember_me: rememberMe ? "true" : "false",
          },
        },
      });

      if (error) {
        console.error("❌ Erro no login via Google:", error);
        showToast(error.message || "Erro ao iniciar login com Google", "error");
        return { error };
      }

      // O redirecionamento será feito automaticamente
      return { error: null };
    } catch (err) {
      const error = err as AuthError;
      console.error("❌ Erro inesperado no login via Google:", error);
      showToast("Erro inesperado. Tente novamente.", "error");
      return { error };
    }
  }, [showToast]);

  // Registrar novo usuário
  const register = useCallback(async (
    email: string,
    password: string,
    rememberMe: boolean = false
  ): Promise<{ error: AuthError | null }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback`
            : `${process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000"}/auth/callback`,
        },
      });

      if (error) {
        console.error("❌ Erro no registro:", error);
        showToast(error.message || "Erro ao criar conta", "error");
        return { error };
      }

      if (data.user && !data.session) {
        // Email de confirmação enviado
        showToast("Conta criada! Verifique seu e-mail para confirmar.", "success");
      } else if (data.session) {
        // Login automático após registro
        // Toast removido - não mostrar mensagem de registro automático
        router.push("/board");
      }

      return { error: null };
    } catch (err) {
      const error = err as AuthError;
      console.error("❌ Erro inesperado no registro:", error);
      showToast("Erro inesperado. Tente novamente.", "error");
      return { error };
    }
  }, [showToast, router]);


  // Renovar sessão
  const refreshSession = useCallback(async (): Promise<{ error: AuthError | null }> => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error("❌ Erro ao renovar sessão:", error);
        return { error };
      }

      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        setupAutoRefresh(data.session);
        startPeriodicSessionCheck();
      }

      return { error: null };
    } catch (err) {
      const error = err as AuthError;
      console.error("❌ Erro inesperado ao renovar sessão:", error);
      return { error };
    }
  }, [setupAutoRefresh, startPeriodicSessionCheck]);

  // Atualizar senha
  const updatePassword = useCallback(async (
    newPassword: string
  ): Promise<{ error: AuthError | null }> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error("❌ Erro ao atualizar senha:", error);
        showToast(error.message || "Erro ao atualizar senha", "error");
        return { error };
      }

      // Toast removido - não mostrar mensagem de atualização de senha
      return { error: null };
    } catch (err) {
      const error = err as AuthError;
      console.error("❌ Erro inesperado ao atualizar senha:", error);
      showToast("Erro inesperado. Tente novamente.", "error");
      return { error };
    }
  }, [showToast]);

  // Resetar senha
  const resetPassword = useCallback(async (
    email: string
  ): Promise<{ error: AuthError | null }> => {
    try {
      const redirectUrl = typeof window !== "undefined"
        ? `${window.location.origin}/auth/reset?email=${encodeURIComponent(email)}`
        : `${process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000"}/auth/reset`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        console.error("❌ Erro ao resetar senha:", error);
        showToast(error.message || "Erro ao enviar link de recuperação", "error");
        return { error };
      }

      showToast("Link de recuperação enviado! Verifique seu e-mail.", "success");
      return { error: null };
    } catch (err) {
      const error = err as AuthError;
      console.error("❌ Erro inesperado ao resetar senha:", error);
      showToast("Erro inesperado. Tente novamente.", "error");
      return { error };
    }
  }, [showToast]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        loginEmail,
        loginPassword,
        loginApple,
        loginGoogle,
        register,
        logout,
        refreshSession,
        updatePassword,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

// Hook simplificado para obter apenas o usuário
export function useUser() {
  const { user } = useAuth();
  return user;
}

