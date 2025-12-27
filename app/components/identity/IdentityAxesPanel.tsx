"use client";

import { useIdentityAxes } from "../../hooks/useIdentityAxes";
import { useAxisSignals } from "../../hooks/useAxisSignals";
import { useState, useEffect } from "react";

export function IdentityAxesPanel() {
  const { axes, loading, loadAxesByStatus } = useIdentityAxes();
  const { loadSignals } = useAxisSignals();
  const [selectedAxis, setSelectedAxis] = useState<string | null>(null);
  const [centralAxes, setCentralAxes] = useState<any[]>([]);

  useEffect(() => {
    loadAxesByStatus("central").then(setCentralAxes);
  }, [loadAxesByStatus]);

  if (loading) {
    return (
      <div className="text-center font-pixel text-sm" style={{ color: "#999" }}>
        Carregando eixos...
      </div>
    );
  }

  if (axes.length === 0) {
    return (
      <div className="text-center py-8 px-4 rounded" style={{ backgroundColor: "#fafafa", border: "1px solid #e5e5e5" }}>
        <p className="text-sm font-pixel" style={{ color: "#666" }}>
          Nenhum eixo detectado ainda.
        </p>
        <p className="text-xs font-pixel mt-2" style={{ color: "#999" }}>
          Continue registrando atividades para ver seus eixos centrais emergirem.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-pixel-bold text-lg" style={{ color: "#333" }}>
        🧩 Eixos Centrais Observados
      </h3>

      <p className="font-pixel text-sm" style={{ color: "#666" }}>
        Com base no que você registra, estes são temas que aparecem de forma consistente na sua vida.
      </p>

      <div className="space-y-3">
        {axes.map((axis) => (
          <AxisCard
            key={axis.id}
            axis={axis}
            isSelected={selectedAxis === axis.axis_key}
            onSelect={() => setSelectedAxis(selectedAxis === axis.axis_key ? null : axis.axis_key)}
          />
        ))}
      </div>
    </div>
  );
}

function AxisCard({
  axis,
  isSelected,
  onSelect,
}: {
  axis: any;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const statusColors: Record<string, string> = {
    latent: "#e0e0e0",
    emerging: "#fff3e0",
    central: "#e8f5e9",
    fading: "#fce4ec",
  };

  const statusLabels: Record<string, string> = {
    latent: "Latente",
    emerging: "Emergindo",
    central: "Central",
    fading: "Desvanecendo",
  };

  return (
    <div
      className="p-4 rounded transition-all cursor-pointer"
      style={{
        backgroundColor: isSelected ? "#f0f8ff" : statusColors[axis.status] || "#f5f5f5",
        border: `1px solid ${isSelected ? "#4d82ff" : "#e5e5e5"}`,
        boxShadow: isSelected ? "0 2px 4px rgba(0,0,0,0.1)" : "0 1px 3px rgba(0,0,0,0.05)",
      }}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-pixel-bold text-base" style={{ color: "#111" }}>
              {axis.label}
            </h4>
            <span
              className="text-xs font-pixel px-2 py-0.5 rounded"
              style={{
                backgroundColor: statusColors[axis.status] || "#e0e0e0",
                color: "#666",
              }}
            >
              {statusLabels[axis.status] || axis.status}
            </span>
          </div>

          {axis.description && (
            <p className="font-pixel text-sm mb-2" style={{ color: "#666" }}>
              {axis.description}
            </p>
          )}

          {axis.relevance_score !== null && (
            <div className="flex items-center gap-2">
              <span className="font-pixel text-xs" style={{ color: "#999" }}>
                Relevância:
              </span>
              <div className="flex-1 h-2 rounded" style={{ backgroundColor: "#e0e0e0" }}>
                <div
                  className="h-full rounded transition-all"
                  style={{
                    width: `${(axis.relevance_score * 100).toFixed(0)}%`,
                    backgroundColor: axis.relevance_score > 0.7 ? "#4caf50" : axis.relevance_score > 0.4 ? "#ff9800" : "#9e9e9e",
                  }}
                />
              </div>
              <span className="font-pixel text-xs" style={{ color: "#666" }}>
                {(axis.relevance_score * 100).toFixed(0)}%
              </span>
            </div>
          )}

          {axis.first_detected_at && (
            <p className="font-pixel text-xs mt-2" style={{ color: "#999" }}>
              Detectado em: {new Date(axis.first_detected_at).toLocaleDateString("pt-BR")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

