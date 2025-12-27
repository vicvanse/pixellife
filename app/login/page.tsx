"use client";

import { Suspense } from "react";
import { LoginPageContent } from "../components/auth/LoginPageContent";

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-bold">Carregando...</p>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
