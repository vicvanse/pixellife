"use client";

import { useEffect, useState } from "react";
import { AssetGoal, usePossessions } from "../../hooks/usePossessions";
import { DailyExpenseItem, useExpenses } from "../../hooks/useExpenses";
import { useConfirmation } from "../../context/ConfirmationContext";
import { useLanguage } from "../../context/LanguageContext";

interface PossessionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  possession: AssetGoal | null;
  expenses: DailyExpenseItem[];
  onAddContribution: () => void;
  onDelete: (id: number) => void;
  onRemoveExpense?: (expenseId: string, dateKey: string) => void;
  onEdit?: (id: number, data: Partial<AssetGoal>) => void;
}

export function PossessionDetailsModal({
  isOpen,
  onClose,
  possession,
  expenses,
  onAddContribution,
  onDelete,
  onRemoveExpense,
  onEdit,
}: PossessionDetailsModalProps) {
  const { t } = useLanguage();
  const { showConfirmation } = useConfirmation();
  const { getPossession, updateAllProgressFromAccountMoney } = usePossessions();
  const { getAccountMoney, getCurrentReserve, formatDateKey } = useExpenses();
  const [currentPossession, setCurrentPossession] = useState<AssetGoal | null>(possession);

  // Atualizar o progresso quando o dinheiro em conta mudar
  useEffect(() => {
    if (!isOpen || !possession) return;

    const updateProgress = () => {
      const today = new Date();
      const todayKey = formatDateKey(today);
      const accountMoney = getAccountMoney(todayKey);
      const reserve = getCurrentReserve();
      updateAllProgressFromAccountMoney(accountMoney, reserve);
      
      // Atualizar o possession atualizado
      setTimeout(() => {
        const updated = getPossession(possession.id);
        if (updated) {
          setCurrentPossession(updated);
        }
      }, 100);
    };

    // Atualizar ao abrir
    updateProgress();

    // Escutar mudanças no storage
    const handleStorageChange = () => {
      updateProgress();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('pixel-life-storage-change', handleStorageChange);
      const handleLocalStorageChange = (e: StorageEvent) => {
        if (e.key && (e.key.startsWith('pixel-life-expenses-v1') || e.key.startsWith('pixel-life-account-money'))) {
          updateProgress();
        }
      };
      window.addEventListener('storage', handleLocalStorageChange);

      return () => {
        window.removeEventListener('pixel-life-storage-change', handleStorageChange);
        window.removeEventListener('storage', handleLocalStorageChange);
      };
    }
  }, [isOpen, possession, getPossession, updateAllProgressFromAccountMoney, getAccountMoney, getCurrentReserve, formatDateKey]);

  // Atualizar quando o possession prop mudar
  useEffect(() => {
    setCurrentPossession(possession);
  }, [possession]);
  
  if (!isOpen || !currentPossession) return null;

  // Usar currentPossession ao invés de possession para ter sempre os dados atualizados
  const possessionToDisplay = currentPossession;

  // Calcular progresso dinamicamente baseado no dinheiro em conta do dia atual
  const today = new Date();
  const todayKey = formatDateKey(today);
  const accountMoney = getAccountMoney(todayKey);
  
  const currentProgress = possessionToDisplay.status === 'completed' || possessionToDisplay.status === 'legal-issues'
    ? possessionToDisplay.targetValue
    : Math.min(accountMoney, possessionToDisplay.targetValue);
  
  const progressPercentage = possessionToDisplay.targetValue > 0
    ? Math.min((currentProgress / possessionToDisplay.targetValue) * 100, 100)
    : 0;

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr + "T00:00:00");
    const days = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
    const months = [
      "janeiro", "fevereiro", "março", "abril", "maio", "junho",
      "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
    ];
    return `${days[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
  };

  const getStatusColor = (status: AssetGoal["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-400";
      case "legal-issues":
        return ""; // Usar cor customizada via style (amarelo)
      case "in-progress":
        return ""; // Usar cor customizada via style
      case "locked":
        return "bg-gray-400";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusColorStyle = (status: AssetGoal["status"]) => {
    switch (status) {
      case "legal-issues":
        return { backgroundColor: '#ffc107' }; // Amarelo para problemas legais
      case "in-progress":
        return { backgroundColor: '#9e9e9e' };
      default:
        return {};
    }
  };

  // Ícone colorido quando completado ou problemas legais
  const iconStyle = (possessionToDisplay.status === "completed" || possessionToDisplay.status === "legal-issues")
    ? { filter: "brightness(1.2) saturate(1.3)" }
    : { filter: "grayscale(0.5)" };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        style={{
          borderRadius: '10px',
          border: '1px solid #e0e0e0',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.12)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex-1">
            <h2 
              className="font-pixel-bold line-clamp-2" 
              style={{ color: '#333', fontSize: '18px', fontWeight: 600, maxWidth: '400px' }}
              title={possessionToDisplay.title || (possessionToDisplay as any).name}
            >
              {possessionToDisplay.title || (possessionToDisplay as any).name}
            </h2>
            {possessionToDisplay.description && (
              <p 
                className="font-pixel mt-2" 
                style={{ color: '#666', fontSize: '14px', lineHeight: '1.5' }}
              >
                {possessionToDisplay.description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-2 py-1 rounded transition-colors hover:bg-gray-100"
            style={{
              backgroundColor: '#f5f5f5',
              border: '1px solid #d4d4d4',
              color: '#555',
              fontSize: '14px',
              borderRadius: '6px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Layout em 2 colunas similar aos cards */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Coluna Esquerda: Ícone + Tipo */}
          <div className="flex flex-col items-center">
            <img
              src={possessionToDisplay.icon}
              alt={possessionToDisplay.title || (possessionToDisplay as any).name}
              className="object-contain image-render-pixel mb-3"
              style={{ 
                width: '96px',
                height: '96px',
                objectFit: 'contain',
                objectPosition: 'center',
                display: 'block',
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                ...iconStyle
              }}
            />
            <div className="font-pixel" style={{ color: '#666', fontSize: '14px' }}>
              Tipo: {possessionToDisplay.type}
            </div>
          </div>

          {/* Coluna Direita: Valores */}
          <div className="flex flex-col justify-center gap-3">
            <div>
              <span className="font-pixel block mb-1" style={{ color: '#666', fontSize: '14px' }}>{t('goals.targetValue')}:</span>
              <p className="font-pixel-bold" style={{ color: '#333', fontSize: '18px' }}>{formatCurrency(possessionToDisplay.targetValue)}</p>
            </div>
            <div>
              <span className="font-pixel block mb-1" style={{ color: '#666', fontSize: '14px' }}>Valor Acumulado:</span>
              <p className="font-pixel-bold" style={{ color: '#333', fontSize: '18px' }}>{formatCurrency(currentProgress)}</p>
            </div>
          </div>
        </div>

        {/* Barra de Progresso - não mostrar para completed ou legal-issues */}
        {possessionToDisplay.status !== 'completed' && possessionToDisplay.status !== 'legal-issues' && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="font-pixel-bold" style={{ color: '#333', fontSize: '14px' }}>Progresso</span>
              <span className="font-pixel-bold" style={{ color: '#333', fontSize: '14px' }}>{progressPercentage.toFixed(1)}%</span>
            </div>
            <div 
              className="h-4 relative overflow-hidden"
              style={{ 
                backgroundColor: '#e0e0e0', 
                border: '1px solid #ccc',
              }}
            >
              <div
                className={`h-full transition-all duration-300 ${possessionToDisplay.status !== 'in-progress' ? getStatusColor(possessionToDisplay.status) : ''}`}
                style={{ 
                  width: `${progressPercentage}%`,
                  ...getStatusColorStyle(possessionToDisplay.status),
                }}
              >
                <div className="h-full w-full" style={{
                  backgroundImage: `repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 4px,
                    rgba(0,0,0,0.1) 4px,
                    rgba(0,0,0,0.1) 8px
                  )`
                }} />
              </div>
            </div>
            <div className="mt-2 text-center">
              <span className="font-pixel" style={{ color: '#666', fontSize: '14px' }}>
                {formatCurrency(currentProgress)} / {formatCurrency(possessionToDisplay.targetValue)}
              </span>
            </div>
          </div>
        )}
        
        {/* Status para completed ou legal-issues */}
        {(possessionToDisplay.status === 'completed' || possessionToDisplay.status === 'legal-issues') && (
          <div className="mb-6 text-center">
            <span 
              className="font-pixel-bold" 
              style={{ 
                color: possessionToDisplay.status === 'completed' ? '#4caf50' : '#ffc107',
                fontSize: '16px'
              }}
            >
              {possessionToDisplay.status === 'completed' ? 'Quitado' : 'Problemas Legais'}
            </span>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex gap-2 pt-4 border-t" style={{ borderColor: '#e0e0e0' }}>
          {possessionToDisplay.status === 'in-progress' && currentProgress >= possessionToDisplay.targetValue && possessionToDisplay.targetValue > 0 && (
            <button
              onClick={() => {
                showConfirmation({
                  message: `Tem certeza que deseja comprar "${possessionToDisplay.title || (possessionToDisplay as any).name}"?\n\nEsta ação marcará o objetivo como concluído.`,
                  onConfirm: () => {
                    if (onEdit) {
                      onEdit(possessionToDisplay.id, { status: 'completed' });
                    }
                  },
                });
              }}
              className="flex-1 px-4 py-2 rounded transition-colors hover:opacity-90"
              style={{
                backgroundColor: '#16a34a',
                border: '1px solid #15803d',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '8px',
              }}
            >
              Comprar
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => {
                if (onEdit) {
                  onEdit(possessionToDisplay.id, {});
                }
              }}
              className="flex-1 px-4 py-2 rounded transition-colors hover:opacity-90"
              style={{
                backgroundColor: '#2563eb',
                border: '1px solid #1b5cff',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '8px',
              }}
            >
              {t('common.edit')}
            </button>
          )}
          <button
            onClick={() => {
              showConfirmation({
                message: `Tem certeza que deseja excluir "${possessionToDisplay.title || (possessionToDisplay as any).name}"?\n\nEsta ação não pode ser desfeita.`,
                onConfirm: () => {
                  onDelete(possessionToDisplay.id);
                  onClose();
                },
              });
            }}
            className="flex-1 px-4 py-2 rounded transition-colors hover:opacity-90"
            style={{
              backgroundColor: '#dc2626',
              border: '1px solid #b91c1c',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '8px',
            }}
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}

