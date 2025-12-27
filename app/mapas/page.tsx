"use client";

import { useState } from "react";
import PixelMenu from "../components/PixelMenu";
import { MapasCategoriesTab } from "../components/mapas/MapasCategoriesTab";
import { MapasItemsTab } from "../components/mapas/MapasItemsTab";
import { useMapas } from "../hooks/useMapas";

type MapasTab = "categories" | "items";

export default function MapasPage() {
  const [activeTab, setActiveTab] = useState<MapasTab>("categories");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { categories, elements, userElements, loading } = useMapas();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF" }}>
      <PixelMenu />

      <div
        className="w-full py-6 md:py-12 md:pt-4"
        style={{
          paddingTop: "calc(max(env(safe-area-inset-top, 0px), 44px) + 58px)",
          paddingLeft: "max(env(safe-area-inset-left), 16px)",
          paddingRight: "max(env(safe-area-inset-right), 16px)",
        }}
      >
        <div className="max-w-6xl mx-auto w-full">
          {/* Header */}
          <div className="mb-6">
            <h1 className="font-pixel-bold text-3xl mb-2" style={{ color: "#333" }}>
              MAPAS
            </h1>
            <p className="font-pixel text-sm" style={{ color: "#666" }}>
              Experiências da vida
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b mb-6" style={{ borderColor: "#e5e5e5" }}>
            <button
              onClick={() => setActiveTab("categories")}
              className={`px-4 py-2 font-pixel text-sm transition-colors ${
                activeTab === "categories"
                  ? "border-b-2"
                  : "opacity-60 hover:opacity-100"
              }`}
              style={{
                borderBottomColor:
                  activeTab === "categories" ? "#4d82ff" : "transparent",
                color: activeTab === "categories" ? "#4d82ff" : "#666",
              }}
            >
              Categorias
            </button>
            <button
              onClick={() => setActiveTab("items")}
              className={`px-4 py-2 font-pixel text-sm transition-colors ${
                activeTab === "items"
                  ? "border-b-2"
                  : "opacity-60 hover:opacity-100"
              }`}
              style={{
                borderBottomColor:
                  activeTab === "items" ? "#4d82ff" : "transparent",
                color: activeTab === "items" ? "#4d82ff" : "#666",
              }}
            >
              Itens
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="text-center py-8">
              <p className="font-pixel text-sm" style={{ color: "#999" }}>
                Carregando...
              </p>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <p className="font-pixel text-base mb-4" style={{ color: "#666" }}>
                Nenhuma categoria encontrada.
              </p>
              <p className="font-pixel text-sm mb-6" style={{ color: "#999" }}>
                Execute o schema do Supabase para criar as tabelas de Mapas.
              </p>
              <a
                href="/docs/GUIA_EXECUTAR_MAPAS_SUPABASE.md"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 rounded font-pixel-bold transition-colors hover:opacity-90"
                style={{
                  backgroundColor: '#4d82ff',
                  color: '#fff',
                  fontSize: '14px',
                  borderRadius: '8px',
                }}
              >
                Ver Guia de Instalação
              </a>
            </div>
          ) : (
            <>
              {activeTab === "categories" && (
                <MapasCategoriesTab
                  categories={categories}
                  userElements={userElements}
                  elements={elements}
                  onCategorySelect={setSelectedCategory}
                />
              )}
              {activeTab === "items" && (
                <MapasItemsTab
                  categories={categories}
                  elements={elements}
                  userElements={userElements}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

