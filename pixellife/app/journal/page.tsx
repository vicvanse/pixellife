"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function JournalPage() {
  const router = useRouter();
  
  // Redireciona automaticamente para o overlay do journal no display
  useEffect(() => {
    router.replace("/display?overlay=journal");
  }, [router]);
  
  return null;
}
