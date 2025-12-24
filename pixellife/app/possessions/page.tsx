"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PixelMenu from "../components/PixelMenu";
import { usePossessions } from "../hooks/usePossessions";
import { useExpenses } from "../hooks/useExpenses";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../context/LanguageContext";
import { PossessionCard } from "../components/possessions/PossessionCard";
import { PossessionDetailsModal } from "../components/possessions/PossessionDetailsModal";
import { CreatePossessionModal } from "../components/possessions/CreatePossessionModal";
import { EditPossessionModal } from "../components/possessions/EditPossessionModal";
import type { AssetGoal } from "../hooks/usePossessions";
import type { DailyExpenseItem } from "../hooks/useExpenses";

export default function PossessionsPage() {
  const { t } = useLanguage();
  const { user, loading } = useAuth();
  const router = useRouter();
  const {
    getAllPossessions,
    addPossession,
    updatePossession,
    deletePossession,
    updateAllProgressFromAccountMoney,
  } = usePossessions();
  
  const { getExpensesByGoalId, removeDailyExpense, formatDateKey, getAccountMoney, getCurrentReserve } = useExpenses();
  
  const [possessions, setPossessions] = useState<AssetGoal[]>([]);
  const [selectedPossession, setSelectedPossession] = useState<AssetGoal | null>(null);
  const [selectedExpenses, setSelectedExpenses] = useState<DailyExpenseItem[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Verificar autenticação
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="relative w-full h-screen overflow-hidden flex items-center justify-center">
        <div className="font-mono text-lg">Carregando...</div>
      </div>
    );
  }

  // Não renderizar nada se não estiver autenticado
  if (!user) {
    return null;
  }

  // Carregar objetivos e atualizar progresso baseado no dinheiro em conta
  useEffect(() => {
    const loadPossessions = () => {
      const all = getAllPossessions();
      setPossessions(all);

      // Obter dinheiro em conta e reserva do dia atual e distribuir entre os objetivos
      const today = new Date();
      const todayKey = formatDateKey(today);
      const accountMoney = getAccountMoney(todayKey);
      const reserve = getCurrentReserve();
      updateAllProgressFromAccountMoney(accountMoney, reserve);

      // Recarregar após atualizar progresso
      setTimeout(() => {
        setPossessions(getAllPossessions());
      }, 100);
    };

    loadPossessions();
    
    // Listener para atualizar objetivos quando há mudanças no storage (movimentações financeiras)
    const handleStorageChange = () => {
      const today = new Date();
      const todayKey = formatDateKey(today);
      const accountMoney = getAccountMoney(todayKey);
      const reserve = getCurrentReserve();
      updateAllProgressFromAccountMoney(accountMoney, reserve);
      setTimeout(() => {
        setPossessions(getAllPossessions());
      }, 100);
    };

    window.addEventListener('pixel-life-storage-change', handleStorageChange);
    
    return () => {
      window.removeEventListener('pixel-life-storage-change', handleStorageChange);
    };
  }, [getAllPossessions, formatDateKey, getAccountMoney, getCurrentReserve, updateAllProgressFromAccountMoney]);

  const handleCardClick = (possession: AssetGoal) => {
    const expenses = getExpensesByGoalId(possession.id);
    setSelectedPossession(possession);
    setSelectedExpenses(expenses);
    setIsDetailsModalOpen(true);
  };

  const handleAddContribution = () => {
    // Isso será integrado com a página de expenses
    // Por enquanto, apenas fecha o modal de detalhes e abre expenses
    setIsDetailsModalOpen(false);
    // Redirecionar para expenses com o goalId selecionado
    window.location.href = `/expenses?goalId=${selectedPossession?.id}`;
  };

  const handleDelete = (id: number) => {
    deletePossession(id);
    // Atualizar imediatamente após exclusão
    const updated = getAllPossessions();
    setPossessions(updated);
    setIsDetailsModalOpen(false);
    setSelectedPossession(null);
    
    // Disparar evento para sincronizar
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('pixel-life-storage-change'));
    }
  };

  const handleRemoveExpense = (expenseId: string, dateKey: string) => {
    removeDailyExpense(dateKey, expenseId);
    // Recarregar despesas e atualizar progresso baseado no dinheiro em conta
    if (selectedPossession) {
      const expenses = getExpensesByGoalId(selectedPossession.id);
      setSelectedExpenses(expenses);
      
      // Atualizar progresso de todos os objetivos baseado no dinheiro em conta e reserva atualizados
      const today = new Date();
      const todayKey = formatDateKey(today);
      const accountMoney = getAccountMoney(todayKey);
      const reserve = getCurrentReserve();
      updateAllProgressFromAccountMoney(accountMoney, reserve);
      
      // Recarregar objetivos
      setTimeout(() => {
        setPossessions(getAllPossessions());
      }, 100);
    }
  };

  const handleCreate = (data: Omit<AssetGoal, "id" | "currentProgress" | "status" | "createdAt">) => {
    // Obter dinheiro em conta ANTES de criar para calcular progresso inicial
    const today = new Date();
    const todayKey = formatDateKey(today);
    const accountMoney = getAccountMoney(todayKey);
    const reserve = getCurrentReserve();
    
    // Criar posse com progresso inicial calculado baseado no dinheiro em conta
    const newPossession = addPossession({
      ...data,
      status: "in-progress", // Status padrão para novos objetivos
    }, accountMoney);
    
    // Atualizar progresso imediatamente após criar (garante sincronização)
    updateAllProgressFromAccountMoney(accountMoney, reserve);
    
    // Atualizar lista com os valores atualizados
    setTimeout(() => {
      const updated = getAllPossessions();
      setPossessions(updated);
    }, 150);
    
    // Disparar evento para sincronizar
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('pixel-life-storage-change'));
    }
  };

  const handleEdit = (id: number, data: Partial<AssetGoal>) => {
    updatePossession(id, data);
    setPossessions(getAllPossessions());
    setIsEditModalOpen(false);
    // Recarregar detalhes se o objetivo editado estiver selecionado
    if (selectedPossession && selectedPossession.id === id) {
      const updated = getAllPossessions().find(p => p.id === id);
      if (updated) {
        setSelectedPossession(updated);
      }
    }
  };

  const handleEditClick = (id: number) => {
    setIsDetailsModalOpen(false);
    setIsEditModalOpen(true);
  };

  return (
    <div className="relative min-h-screen p-6 font-mono">
      <PixelMenu />

      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Objetivos</h1>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-green-400 border-4 border-black px-4 py-2 font-bold hover:bg-green-500 shadow-[4px_4px_0_0_#000]"
          >
            + Novo Objetivo
          </button>
        </div>

        {/* Grid de Objetivos */}
        {possessions.length > 0 ? (
          <>
            <div className="grid grid-cols-3 gap-4">
              {possessions.map((possession) => (
                <PossessionCard
                  key={possession.id}
                  possession={possession}
                  onClick={() => handleCardClick(possession)}
                  onBuy={(id) => {
                    updatePossession(id, { status: 'completed' });
                    const updated = getAllPossessions();
                    setPossessions(updated);
                  }}
                />
              ))}
            </div>
            <div className="mt-6">
              <div className="flex flex-col items-end gap-2">
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-green-400 border-4 border-black px-4 py-2 font-bold hover:bg-green-500 shadow-[4px_4px_0_0_#000]"
                >
                  + Novo Objetivo
                </button>
                <div className="font-pixel text-right" style={{ color: '#333', fontSize: '14px' }}>
                  {t('goals.accumulatedValue')}{' '}
                  <span className="font-pixel-bold" style={{ color: '#111' }}>
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(
                      possessions
                        .filter(p => p.status === 'completed')
                        .reduce((sum, p) => sum + p.targetValue, 0)
                    )}
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white border-4 border-black p-8 text-center shadow-[6px_6px_0_0_#000]">
            <p className="text-gray-500 mb-4">Nenhum objetivo criado ainda.</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-400 border-4 border-black px-4 py-2 font-bold hover:bg-blue-500 shadow-[4px_4px_0_0_#000]"
            >
              Criar Primeiro Objetivo
            </button>
          </div>
        )}
      </div>

      {/* Modais */}
      <CreatePossessionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreate}
      />

      <PossessionDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedPossession(null);
        }}
        possession={selectedPossession}
        expenses={selectedExpenses}
        onAddContribution={handleAddContribution}
        onDelete={handleDelete}
        onRemoveExpense={handleRemoveExpense}
        onEdit={selectedPossession ? () => handleEditClick(selectedPossession.id) : undefined}
      />

      <EditPossessionModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          // Reabrir o modal de detalhes após fechar a edição
          if (selectedPossession) {
            setIsDetailsModalOpen(true);
          }
        }}
        possession={selectedPossession}
        onUpdate={handleEdit}
      />
    </div>
  );
}

