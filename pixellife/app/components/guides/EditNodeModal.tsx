'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';
import type { GuideNode } from '../../types/guides';

interface EditNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: GuideNode | null;
  onSave: (nodeId: string, data: {
    title: string;
    description: string;
    icon?: {
      active: string;
      inactive: string;
      meaning?: string;
    };
  }) => void;
}

/**
 * Modal para editar/criar nó com upload de ícones
 * Implementa o fluxo correto: upload para Storage → salvar URLs no banco
 */
export function EditNodeModal({ isOpen, onClose, node, onSave }: EditNodeModalProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [title, setTitle] = useState(node?.title || '');
  const [description, setDescription] = useState(node?.description || '');
  const [meaning, setMeaning] = useState(node?.icon?.meaning || '');
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const file1InputRef = useRef<HTMLInputElement>(null);
  const file2InputRef = useRef<HTMLInputElement>(null);

  // Resetar formulário quando o modal abrir/fechar ou node mudar
  useEffect(() => {
    if (isOpen && node) {
      setTitle(node.title);
      setDescription(node.description);
      setMeaning(node.icon?.meaning || '');
      setFile1(null);
      setFile2(null);
      setError(null);
    }
  }, [isOpen, node]);

  // Função auxiliar para fazer upload de UM arquivo e retornar a URL
  const uploadFile = async (file: File, userId: string, suffix: 'active' | 'inactive'): Promise<string | null> => {
    if (!file) return null;

    try {
      // Criar nome de arquivo único
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).slice(2, 8);
      const fileExtension = file.name.split('.').pop() || 'png';
      const fileName = `${timestamp}_${userId}_${suffix}_${randomStr}.${fileExtension}`;
      const filePath = `${userId}/${fileName}`;

      // 1. Faz o Upload para o bucket 'user-icons'
      const { error: uploadError } = await supabase.storage
        .from('user-icons')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        throw new Error(`Erro ao fazer upload: ${uploadError.message}`);
      }

      // 2. Pega a URL pública do arquivo
      const { data } = supabase.storage
        .from('user-icons')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (err) {
      console.error('Erro no uploadFile:', err);
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!node) return;

    setLoading(true);
    setError(null);

    try {
      // Verificar se o usuário está logado
      if (!user) {
        throw new Error('Você precisa estar logado para salvar.');
      }

      let icon1Url = node.icon?.active || '';
      let icon2Url = node.icon?.inactive || '';

      // --- FASE 1: Upload dos Arquivos (se houver novos arquivos) ---
      if (file1 || file2) {
        console.log('Iniciando uploads...');

        const uploads: Promise<string | null>[] = [];
        
        if (file1) {
          uploads.push(uploadFile(file1, user.id, 'active'));
        } else {
          uploads.push(Promise.resolve(icon1Url));
        }

        if (file2) {
          uploads.push(uploadFile(file2, user.id, 'inactive'));
        } else {
          uploads.push(Promise.resolve(icon2Url));
        }

        const [url1, url2] = await Promise.all(uploads);

        if (file1 && url1) icon1Url = url1;
        if (file2 && url2) icon2Url = url2;

        console.log('Uploads concluídos. URLs:', icon1Url, icon2Url);
      }

      // --- FASE 2: Salvar dados no banco (através do callback) ---
      onSave(node.id, {
        title: title.trim(),
        description: description.trim(),
        icon: {
          active: icon1Url || '/icon2.1.png',
          inactive: icon2Url || '/icon2.2.png',
          meaning: meaning.trim() || undefined,
        },
      });

      // Limpar formulário
      setFile1(null);
      setFile2(null);
      if (file1InputRef.current) file1InputRef.current.value = '';
      if (file2InputRef.current) file2InputRef.current.value = '';

      onClose();
    } catch (err: any) {
      console.error('Erro no processo:', err);
      setError(err.message || 'Erro ao salvar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !node) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 max-w-md w-full mx-4 rounded-lg shadow-lg"
        style={{ border: '1px solid #e5e5e5' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-pixel-bold text-lg mb-4" style={{ color: '#111' }}>
          Editar Nó: {node.title}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Título */}
          <div>
            <label className="block font-pixel-bold text-sm mb-1" style={{ color: '#111' }}>
              Título *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded font-pixel text-sm"
              style={{
                border: '1px solid #e5e5e5',
                backgroundColor: '#FFFFFF',
              }}
              required
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block font-pixel-bold text-sm mb-1" style={{ color: '#111' }}>
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded font-pixel text-sm"
              style={{
                border: '1px solid #e5e5e5',
                backgroundColor: '#FFFFFF',
              }}
            />
          </div>

          {/* Significado do ícone */}
          <div>
            <label className="block font-pixel-bold text-sm mb-1" style={{ color: '#111' }}>
              Significado do Ícone (opcional)
            </label>
            <input
              type="text"
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              placeholder="ex: olhar atento, presença"
              className="w-full px-3 py-2 rounded font-pixel text-sm"
              style={{
                border: '1px solid #e5e5e5',
                backgroundColor: '#FFFFFF',
              }}
            />
          </div>

          {/* Input Arquivo 1 - Ícone Ativo */}
          <div>
            <label className="block font-pixel-bold text-sm mb-1" style={{ color: '#111' }}>
              Ícone Ativo (Verde) *
            </label>
            <p className="text-xs mb-2" style={{ color: '#666' }}>
              Ícone claro = quando este comportamento está ativo
            </p>
            <input
              ref={file1InputRef}
              type="file"
              accept="image/*"
              onChange={(e) => setFile1(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:border-2 file:border-black file:text-sm file:font-semibold file:bg-gray-100 hover:file:bg-gray-200"
            />
            {file1 && (
              <p className="text-xs mt-1" style={{ color: '#22c55e' }}>
                Selecionado: {file1.name}
              </p>
            )}
            {!file1 && node.icon?.active && (
              <p className="text-xs mt-1" style={{ color: '#666' }}>
                Atual: {node.icon.active.includes('supabase.co') ? 'Upload personalizado' : 'Padrão'}
              </p>
            )}
          </div>

          {/* Input Arquivo 2 - Ícone Inativo */}
          <div>
            <label className="block font-pixel-bold text-sm mb-1" style={{ color: '#111' }}>
              Ícone Inativo (Cinza) *
            </label>
            <p className="text-xs mb-2" style={{ color: '#666' }}>
              Ícone escuro = quando ainda não está ativo
            </p>
            <input
              ref={file2InputRef}
              type="file"
              accept="image/*"
              onChange={(e) => setFile2(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:border-2 file:border-black file:text-sm file:font-semibold file:bg-gray-100 hover:file:bg-gray-200"
            />
            {file2 && (
              <p className="text-xs mt-1" style={{ color: '#22c55e' }}>
                Selecionado: {file2.name}
              </p>
            )}
            {!file2 && node.icon?.inactive && (
              <p className="text-xs mt-1" style={{ color: '#666' }}>
                Atual: {node.icon.inactive.includes('supabase.co') ? 'Upload personalizado' : 'Padrão'}
              </p>
            )}
          </div>

          {/* Preview lado a lado */}
          {(file1 || file2 || node.icon) && (
            <div className="flex gap-4 items-center">
              <div className="text-center">
                <p className="text-xs mb-1" style={{ color: '#666' }}>Ativo</p>
                <img
                  src={file1 ? URL.createObjectURL(file1) : (node.icon?.active || '/icon2.1.png')}
                  alt="Ícone ativo"
                  className="w-16 h-16 object-contain border-2 border-black"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
              <div className="text-center">
                <p className="text-xs mb-1" style={{ color: '#666' }}>Inativo</p>
                <img
                  src={file2 ? URL.createObjectURL(file2) : (node.icon?.inactive || '/icon2.2.png')}
                  alt="Ícone inativo"
                  className="w-16 h-16 object-contain border-2 border-black"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
            </div>
          )}

          {/* Mensagem de erro */}
          {error && (
            <div className="p-3 rounded bg-red-50 border border-red-200">
              <p className="text-sm text-red-600 font-pixel">{error}</p>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded font-pixel-bold text-sm"
              style={{
                backgroundColor: '#f5f5f5',
                color: '#111',
                border: '1px solid #e5e5e5',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded font-pixel-bold text-sm text-white"
              style={{
                backgroundColor: loading ? '#999' : '#111',
                border: '1px solid #111',
              }}
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

