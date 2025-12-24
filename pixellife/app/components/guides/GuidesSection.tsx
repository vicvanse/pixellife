'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGuides } from '../../hooks/useGuides';
import { initializeOfficialGuides } from '../../lib/officialGuides';
import { GuidesOverview } from './GuidesOverview';

export function GuidesSection() {
  const { user } = useAuth();
  const { guides, nodes, saveGuides, saveNodes } = useGuides();
  const hasInitializedRef = useRef<Record<string, boolean>>({});
  const isInitializingRef = useRef(false);

  // Inicializar guias oficiais se ainda não existirem (apenas quando usuário estiver disponível)
  useEffect(() => {
    if (!user?.id) {
      // Resetar quando não houver usuário
      hasInitializedRef.current = {};
      isInitializingRef.current = false;
      return;
    }

    // Evitar múltiplas inicializações simultâneas
    if (isInitializingRef.current) return;
    
    // Verificar se já inicializamos para este usuário
    if (hasInitializedRef.current[user.id]) return;
    
    const officialGuides = guides.filter(g => g.isOfficial);
    
    // Se não há guias oficiais, inicializar
    if (officialGuides.length === 0) {
      isInitializingRef.current = true;
      
      // Usar setTimeout para garantir que os dados foram carregados do localStorage
      const timer = setTimeout(() => {
        const { guides: officialGuidesData, nodes: officialNodesData } = initializeOfficialGuides();
        
        // Adicionar apenas os guias oficiais que ainda não existem
        const existingGuideIds = new Set(guides.map(g => g.id));
        const newGuides = officialGuidesData.filter(g => !existingGuideIds.has(g.id));
        
        // Adicionar apenas os nós que ainda não existem
        const existingNodeIds = new Set(nodes.map(n => n.id));
        const newNodes = officialNodesData.filter(n => !existingNodeIds.has(n.id));
        
        if (newGuides.length > 0 || newNodes.length > 0) {
          saveGuides([...guides, ...newGuides]);
          saveNodes([...nodes, ...newNodes]);
        }
        
        hasInitializedRef.current[user.id] = true;
        isInitializingRef.current = false;
      }, 500); // Aumentado para 500ms para dar mais tempo para o localStorage carregar

      return () => clearTimeout(timer);
    } else {
      hasInitializedRef.current[user.id] = true;
    }
  }, [user?.id]); // Removido guides, nodes, saveGuides, saveNodes das dependências para evitar loops

  return <GuidesOverview />;
}

