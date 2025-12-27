"use client";

import { useState } from "react";
import type {
  MapasCategory,
  MapasElement,
  MapasUserElement,
  MapasState,
} from "../../types/mapas";
import { STATE_LABELS, STATE_ICONS } from "../../types/mapas";
import { useMapas } from "../../hooks/useMapas";
import { getElementDexId } from "../../utils/mapas";

interface MapasItemsTabProps {
  categories: MapasCategory[];
  elements: MapasElement[];
  userElements: MapasUserElement[];
  selectedCategory: string | null;
  onCategoryChange: (categoryKey: string | null) => void;
}

export function MapasItemsTab({
  categories,
  elements,
  userElements,
  selectedCategory,
  onCategoryChange,
}: MapasItemsTabProps) {
  const { updateElementState } = useMapas();
  // Estado local para atualização otimista
  const [optimisticStates, setOptimisticStates] = useState<Record<string, MapasState>>({});

  // Filtrar elementos por categoria
  const filteredElements = selectedCategory
    ? elements.filter((e) => e.category_key === selectedCategory)
    : elements;

  // Obter estado atual de um elemento (com atualização otimista)
  const getElementState = (elementId: string): MapasState => {
    // Se há uma atualização otimista, usar ela
    if (optimisticStates[elementId]) {
      return optimisticStates[elementId];
    }
    // Caso contrário, usar o estado do banco
    const userElement = userElements.find((ue) => ue.element_id === elementId);
    return userElement?.state || "not_done";
  };


  // Mudar estado de um elemento
  const handleStateChange = async (elementId: string, newState: MapasState) => {
    // Atualização otimista - atualizar UI imediatamente
    setOptimisticStates(prev => ({
      ...prev,
      [elementId]: newState
    }));

    // Atualizar no banco
    const result = await updateElementState(elementId, newState, "manual");
    
    if (!result.success) {
      console.error("Erro ao atualizar estado:", result.error);
      // Reverter atualização otimista em caso de erro
      setOptimisticStates(prev => {
        const updated = { ...prev };
        delete updated[elementId];
        return updated;
      });
    } else {
      // Limpar atualização otimista após sucesso (os dados virão do banco)
      setTimeout(() => {
        setOptimisticStates(prev => {
          const updated = { ...prev };
          delete updated[elementId];
          return updated;
        });
      }, 100);
    }
  };

  const states: MapasState[] = ["not_done", "experienced", "satisfied", "complete"];

  return (
    <div className="space-y-4">
      <p className="font-pixel text-sm mb-4" style={{ color: "#666" }}>
        Quais experiências específicas existem dentro disso?
      </p>

      {/* Filtro de categoria */}
      <div className="flex gap-2 flex-wrap mb-4">
        <button
          onClick={() => onCategoryChange(null)}
          className={`px-3 py-1 rounded font-pixel text-sm transition-colors ${
            selectedCategory === null ? "bg-blue-100" : "bg-gray-100"
          }`}
          style={{
            color: selectedCategory === null ? "#4d82ff" : "#666",
          }}
        >
          Todas
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.key)}
            className={`px-3 py-1 rounded font-pixel text-sm transition-colors ${
              selectedCategory === category.key ? "bg-blue-100" : "bg-gray-100"
            }`}
            style={{
              color: selectedCategory === category.key ? "#4d82ff" : "#666",
            }}
          >
            {category.icon} {category.name}
          </button>
        ))}
      </div>

      {/* Grid de itens - Cards Dex Compactos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredElements.map((element) => {
          const currentState = getElementState(element.id);
          const userElement = userElements.find((ue) => ue.element_id === element.id);
          const dexId = getElementDexId(element.id);

          return (
            <div
              key={element.id}
              className="p-3 rounded transition-all cursor-pointer group"
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #e5e5e5",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f9f9f9";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#FFFFFF";
              }}
            >
              {/* ID Dex no canto superior esquerdo */}
              <div className="flex items-start justify-between mb-2">
                <span className="font-pixel text-xs" style={{ color: "#999" }}>
                  {dexId}
                </span>
                {/* Badge de status fixo */}
                <span className="font-pixel text-base">
                  {STATE_ICONS[currentState]}
                </span>
              </div>

              {/* Nome do elemento */}
              <h4 
                className="font-pixel-bold text-sm mb-2 line-clamp-2" 
                style={{ color: "#111" }}
                title={element.name}
              >
                {element.name}
              </h4>

              {/* Data "Último" - apenas se state !== "not_done" */}
              {currentState !== "not_done" && userElement?.last_updated_at && (
                <p className="font-pixel text-xs mb-2" style={{ color: "#999" }}>
                  Último: {new Date(userElement.last_updated_at).toLocaleDateString("pt-BR")}
                </p>
              )}

              {/* Stepper compacto de estados - sempre visível no mobile, apenas hover no desktop */}
              <div className="flex items-center gap-1 mt-3 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                {states.map((state) => {
                  const isActive = currentState === state;
                  return (
                    <button
                      key={state}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStateChange(element.id, state);
                      }}
                      className="px-1.5 py-1 rounded font-pixel text-xs transition-all"
                      style={{
                        backgroundColor: isActive ? '#f0f8ff' : 'transparent',
                        border: `1px solid ${isActive ? '#4d82ff' : '#e0e0e0'}`,
                        color: isActive ? '#4d82ff' : '#666',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = '#f0f0f0';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      {STATE_ICONS[state]}
                    </button>
                  );
                })}
              </div>

              {/* Espaço reservado para Notas */}
              <div className="mt-2 pt-2 border-t" style={{ borderColor: "#e5e5e5" }}>
                <p className="font-pixel text-xs" style={{ color: "#999" }}>
                  Notas ▸
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {filteredElements.length === 0 && (
        <div className="text-center py-8">
          <p className="font-pixel text-sm" style={{ color: "#999" }}>
            Nenhum item encontrado nesta categoria.
          </p>
        </div>
      )}
    </div>
  );
}

