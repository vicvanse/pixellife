"use client";

import type { MapasCategory, MapasElement, MapasUserElement } from "../../types/mapas";
import { STATE_ICONS } from "../../types/mapas";

interface MapasCategoriesTabProps {
  categories: MapasCategory[];
  userElements: MapasUserElement[];
  elements: MapasElement[];
  onCategorySelect: (categoryKey: string | null) => void;
}

export function MapasCategoriesTab({
  categories,
  userElements,
  elements,
  onCategorySelect,
}: MapasCategoriesTabProps) {
  // Calcular progresso por categoria
  const getCategoryProgress = (categoryKey: string) => {
    const categoryElements = elements.filter((e) => e.category_key === categoryKey);
    const userCategoryElements = userElements.filter(
      (ue) => ue.element?.category_key === categoryKey
    );
    const doneCount = userCategoryElements.filter(
      (ue) => ue.state !== "not_done"
    ).length;

    return {
      total: categoryElements.length,
      done: doneCount,
      percentage: categoryElements.length > 0 ? (doneCount / categoryElements.length) * 100 : 0,
    };
  };

  // Calcular estatísticas por estado para categoria
  const getCategoryStats = (categoryKey: string) => {
    const categoryElements = elements.filter((e) => e.category_key === categoryKey);
    const userCategoryElements = userElements.filter(
      (ue) => ue.element?.category_key === categoryKey
    );

    return {
      complete: userCategoryElements.filter((ue) => ue.state === "complete").length,
      satisfied: userCategoryElements.filter((ue) => ue.state === "satisfied").length,
      experienced: userCategoryElements.filter((ue) => ue.state === "experienced").length,
    };
  };

  return (
    <div className="space-y-4">
      <p className="font-pixel text-sm mb-4" style={{ color: "#666" }}>
        Que tipos de experiências existem?
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => {
          const progress = getCategoryProgress(category.key);
          const stats = getCategoryStats(category.key);

          return (
            <button
              key={category.id}
              onClick={() => onCategorySelect(category.key)}
              className="p-4 rounded transition-all text-left"
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #e5e5e5",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f8f8f8";
                e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#FFFFFF";
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{category.icon || "📦"}</span>
                <h3 
                  className="font-pixel-bold text-lg line-clamp-2" 
                  style={{ color: "#111", maxWidth: '200px' }}
                  title={category.name}
                >
                  {category.name}
                </h3>
              </div>

              <p className="font-pixel text-sm mb-3" style={{ color: "#666" }}>
                {progress.done} / {progress.total} experiências
              </p>

              {/* Barra de progresso leve */}
              <div
                className="h-2 rounded mb-3"
                style={{ backgroundColor: "#e0e0e0" }}
              >
                <div
                  className="h-full rounded transition-all"
                  style={{
                    width: `${progress.percentage}%`,
                    backgroundColor: progress.percentage > 0 ? "#4d82ff" : "#e0e0e0",
                  }}
                />
              </div>

              {/* Rodapé compacto com contadores */}
              {(stats.experienced > 0 || stats.satisfied > 0 || stats.complete > 0) && (
                <div className="flex items-center gap-2 flex-wrap">
                  {stats.experienced > 0 && (
                    <span className="font-pixel text-sm" style={{ color: "#666" }}>
                      👣 {stats.experienced}
                    </span>
                  )}
                  {stats.satisfied > 0 && (
                    <span className="font-pixel text-sm" style={{ color: "#666" }}>
                      ★ {stats.satisfied}
                    </span>
                  )}
                  {stats.complete > 0 && (
                    <span className="font-pixel text-sm" style={{ color: "#666" }}>
                      ✓ {stats.complete}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Seção de Progresso - Feed Compacto */}
      <div className="mt-8 pt-8 border-t" style={{ borderColor: "#e5e5e5" }}>
        <h2 className="font-pixel-bold text-xl mb-4" style={{ color: "#333" }}>
          Progresso
        </h2>

        {/* Lista compacta de itens recentes */}
        {(() => {
          const recentElements = userElements
            .filter((ue) => ue.state !== "not_done")
            .sort((a, b) => {
              const dateA = new Date(a.last_updated_at).getTime();
              const dateB = new Date(b.last_updated_at).getTime();
              return dateB - dateA;
            })
            .slice(0, 10);

          if (recentElements.length === 0) {
            return (
              <div className="text-center py-8">
                <p className="font-pixel text-sm" style={{ color: "#999" }}>
                  Ainda não há experiências registradas.
                </p>
                <p className="font-pixel text-xs mt-2" style={{ color: "#999" }}>
                  Explore as categorias e marque o que você já viveu.
                </p>
              </div>
            );
          }

          return (
            <div className="space-y-2">
              {recentElements.map((userElement) => {
                const element = elements.find((e) => e.id === userElement.element_id);
                if (!element) return null;

                return (
                  <div
                    key={userElement.id}
                    className="p-2 rounded flex items-center justify-between"
                    style={{
                      backgroundColor: "#f8f8f8",
                      border: "1px solid #e5e5e5",
                    }}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="font-pixel text-base flex-shrink-0">
                        {STATE_ICONS[userElement.state]}
                      </span>
                      <span 
                        className="font-pixel text-sm truncate" 
                        style={{ color: "#111" }}
                        title={element.name}
                      >
                        {element.name}
                      </span>
                    </div>
                    <span className="font-pixel text-xs flex-shrink-0 ml-2" style={{ color: "#999" }}>
                      — {new Date(userElement.last_updated_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

