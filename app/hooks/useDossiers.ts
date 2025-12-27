import { useState, useEffect, useCallback } from 'react';

export interface Dossier {
  id: string;
  title: string;
  content: string;
  description?: string; // Descrição curta opcional (1 linha)
  pinned?: boolean; // Dossiê fixado no topo
  itemCount?: number; // Quantidade de itens no dossiê (eventos, pessoas, lugares, etc.)
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'pixel-life-dossiers-v2';

export function useDossiers() {
  const [dossiers, setDossiers] = useState<Dossier[]>([]);

  // Dossiês pré-prontos (templates)
  const getDefaultDossiers = useCallback((): Dossier[] => {
    const now = new Date().toISOString();
    return [
      {
        id: `template-${Date.now()}-1`,
        title: '💼 Carreira',
        content: 'Aqui você pode guardar:\n- Currículo\n- Portfólio\n- Feedbacks formais\n- Contratos\n- Metas profissionais',
        description: 'Trabalho e projetos',
        pinned: true,
        itemCount: 0,
        createdAt: now,
        updatedAt: now,
      },
    ];
  }, []);

  // Carregar do localStorage com migração e criação de templates
  useEffect(() => {
    try {
      // Tentar carregar versão nova
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // Migração: remover dossiês pré-prontos antigos (exceto Carreira)
        const dossiesParaRemover = [
          '🏥 Prontuário Médico',
          '🎓 Vida Acadêmica',
          '📚 Biblioteca Pessoal',
          '🧩 Inventário da Mente'
        ];
        
        const filtered = parsed.filter((d: Dossier) => {
          // Manter apenas se não for um dos dossiês a remover
          return !dossiesParaRemover.includes(d.title);
        });
        
        // Se houve remoção, salvar a lista filtrada
        if (filtered.length !== parsed.length) {
          setDossiers(filtered);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        } else {
          setDossiers(parsed);
        }
      } else {
        // Migrar da versão antiga se existir
        const oldStored = localStorage.getItem('pixel-life-dossiers-v1');
        if (oldStored) {
          const oldParsed = JSON.parse(oldStored);
          // Migrar dados antigos para novo formato
          const migrated = oldParsed.map((d: any) => ({
            ...d,
            pinned: false,
            itemCount: 0,
            description: undefined,
          }));
          
          // Remover dossiês pré-prontos antigos (exceto Carreira)
          const dossiesParaRemover = [
            '🏥 Prontuário Médico',
            '🎓 Vida Acadêmica',
            '📚 Biblioteca Pessoal',
            '🧩 Inventário da Mente'
          ];
          const filtered = migrated.filter((d: Dossier) => !dossiesParaRemover.includes(d.title));
          
          setDossiers(filtered);
          // Salvar na nova versão
          localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
          // Remover versão antiga
          localStorage.removeItem('pixel-life-dossiers-v1');
        } else {
          // Primeira vez: criar dossiês pré-prontos
          const defaultDossiers = getDefaultDossiers();
          setDossiers(defaultDossiers);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultDossiers));
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dossiês:', error);
    }
  }, [getDefaultDossiers]);

  // Salvar no localStorage
  const saveDossiers = useCallback((newDossiers: Dossier[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newDossiers));
      setDossiers(newDossiers);
    } catch (error) {
      console.error('Erro ao salvar dossiês:', error);
    }
  }, []);

  // Adicionar dossiê
  const addDossier = useCallback((dossier: Omit<Dossier, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newDossier: Dossier = {
      ...dossier,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };
    const newDossiers = [...dossiers, newDossier];
    // Ordenar: fixados primeiro, depois por data de atualização (mais recente primeiro)
    newDossiers.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
    saveDossiers(newDossiers);
  }, [dossiers, saveDossiers]);

  // Atualizar dossiê
  const updateDossier = useCallback((id: string, updates: Partial<Omit<Dossier, 'id' | 'createdAt'>>) => {
    const newDossiers = dossiers.map(dossier => 
      dossier.id === id 
        ? { ...dossier, ...updates, updatedAt: new Date().toISOString() }
        : dossier
    );
    // Reordenar após atualização: fixados primeiro, depois por data
    newDossiers.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
    saveDossiers(newDossiers);
  }, [dossiers, saveDossiers]);

  // Remover dossiê
  const removeDossier = useCallback((id: string) => {
    const newDossiers = dossiers.filter(dossier => dossier.id !== id);
    saveDossiers(newDossiers);
  }, [dossiers, saveDossiers]);

  // Obter todos os dossiês
  const getAllDossiers = useCallback(() => dossiers, [dossiers]);

  // Obter dossiê por ID
  const getDossier = useCallback((id: string) => {
    return dossiers.find(d => d.id === id);
  }, [dossiers]);

  // Alternar fixação de dossiê
  const togglePin = useCallback((id: string) => {
    const newDossiers = dossiers.map(dossier => 
      dossier.id === id 
        ? { ...dossier, pinned: !dossier.pinned, updatedAt: new Date().toISOString() }
        : dossier
    );
    // Reordenar: fixados primeiro
    newDossiers.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
    saveDossiers(newDossiers);
  }, [dossiers, saveDossiers]);

  return {
    dossiers,
    addDossier,
    updateDossier,
    removeDossier,
    getAllDossiers,
    getDossier,
    togglePin,
  };
}

