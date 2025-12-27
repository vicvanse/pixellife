import { useState, useEffect, useCallback } from 'react';

export interface Attribute {
  id: string;
  label: string; // Ex: "Uso óculos", "Gosto de rock", "Sou forte"
  category?: 'physical' | 'preference' | 'skill' | 'trait' | 'other'; // Categoria opcional
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'pixel-life-attributes-v1';

export function useAttributes() {
  const [attributes, setAttributes] = useState<Attribute[]>([]);

  // Carregar do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setAttributes(parsed);
      }
    } catch (error) {
      console.error('Erro ao carregar atributos:', error);
    }
  }, []);

  // Salvar no localStorage
  const saveAttributes = useCallback((newAttributes: Attribute[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newAttributes));
      setAttributes(newAttributes);
      // Disparar evento customizado para sincronização
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("pixel-life-attributes-changed"));
      }
    } catch (error) {
      console.error('Erro ao salvar atributos:', error);
    }
  }, []);

  // Adicionar atributo
  const addAttribute = useCallback((attribute: Omit<Attribute, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newAttribute: Attribute = {
      ...attribute,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };
    const newAttributes = [...attributes, newAttribute];
    // Ordenar alfabeticamente por label
    newAttributes.sort((a, b) => a.label.localeCompare(b.label));
    saveAttributes(newAttributes);
  }, [attributes, saveAttributes]);

  // Atualizar atributo
  const updateAttribute = useCallback((id: string, updates: Partial<Omit<Attribute, 'id' | 'createdAt'>>) => {
    const newAttributes = attributes.map(attr => 
      attr.id === id 
        ? { ...attr, ...updates, updatedAt: new Date().toISOString() }
        : attr
    );
    // Reordenar após atualização
    newAttributes.sort((a, b) => a.label.localeCompare(b.label));
    saveAttributes(newAttributes);
  }, [attributes, saveAttributes]);

  // Remover atributo
  const removeAttribute = useCallback((id: string) => {
    const newAttributes = attributes.filter(attr => attr.id !== id);
    saveAttributes(newAttributes);
  }, [attributes, saveAttributes]);

  // Obter todos os atributos
  const getAllAttributes = useCallback(() => attributes, [attributes]);

  // Obter atributos por categoria
  const getAttributesByCategory = useCallback((category: Attribute['category']) => {
    if (!category) return attributes;
    return attributes.filter(attr => attr.category === category);
  }, [attributes]);

  // Obter atributo por ID
  const getAttribute = useCallback((id: string) => {
    return attributes.find(attr => attr.id === id);
  }, [attributes]);

  return {
    attributes,
    addAttribute,
    updateAttribute,
    removeAttribute,
    getAllAttributes,
    getAttributesByCategory,
    getAttribute,
  };
}










