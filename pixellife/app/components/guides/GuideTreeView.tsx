'use client';

import { useState } from 'react';
import { useGuides } from '../../hooks/useGuides';
import type { Guide, GuideNode, NodeState } from '../../types/guides';
import { BehaviorTree } from './BehaviorTree';
import { GuideNodeComponent } from './GuideNodeComponent';
import { EditNodeModal } from './EditNodeModal';

interface GuideTreeViewProps {
  guide: Guide;
}

export function GuideTreeView({ guide }: GuideTreeViewProps) {
  const { getGuideNodes, getNodeState, updateNodeState, updateNode } = useGuides();
  const nodes = getGuideNodes(guide.id);
  const [selectedNode, setSelectedNode] = useState<GuideNode | null>(null);
  const [editingNode, setEditingNode] = useState<GuideNode | null>(null);
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');

  const handleNodeClick = (node: GuideNode) => {
    const state = getNodeState(node.id);
    if (state === 'locked') return;
    setSelectedNode(node);
  };

  const handleNodeStateChange = (nodeId: string, newState: NodeState) => {
    updateNodeState(nodeId, newState);
    setSelectedNode(null);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Guia */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 
            className="font-pixel-bold text-2xl line-clamp-2" 
            style={{ color: '#111', maxWidth: '400px' }}
            title={guide.name}
          >
            {guide.name}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('tree')}
              className="px-3 py-1 rounded font-pixel text-xs transition-colors"
              style={{
                backgroundColor: viewMode === 'tree' ? '#6daffe' : '#f0f0f0',
                color: viewMode === 'tree' ? '#111' : '#666',
                border: '1px solid #e0e0e0',
              }}
            >
              Árvore
            </button>
            <button
              onClick={() => setViewMode('list')}
              className="px-3 py-1 rounded font-pixel text-xs transition-colors"
              style={{
                backgroundColor: viewMode === 'list' ? '#6daffe' : '#f0f0f0',
                color: viewMode === 'list' ? '#111' : '#666',
                border: '1px solid #e0e0e0',
              }}
            >
              Lista
            </button>
          </div>
        </div>
        <p className="font-pixel text-base mb-2" style={{ color: '#666' }}>
          {guide.description}
        </p>
        {guide.philosophicalNote && (
          <p className="font-pixel text-sm italic" style={{ color: '#999' }}>
            {guide.philosophicalNote}
          </p>
        )}
      </div>

      {/* Visualização em Árvore ou Lista */}
      {viewMode === 'tree' ? (
        <BehaviorTree
          guide={guide}
          nodes={nodes}
          getNodeState={getNodeState}
          onNodeClick={handleNodeClick}
        />
      ) : (
        <div className="space-y-8">
          {buildTree(nodes).map((node) => (
            <NodeTree
              key={node.id}
              node={node}
              allNodes={nodes}
              getChildNodes={(parentId) => getChildNodes(nodes, parentId)}
              getNodeState={getNodeState}
              onStateChange={handleNodeStateChange}
              level={0}
            />
          ))}
        </div>
      )}

      {/* Modal de detalhes do nó */}
      {selectedNode && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedNode(null)}
        >
          <div
            className="bg-white border-4 border-black p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
            style={{
              boxShadow: '8px 8px 0 0 #000',
            }}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-pixel-bold text-xl" style={{ color: '#111' }}>
                {selectedNode.title}
              </h3>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-2xl font-bold"
                style={{ color: '#111' }}
              >
                ×
              </button>
            </div>
            <p className="font-pixel text-sm mb-4" style={{ color: '#666' }}>
              {selectedNode.description}
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => {
                  setEditingNode(selectedNode);
                  setSelectedNode(null);
                }}
                className="px-3 py-1 rounded font-pixel text-xs transition-colors"
                style={{
                  backgroundColor: '#6daffe',
                  color: '#111',
                  border: '1px solid #1b5cff',
                }}
              >
                ✎ Editar
              </button>
              {(['locked', 'available', 'in_progress', 'integrated'] as NodeState[]).map((state) => {
                const currentState = getNodeState(selectedNode.id);
                if (currentState === 'locked' && state === 'locked') return null;
                return (
                  <button
                    key={state}
                    onClick={() => handleNodeStateChange(selectedNode.id, state)}
                    className="px-3 py-1 rounded font-pixel text-xs transition-colors"
                    style={{
                      backgroundColor: currentState === state ? '#6daffe' : '#f0f0f0',
                      color: currentState === state ? '#111' : '#666',
                      border: '1px solid #e0e0e0',
                    }}
                  >
                    {state === 'locked' ? 'Bloquear' : 
                     state === 'available' ? 'Disponível' :
                     state === 'in_progress' ? 'Em Progresso' : 'Integrado'}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal de edição de nó */}
      {editingNode && (
        <EditNodeModal
          isOpen={true}
          onClose={() => setEditingNode(null)}
          node={editingNode}
          onSave={(nodeId, data) => {
            updateNode(nodeId, data);
            setEditingNode(null);
          }}
        />
      )}
    </div>
  );
}

// Função auxiliar para construir árvore (modo lista)
function buildTree(nodes: GuideNode[]): GuideNode[] {
  const nodeMap = new Map<string, GuideNode>();
  const rootNodes: GuideNode[] = [];

  nodes.forEach(node => {
    nodeMap.set(node.id, node);
  });

  nodes.forEach(node => {
    if (!node.parentNodeId || !nodeMap.has(node.parentNodeId)) {
      rootNodes.push(node);
    }
  });

  return rootNodes.sort((a, b) => a.order - b.order);
}

function getChildNodes(nodes: GuideNode[], parentId: string): GuideNode[] {
  return nodes
    .filter(n => n.parentNodeId === parentId)
    .sort((a, b) => a.order - b.order);
}

interface NodeTreeProps {
  node: GuideNode;
  allNodes: GuideNode[];
  getChildNodes: (parentId: string) => GuideNode[];
  getNodeState: (nodeId: string) => NodeState;
  onStateChange: (nodeId: string, newState: NodeState) => void;
  level: number;
}

function NodeTree({ node, allNodes, getChildNodes, getNodeState, onStateChange, level }: NodeTreeProps) {
  const childNodes = getChildNodes(node.id);
  const state = getNodeState(node.id);

  return (
    <div className="relative" style={{ paddingLeft: level > 0 ? '24px' : '0' }}>
      {/* Linha conectora (se não for raiz) */}
      {level > 0 && (
        <div
          className="absolute left-0 top-0 bottom-0 w-0.5"
          style={{
            backgroundColor: '#e5e5e5',
            transform: 'translateX(-12px)',
          }}
        />
      )}

      {/* Nó */}
      <GuideNodeComponent
        node={node}
        state={state}
        onStateChange={(newState) => onStateChange(node.id, newState)}
      />

      {/* Filhos */}
      {childNodes.length > 0 && (
        <div className="mt-4 space-y-4">
          {childNodes.map((child) => (
            <NodeTree
              key={child.id}
              node={child}
              allNodes={allNodes}
              getChildNodes={getChildNodes}
              getNodeState={getNodeState}
              onStateChange={onStateChange}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

