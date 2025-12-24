"use client";

import { useToastContext } from "../context/ToastContext";
import type { Toast } from "../hooks/useToast";

export function ToastContainer() {
  const { toasts, removeToast } = useToastContext();

  if (toasts.length === 0) return null;

  const getToastStyles = (type: Toast["type"]) => {
    switch (type) {
      case "success":
        return "bg-green-100 border-green-800 text-green-900";
      case "error":
        return "bg-red-100 border-red-800 text-red-900";
      case "warning":
        return "bg-yellow-100 border-yellow-800 text-yellow-900";
      case "info":
        return "bg-blue-100 border-blue-800 text-blue-900";
      default:
        return "bg-gray-100 border-gray-800 text-gray-900";
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 space-y-1 flex flex-col items-center">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${getToastStyles(toast.type)} border-2 border-black px-2 py-0.5 shadow-[1px_1px_0_0_#000] font-mono text-xs flex items-center justify-center gap-1`}
        >
          <span className="text-xs">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="font-bold hover:opacity-70 text-xs leading-none"
            style={{ fontSize: '10px' }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

