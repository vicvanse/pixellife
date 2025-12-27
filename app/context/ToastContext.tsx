"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { Toast, ToastType } from "../hooks/useToast";

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const newToast: Toast = { id, message, type };
    
    setToasts((prev) => [...prev, newToast]);
    
    // Remover automaticamente após 2 segundos (mais rápido)
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 2000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToastContext must be used within ToastProvider");
  }
  return context;
}

// Re-exportar tipos para facilitar importação
export type { Toast, ToastType } from "../hooks/useToast";

