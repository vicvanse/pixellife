"use client";

import { Suspense } from "react";
import { RegisterPageContent } from "../../components/auth/RegisterPageContent";

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-[#F1F1F1]">
        <p className="text-sm tracking-widest">INITIALIZING...</p>
      </div>
    }>
      <RegisterPageContent />
    </Suspense>
  );
}

