"use client";

import { useState, useEffect, useCallback } from 'react';

export interface JournalDossierLink {
  id: string;
  journalDate: string; // Data da entrada do diário (YYYY-MM-DD)
  dossierId: string; // ID do dossiê
  createdAt: string; // Quando foi criado o link
}

const STORAGE_KEY = 'pixel-life-journal-dossier-links-v1';

export function useJournalDossierLinks() {
  const [links, setLinks] = useState<JournalDossierLink[]>([]);

  // Carregar do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setLinks(parsed);
      }
    } catch (error) {
      console.error('Erro ao carregar links diário-dossiê:', error);
    }
  }, []);

  // Salvar no localStorage
  const saveLinks = useCallback((newLinks: JournalDossierLink[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newLinks));
      setLinks(newLinks);
    } catch (error) {
      console.error('Erro ao salvar links diário-dossiê:', error);
    }
  }, []);

  // Vincular entrada do diário a um dossiê
  const linkJournalToDossier = useCallback((journalDate: string, dossierId: string) => {
    // Verificar se já existe o link
    const exists = links.some(
      link => link.journalDate === journalDate && link.dossierId === dossierId
    );
    
    if (exists) {
      return; // Já existe, não duplicar
    }

    const newLink: JournalDossierLink = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      journalDate,
      dossierId,
      createdAt: new Date().toISOString(),
    };

    saveLinks([...links, newLink]);
  }, [links, saveLinks]);

  // Desvincular entrada do diário de um dossiê
  const unlinkJournalFromDossier = useCallback((journalDate: string, dossierId: string) => {
    const newLinks = links.filter(
      link => !(link.journalDate === journalDate && link.dossierId === dossierId)
    );
    saveLinks(newLinks);
  }, [links, saveLinks]);

  // Obter todos os dossiês vinculados a uma entrada do diário
  const getDossiersForJournal = useCallback((journalDate: string): string[] => {
    return links
      .filter(link => link.journalDate === journalDate)
      .map(link => link.dossierId);
  }, [links]);

  // Obter todas as entradas do diário vinculadas a um dossiê
  const getJournalsForDossier = useCallback((dossierId: string): JournalDossierLink[] => {
    return links
      .filter(link => link.dossierId === dossierId)
      .sort((a, b) => b.journalDate.localeCompare(a.journalDate)); // Mais recente primeiro
  }, [links]);

  // Verificar se uma entrada está vinculada a um dossiê
  const isLinked = useCallback((journalDate: string, dossierId: string): boolean => {
    return links.some(
      link => link.journalDate === journalDate && link.dossierId === dossierId
    );
  }, [links]);

  // Remover todos os links de uma entrada do diário
  const removeAllLinksForJournal = useCallback((journalDate: string) => {
    const newLinks = links.filter(link => link.journalDate !== journalDate);
    saveLinks(newLinks);
  }, [links, saveLinks]);

  // Remover todos os links de um dossiê
  const removeAllLinksForDossier = useCallback((dossierId: string) => {
    const newLinks = links.filter(link => link.dossierId !== dossierId);
    saveLinks(newLinks);
  }, [links, saveLinks]);

  return {
    links,
    linkJournalToDossier,
    unlinkJournalFromDossier,
    getDossiersForJournal,
    getJournalsForDossier,
    isLinked,
    removeAllLinksForJournal,
    removeAllLinksForDossier,
  };
}










