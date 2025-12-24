'use client';

import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import type { GuideNode, NodeState } from '../../types/guides';

interface GuideNodeComponentProps {
  node: GuideNode;
  state: NodeState;
  onStateChange: (newState: NodeState) => void;
}

const STATE_COLORS: Record<NodeState, string> = {
  locked: '#e5e5e5',
  available: '#6daffe',
  in_progress: '#ffa500',
  integrated: '#7aff7a',
  abandoned: '#999',
};

export function GuideNodeComponent({ node, state, onStateChange }: GuideNodeComponentProps) {
  const { tString } = useLanguage();
  
  const STATE_LABELS: Record<NodeState, string> = {
    locked: tString('guides.nodeStateLocked'),
    available: tString('guides.nodeStateAvailable'),
    in_progress: tString('guides.nodeStateInProgress'),
    integrated: tString('guides.nodeStateIntegrated'),
    abandoned: tString('guides.nodeStateAbandoned'),
  };

  const TYPE_LABELS: Record<GuideNode['type'], string> = {
    skill: tString('guides.nodeTypeSkill'),
    experience: tString('guides.nodeTypeExperience'),
    habit: tString('guides.nodeTypeHabit'),
    challenge: tString('guides.nodeTypeChallenge'),
    reflection: tString('guides.nodeTypeReflection'),
    knowledge: tString('guides.nodeTypeKnowledge'),
  };
  const [showDetails, setShowDetails] = useState(false);

  const handleStateClick = () => {
    // Ciclo de estados: locked -> available -> in_progress -> integrated
    // Ou pode voltar para abandoned
    const nextState: NodeState = 
      state === 'locked' ? 'available' :
      state === 'available' ? 'in_progress' :
      state === 'in_progress' ? 'integrated' :
      state === 'integrated' ? 'integrated' : // mantém integrado
      'available'; // abandoned volta para available

    onStateChange(nextState);
  };

  return (
    <div
      className="p-4 rounded transition-all cursor-pointer"
      style={{
        backgroundColor: state === 'locked' ? '#f5f5f5' : '#FFFFFF',
        border: `2px solid ${STATE_COLORS[state]}`,
        opacity: state === 'locked' ? 0.6 : 1,
      }}
      onClick={() => setShowDetails(!showDetails)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-pixel-bold text-base" style={{ color: '#111' }}>
              {node.title}
            </h4>
            {node.branch && (
              <span
                className="px-2 py-0.5 rounded text-xs font-pixel"
                style={{
                  backgroundColor: '#f0f0f0',
                  color: '#666',
                }}
              >
                {node.branch}
              </span>
            )}
            <span
              className="px-2 py-0.5 rounded text-xs font-pixel"
              style={{
                backgroundColor: '#f0f0f0',
                color: '#666',
              }}
            >
              {TYPE_LABELS[node.type]}
            </span>
          </div>
          {showDetails && (
            <p className="font-pixel text-sm mt-2" style={{ color: '#666' }}>
              {node.description}
            </p>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleStateClick();
          }}
          className="px-3 py-1 rounded font-pixel-bold text-xs transition-colors hover:opacity-90"
          style={{
            backgroundColor: STATE_COLORS[state],
            color: '#111',
            minWidth: '100px',
          }}
        >
          {STATE_LABELS[state]}
        </button>
      </div>
    </div>
  );
}

