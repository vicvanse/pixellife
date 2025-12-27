import { useState, useEffect, useCallback } from 'react';

export type AboutItemCategory = 'books' | 'albums' | 'films' | 'ideas' | 'authors' | 'places';

export interface AboutItem {
  id: string;
  category: AboutItemCategory;
  label: string;
  externalId?: string;
  externalSource?: 'spotify' | 'google_books' | 'tmdb';
  coverImage?: string;
  personalNote?: string; // Nota pessoal opcional
  addedYear?: number; // Ano em que foi adicionado como favorito
  metadata?: {
    author?: string;
    year?: number;
    genre?: string;
    city?: string; // Para lugares
    country?: string; // Para lugares
    [key: string]: any;
  };
}

const STORAGE_KEY = 'pixel-life-about-items-v1';

export function useAboutItems() {
  const [items, setItems] = useState<AboutItem[]>([]);

  // Carregar do localStorage
  useEffect(() => {
    const loadItems = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setItems(parsed);
        }
      } catch (error) {
        console.error('Erro ao carregar itens sobre mim:', error);
      }
    };
    
    loadItems();
    
    // Escutar mudanças no localStorage e eventos customizados
    if (typeof window !== 'undefined') {
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === STORAGE_KEY) {
          loadItems();
        }
      };
      
      const handleCustomChange = () => {
        loadItems();
      };
      
      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('pixel-life-about-items-change', handleCustomChange);
      
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('pixel-life-about-items-change', handleCustomChange);
      };
    }
  }, []);

  // Salvar no localStorage
  const saveItems = useCallback((newItems: AboutItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
      setItems(newItems);
      // Disparar evento para sincronizar entre componentes
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('pixel-life-about-items-change'));
      }
    } catch (error) {
      console.error('Erro ao salvar itens sobre mim:', error);
    }
  }, []);

  // Obter todos os itens
  const getAllItems = useCallback(() => items, [items]);

  // Obter itens por categoria
  const getItemsByCategory = useCallback((category: AboutItemCategory) => {
    return items.filter(item => item.category === category);
  }, [items]);

  // Adicionar item
  const addItem = useCallback((item: Omit<AboutItem, 'id'>) => {
    setItems(currentItems => {
      const newItem: AboutItem = {
        ...item,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };
      const newItems = [...currentItems, newItem];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('pixel-life-about-items-change'));
        }
      } catch (error) {
        console.error('Erro ao salvar itens sobre mim:', error);
      }
      return newItems;
    });
  }, []);

  // Atualizar item
  const updateItem = useCallback((id: string, updates: Partial<AboutItem>) => {
    setItems(currentItems => {
      const newItems = currentItems.map(item => 
        item.id === id ? { ...item, ...updates } : item
      );
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('pixel-life-about-items-change'));
        }
      } catch (error) {
        console.error('Erro ao salvar itens sobre mim:', error);
      }
      return newItems;
    });
  }, []);

  // Remover item
  const removeItem = useCallback((id: string) => {
    setItems(currentItems => {
      const newItems = currentItems.filter(item => item.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('pixel-life-about-items-change'));
        }
      } catch (error) {
        console.error('Erro ao salvar itens sobre mim:', error);
      }
      return newItems;
    });
  }, []);

  return {
    items,
    addItem,
    updateItem,
    removeItem,
    getItemsByCategory,
    getAllItems,
  };
}

// Mapeamento de categorias para labels
export const ABOUT_CATEGORIES: Record<AboutItemCategory, { label: string; emoji: string }> = {
  books: { label: 'Livros', emoji: '📚' },
  albums: { label: 'Álbuns', emoji: '🎵' },
  films: { label: 'Filmes', emoji: '🎬' },
  ideas: { label: 'Ideias', emoji: '💡' },
  authors: { label: 'Autores', emoji: '✍️' },
  places: { label: 'Lugares', emoji: '📍' },
};

