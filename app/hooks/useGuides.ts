'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePersistentState } from './usePersistentState';
import type { Guide, GuideNode, UserGuideProgress, NodeState } from '../types/guides';

const STORAGE_PREFIX = 'pixel-life-guides-v1';

const k = (suffix: string, userId?: string) => {
  if (userId) {
    return `${STORAGE_PREFIX}:${userId}:${suffix}`;
  }
  return `${STORAGE_PREFIX}:${suffix}`;
};

function readJSON<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

function writeJSON<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function useGuides() {
  const { user } = useAuth();
  const [guides, setGuides] = useState<Guide[]>([]);
  const [nodes, setNodes] = useState<GuideNode[]>([]);
  const [userProgress, setUserProgress] = useState<UserGuideProgress[]>([]);

  // Carregar dados quando usuário mudar
  useEffect(() => {
    if (!user?.id) {
      // Limpar dados se não houver usuário
      setGuides([]);
      setNodes([]);
      setUserProgress([]);
      return;
    }

    const storedGuides = readJSON<Guide[]>(k('guides', user.id), []);
    const storedNodes = readJSON<GuideNode[]>(k('nodes', user.id), []);
    const storedProgress = readJSON<UserGuideProgress[]>(k('progress', user.id), []);
    
    setGuides(storedGuides);
    setNodes(storedNodes);
    setUserProgress(storedProgress);
  }, [user?.id]);

  // Salvar dados
  const saveGuides = useCallback((newGuides: Guide[]) => {
    if (!user?.id) return;
    setGuides(newGuides);
    writeJSON(k('guides', user.id), newGuides);
  }, [user?.id]);

  const saveNodes = useCallback((newNodes: GuideNode[]) => {
    if (!user?.id) return;
    setNodes(newNodes);
    writeJSON(k('nodes', user.id), newNodes);
  }, [user?.id]);

  const saveProgress = useCallback((newProgress: UserGuideProgress[]) => {
    if (!user?.id) return;
    setUserProgress(newProgress);
    writeJSON(k('progress', user.id), newProgress);
  }, [user?.id]);

  // Obter guias oficiais e customizados
  const getOfficialGuides = useCallback((): Guide[] => {
    return guides.filter(g => g.isOfficial);
  }, [guides]);

  const getCustomGuides = useCallback((): Guide[] => {
    return guides.filter(g => !g.isOfficial && g.userId === user?.id);
  }, [guides, user?.id]);

  // Obter nós de um guia
  const getGuideNodes = useCallback((guideId: string): GuideNode[] => {
    return nodes.filter(n => n.guideId === guideId).sort((a, b) => a.order - b.order);
  }, [nodes]);

  // Obter estado de um nó para o usuário
  const getNodeState = useCallback((nodeId: string): NodeState => {
    const progress = userProgress.find(p => p.nodeId === nodeId);
    return progress?.state || 'locked';
  }, [userProgress]);

  // Atualizar estado de um nó
  const updateNodeState = useCallback((nodeId: string, newState: NodeState, notes?: string) => {
    const existing = userProgress.find(p => p.nodeId === nodeId);
    const now = new Date().toISOString();

    let updated: UserGuideProgress[];
    if (existing) {
      updated = userProgress.map(p => 
        p.nodeId === nodeId
          ? {
              ...p,
              state: newState,
              notes: notes !== undefined ? notes : p.notes,
              startedAt: newState !== 'locked' && !p.startedAt ? now : p.startedAt,
              completedAt: newState === 'integrated' ? now : p.completedAt,
              updatedAt: now,
            }
          : p
      );
    } else {
      updated = [
        ...userProgress,
        {
          id: `${nodeId}-${Date.now()}`,
          userId: user?.id || '',
          guideId: nodes.find(n => n.id === nodeId)?.guideId || '',
          nodeId,
          state: newState,
          notes,
          startedAt: newState !== 'locked' ? now : undefined,
          completedAt: newState === 'integrated' ? now : undefined,
          createdAt: now,
          updatedAt: now,
        },
      ];
    }

    saveProgress(updated);
  }, [userProgress, user?.id, nodes, saveProgress]);

  // Criar guia customizado
  const createCustomGuide = useCallback((name: string, description: string, philosophicalNote?: string) => {
    const now = new Date().toISOString();
    const guideId = `custom-${Date.now()}`;
    
    const newGuide: Guide = {
      id: guideId,
      userId: user?.id || null,
      name,
      description,
      philosophicalNote,
      isOfficial: false,
      initialNodeId: `node-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };

    // Criar nó inicial
    const initialNode: GuideNode = {
      id: newGuide.initialNodeId,
      guideId,
      parentNodeId: null,
      title: 'Início',
      description: 'Ponto de partida do seu caminho',
      type: 'reflection',
      state: 'available',
      order: 0,
      icon: {
        active: '/icon2.1.png',
        inactive: '/icon2.2.png',
        meaning: 'início',
      },
      createdAt: now,
      updatedAt: now,
    };

    saveGuides([...guides, newGuide]);
    saveNodes([...nodes, initialNode]);
    
    return newGuide;
  }, [guides, nodes, user?.id, saveGuides, saveNodes]);

  // Adicionar nó a um guia
  const addNodeToGuide = useCallback((
    guideId: string,
    parentNodeId: string | null,
    title: string,
    description: string,
    type: GuideNode['type'],
    branch?: string
  ) => {
    const guideNodes = getGuideNodes(guideId);
    const maxOrder = guideNodes.length > 0 
      ? Math.max(...guideNodes.map(n => n.order))
      : -1;

    const newNode: GuideNode = {
      id: `node-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      guideId,
      parentNodeId,
      title,
      description,
      type,
      state: 'available',
      order: maxOrder + 1,
      branch,
      icon: {
        active: '/icon2.1.png',
        inactive: '/icon2.2.png',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveNodes([...nodes, newNode]);
    return newNode;
  }, [nodes, getGuideNodes, saveNodes]);

  // Atualizar nó existente
  const updateNode = useCallback((
    nodeId: string,
    data: {
      title?: string;
      description?: string;
      icon?: {
        active: string;
        inactive: string;
        meaning?: string;
      };
    }
  ) => {
    const updatedNodes = nodes.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          ...(data.title && { title: data.title }),
          ...(data.description && { description: data.description }),
          ...(data.icon && { icon: data.icon }),
          updatedAt: new Date().toISOString(),
        };
      }
      return node;
    });
    saveNodes(updatedNodes);
  }, [nodes, saveNodes]);

  return {
    guides,
    nodes,
    userProgress,
    getOfficialGuides,
    getCustomGuides,
    getGuideNodes,
    getNodeState,
    updateNodeState,
    createCustomGuide,
    addNodeToGuide,
    updateNode,
    saveGuides,
    saveNodes,
  };
}

