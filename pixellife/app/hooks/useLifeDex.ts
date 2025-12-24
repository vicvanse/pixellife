'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { usePersistentState } from './usePersistentState';
import { loadFromSupabase, saveToSupabase } from '@/app/lib/supabase-sync';

export interface LifeDexItem {
  id: string;
  categoryId: string;
  name: string;
  icon?: string;
  tags?: string[];
  experienced: boolean;
  dateExperienced?: string;
  rating?: number; // 1-5
  notes?: string;
  planned: boolean;
  plannedFor?: string;
  count?: number; // quantas vezes fez
  type: 'check' | 'progress' | 'list' | 'free';
  progress?: number; // 0-100, se type = 'progress'
  subItems?: Array<{ id: string; text: string; completed: boolean }>;
  createdAt: string;
  updatedAt: string;
}

export interface LifeDexCategory {
  id: string;
  userId: string;
  name: string;
  description?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FutureList {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FutureListItem {
  id: string;
  listId: string;
  text: string;
  completed: boolean;
  plannedFor?: string;
  createdAt: string;
}

const STORAGE_KEY_CATEGORIES = 'lifedex_categories';
const STORAGE_KEY_ITEMS = 'lifedex_items';
const STORAGE_KEY_FUTURE_LISTS = 'lifedex_future_lists';
const STORAGE_KEY_FUTURE_LIST_ITEMS = 'lifedex_future_list_items';

export function useLifeDex() {
  const { user } = useAuth();
  const [categories, setCategories] = usePersistentState<LifeDexCategory[]>(STORAGE_KEY_CATEGORIES, []);
  const [items, setItems] = usePersistentState<LifeDexItem[]>(STORAGE_KEY_ITEMS, []);
  const [futureLists, setFutureLists] = usePersistentState<FutureList[]>(STORAGE_KEY_FUTURE_LISTS, []);
  const [futureListItems, setFutureListItems] = usePersistentState<FutureListItem[]>(STORAGE_KEY_FUTURE_LIST_ITEMS, []);
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = useRef(false);

  // Carregar dados do Supabase quando houver usuário
  useEffect(() => {
    if (user && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadFromSupabase(user.id, 'lifedex_categories')
        .then((result) => {
          if (result.data && !result.error) {
            setCategories(result.data as LifeDexCategory[]);
          }
        })
        .catch(console.error);

      loadFromSupabase(user.id, 'lifedex_items')
        .then((result) => {
          if (result.data && !result.error) {
            setItems(result.data as LifeDexItem[]);
          }
        })
        .catch(console.error);

      loadFromSupabase(user.id, 'lifedex_future_lists')
        .then((result) => {
          if (result.data && !result.error) {
            setFutureLists(result.data as FutureList[]);
          }
        })
        .catch(console.error);

      loadFromSupabase(user.id, 'lifedex_future_list_items')
        .then((result) => {
          if (result.data && !result.error) {
            setFutureListItems(result.data as FutureListItem[]);
          }
        })
        .catch(console.error);

      setLoading(false);
    } else {
      setLoading(false);
      hasLoadedRef.current = false; // Reset quando não há usuário
    }
  }, [user?.id]); // Usar user?.id ao invés de user para evitar re-renders desnecessários

  // Salvar no Supabase
  const saveCategories = useCallback(async () => {
    if (user) {
      await saveToSupabase(user.id, 'lifedex_categories', categories);
    }
  }, [user, categories]);

  const saveItems = useCallback(async () => {
    if (user) {
      await saveToSupabase(user.id, 'lifedex_items', items);
    }
  }, [user, items]);

  const saveFutureLists = useCallback(async () => {
    if (user) {
      await saveToSupabase(user.id, 'lifedex_future_lists', futureLists);
    }
  }, [user, futureLists]);

  const saveFutureListItems = useCallback(async () => {
    if (user) {
      await saveToSupabase(user.id, 'lifedex_future_list_items', futureListItems);
    }
  }, [user, futureListItems]);

  // Categorias
  const addCategory = useCallback((category: Omit<LifeDexCategory, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCategory: LifeDexCategory = {
      ...category,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCategories((prev) => [...prev, newCategory]);
    saveCategories();
  }, [saveCategories]);

  const updateCategory = useCallback((id: string, updates: Partial<LifeDexCategory>) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, ...updates, updatedAt: new Date().toISOString() } : cat))
    );
    saveCategories();
  }, [saveCategories]);

  const deleteCategory = useCallback((id: string) => {
    setCategories((prev) => prev.filter((cat) => cat.id !== id));
    setItems((prev) => prev.filter((item) => item.categoryId !== id));
    saveCategories();
    saveItems();
  }, [saveCategories, saveItems]);

  // Itens
  const addItem = useCallback((item: Omit<LifeDexItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newItem: LifeDexItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setItems((prev) => [...prev, newItem]);
    saveItems();
  }, [saveItems]);

  const updateItem = useCallback((id: string, updates: Partial<LifeDexItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item))
    );
    saveItems();
  }, [saveItems]);

  const deleteItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    saveItems();
  }, [saveItems]);

  // Future Lists
  const addFutureList = useCallback((list: Omit<FutureList, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newList: FutureList = {
      ...list,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setFutureLists((prev) => [...prev, newList]);
    saveFutureLists();
  }, [saveFutureLists]);

  const updateFutureList = useCallback((id: string, updates: Partial<FutureList>) => {
    setFutureLists((prev) =>
      prev.map((list) => (list.id === id ? { ...list, ...updates, updatedAt: new Date().toISOString() } : list))
    );
    saveFutureLists();
  }, [saveFutureLists]);

  const deleteFutureList = useCallback((id: string) => {
    setFutureLists((prev) => prev.filter((list) => list.id !== id));
    setFutureListItems((prev) => prev.filter((item) => item.listId !== id));
    saveFutureLists();
    saveFutureListItems();
  }, [saveFutureLists, saveFutureListItems]);

  // Future List Items
  const addFutureListItem = useCallback((item: Omit<FutureListItem, 'id' | 'createdAt'>) => {
    const newItem: FutureListItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    setFutureListItems((prev) => [...prev, newItem]);
    saveFutureListItems();
  }, [saveFutureListItems]);

  const updateFutureListItem = useCallback((id: string, updates: Partial<FutureListItem>) => {
    setFutureListItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
    saveFutureListItems();
  }, [saveFutureListItems]);

  const deleteFutureListItem = useCallback((id: string) => {
    setFutureListItems((prev) => prev.filter((item) => item.id !== id));
    saveFutureListItems();
  }, [saveFutureListItems]);

  // Helpers
  const getItemsByCategory = useCallback((categoryId: string) => {
    return items.filter((item) => item.categoryId === categoryId);
  }, [items]);

  const getCategoryProgress = useCallback((categoryId: string) => {
    const categoryItems = getItemsByCategory(categoryId);
    if (categoryItems.length === 0) return { completed: 0, total: 0, percentage: 0 };

    const completed = categoryItems.filter((item) => {
      if (item.type === 'check') return item.experienced;
      if (item.type === 'progress') return item.progress === 100;
      if (item.type === 'list') {
        return item.subItems && item.subItems.length > 0 && item.subItems.every((sub) => sub.completed);
      }
      return false;
    }).length;

    return {
      completed,
      total: categoryItems.length,
      percentage: categoryItems.length > 0 ? Math.round((completed / categoryItems.length) * 100) : 0,
    };
  }, [getItemsByCategory]);

  return {
    categories,
    items,
    futureLists,
    futureListItems,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    addItem,
    updateItem,
    deleteItem,
    addFutureList,
    updateFutureList,
    deleteFutureList,
    addFutureListItem,
    updateFutureListItem,
    deleteFutureListItem,
    getItemsByCategory,
    getCategoryProgress,
  };
}

