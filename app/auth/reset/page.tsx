"use client";

import { Suspense } from "react";
import { ResetPasswordForm } from "../../components/auth/ResetPasswordForm";

function ResetPageContent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <ResetPasswordForm />
    </div>
  );
}

export default function ResetPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-bold">Carregando...</p>
      </div>
    }>
      <ResetPageContent />
    </Suspense>
  );
}
















