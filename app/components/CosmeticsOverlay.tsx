"use client";

import { useCosmetics } from "./CosmeticsContext";

interface CosmeticsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CosmeticsOverlay({ isOpen, onClose }: CosmeticsOverlayProps) {
  const { avatar, setAvatar, background, setBackground } = useCosmetics();

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white border-4 border-black p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-[8px_8px_0_0_#000]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho com botão de fechar */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold font-mono">Cosméticos</h1>
          <button
            onClick={onClose}
            className="bg-red-400 border-4 border-black px-4 py-2 font-bold hover:bg-red-500"
          >
            X
          </button>
        </div>

        {/* Avatares */}
        <h2 className="text-lg font-semibold mb-2 font-mono">Avatar</h2>
        <div className="flex gap-4 mb-6">
          <img
            src="/avatar1.gif"
            className={`w-20 cursor-pointer border-4 image-render-pixel ${
              avatar === "/avatar1.gif" ? "border-blue-500" : "border-transparent"
            }`}
            onClick={() => setAvatar("/avatar1.gif")}
            alt="Avatar 1"
          />

          <img
            src="/avatar1.2.gif"
            className={`w-20 cursor-pointer border-4 image-render-pixel ${
              avatar === "/avatar1.2.gif" ? "border-blue-500" : "border-transparent"
            }`}
            onClick={() => setAvatar("/avatar1.2.gif")}
            alt="Avatar 1.2"
          />

          <img
            src="/avatar2.gif"
            className={`w-20 cursor-pointer border-4 image-render-pixel ${
              avatar === "/avatar2.gif" ? "border-blue-500" : "border-transparent"
            }`}
            onClick={() => setAvatar("/avatar2.gif")}
            alt="Avatar 2"
          />

          <img
            src="/avatar3.gif"
            className={`w-20 cursor-pointer border-4 image-render-pixel ${
              avatar === "/avatar3.gif" ? "border-blue-500" : "border-transparent"
            }`}
            onClick={() => setAvatar("/avatar3.gif")}
            alt="Avatar 3"
          />
        </div>

        {/* Fundos */}
        <h2 className="text-lg font-semibold mb-2 font-mono">Background</h2>
        <div className="flex gap-4">
          {/* Fundo 3 */}
          <div
            className={`w-32 h-20 bg-cover cursor-pointer border-4 ${
              background === "/fundo3.png" ? "border-blue-500" : "border-transparent"
            }`}
            style={{
              backgroundImage: "url('/fundo3.png')",
              imageRendering: "pixelated",
            }}
            onClick={() => setBackground("/fundo3.png")}
          />

          {/* Fundo 4 */}
          <div
            className={`w-32 h-20 bg-cover cursor-pointer border-4 ${
              background === "/fundo4.png" ? "border-blue-500" : "border-transparent"
            }`}
            style={{
              backgroundImage: "url('/fundo4.png')",
              imageRendering: "pixelated",
            }}
            onClick={() => setBackground("/fundo4.png")}
          />

          {/* Fundo cinza */}
          <div
            className={`w-32 h-20 bg-gray-300 flex items-center justify-center cursor-pointer border-4 ${
              background === "none" ? "border-blue-500" : "border-transparent"
            }`}
            onClick={() => setBackground("none")}
          >
            Cinza
          </div>
        </div>
      </div>
    </div>
  );
}

