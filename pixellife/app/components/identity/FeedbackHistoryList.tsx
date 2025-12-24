"use client";

import { useFeedbackHistory } from "../../hooks/useFeedbackHistory";
import type { FeedbackHistory } from "../../types/identity_axes";

export function FeedbackHistoryList() {
  const { feedbackHistory, loading } = useFeedbackHistory();

  if (loading) {
    return (
      <div className="text-center font-pixel text-sm" style={{ color: "#999" }}>
        Carregando histórico...
      </div>
    );
  }

  if (feedbackHistory.length === 0) {
    return (
      <div className="text-center py-8 px-4 rounded" style={{ backgroundColor: "#fafafa", border: "1px solid #e5e5e5" }}>
        <p className="text-sm font-pixel" style={{ color: "#666" }}>
          Nenhum feedback ainda.
        </p>
        <p className="text-xs font-pixel mt-2" style={{ color: "#999" }}>
          Os feedbacks aparecerão aqui conforme você usa o app.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-pixel-bold text-lg" style={{ color: "#333" }}>
        📜 Histórico de Feedback
      </h3>

      <div className="space-y-3">
        {feedbackHistory.map((feedback) => (
          <FeedbackCard key={feedback.id} feedback={feedback} />
        ))}
      </div>
    </div>
  );
}

function FeedbackCard({ feedback }: { feedback: FeedbackHistory }) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const contextLabels: Record<string, string> = {
    monthly_review: "📅 Revisão Mensal",
    axis_summary: "🧩 Resumo de Eixos",
    achievement_unlock: "🏆 Conquista Desbloqueada",
    pattern_detected: "🔍 Padrão Detectado",
  };

  return (
    <div
      className="p-4 rounded transition-all"
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #e5e5e5",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          {feedback.context && (
            <span className="text-xs font-pixel px-2 py-0.5 rounded mb-2 inline-block" style={{ backgroundColor: "#e3f2fd", color: "#1976d2" }}>
              {contextLabels[feedback.context] || feedback.context}
            </span>
          )}
          <p className="font-pixel text-sm leading-relaxed" style={{ color: "#333" }}>
            {feedback.content}
          </p>
          {feedback.confidence !== null && (
            <p className="font-pixel text-xs mt-2" style={{ color: "#999" }}>
              Confiança: {(feedback.confidence * 100).toFixed(0)}%
            </p>
          )}
          <p className="font-pixel text-xs mt-1" style={{ color: "#999" }}>
            {formatDate(feedback.created_at)}
          </p>
        </div>
      </div>
    </div>
  );
}

