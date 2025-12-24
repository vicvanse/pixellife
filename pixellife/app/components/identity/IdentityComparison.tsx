"use client";

import { useState, useMemo } from "react";
import { useIdentityDeclared } from "../../hooks/useIdentityDeclared";
import { useIdentityObserved } from "../../hooks/useIdentityObserved";
import { compareIdentities } from "../../lib/compareIdentities";

export function IdentityComparison() {
  const { identity: declared } = useIdentityDeclared();
  const { observed } = useIdentityObserved();
  const [enabled, setEnabled] = useState(false);

  const comparison = useMemo(() => {
    if (!declared || !observed) return null;
    return compareIdentities(declared, observed);
  }, [declared, observed]);

  if (!enabled) {
    return (
      <div className="p-4 rounded text-center" style={{ backgroundColor: "#f8f8f8", border: "1px solid #e5e5e5" }}>
        <p className="font-pixel text-sm mb-2" style={{ color: "#666" }}>
          Compare sua identidade declarada com o que os dados mostram
        </p>
        <button
          onClick={() => setEnabled(true)}
          className="px-3 py-2 rounded font-pixel text-sm transition-colors"
          style={{
            backgroundColor: "#4d82ff",
            color: "#FFFFFF",
            border: "1px solid #3d72ef",
          }}
        >
          Ativar comparação
        </button>
      </div>
    );
  }

  if (!comparison) {
    return (
      <div className="text-center font-pixel text-sm" style={{ color: "#999" }}>
        Carregando comparação...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-pixel-bold text-lg" style={{ color: "#333" }}>
        Comparação: Declarado vs Observado
      </h3>

      {/* Sobreposições */}
      {comparison.overlaps.length > 0 && (
        <div>
          <h4 className="font-pixel-bold text-sm mb-2" style={{ color: "#666" }}>
            ✅ Sobreposições ({comparison.overlaps.length})
          </h4>
          <div className="space-y-2">
            {comparison.overlaps.map((overlap, idx) => (
              <div key={idx} className="p-2 rounded" style={{ backgroundColor: "#e8f5e9", border: "1px solid #4caf50" }}>
                <p className="font-pixel text-sm">
                  "{overlap.declared}" aparece tanto para você quanto nos dados.
                </p>
                {overlap.match < 1 && (
                  <p className="font-pixel text-xs mt-1" style={{ color: "#666" }}>
                    Match: {(overlap.match * 100).toFixed(0)}%
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Divergências */}
      {comparison.divergences.length > 0 && (
        <div>
          <h4 className="font-pixel-bold text-sm mb-2" style={{ color: "#666" }}>
            ⚠️ Divergências ({comparison.divergences.length})
          </h4>
          <div className="space-y-2">
            {comparison.divergences.map((divergence, idx) => (
              <div key={idx} className="p-2 rounded" style={{ backgroundColor: "#fff3e0", border: "1px solid #ff9800" }}>
                <p className="font-pixel text-sm">
                  "{divergence.declared}" é importante para você, mas aparece pouco nos registros.
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ausências */}
      {comparison.absences.length > 0 && (
        <div>
          <h4 className="font-pixel-bold text-sm mb-2" style={{ color: "#666" }}>
            💡 Ausências ({comparison.absences.length})
          </h4>
          <div className="space-y-2">
            {comparison.absences.map((absence, idx) => (
              <div key={idx} className="p-2 rounded" style={{ backgroundColor: "#e3f2fd", border: "1px solid #2196f3" }}>
                <p className="font-pixel text-sm">
                  "{absence.observed}" aparece forte nos dados, mas não é mencionado por você.
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {comparison.overlaps.length === 0 && comparison.divergences.length === 0 && comparison.absences.length === 0 && (
        <div className="text-center py-4">
          <p className="font-pixel text-sm" style={{ color: "#999" }}>
            Não há dados suficientes para comparação.
          </p>
        </div>
      )}
    </div>
  );
}

