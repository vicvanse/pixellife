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

  return (
    <div className="space-y-4">
      <p className="font-pixel text-sm mb-4" style={{ color: "#666" }}>
        Que tipos de experiências existem?
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => {
          const progress = getCategoryProgress(category.key);

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
                className="h-2 rounded"
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
            </button>
          );
        })}
      </div>

      {/* Seção de Progresso */}
      <div className="mt-8 pt-8 border-t" style={{ borderColor: "#e5e5e5" }}>
        <h2 className="font-pixel-bold text-xl mb-4" style={{ color: "#333" }}>
          Progresso
        </h2>
        <p className="font-pixel text-sm mb-4" style={{ color: "#666" }}>
          O que você já viveu?
        </p>

        {/* Estatísticas por categoria */}
        <div className="space-y-4">
          {categories.map((category) => {
            const categoryElements = elements.filter((e) => e.category_key === category.key);
            const userCategoryElements = userElements.filter(
              (ue) => ue.element?.category_key === category.key
            );

            const stats = {
              complete: userCategoryElements.filter((ue) => ue.state === "complete").length,
              satisfied: userCategoryElements.filter((ue) => ue.state === "satisfied").length,
              experienced: userCategoryElements.filter((ue) => ue.state === "experienced").length,
              notDone: categoryElements.length - userCategoryElements.length,
            };

            if (stats.complete + stats.satisfied + stats.experienced === 0) {
              return null;
            }

            // Encontrar a data mais recente da categoria
            const mostRecentDate = userCategoryElements.length > 0
              ? userCategoryElements
                  .map((ue) => new Date(ue.last_updated_at).getTime())
                  .reduce((max, date) => Math.max(max, date), 0)
              : null;

            return (
              <div
                key={category.id}
                className="p-4 rounded"
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #e5e5e5",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{category.icon}</span>
                    <h3 
                      className="font-pixel-bold text-lg line-clamp-2" 
                      style={{ color: "#111", maxWidth: '200px' }}
                      title={category.name}
                    >
                      {category.name}
                    </h3>
                  </div>
                  {mostRecentDate && (
                    <span className="font-pixel text-xs" style={{ color: "#999" }}>
                      {new Date(mostRecentDate).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {stats.complete > 0 && (
                    <div className="flex items-center gap-2">
                      <span>{STATE_ICONS.complete}</span>
                      <span className="font-pixel text-sm" style={{ color: "#666" }}>
                        {stats.complete} experiências completas
                      </span>
                    </div>
                  )}
                  {stats.satisfied > 0 && (
                    <div className="flex items-center gap-2">
                      <span>{STATE_ICONS.satisfied}</span>
                      <span className="font-pixel text-sm" style={{ color: "#666" }}>
                        {stats.satisfied} práticas recorrentes
                      </span>
                    </div>
                  )}
                  {stats.experienced > 0 && (
                    <div className="flex items-center gap-2">
                      <span>{STATE_ICONS.experienced}</span>
                      <span className="font-pixel text-sm" style={{ color: "#666" }}>
                        {stats.experienced} experiências únicas
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mensagem quando não há experiências */}
        {userElements.filter((ue) => ue.state !== "not_done").length === 0 && (
          <div className="text-center py-8 mt-6">
            <p className="font-pixel text-sm" style={{ color: "#999" }}>
              Ainda não há experiências registradas.
            </p>
            <p className="font-pixel text-xs mt-2" style={{ color: "#999" }}>
              Explore as categorias e marque o que você já viveu.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

