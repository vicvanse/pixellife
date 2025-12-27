"use client";

import PixelMenu from "@/app/components/PixelMenu";
import { useCosmetics } from "../components/CosmeticsContext";

export default function CosmeticsPage() {
  const { avatar, setAvatar, background, setBackground } = useCosmetics();

  return (
    <div className="p-6 relative">
      {/* menu hambúrguer */}
      <PixelMenu />

      <h1 className="text-2xl font-bold mb-6">Cosméticos</h1>

      {/* Avatares */}
      <h2 className="text-lg font-semibold mb-2">Avatar</h2>
      <div className="flex gap-4">
        <img
          src="/avatar1.gif"
          className={`w-20 cursor-pointer border-4 image-render-pixel ${
            avatar === "/avatar1.gif" ? "border-blue-500" : "border-transparent"
          }`}
          onClick={() => setAvatar("/avatar1.gif")}
        />

        <img
          src="/avatar1.2.gif"
          className={`w-20 cursor-pointer border-4 image-render-pixel ${
            avatar === "/avatar1.2.gif" ? "border-blue-500" : "border-transparent"
          }`}
          onClick={() => setAvatar("/avatar1.2.gif")}
        />

        <img
          src="/avatar2.gif"
          className={`w-20 cursor-pointer border-4 image-render-pixel ${
            avatar === "/avatar2.gif" ? "border-blue-500" : "border-transparent"
          }`}
          onClick={() => setAvatar("/avatar2.gif")}
        />

        <img
          src="/avatar3.gif"
          className={`w-20 cursor-pointer border-4 image-render-pixel ${
            avatar === "/avatar3.gif" ? "border-blue-500" : "border-transparent"
          }`}
          onClick={() => setAvatar("/avatar3.gif")}
        />
      </div>

      {/* Fundos */}
      <h2 className="text-lg font-semibold mt-6 mb-2">Background</h2>
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
  );
}
