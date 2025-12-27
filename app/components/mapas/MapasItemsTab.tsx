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
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
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

  // Obter categoria de um elemento
  const getElementCategory = (element: MapasElement): MapasCategory | undefined => {
    return categories.find((c) => c.key === element.category_key);
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

      {/* Grid de itens */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredElements.map((element) => {
          const currentState = getElementState(element.id);
          const category = getElementCategory(element);
          const isSelected = selectedElement === element.id;

          return (
            <div
              key={element.id}
              className="p-4 rounded transition-all cursor-pointer"
              onClick={() => setSelectedElement(isSelected ? null : element.id)}
              style={{
                backgroundColor: isSelected ? "#f0f8ff" : "#FFFFFF",
                border: `1px solid ${isSelected ? "#4d82ff" : "#e5e5e5"}`,
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = "#f9f9f9";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = "#FFFFFF";
                }
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {category && <span>{category.icon}</span>}
                    <h4 
                      className="font-pixel-bold text-base line-clamp-2" 
                      style={{ color: "#111", maxWidth: '250px' }}
                      title={element.name}
                    >
                      {element.name}
                    </h4>
                  </div>
                  {element.description && (
                    <p className="font-pixel text-xs" style={{ color: "#666" }}>
                      {element.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Estado atual */}
              <div className="mb-3">
                <p className="font-pixel text-xs mb-2" style={{ color: "#999" }}>
                  Estado:
                </p>
                <div className="flex items-center gap-2">
                  <span>{STATE_ICONS[currentState]}</span>
                  <span className="font-pixel text-sm" style={{ color: "#666" }}>
                    {STATE_LABELS[currentState]}
                  </span>
                </div>
              </div>

              {/* Botões para mudar estado */}
              <div className="space-y-1">
                {states.map((state) => {
                  const isActive = currentState === state;
                  // Estilo baseado no estado ativo
                  const getButtonStyle = () => {
                    if (isActive) {
                      // Estado ativo: verde (mesmo verde dos hábitos)
                      return {
                        backgroundColor: '#7aff7a',
                        color: '#0f9d58',
                        border: '1px solid #0f9d58',
                        cursor: 'pointer',
                      };
                    } else {
                      // Estado inativo: cinza claro
                      return {
                        backgroundColor: '#f0f0f0',
                        color: '#666',
                        border: '1px solid #e0e0e0',
                        cursor: 'pointer',
                      };
                    }
                  };

                  const buttonStyle = getButtonStyle();

                  return (
                    <button
                      key={state}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevenir que o clique no botão selecione o card
                        handleStateChange(element.id, state);
                      }}
                      className="w-full px-2 py-1.5 rounded font-pixel text-xs transition-all"
                      style={{
                        ...buttonStyle,
                        fontWeight: isActive ? '700' : '400',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = '#e0e0e0';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = '#f0f0f0';
                        }
                      }}
                    >
                      {STATE_ICONS[state]} {STATE_LABELS[state]}
                    </button>
                  );
                })}
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

