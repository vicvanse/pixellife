"use client";

import { useAchievements } from "../../hooks/useAchievements";
import { useState, useEffect } from "react";
import type { AchievementProgress } from "../../types/identity_axes";

export function AchievementsPanel() {
  const { achievements, userAchievements, loading, getAchievementProgress } = useAchievements();
  const [progressList, setProgressList] = useState<AchievementProgress[]>([]);

  // Mock signals para demonstração (em produção, viria de useAxisSignals)
  const mockSignals = [
    {
      axis_key: "body_movement",
      activity_count: 20,
      streak: 7,
      diary_mentions: 5,
      time_span_days: 30,
      frequency: 0.67,
      last_calculated: new Date().toISOString(),
    },
  ];

  useEffect(() => {
    if (achievements.length > 0) {
      const progress = achievements.map((achievement) =>
        getAchievementProgress(achievement, mockSignals)
      );
      setProgressList(progress);
    }
  }, [achievements, getAchievementProgress]);

  if (loading) {
    return (
      <div className="text-center font-pixel text-sm" style={{ color: "#999" }}>
        Carregando conquistas...
      </div>
    );
  }

  const completed = progressList.filter((p) => p.userAchievement?.completed);
  const inProgress = progressList.filter(
    (p) => !p.userAchievement?.completed && p.progressPercent > 0
  );
  const notStarted = progressList.filter((p) => p.progressPercent === 0);

  return (
    <div className="space-y-6">
      <h3 className="font-pixel-bold text-lg" style={{ color: "#333" }}>
        🏆 Conquistas
      </h3>

      {/* Concluídas */}
      {completed.length > 0 && (
        <div>
          <h4 className="font-pixel-bold text-sm mb-2" style={{ color: "#666" }}>
            ✅ Concluídas ({completed.length})
          </h4>
          <div className="space-y-2">
            {completed.map((progress) => (
              <AchievementCard key={progress.achievement.id} progress={progress} />
            ))}
          </div>
        </div>
      )}

      {/* Em Progresso */}
      {inProgress.length > 0 && (
        <div>
          <h4 className="font-pixel-bold text-sm mb-2" style={{ color: "#666" }}>
            🔄 Em Progresso ({inProgress.length})
          </h4>
          <div className="space-y-2">
            {inProgress.map((progress) => (
              <AchievementCard key={progress.achievement.id} progress={progress} />
            ))}
          </div>
        </div>
      )}

      {/* Não Iniciadas */}
      {notStarted.length > 0 && (
        <div>
          <h4 className="font-pixel-bold text-sm mb-2" style={{ color: "#666" }}>
            🔒 Não Iniciadas ({notStarted.length})
          </h4>
          <div className="space-y-2">
            {notStarted.slice(0, 5).map((progress) => (
              <AchievementCard key={progress.achievement.id} progress={progress} />
            ))}
          </div>
        </div>
      )}

      {progressList.length === 0 && (
        <div className="text-center py-8 px-4 rounded" style={{ backgroundColor: "#fafafa", border: "1px solid #e5e5e5" }}>
          <p className="text-sm font-pixel" style={{ color: "#666" }}>
            Nenhuma conquista disponível ainda.
          </p>
        </div>
      )}
    </div>
  );
}

function AchievementCard({ progress }: { progress: AchievementProgress }) {
  const { achievement, userAchievement, progressPercent, remaining, canComplete } = progress;

  return (
    <div
      className="p-3 rounded transition-all"
      style={{
        backgroundColor: userAchievement?.completed ? "#e8f5e9" : "#FFFFFF",
        border: `1px solid ${userAchievement?.completed ? "#4caf50" : "#e5e5e5"}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {achievement.icon_key && (
              <span className="text-lg">{achievement.icon_key}</span>
            )}
            <h4 className="font-pixel-bold text-sm" style={{ color: "#111" }}>
              {achievement.title}
            </h4>
            {userAchievement?.completed && (
              <span className="text-xs font-pixel px-2 py-0.5 rounded" style={{ backgroundColor: "#4caf50", color: "#fff" }}>
                ✓
              </span>
            )}
          </div>
          {achievement.description && (
            <p className="font-pixel text-xs mt-1" style={{ color: "#666" }}>
              {achievement.description}
            </p>
          )}
        </div>
      </div>

      {!userAchievement?.completed && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-pixel text-xs" style={{ color: "#999" }}>
              Progresso:
            </span>
            <div className="flex-1 h-2 rounded" style={{ backgroundColor: "#e0e0e0" }}>
              <div
                className="h-full rounded transition-all"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: canComplete ? "#4caf50" : "#ff9800",
                }}
              />
            </div>
            <span className="font-pixel text-xs" style={{ color: "#666" }}>
              {progressPercent}%
            </span>
          </div>
          {remaining && (
            <p className="font-pixel text-xs" style={{ color: "#ff9800" }}>
              {remaining}
            </p>
          )}
        </div>
      )}

      {userAchievement?.completed && userAchievement.completed_at && (
        <p className="font-pixel text-xs mt-2" style={{ color: "#999" }}>
          Concluída em: {new Date(userAchievement.completed_at).toLocaleDateString("pt-BR")}
        </p>
      )}
    </div>
  );
}

