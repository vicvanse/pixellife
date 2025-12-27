"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(true);
  const { resetPassword, updatePassword } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Verificar se veio do link de reset (tem token na URL)
  const hasToken = searchParams.get("token") || searchParams.get("code");

  // Se tiver token, estamos no modo de atualizar senha
  useState(() => {
    if (hasToken) {
      setIsResetMode(false);
      const emailParam = searchParams.get("email");
      if (emailParam) {
        setEmail(decodeURIComponent(emailParam));
      }
    }
  });

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    const { error } = await resetPassword(email);
    setIsLoading(false);

    if (!error) {
      setIsResetMode(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert("As senhas não coincidem!");
      return;
    }

    if (newPassword.length < 6) {
      alert("A senha deve ter pelo menos 6 caracteres!");
      return;
    }

    setIsLoading(true);
    const { error } = await updatePassword(newPassword);
    setIsLoading(false);

    if (!error) {
      router.push("/auth/login");
    }
  };

  if (!isResetMode && hasToken) {
    // Modo de atualizar senha (veio do link)
    return (
      <div className="w-full max-w-md mx-auto bg-white border-4 border-black p-6 shadow-[8px_8px_0_0_#000]">
        <h1 className="text-2xl font-bold mb-6 text-center">Nova Senha</h1>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="block font-bold mb-2">
              Nova Senha
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block font-bold mb-2">
              Confirmar Senha
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Digite a senha novamente"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-yellow-400 border-2 border-black px-4 py-2 font-bold hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Atualizando..." : "Atualizar Senha"}
          </button>
        </form>
      </div>
    );
  }

  // Modo de solicitar reset
  return (
    <div className="w-full max-w-md mx-auto bg-white border-4 border-black p-6 shadow-[8px_8px_0_0_#000]">
      <h1 className="text-2xl font-bold mb-6 text-center">Recuperar Senha</h1>

      {isResetMode ? (
        <form onSubmit={handleRequestReset} className="space-y-4">
          <div>
            <label htmlFor="email" className="block font-bold mb-2">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="seu@email.com"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-yellow-400 border-2 border-black px-4 py-2 font-bold hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Enviando..." : "Enviar Link de Recuperação"}
          </button>
        </form>
      ) : (
        <div className="text-center space-y-4">
          <p className="text-green-600 font-bold">
            ✅ Link de recuperação enviado!
          </p>
          <p className="text-sm">
            Verifique seu e-mail e clique no link para redefinir sua senha.
          </p>
        </div>
      )}

      <div className="mt-6 text-center">
        <Link
          href="/auth/login"
          className="text-sm font-bold text-blue-600 hover:underline"
        >
          Voltar para login
        </Link>
      </div>
    </div>
  );
}

