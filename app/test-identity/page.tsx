"use client";

import { useIdentityAxes } from "../hooks/useIdentityAxes";
import { useIdentityDeclared } from "../hooks/useIdentityDeclared";
import { useIdentityObserved } from "../hooks/useIdentityObserved";
import { useAchievements } from "../hooks/useAchievements";
import { useFeedbackHistory } from "../hooks/useFeedbackHistory";
import { IdentityAxesPanel } from "../components/identity/IdentityAxesPanel";
import { AchievementsPanel } from "../components/identity/AchievementsPanel";
import { IdentityComparison } from "../components/identity/IdentityComparison";
import { FeedbackHistoryList } from "../components/identity/FeedbackHistoryList";
import PixelMenu from "../components/PixelMenu";

export default function TestIdentityPage() {
  const { axes, loading: axesLoading } = useIdentityAxes();
  const { identity, loading: declaredLoading } = useIdentityDeclared();
  const { observed, loading: observedLoading } = useIdentityObserved();
  const { achievements, userAchievements, loading: achievementsLoading } = useAchievements();
  const { feedbackHistory, loading: feedbackLoading } = useFeedbackHistory();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF" }}>
      <PixelMenu />
      
      <div className="pl-0 md:pl-[80px] py-6 md:py-12 px-4 md:px-6 pt-[50px] md:pt-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-pixel-bold text-3xl mb-6" style={{ color: "#333" }}>
            🧪 Teste - Sistema de Identidade
          </h1>

          {/* Status dos Hooks */}
          <div className="mb-8 p-4 rounded" style={{ backgroundColor: "#f8f8f8", border: "1px solid #e5e5e5" }}>
            <h2 className="font-pixel-bold text-lg mb-4">Status dos Hooks</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm font-pixel">
              <div>
                <span className="font-pixel-bold">Eixos:</span>{" "}
                {axesLoading ? "⏳" : axes.length}
              </div>
              <div>
                <span className="font-pixel-bold">Declarada:</span>{" "}
                {declaredLoading ? "⏳" : identity ? "✅" : "❌"}
              </div>
              <div>
                <span className="font-pixel-bold">Observada:</span>{" "}
                {observedLoading ? "⏳" : observed ? "✅" : "❌"}
              </div>
              <div>
                <span className="font-pixel-bold">Conquistas:</span>{" "}
                {achievementsLoading ? "⏳" : achievements.length}
              </div>
              <div>
                <span className="font-pixel-bold">Feedback:</span>{" "}
                {feedbackLoading ? "⏳" : feedbackHistory.length}
              </div>
            </div>
          </div>

          {/* Componentes */}
          <div className="space-y-8">
            <div className="section-box">
              <h2 className="font-pixel-bold text-xl mb-4">Eixos Detectados</h2>
              <IdentityAxesPanel />
            </div>

            <div className="section-box">
              <h2 className="font-pixel-bold text-xl mb-4">Conquistas</h2>
              <AchievementsPanel />
            </div>

            <div className="section-box">
              <h2 className="font-pixel-bold text-xl mb-4">Comparação</h2>
              <IdentityComparison />
            </div>

            <div className="section-box">
              <h2 className="font-pixel-bold text-xl mb-4">Histórico de Feedback</h2>
              <FeedbackHistoryList />
            </div>
          </div>

          {/* Debug Info (colapsável) */}
          <details className="mt-8">
            <summary className="font-pixel-bold text-lg cursor-pointer" style={{ color: "#666" }}>
              🔍 Debug Info (clique para expandir)
            </summary>
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="font-pixel-bold text-sm mb-2">Eixos (Raw)</h3>
                <pre className="text-xs p-2 rounded overflow-auto" style={{ backgroundColor: "#f5f5f5", maxHeight: "200px" }}>
                  {JSON.stringify(axes, null, 2)}
                </pre>
              </div>
              <div>
                <h3 className="font-pixel-bold text-sm mb-2">Identidade Declarada (Raw)</h3>
                <pre className="text-xs p-2 rounded overflow-auto" style={{ backgroundColor: "#f5f5f5", maxHeight: "200px" }}>
                  {JSON.stringify(identity, null, 2)}
                </pre>
              </div>
              <div>
                <h3 className="font-pixel-bold text-sm mb-2">Identidade Observada (Raw)</h3>
                <pre className="text-xs p-2 rounded overflow-auto" style={{ backgroundColor: "#f5f5f5", maxHeight: "200px" }}>
                  {JSON.stringify(observed, null, 2)}
                </pre>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

