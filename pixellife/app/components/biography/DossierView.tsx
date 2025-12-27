'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dossier } from '@/app/hooks/useDossiers';
import { useJournalDossierLinks } from '@/app/hooks/useJournalDossierLinks';
import { useJournal } from '@/app/hooks/useJournal';
import { formatDate } from '@/app/lib/utils';

interface DossierViewProps {
  dossier: Dossier;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Omit<Dossier, 'id' | 'createdAt'>>) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
}

export function DossierView({ dossier, onClose, onUpdate, onDelete, onRename }: DossierViewProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'logs'>('content');
  const [content, setContent] = useState(dossier.content || "");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(dossier.title);
  const [isSaving, setIsSaving] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastSavedContentRef = useRef<string>(dossier.content || "");
  const lastDossierIdRef = useRef<string>(dossier.id);
  
  // Garantir que as refs estão sincronizadas na montagem inicial
  useEffect(() => {
    if (lastDossierIdRef.current !== dossier.id) {
      lastSavedContentRef.current = dossier.content || "";
      lastDossierIdRef.current = dossier.id;
    }
  }, []);
  
  const { getJournalsForDossier } = useJournalDossierLinks();
  const { getEntry } = useJournal();
  
  // Obter entradas do diário vinculadas a este dossiê
  const journalLinks = getJournalsForDossier(dossier.id);

  // Carregar conteúdo quando o dossiê muda (ID diferente)
  useEffect(() => {
    // Se mudou o dossiê (ID diferente), carregar novo conteúdo
    if (dossier.id !== lastDossierIdRef.current) {
      setContent(dossier.content || "");
      setTitle(dossier.title);
      lastSavedContentRef.current = dossier.content || "";
      lastDossierIdRef.current = dossier.id;
      setIsFocused(false);
    }
    // Não atualizar o estado local quando o conteúdo muda externamente
    // O auto-save já gerencia a sincronização através do lastSavedContentRef
  }, [dossier.id, dossier.content, dossier.title]);

  // Função para salvar conteúdo (reutilizável)
  const saveContent = useCallback((immediate = false) => {
    const currentContent = content;
    
    // Não salvar se o conteúdo não mudou em relação ao último salvo
    if (currentContent === lastSavedContentRef.current) {
      setIsSaving(false);
      return;
    }

    // Não salvar se o conteúdo está vazio e o salvo também está vazio
    if (!currentContent.trim() && !lastSavedContentRef.current.trim()) {
      setIsSaving(false);
      return;
    }

    // Se for imediato, cancelar qualquer timeout pendente e salvar agora
    if (immediate) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      const trimmedContent = currentContent.trim();
      onUpdate(dossier.id, { content: trimmedContent });
      lastSavedContentRef.current = trimmedContent;
      setIsSaving(false);
      return;
    }

    // Caso contrário, usar debounce
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setIsSaving(true);
    saveTimeoutRef.current = setTimeout(() => {
      const trimmedContent = currentContent.trim();
      onUpdate(dossier.id, { content: trimmedContent });
      lastSavedContentRef.current = trimmedContent;
      setIsSaving(false);
    }, 1000);
  }, [content, dossier.id, onUpdate]);

  // Auto-save do conteúdo com debounce
  useEffect(() => {
    // Não salvar se o conteúdo não mudou em relação ao último salvo
    if (content === lastSavedContentRef.current) {
      setIsSaving(false);
      return;
    }

    // Não salvar se o conteúdo está vazio e o salvo também está vazio
    if (!content.trim() && !lastSavedContentRef.current.trim()) {
      setIsSaving(false);
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setIsSaving(true);
    saveTimeoutRef.current = setTimeout(() => {
      const trimmedContent = content.trim();
      onUpdate(dossier.id, { content: trimmedContent });
      lastSavedContentRef.current = trimmedContent;
      setIsSaving(false);
    }, 1000);

    return () => {
      // Ao desmontar, salvar imediatamente se houver mudanças pendentes
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      // Usar refs para pegar valores atuais no momento do cleanup
      const currentContent = content;
      if (currentContent !== lastSavedContentRef.current) {
        const trimmedContent = currentContent.trim();
        if (trimmedContent !== lastSavedContentRef.current) {
          onUpdate(dossier.id, { content: trimmedContent });
          lastSavedContentRef.current = trimmedContent;
        }
      }
    };
  }, [content, dossier.id, onUpdate]);

  // Salvar título quando sair do modo de edição
  const handleTitleBlur = () => {
    if (title.trim() && title !== dossier.title) {
      onRename(dossier.id, title.trim());
    } else {
      setTitle(dossier.title); // Reverter se vazio
    }
    setIsEditingTitle(false);
  };

  // Salvar título ao pressionar Enter
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleBlur();
    }
    if (e.key === 'Escape') {
      setTitle(dossier.title);
      setIsEditingTitle(false);
    }
  };

  // Resetar isFocused quando fechar ou mudar de dossiê
  useEffect(() => {
    setIsFocused(false);
  }, [dossier.id]);

  return (
    <div className="w-full">
      {/* Header com título e ações */}
      <div className="mb-6 pb-4 border-b" style={{ borderColor: '#e0e0e0' }}>
        <div className="flex items-center justify-between mb-4">
          {isEditingTitle ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              className="flex-1 px-3 py-2 rounded font-pixel-bold focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{
                fontSize: '20px',
                backgroundColor: '#fff',
                border: '2px solid #6daffe',
                color: '#111',
              }}
              autoFocus
            />
          ) : (
            <h2 
              className="font-pixel-bold flex-1 cursor-pointer"
              style={{ 
                color: '#111', 
                fontSize: '20px',
                lineHeight: '1.3',
              }}
              onClick={() => setIsEditingTitle(true)}
              title="Clique para renomear"
            >
              {dossier.title}
            </h2>
          )}
          
          <div className="flex gap-2 ml-4">
            <button
              onClick={() => setIsEditingTitle(true)}
              className="px-3 py-1 rounded font-pixel text-sm transition-colors hover:opacity-90"
              style={{
                backgroundColor: '#f5f5f5',
                border: '1px solid #d4d4d4',
                color: '#555',
              }}
              title="Renomear"
            >
              Renomear
            </button>
            <button
              onClick={() => {
                if (confirm(`Tem certeza que deseja excluir "${dossier.title}"?`)) {
                  onDelete(dossier.id);
                  onClose();
                }
              }}
              className="px-3 py-1 rounded font-pixel text-sm transition-colors hover:opacity-90"
              style={{
                backgroundColor: '#f5f5f5',
                border: '1px solid #d4d4d4',
                color: '#f44336',
              }}
              title="Excluir"
            >
              Excluir
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1 rounded font-pixel text-sm transition-colors hover:opacity-90"
              style={{
                backgroundColor: '#6daffe',
                border: '1px solid #1b5cff',
                color: '#fff',
              }}
              title="Fechar"
            >
              Fechar
            </button>
          </div>
        </div>

        {/* Status de salvamento */}
        {isSaving && (
          <p className="font-pixel text-sm" style={{ color: '#666' }}>
            Salvando...
          </p>
        )}
      </div>

      {/* Abas */}
      <div className="mb-4 border-b-2 border-black">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('content')}
            className="px-4 py-2 font-pixel-bold text-sm transition-colors"
            style={{
              backgroundColor: activeTab === 'content' ? '#6daffe' : 'transparent',
              color: activeTab === 'content' ? '#fff' : '#666',
              borderBottom: activeTab === 'content' ? '3px solid #1b5cff' : '3px solid transparent',
            }}
          >
            Conteúdo
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className="px-4 py-2 font-pixel-bold text-sm transition-colors"
            style={{
              backgroundColor: activeTab === 'logs' ? '#6daffe' : 'transparent',
              color: activeTab === 'logs' ? '#fff' : '#666',
              borderBottom: activeTab === 'logs' ? '3px solid #1b5cff' : '3px solid transparent',
            }}
          >
            Registros {journalLinks.length > 0 && `(${journalLinks.length})`}
          </button>
        </div>
      </div>

      {/* Conteúdo da aba ativa */}
      {activeTab === 'content' ? (
        <div className="mb-4">
          <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>
            Conteúdo:
          </label>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              // Salvar imediatamente ao sair do campo
              saveContent(true);
            }}
            className="w-full px-4 py-3 rounded font-pixel resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
            style={{
              fontSize: '16px',
              minHeight: (content && content.trim().length > 0) || isFocused ? '400px' : '120px',
              backgroundColor: '#fff',
              border: 'none',
              lineHeight: '1.6',
            }}
            placeholder="Escreva seu dossiê aqui... (salva automaticamente)"
          />
        </div>
      ) : (
        <div className="mb-4">
          <label className="block font-pixel-bold mb-4" style={{ color: '#333', fontSize: '16px' }}>
            Registros do Diário:
          </label>
          {journalLinks.length === 0 ? (
            <div className="p-8 text-center font-pixel border-2 border-dashed border-gray-300 rounded" style={{ color: '#999', fontSize: '14px', backgroundColor: '#fafafa' }}>
              <div className="mb-2" style={{ fontSize: '32px' }}>📎</div>
              <div className="mb-2 font-pixel-bold" style={{ color: '#666' }}>Nenhum registro vinculado ainda</div>
              <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
                Use o botão 📎 no Diário para vincular<br />
                entradas a este dossiê.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {journalLinks.map((link) => {
                const entry = getEntry(link.journalDate);
                if (!entry) return null;
                
                const date = new Date(link.journalDate);
                const formattedDate = date.toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                });
                
                // Truncar texto para 2 linhas
                const truncatedText = entry.text.length > 150 
                  ? entry.text.substring(0, 150) + '...' 
                  : entry.text;
                
                // Determinar cor do mood
                const moodColors: Record<string, string> = {
                  good: '#4caf50',
                  neutral: '#ffa726',
                  bad: '#f44336',
                };
                const moodColor = entry.mood ? moodColors[entry.mood] : '#999';
                
                return (
                  <div
                    key={link.id}
                    className="p-4 border-2 border-black bg-white transition-all hover:shadow-[4px_4px_0_0_#000]"
                    style={{ 
                      boxShadow: '3px 3px 0 0 #000',
                      borderLeft: `4px solid ${moodColor}`,
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-pixel-bold text-sm flex items-center gap-2" style={{ color: '#333' }}>
                        <span style={{ color: moodColor }}>●</span>
                        <span>{formattedDate}</span>
                      </div>
                      <button
                        onClick={() => {
                          // Por enquanto, apenas mostra a data
                          // TODO: Implementar abertura do diário para data específica
                          alert(`Entrada do diário de ${formattedDate}. Para ver, abra o Diário e navegue até essa data.`);
                        }}
                        className="text-xs font-pixel hover:underline cursor-pointer px-2 py-1 border border-black bg-blue-50 transition-colors hover:bg-blue-100"
                        style={{ color: '#2196f3' }}
                      >
                        ↪ Ver no Diário
                      </button>
                    </div>
                    <p 
                      className="font-pixel text-sm"
                      style={{ 
                        color: '#555',
                        lineHeight: '1.6',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        fontStyle: 'italic',
                      }}
                    >
                      "{truncatedText}"
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Informações do dossiê */}
      <div className="mt-4 pt-4 border-t" style={{ borderColor: '#e0e0e0' }}>
        <div className="flex gap-4 text-sm font-pixel" style={{ color: '#666' }}>
          <span>
            Criado em: {new Date(dossier.createdAt).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
          </span>
          <span>
            Atualizado em: {new Date(dossier.updatedAt).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>
    </div>
  );
}

