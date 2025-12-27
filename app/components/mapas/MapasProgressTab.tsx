"use client";

import type {
  MapasCategory,
  MapasElement,
  MapasUserElement,
} from "../../types/mapas";
import { STATE_LABELS, STATE_ICONS } from "../../types/mapas";

interface MapasProgressTabProps {
  categories: MapasCategory[];
  userElements: MapasUserElement[];
  elements: MapasElement[];
}

export function MapasProgressTab({
  categories,
  userElements,
  elements,
}: MapasProgressTabProps) {
  // Agrupar por categoria
  const getCategoryStats = (categoryKey: string) => {
    const categoryElements = elements.filter((e) => e.category_key === categoryKey);
    const userCategoryElements = userElements.filter(
      (ue) => ue.element?.category_key === categoryKey
    );

    const stats = {
      complete: userCategoryElements.filter((ue) => ue.state === "complete").length,
      satisfied: userCategoryElements.filter((ue) => ue.state === "satisfied").length,
      experienced: userCategoryElements.filter((ue) => ue.state === "experienced").length,
      notDone: categoryElements.length - userCategoryElements.length,
    };

    return stats;
  };

  // Obter elementos recentes
  const getRecentElements = (limit: number = 5) => {
    return userElements
      .filter((ue) => ue.state !== "not_done")
      .sort((a, b) => {
        const dateA = new Date(a.last_updated_at).getTime();
        const dateB = new Date(b.last_updated_at).getTime();
        return dateB - dateA;
      })
      .slice(0, limit);
  };

  const recentElements = getRecentElements(5);

  return (
    <div className="space-y-6">
      <p className="font-pixel text-sm mb-4" style={{ color: "#666" }}>
        O que você já viveu?
      </p>

      {/* Estatísticas por categoria */}
      <div className="space-y-4">
        {categories.map((category) => {
          const stats = getCategoryStats(category.key);

          if (stats.complete + stats.satisfied + stats.experienced === 0) {
            return null;
          }

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
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{category.icon}</span>
                <h3 
                  className="font-pixel-bold text-lg line-clamp-2" 
                  style={{ color: "#111", maxWidth: '200px' }}
                  title={category.name}
                >
                  {category.name}
                </h3>
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

      {/* Elementos recentes */}
      {recentElements.length > 0 && (
        <div>
          <h3 className="font-pixel-bold text-lg mb-3" style={{ color: "#333" }}>
            Recentes
          </h3>
          <div className="space-y-2">
            {recentElements.map((userElement) => {
              const element = elements.find((e) => e.id === userElement.element_id);
              if (!element) return null;

              const category = categories.find((c) => c.key === element.category_key);

              return (
                <div
                  key={userElement.id}
                  className="p-3 rounded flex items-center justify-between"
                  style={{
                    backgroundColor: "#f8f8f8",
                    border: "1px solid #e5e5e5",
                  }}
                >
                  <div className="flex items-center gap-2">
                    {category && <span>{category.icon}</span>}
                    <span 
                      className="font-pixel text-sm truncate block" 
                      style={{ color: "#111", maxWidth: '150px' }}
                      title={element.name}
                    >
                      {element.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{STATE_ICONS[userElement.state]}</span>
                    <span className="font-pixel text-xs" style={{ color: "#999" }}>
                      {new Date(userElement.last_updated_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {userElements.filter((ue) => ue.state !== "not_done").length === 0 && (
        <div className="text-center py-8">
          <p className="font-pixel text-sm" style={{ color: "#999" }}>
            Ainda não há experiências registradas.
          </p>
          <p className="font-pixel text-xs mt-2" style={{ color: "#999" }}>
            Explore as categorias e marque o que você já viveu.
          </p>
        </div>
      )}
    </div>
  );
}

