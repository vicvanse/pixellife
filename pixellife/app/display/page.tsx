"use client";

import { Suspense } from "react";
import DisplayPageInner from "./DisplayPageInner";

export default function DisplayPage() {
  return (
    <Suspense fallback={
      <div className="relative w-full h-screen overflow-hidden flex items-center justify-center">
        <div className="font-mono text-lg">Carregando...</div>
      </div>
    }>
      <DisplayPageInner />
    </Suspense>
  );
}
