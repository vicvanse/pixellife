"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RegisterForm } from "../../components/auth/RegisterForm";
import { AppleSignInButton } from "../../components/auth/AppleSignInButton";
import { GoogleSignInButton } from "../../components/auth/GoogleSignInButton";
import { useAuth } from "../../context/AuthContext";

function RegisterPageContent() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/board");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-bold">Carregando...</p>
      </div>
    );
  }

  if (user) {
    return null; // Redirecionando...
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md space-y-4">
        <RegisterForm />
        <div className="flex items-center gap-4">
          <div className="flex-1 border-t-2 border-black"></div>
          <span className="font-bold">OU</span>
          <div className="flex-1 border-t-2 border-black"></div>
        </div>
        <div className="bg-white border-4 border-black p-4 shadow-[8px_8px_0_0_#000] space-y-4">
          <GoogleSignInButton />
          <AppleSignInButton />
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-bold">Carregando...</p>
      </div>
    }>
      <RegisterPageContent />
    </Suspense>
  );
}

