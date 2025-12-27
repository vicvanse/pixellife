"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "./LoginForm";
import { AppleSignInButton } from "./AppleSignInButton";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { useAuth } from "../../context/AuthContext";

export function LoginPageContent() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log("🎨 LoginPageContent renderizado com background pixel art");
    // Aguardar um pouco para garantir que a sessão foi totalmente carregada
    if (!loading && user) {
      console.log("✅ Usuário autenticado detectado, redirecionando para /display...");
      // Usar replace para evitar adicionar ao histórico
      router.replace("/display");
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
    <div 
      className="min-h-screen relative flex items-center p-4 overflow-hidden"
      style={{
        backgroundImage: "url('/fundo4.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        imageRendering: "pixelated",
      }}
    >
      {/* Overlay escuro sutil para melhor contraste do texto */}
      <div 
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.1) 50%, transparent 100%)",
          zIndex: 1,
        }}
      />
      
      {/* Conteúdo sobre o background - posicionado à direita */}
      <div 
        className="relative z-10 space-y-4" 
        style={{ 
          zIndex: 10,
          position: "absolute",
          right: "15%",
          top: "50%",
          transform: "translateY(-50%)",
          width: "90%",
          maxWidth: "360px",
        }}
      >
        {/* Título pixel art */}
        <div className="text-center mb-8">
          <h1
            className="text-6xl font-bold text-white mb-2 font-pixel"
            style={{
              fontFamily: "'Pixel Operator', monospace, Arial, sans-serif",
              fontSize: "4.4rem",
              imageRendering: "pixelated",
              letterSpacing: "0.1em",
              whiteSpace: "nowrap",
            }}
          >
            PIXEL LIFE
          </h1>
          <p 
            className="text-xl text-white font-pixel"
            style={{
              imageRendering: "pixelated",
            }}
          >
            - Sua história -
          </p>
          <p 
            className="text-sm text-white/80 font-pixel mt-1"
            style={{
              imageRendering: "pixelated",
            }}
          >
            Registro, guias e desejos
          </p>
        </div>

        <LoginForm />
        <div className="flex items-center gap-3">
          <div className="flex-1 border-t-2 border-white"></div>
          <span className="font-bold text-white text-sm font-pixel" style={{ textShadow: "2px 2px 0 #000" }}>OU</span>
          <div className="flex-1 border-t-2 border-white"></div>
        </div>
        <div className="bg-white/95 border-4 border-black p-3 shadow-[8px_8px_0_0_#000] space-y-2.5 backdrop-blur-sm font-pixel">
          <GoogleSignInButton />
          <AppleSignInButton />
        </div>
      </div>
    </div>
  );
}

