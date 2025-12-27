"use client";

import { useState } from "react";
import { useInsights } from "../../hooks/useInsights";
import { Insight } from "../../types/activity";

export function InsightHistory() {
  const { insights, loading, deleteInsight } = useInsights();
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const formatConfidence = (confidence: number | null | undefined) => {
    if (confidence === null || confidence === undefined) return null;
    return Math.round(confidence * 100);
  };

  if (loading) {
    return (
      <div className="text-sm font-pixel" style={{ color: "#999" }}>
        Carregando histórico...
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="text-center py-8 px-4 rounded" style={{ backgroundColor: "#fafafa", border: "1px solid #e5e5e5" }}>
        <p className="text-sm font-pixel" style={{ color: "#666" }}>
          Nenhum feedback ainda.
        </p>
        <p className="text-xs font-pixel mt-2" style={{ color: "#999" }}>
          Os insights aparecerão aqui conforme você usa o app.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-pixel-bold text-lg" style={{ color: "#333" }}>
        Histórico de Leituras sobre Você
      </h3>

      <div className="space-y-3">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className="p-4 rounded transition-all cursor-pointer"
            style={{
              backgroundColor: selectedInsight?.id === insight.id ? "#f0f8ff" : "#FFFFFF",
              border: "1px solid #e5e5e5",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
            onClick={() =>
              setSelectedInsight(selectedInsight?.id === insight.id ? null : insight)
            }
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-pixel-bold px-2 py-0.5 rounded" style={{ backgroundColor: "#e3f2fd", color: "#1976d2" }}>
                    {formatDate(insight.generated_at)}
                  </span>
                  {insight.pattern && (
                    <span className="text-xs font-pixel px-2 py-0.5 rounded" style={{ backgroundColor: "#f5f5f5", color: "#666" }}>
                      {insight.pattern}
                    </span>
                  )}
                  {insight.confidence !== null && insight.confidence !== undefined && (
                    <span className="text-xs font-pixel" style={{ color: "#999" }}>
                      {formatConfidence(insight.confidence)}% confiança
                    </span>
                  )}
                </div>
                <p className="text-sm font-pixel leading-relaxed" style={{ color: "#333" }}>
                  {insight.description}
                </p>
                {selectedInsight?.id === insight.id && insight.based_on && (
                  <div className="mt-2 pt-2 border-t" style={{ borderColor: "#e5e5e5" }}>
                    <p className="text-xs font-pixel" style={{ color: "#666" }}>
                      <strong>Baseado em:</strong> {JSON.stringify(insight.based_on, null, 2)}
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("Tem certeza que deseja deletar este insight?")) {
                    deleteInsight(insight.id);
                  }
                }}
                className="ml-2 text-xs font-pixel px-2 py-1 rounded transition-opacity hover:opacity-70"
                style={{ backgroundColor: "#ffebee", color: "#c62828" }}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      {insights.length > 1 && (
        <div className="mt-4 p-3 rounded text-center" style={{ backgroundColor: "#f0f8ff", border: "1px solid #90caf9" }}>
          <p className="text-xs font-pixel" style={{ color: "#1976d2" }}>
            💡 Compare os insights ao longo do tempo para ver como você mudou.
          </p>
        </div>
      )}
    </div>
  );
}

