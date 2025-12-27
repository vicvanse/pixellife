"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white border-4 border-black p-6 shadow-[8px_8px_0_0_#000] text-center">
        <h1 className="text-2xl font-bold mb-4">Verifique seu e-mail</h1>
        <p className="mb-4">
          Enviamos um link de autenticação para:
        </p>
        {email && (
          <p className="font-bold text-blue-600 mb-4">{email}</p>
        )}
        <p className="text-sm mb-6">
          Clique no link no seu e-mail para fazer login. O link expira em 1 hora.
        </p>
        <div className="space-y-2">
          <Link
            href="/auth/login"
            className="block bg-yellow-400 border-2 border-black px-4 py-2 font-bold hover:bg-yellow-500"
          >
            Voltar para login
          </Link>
          <Link
            href="/auth/login"
            className="block text-sm font-bold text-blue-600 hover:underline"
          >
            Reenviar link
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-bold">Carregando...</p>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
















