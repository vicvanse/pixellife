'use client';

import type { Guide, GuideNode, NodeState } from '../../types/guides';
import { SkillTreeContainer } from './SkillTreeContainer';

interface BehaviorTreeProps {
  guide: Guide;
  nodes: GuideNode[];
  getNodeState: (nodeId: string) => NodeState;
  onNodeClick?: (node: GuideNode) => void;
}

/**
 * Componente BehaviorTree - wrapper para SkillTreeContainer
 * Mantém compatibilidade com código existente enquanto usa a nova implementação
 */
export function BehaviorTree({ guide, nodes, getNodeState, onNodeClick }: BehaviorTreeProps) {
  return (
    <SkillTreeContainer
      guide={guide}
      nodes={nodes}
      getNodeState={getNodeState}
      onNodeClick={onNodeClick}
    />
  );
}

