"use client";

import { useState } from "react";
import { IdentityAxesPanel } from "../identity/IdentityAxesPanel";
import { AchievementsPanel } from "../identity/AchievementsPanel";
import { IdentityComparison } from "../identity/IdentityComparison";
import { FeedbackHistoryList } from "../identity/FeedbackHistoryList";
import { useIdentityObserved } from "../../hooks/useIdentityObserved";
import { useIdentityAxes } from "../../hooks/useIdentityAxes";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { runIdentityPipeline } from "../../lib/pipelineIdentity";
import type { Activity } from "../../types/activity";

export function FeedbackSection() {
  const [activeTab, setActiveTab] = useState<'axes' | 'achievements' | 'comparison' | 'history'>('axes');
  const { observed, loading: observedLoading, generateObservedIdentity } = useIdentityObserved();
  const { axes, refresh: refreshAxes, upsertAxis } = useIdentityAxes();
  const { user } = useAuth();
  const [calculating, setCalculating] = useState(false);

  const handleCalculateIdentity = async () => {
    if (!user?.id) {
      alert("Você precisa estar logado para calcular identidade.");
      return;
    }

    try {
      setCalculating(true);

      // 1. Buscar todas as activities
      const { data: activities, error: activitiesError } = await supabase
        .from("activities")
        .select("*")
        .eq("user_id", user.id)
        .order("timestamp", { ascending: true });

      if (activitiesError) {
        console.error("Erro ao buscar activities:", activitiesError);
        alert(`Erro ao buscar atividades: ${activitiesError.message}`);
        return;
      }

      // 2. Executar pipeline completo
      const result = await runIdentityPipeline(activities as Activity[] || [], "90d", user.id);

      // 3. Salvar eixos no banco (via hook useIdentityAxes)
      for (const axis of result.axes) {
        await upsertAxis(axis.axis_key, {
          label: axis.label,
          description: axis.description || undefined,
          status: axis.status,
          relevance_score: axis.relevance_score || undefined,
          first_detected_at: axis.first_detected_at || undefined,
          last_active_at: axis.last_active_at || undefined,
        });
      }

      // 4. Gerar identidade observada (cache)
      await generateObservedIdentity("90d");

      // 5. Atualizar lista de eixos
      await refreshAxes();

      alert(`✅ Pipeline executado! ${result.axes.length} eixos detectados.`);
    } catch (err) {
      console.error("Erro ao executar pipeline:", err);
      alert(`❌ Erro: ${(err as Error).message}`);
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 border-b" style={{ borderColor: "#e5e5e5" }}>
        <button
          onClick={() => setActiveTab('axes')}
          className={`px-4 py-2 font-pixel text-sm transition-colors ${
            activeTab === 'axes'
              ? 'border-b-2'
              : 'opacity-60 hover:opacity-100'
          }`}
          style={{
            borderBottomColor: activeTab === 'axes' ? '#4d82ff' : 'transparent',
            color: activeTab === 'axes' ? '#4d82ff' : '#666',
          }}
        >
          🧩 Eixos
        </button>
        <button
          onClick={() => setActiveTab('achievements')}
          className={`px-4 py-2 font-pixel text-sm transition-colors ${
            activeTab === 'achievements'
              ? 'border-b-2'
              : 'opacity-60 hover:opacity-100'
          }`}
          style={{
            borderBottomColor: activeTab === 'achievements' ? '#4d82ff' : 'transparent',
            color: activeTab === 'achievements' ? '#4d82ff' : '#666',
          }}
        >
          🏆 Conquistas
        </button>
        <button
          onClick={() => setActiveTab('comparison')}
          className={`px-4 py-2 font-pixel text-sm transition-colors ${
            activeTab === 'comparison'
              ? 'border-b-2'
              : 'opacity-60 hover:opacity-100'
          }`}
          style={{
            borderBottomColor: activeTab === 'comparison' ? '#4d82ff' : 'transparent',
            color: activeTab === 'comparison' ? '#4d82ff' : '#666',
          }}
        >
          🔄 Comparação
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-pixel text-sm transition-colors ${
            activeTab === 'history'
              ? 'border-b-2'
              : 'opacity-60 hover:opacity-100'
          }`}
          style={{
            borderBottomColor: activeTab === 'history' ? '#4d82ff' : 'transparent',
            color: activeTab === 'history' ? '#4d82ff' : '#666',
          }}
        >
          📜 Histórico
        </button>
      </div>

      {/* Botão para calcular identidade */}
      <div className="flex justify-end">
        <button
          onClick={handleCalculateIdentity}
          disabled={calculating || observedLoading}
          className="px-4 py-2 rounded font-pixel text-sm transition-opacity"
          style={{
            backgroundColor: calculating ? "#ccc" : "#4d82ff",
            color: "#FFFFFF",
            border: "1px solid #3d72ef",
            opacity: calculating || observedLoading ? 0.5 : 1,
          }}
        >
          {calculating ? "Calculando..." : "🔄 Calcular Identidade"}
        </button>
      </div>

      {/* Conteúdo por tab */}
      <div className="mt-4">
        {activeTab === 'axes' && <IdentityAxesPanel />}
        {activeTab === 'achievements' && <AchievementsPanel />}
        {activeTab === 'comparison' && <IdentityComparison />}
        {activeTab === 'history' && <FeedbackHistoryList />}
      </div>
    </div>
  );
}

