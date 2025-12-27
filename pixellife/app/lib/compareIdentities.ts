/**
 * Compara Identidade Declarada vs Identidade Observada
 * 
 * Retorna sobreposições, divergências e ausências sem julgamento
 */

import type { IdentityDeclared } from "../types/identity";
import type { IdentityObserved } from "../types/identity";
import type { IdentityComparison } from "../types/identity";

/**
 * Compara pontos centrais declarados com eixos observados
 */
export function compareIdentities(
  declared: IdentityDeclared,
  observed: IdentityObserved
): IdentityComparison {
  const comparison: IdentityComparison = {
    overlaps: [],
    divergences: [],
    absences: [],
  };

  // Comparar pontos centrais declarados com eixos observados
  declared.core_labels.forEach((declaredPoint) => {
    const matchingAxis = observed.axes.find((axis) =>
      fuzzyMatch(declaredPoint, axis.label)
    );

    if (matchingAxis) {
      comparison.overlaps.push({
        declared: declaredPoint,
        observed: matchingAxis.label,
        match: matchingAxis.score || 0,
      });
    } else {
      comparison.divergences.push({
        declared: declaredPoint,
        reason: "not_in_data",
      });
    }
  });

  // Eixos observados não declarados (considerar apenas eixos com score alto)
  observed.axes.forEach((axis) => {
    const isDeclared = declared.core_labels.some((point) =>
      fuzzyMatch(point, axis.label)
    );

    // Considerar eixo "central" se score > 0.5 (ajustável)
    if (!isDeclared && axis.score > 0.5) {
      comparison.absences.push({
        observed: axis.label,
        reason: "not_declared",
      });
    }
  });

  return comparison;
}

/**
 * Match fuzzy entre strings (case-insensitive, parcial)
 */
function fuzzyMatch(str1: string, str2: string): boolean {
  const normalize = (s: string) => s.toLowerCase().trim();
  const s1 = normalize(str1);
  const s2 = normalize(str2);

  // Match exato
  if (s1 === s2) return true;

  // Match parcial (uma contém a outra)
  if (s1.includes(s2) || s2.includes(s1)) return true;

  // Match por palavras-chave comuns
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  const commonWords = words1.filter((w) => words2.includes(w) && w.length > 3);

  return commonWords.length > 0;
}

