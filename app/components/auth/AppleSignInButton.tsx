"use client";

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

export function AppleSignInButton() {
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { loginApple } = useAuth();

  const handleAppleLogin = async () => {
    setIsLoading(true);
    await loginApple(rememberMe);
    setIsLoading(false);
  };

  return (
    <div className="space-y-1.5 font-pixel">
      <button
        type="button"
        onClick={handleAppleLogin}
        disabled={isLoading}
        className="w-full bg-black text-white border-2 border-black px-3 py-2 font-bold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-pixel"
      >
        {isLoading ? (
          "Conectando..."
        ) : (
          <>
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            Continuar com Apple
          </>
        )}
      </button>

      <div className="flex items-center gap-2">
        <input
          id="remember-apple"
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          className="w-4 h-4 border-2 border-black"
        />
        <label htmlFor="remember-apple" className="text-sm font-bold font-pixel">
          ☑️ Manter conectado
        </label>
      </div>
    </div>
  );
}



