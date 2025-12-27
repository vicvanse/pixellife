"use client";

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

type LoginMethod = "email" | "password";

export function LoginForm() {
  const [method, setMethod] = useState<LoginMethod>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { loginEmail, loginPassword } = useAuth();
  const router = useRouter();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    const { error } = await loginEmail(email, rememberMe);
    setIsLoading(false);

    if (!error) {
      // Redirecionar para página de verificação de email
      router.push("/auth/verify-email");
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setIsLoading(true);
    const { error } = await loginPassword(email, password, rememberMe);
    setIsLoading(false);

    // Se não houver erro, o loginPassword já redireciona
  };

  return (
    <div className="w-full bg-white/95 border-4 border-black p-4 shadow-[8px_8px_0_0_#000] backdrop-blur-sm font-pixel">
      <h1 
        className="text-xl font-bold mb-3 text-center font-pixel"
        style={{
          imageRendering: "pixelated",
        }}
      >
        ENTRAR
      </h1>

      {/* Tabs para escolher método */}
      <div className="flex gap-2 mb-3 border-b-2 border-black">
        <button
          type="button"
          onClick={() => setMethod("email")}
          className={`flex-1 py-1.5 font-bold ${
            method === "email"
              ? "bg-yellow-400 border-b-4 border-black"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          Magic Link
        </button>
        <button
          type="button"
          onClick={() => setMethod("password")}
          className={`flex-1 py-1.5 font-bold ${
            method === "password"
              ? "bg-yellow-400 border-b-4 border-black"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          Senha
        </button>
      </div>

      {/* Formulário de login por email */}
      {method === "email" && (
        <form onSubmit={handleEmailLogin} className="space-y-2.5">
          <div>
            <label htmlFor="email" className="block font-bold mb-1.5 text-sm font-pixel">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-1.5 border-2 border-black focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm font-pixel"
              placeholder="seu@email.com"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="remember-email"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 border-2 border-black"
            />
            <label htmlFor="remember-email" className="text-sm font-bold font-pixel">
              ☑️ Manter conectado
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-yellow-400 border-2 border-black px-3 py-1.5 font-bold hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-pixel"
          >
            {isLoading ? "Enviando..." : "Enviar Link"}
          </button>
        </form>
      )}

      {/* Formulário de login por senha */}
      {method === "password" && (
        <form onSubmit={handlePasswordLogin} className="space-y-2.5">
          <div>
            <label htmlFor="email-password" className="block font-bold mb-1.5 text-sm font-pixel">
              E-mail
            </label>
            <input
              id="email-password"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-1.5 border-2 border-black focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm font-pixel"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block font-bold mb-1.5 text-sm font-pixel">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-1.5 border-2 border-black focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm font-pixel"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                id="remember-password"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 border-2 border-black"
              />
              <label htmlFor="remember-password" className="text-sm font-bold font-pixel">
                ☑️ Manter conectado
              </label>
            </div>
            <Link
              href="/auth/reset"
              className="text-sm font-bold text-blue-600 hover:underline font-pixel"
            >
              Esqueci a senha
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-yellow-400 border-2 border-black px-3 py-1.5 font-bold hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-pixel"
          >
            {isLoading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      )}

      {/* Divisor */}
      <div className="my-3 flex items-center gap-4">
        <div className="flex-1 border-t-2 border-black"></div>
        <span className="font-bold font-pixel">OU</span>
        <div className="flex-1 border-t-2 border-black"></div>
      </div>

      {/* Links */}
      <div className="text-center space-y-2 font-pixel">
        <p className="text-sm">
          Não tem conta?{" "}
          <Link href="/auth/register" className="font-bold text-blue-600 hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}



