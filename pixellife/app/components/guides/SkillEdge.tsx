'use client';

interface SkillEdgeProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  isActive?: boolean;
  isCompleted?: boolean;
}

/**
 * Componente de conexão entre nós na skill tree
 * Linhas finas e suaves conectando os nós
 * 
 * Estilo: linhas finas, suaves, minimalistas
 * Cores variam baseado no estado (ativa/concluída/bloqueada)
 */
export function SkillEdge({ fromX, fromY, toX, toY, isActive = false, isCompleted = false }: SkillEdgeProps) {
  // Linha direta e suave (mais orgânica, menos rígida)
  const path = `M ${fromX} ${fromY} L ${toX} ${toY}`;
  
  // Cor baseada no estado (ajustado para fundo escuro)
  const getStrokeColor = () => {
    if (isCompleted) {
      return '#7aff7a'; // Verde brilhante para conexões concluídas
    } else if (isActive) {
      return '#ffffff'; // Branco para conexões ativas
    } else {
      return '#555555'; // Cinza médio para conexões bloqueadas
    }
  };

  const strokeColor = getStrokeColor();
  const strokeWidth = isCompleted || isActive ? 3 : 2; // Linhas mais grossas
  const opacity = isCompleted || isActive ? 1 : 0.5; // Mais opaco

  return (
    <line
      x1={fromX}
      y1={fromY}
      x2={toX}
      y2={toY}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      opacity={opacity}
      style={{
        transition: 'all 0.3s ease',
      }}
    />
  );
}

