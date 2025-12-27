"use client";

import { useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Rotas públicas que não requerem autenticação
const PUBLIC_ROUTES = [
  "/auth/login",
  "/auth/register",
  "/auth/reset",
  "/auth/verify-email",
  "/auth/callback",
  "/privacy",
  "/terms",
];

/**
 * Componente que protege rotas, redirecionando para login
 * se o usuário não estiver autenticado
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Verificar se a rota atual é pública
  const isPublicRoute = useMemo(() => {
    return PUBLIC_ROUTES.some((route) => pathname?.startsWith(route));
  }, [pathname]);

  useEffect(() => {
    // Se for rota pública, não fazer nada
    if (isPublicRoute) {
      return;
    }

    // Se ainda estiver carregando, aguardar
    if (loading) {
      return;
    }

    // Se não houver usuário e não for rota pública, redirecionar para login
    if (!user) {
      const redirectUrl = new URL("/auth/login", window.location.origin);
      redirectUrl.searchParams.set("redirect", pathname || "/");
      router.push(redirectUrl.toString());
    }
  }, [user, loading, router, pathname, isPublicRoute]);

  // Se ainda estiver carregando, mostrar loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-bold">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se for rota pública ou usuário estiver autenticado, renderizar children
  if (isPublicRoute || user) {
    return <>{children}</>;
  }

  // Se não houver usuário e não for rota pública, mostrar loading enquanto redireciona
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-xl font-bold">Redirecionando...</p>
      </div>
    </div>
  );
}

