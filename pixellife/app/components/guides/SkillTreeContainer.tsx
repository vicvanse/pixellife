'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import type { Guide, GuideNode, NodeState } from '../../types/guides';
import { SkillNode } from './SkillNode';
import { SkillEdge } from './SkillEdge';

interface SkillTreeContainerProps {
  guide: Guide;
  nodes: GuideNode[];
  getNodeState: (nodeId: string) => NodeState;
  onNodeClick?: (node: GuideNode) => void;
}

/**
 * Container principal da skill tree
 * 
 * Layout:
 * - Fundo claro (off-white/cinza muito claro) - estilo whiteboard
 * - Árvore horizontal ou levemente radial
 * - Responsivo para desktop e mobile
 * - Suporte futuro para zoom/pan
 */
export function SkillTreeContainer({ 
  guide, 
  nodes, 
  getNodeState, 
  onNodeClick 
}: SkillTreeContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

  // Ajustar tamanho do container ao redimensionar
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({
          width: Math.max(800, rect.width - 40),
          height: Math.max(600, rect.height - 40),
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Organizar nós em estrutura de árvore e calcular posições
  const treeLayout = useMemo(() => {
    const nodeMap = new Map<string, GuideNode>();
    const childrenMap = new Map<string, GuideNode[]>();
    
    // Criar mapas
    nodes.forEach(node => {
      nodeMap.set(node.id, node);
      const parentKey = node.parentNodeId || 'root';
      if (!childrenMap.has(parentKey)) {
        childrenMap.set(parentKey, []);
      }
      childrenMap.get(parentKey)?.push(node);
    });

    // Encontrar nó raiz
    const rootNodeId = guide.initialNodeId || nodes.find(n => !n.parentNodeId)?.id;
    if (!rootNodeId) return { nodePositions: [], edges: [], width: 0, height: 0 };

    // Layout mais orgânico e flexível
    const BASE_NODE_WIDTH = 120;
    const BASE_NODE_HEIGHT = 100;
    const ACTIVE_NODE_WIDTH = 180;
    const ACTIVE_NODE_HEIGHT = 140;
    
    // Espaçamento orgânico
    const MIN_SPACING = 180; // Espaçamento mínimo entre nós
    const START_X = 150;
    const START_Y = 150;

    interface NodePosition {
      id: string;
      x: number;
      y: number;
      node: GuideNode;
    }

    const nodePositions: NodePosition[] = [];
    const edges: Array<{ from: { x: number; y: number }; to: { x: number; y: number }; fromState: NodeState; toState: NodeState }> = [];

    // Função recursiva para calcular posições (layout mais orgânico/radial)
    const calculateLayout = (
      nodeId: string,
      level: number,
      angle: number, // Ângulo radial para posicionamento
      radius: number, // Distância do centro
      centerX: number,
      centerY: number,
      parentX?: number,
      parentY?: number
    ): { maxRadius: number; nodeX: number; nodeY: number } => {
      const node = nodeMap.get(nodeId);
      if (!node) return { maxRadius: radius, nodeX: centerX, nodeY: centerY };

      const children = childrenMap.get(nodeId) || [];
      
      // Calcular posição usando coordenadas polares (mais orgânico)
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      // Adicionar posição do nó
      nodePositions.push({
        id: nodeId,
        x,
        y,
        node,
      });

      // Adicionar conexão com o pai (linha direta, mais orgânica)
      if (parentX !== undefined && parentY !== undefined) {
        const fromState = getNodeState(node.parentNodeId || '');
        const toState = getNodeState(nodeId);
        edges.push({
          from: { x: parentX, y: parentY },
          to: { x, y },
          fromState,
          toState,
        });
      }

      // Calcular posições dos filhos em arco
      let maxRadius = radius;
      if (children.length > 0) {
        const childRadius = radius + MIN_SPACING;
        const angleStep = (Math.PI * 1.5) / (children.length + 1); // Arco de 270 graus
        const startAngle = angle - (Math.PI * 0.75); // Começar à esquerda
        
        children.forEach((child, index) => {
          const childAngle = startAngle + (angleStep * (index + 1));
          const childResult = calculateLayout(
            child.id,
            level + 1,
            childAngle,
            childRadius,
            centerX,
            centerY,
            x,
            y
          );
          maxRadius = Math.max(maxRadius, childResult.maxRadius);
        });
      }

      return {
        maxRadius,
        nodeX: x,
        nodeY: y,
      };
    };

    // Calcular layout radial a partir do nó raiz (posição central)
    const centerX = START_X + 400;
    const centerY = START_Y + 300;
    const rootResult = calculateLayout(rootNodeId, 0, -Math.PI / 2, 0, centerX, centerY); // Começar no topo (ângulo -90°)

    // Calcular dimensões totais baseadas no raio máximo
    const padding = 100;
    const totalRadius = rootResult.maxRadius + ACTIVE_NODE_HEIGHT / 2 + padding;
    const width = centerX + totalRadius + padding;
    const height = centerY + totalRadius + padding;

    return {
      nodePositions,
      edges,
      width: Math.max(width, 1000),
      height: Math.max(height, 600),
    };
  }, [nodes, guide.initialNodeId, getNodeState]);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-auto"
      style={{
        backgroundColor: '#111111', // Fundo escuro para contraste
        minHeight: '500px',
        borderRadius: '8px',
        border: '1px solid #333',
        padding: '40px',
        color: '#ffffff',
      }}
    >
      <svg
        width={Math.max(treeLayout.width, containerSize.width)}
        height={Math.max(treeLayout.height, containerSize.height)}
        style={{
          display: 'block',
        }}
      >
        {/* Linhas de conexão (renderizadas primeiro, atrás dos nós) */}
        {treeLayout.edges.map((edge, index) => {
          const isActive = edge.fromState !== 'locked' && edge.toState !== 'locked';
          const isCompleted = edge.fromState === 'integrated' || edge.toState === 'integrated';
          
          return (
            <SkillEdge
              key={`edge-${index}`}
              fromX={edge.from.x}
              fromY={edge.from.y}
              toX={edge.to.x}
              toY={edge.to.y}
              isActive={isActive}
              isCompleted={isCompleted}
            />
          );
        })}

        {/* Nós (renderizados por cima das linhas) */}
        {treeLayout.nodePositions.map(({ id, x, y, node }) => {
          const state = getNodeState(id);
          const isActive = activeNodeId === id;
          
          const handleNodeClick = (clickedNode: GuideNode) => {
            // Se clicar no mesmo nó, desativa; caso contrário, ativa o novo
            if (activeNodeId === clickedNode.id) {
              setActiveNodeId(null);
            } else {
              setActiveNodeId(clickedNode.id);
            }
            // Chamar callback original se existir
            if (onNodeClick) {
              onNodeClick(clickedNode);
            }
          };
          
          return (
            <SkillNode
              key={id}
              node={node}
              state={state}
              x={x}
              y={y}
              isActive={isActive}
              onNodeClick={handleNodeClick}
            />
          );
        })}
      </svg>
    </div>
  );
}

