"use client";

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("As senhas não coincidem!");
      return;
    }

    if (password.length < 6) {
      alert("A senha deve ter pelo menos 6 caracteres!");
      return;
    }

    setIsLoading(true);
    const { error } = await register(email, password, rememberMe);
    setIsLoading(false);

    // Se não houver erro, o register já redireciona ou mostra mensagem
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white border-4 border-black p-6 shadow-[8px_8px_0_0_#000]">
      <h1 className="text-2xl font-bold mb-6 text-center">Criar Conta</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
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

        <div>
          <label htmlFor="password" className="block font-bold mb-2">
            Senha
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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

        <div className="flex items-center gap-2">
          <input
            id="remember"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 border-2 border-black"
          />
          <label htmlFor="remember" className="text-sm font-bold">
            ☑️ Manter conectado
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-yellow-400 border-2 border-black px-4 py-2 font-bold hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Criando..." : "Criar Conta"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm">
          Já tem conta?{" "}
          <Link href="/auth/login" className="font-bold text-blue-600 hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
















