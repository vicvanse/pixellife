"use client";

import { createContext, useContext, ReactNode, useEffect, useRef } from "react";
import { usePersistentState } from "../hooks/usePersistentState";
import { useAuth } from "../context/AuthContext";
import { saveToSupabase, loadFromSupabase } from "../lib/supabase-sync";
import { withRetry } from "../lib/retry";
import type { PostgrestError } from "@supabase/supabase-js";

// ---------------------------
// TIPAGEM DO CONTEXTO
// ---------------------------
interface CosmeticsContextType {
  avatar: string;
  setAvatar: (value: string) => void;
  background: string;
  setBackground: (value: string) => void;
}

interface CosmeticsData {
  avatar: string;
  background: string;
}

// ---------------------------
// VALOR INICIAL DO CONTEXTO
// ---------------------------
const CosmeticsContext = createContext<CosmeticsContextType | undefined>(undefined);

// ---------------------------
// PROVIDER
// ---------------------------
export function CosmeticsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [avatar, setAvatar] = usePersistentState<string>("avatar", "/avatar3.gif");
  const [background, setBackground] = usePersistentState<string>("background", "/fundo3.png");
  const hasLoadedFromSupabaseRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Carregar cosmetics do Supabase
  useEffect(() => {
    async function loadCosmeticsFromSupabase() {
      if (!user?.id) {
        hasLoadedFromSupabaseRef.current = false;
        return;
      }
      
      if (hasLoadedFromSupabaseRef.current) {
        return;
      }

      console.log("🔄 CosmeticsContext: Carregando cosmetics do Supabase para usuário:", user.id);
      
      const { data: cosmeticsData, error: cosmeticsError } = await loadFromSupabase(user.id, "cosmetics");
      if (!cosmeticsError && cosmeticsData && typeof cosmeticsData === "object") {
        const cosmetics = cosmeticsData as CosmeticsData;
        console.log("✅ CosmeticsContext: Cosmetics carregados do Supabase");
        if (cosmetics.avatar) setAvatar(cosmetics.avatar);
        if (cosmetics.background) setBackground(cosmetics.background);
      } else if (cosmeticsError && (cosmeticsError as PostgrestError).code !== "PGRST116") {
        console.warn("⚠️ CosmeticsContext: Erro ao carregar cosmetics do Supabase:", cosmeticsError);
      } else {
        console.log("ℹ️ CosmeticsContext: Nenhum cosmetic encontrado no Supabase (primeira vez?)");
      }

      hasLoadedFromSupabaseRef.current = true;
    }

    loadCosmeticsFromSupabase();
  }, [user?.id, setAvatar, setBackground]);

  // Salvar cosmetics no Supabase (debounced)
  useEffect(() => {
    if (!user?.id) {
      return;
    }
    if (!hasLoadedFromSupabaseRef.current) {
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      const cosmeticsData: CosmeticsData = {
        avatar,
        background,
      };
      
      console.log("💾 CosmeticsContext: Salvando cosmetics no Supabase...", { userId: user.id });
      try {
        await withRetry(
          async () => {
            const { error } = await saveToSupabase(user.id, "cosmetics", cosmeticsData);
            if (error) throw error;
          },
          {
            maxRetries: 3,
            initialDelay: 1000,
            onRetry: (attempt) => {
              console.warn(`⚠️ Tentativa ${attempt} de salvar cosmetics falhou, tentando novamente...`);
            },
          }
        );
        console.log("✅ CosmeticsContext: Cosmetics salvos com sucesso!");
      } catch (err) {
        console.error("❌ CosmeticsContext: Erro ao salvar cosmetics após múltiplas tentativas:", err);
      }
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [avatar, background, user?.id]);

  return (
    <CosmeticsContext.Provider
      value={{ avatar, setAvatar, background, setBackground }}
    >
      {children}
    </CosmeticsContext.Provider>
  );
}

// ---------------------------
// HOOK CUSTOMIZADO
// ---------------------------
export function useCosmetics() {
  const ctx = useContext(CosmeticsContext);
  if (!ctx) {
    throw new Error("useCosmetics must be used inside a CosmeticsProvider");
  }
  return ctx;
}
