'use client';

import { useState } from 'react';
import type { GuideNode, NodeState } from '../../types/guides';

interface SkillNodeProps {
  node: GuideNode;
  state: NodeState;
  x: number;
  y: number;
  isActive?: boolean; // Se este nó está atualmente selecionado/ativo
  onNodeClick?: (node: GuideNode) => void;
}

/**
 * Componente de nó da skill tree
 * Representa um comportamento específico na árvore visual
 * 
 * Estados visuais:
 * - Ativo/Atual (available/in_progress): Preenchimento branco, borda preta, ícone preto, leve destaque
 * - Concluído (integrated): Preenchimento verde, ícone branco/verde escuro, borda verde
 * - Bloqueado (locked): Preenchimento transparente/preto, ícone cinza escuro, borda preta
 */
export function SkillNode({ node, state, x, y, isActive = false, onNodeClick }: SkillNodeProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Determinar estado visual baseado no NodeState e se está ativo
  const isCompleted = state === 'integrated';
  const isLocked = state === 'locked';
  
  // Se o nó está ativo (selecionado), ele fica verde independente do estado
  const isNodeActive = isActive;

  // Estilos baseados no estado
  const getNodeStyles = () => {
    if (isNodeActive) {
      // Nó ativo/selecionado: verde (mesmo verde dos hábitos concluídos)
      return {
        fill: '#7aff7a',
        stroke: '#0f9d58',
        iconColor: '#0f9d58',
        shadow: '0 2px 8px rgba(122, 255, 122, 0.3)',
      };
    } else if (isCompleted) {
      // Concluído: verde claro
      return {
        fill: '#7aff7a',
        stroke: '#0f9d58',
        iconColor: '#0f9d58',
        shadow: '0 2px 8px rgba(122, 255, 122, 0.3)',
      };
    } else {
      // Inativo/Bloqueado: cinza
      return {
        fill: '#e5e5e5',
        stroke: '#999999',
        iconColor: '#666666',
        shadow: 'none',
      };
    }
  };

  const styles = getNodeStyles();
  
  // Determinar qual ícone usar baseado no status
  const getIconSrc = () => {
    // Se o nó tem ícones definidos, usa-os baseado no status
    if (node.icon) {
      const isActiveOrCompleted = isNodeActive || isCompleted;
      return isActiveOrCompleted ? node.icon.active : node.icon.inactive;
    }
    // Fallback: usa ícones padrão se não houver ícones definidos
    return (isNodeActive || isCompleted) ? '/icon2.1.png' : '/icon2.2.png';
  };

  const iconSrc = getIconSrc();
  
  // Tamanho do losango varia baseado se está ativo (precisa mostrar descrição)
  const DIAMOND_SIZE = isNodeActive ? 120 : 80; // Maior quando ativo para acomodar texto
  const DIAMOND_WIDTH = isNodeActive ? 180 : 120;
  const DIAMOND_HEIGHT = isNodeActive ? 140 : 100;

  const handleClick = () => {
    if (isLocked) return;
    if (onNodeClick) {
      onNodeClick(node);
    }
  };

  // Coordenadas do losango (diamante) - formato retangular alongado
  const diamondPoints = [
    `${0},${-DIAMOND_HEIGHT / 2}`,      // topo
    `${DIAMOND_WIDTH / 2},${0}`,         // direita
    `${0},${DIAMOND_HEIGHT / 2}`,        // baixo
    `${-DIAMOND_WIDTH / 2},${0}`,        // esquerda
  ].join(' ');

  return (
    <g
      transform={`translate(${x}, ${y})`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ cursor: isLocked ? 'not-allowed' : 'pointer' }}
    >
      {/* Ícone (se definido) - renderizado antes do losango para ficar atrás */}
      {node.icon && (
        <image
          href={iconSrc}
          x={-24}
          y={-DIAMOND_HEIGHT / 2 - 30}
          width={48}
          height={48}
          style={{
            opacity: isLocked ? 0.5 : 1,
            imageRendering: 'pixelated',
            filter: isLocked ? 'grayscale(100%) brightness(0.7)' : 'none',
            zIndex: 10,
          }}
        />
      )}

      {/* Losango (diamante) do nó */}
      <polygon
        points={diamondPoints}
        fill={styles.fill}
        stroke={styles.stroke}
        strokeWidth={isHovered && !isLocked ? 3 : 2}
        style={{
          filter: styles.shadow ? `drop-shadow(${styles.shadow})` : 'none',
          transition: 'all 0.3s ease',
          opacity: isLocked ? 0.6 : 1,
        }}
        onClick={handleClick}
      />

      {/* Texto DENTRO do losango */}
      <foreignObject 
        x={-DIAMOND_WIDTH / 2 + 8} 
        y={-DIAMOND_HEIGHT / 2 + 8} 
        width={DIAMOND_WIDTH - 16} 
        height={DIAMOND_HEIGHT - 16} 
        xmlns="http://www.w3.org/1999/xhtml"
      >
        <div
          style={{
            fontFamily: 'Pixel Operator, monospace',
            fontSize: isNodeActive ? '14px' : '14px',
            color: isLocked ? '#999' : (isNodeActive ? '#0f9d58' : '#eeeeee'),
            fontWeight: '600',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            pointerEvents: 'none',
            userSelect: 'none',
            lineHeight: '1.4',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            opacity: isLocked ? 0.7 : 1,
            textShadow: '2px 2px 0px #000000', // Borda preta para leitura
          }}
        >
          {/* Título - sempre visível */}
          <div style={{ 
            fontWeight: '700',
            marginBottom: isNodeActive ? '6px' : '0',
            fontSize: isNodeActive ? '14px' : '14px',
            maxWidth: '120px',
          }}>
            {node.title}
          </div>
          
          {/* Descrição - apenas quando ativo */}
          {isNodeActive && (
            <div style={{
              fontSize: '11px',
              color: '#cccccc',
              fontWeight: '400',
              lineHeight: '1.5',
              marginTop: '4px',
              maxWidth: '160px',
            }}>
              {node.description}
            </div>
          )}
        </div>
      </foreignObject>
    </g>
  );
}

