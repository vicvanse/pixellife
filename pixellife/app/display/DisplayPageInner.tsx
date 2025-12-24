"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PixelMenu from "../components/PixelMenu";
import { useCosmetics } from "../components/CosmeticsContext";
import { useJournal } from "../hooks/useJournal";
import { useExpenses } from "../hooks/useExpenses";
import { useAuth } from "../context/AuthContext";
import { useUI } from "../context/UIContext";
import { QuickNoteModal } from "../components/journal/QuickNoteModal";
import { HabitsOverlay } from "../components/HabitsOverlay";
import { JournalOverlay } from "../components/JournalOverlay";
import { ExpensesOverlay } from "../components/ExpensesOverlay";
import { CosmeticsOverlay } from "../components/CosmeticsOverlay";
import { PossessionsOverlay } from "../components/PossessionsOverlay";
import Link from "next/link";

export default function DisplayPageInner() {
  // TODOS OS HOOKS DEVEM SER CHAMADOS ANTES DE QUALQUER RETURN CONDICIONAL
  const { user, loading } = useAuth();
  const { mode } = useUI();
  const { avatar, background } = useCosmetics();
  const { getTodayDate, addQuickNote } = useJournal();
  const { formatMonthKey, getDesiredMonthlyExpense, calculateMonthlyData, getCurrentReserve, getBudget, formatDateKey, getResetDate, getAccountMoney, calculateDailyTotal, getAccountMoneyInitialByDate } = useExpenses();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHabitsOpen, setIsHabitsOpen] = useState(false);
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [isExpensesOpen, setIsExpensesOpen] = useState(false);
  const [isCosmeticsOpen, setIsCosmeticsOpen] = useState(false);
  const [isPossessionsOpen, setIsPossessionsOpen] = useState(false);
  const [availableMoney, setAvailableMoney] = useState(0);
  const [reserve, setReserve] = useState(0);

  // TODOS OS HOOKS DEVEM SER CHAMADOS ANTES DE QUALQUER RETURN CONDICIONAL
  // Verificar autenticação
  useEffect(() => {
    // Aguardar um pouco para garantir que a sessão foi verificada
    // Isso evita redirecionamentos prematuros durante o carregamento inicial
    if (!loading && !user) {
      console.log("⚠️ Usuário não autenticado, redirecionando para login...");
      // Usar replace para evitar adicionar ao histórico e criar loop
      // Adicionar pequeno delay para evitar race condition
      const timeout = setTimeout(() => {
        router.replace("/auth/login");
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [user, loading, router]);

  // Redirecionar para /board se estiver no modo board
  useEffect(() => {
    if (mode === 'board') {
      router.push('/board');
    }
  }, [mode, router]);

  // Verificar query parameters para abrir overlays
  useEffect(() => {
    if (!user || mode === 'board') return; // Não processar se não estiver autenticado ou estiver no modo board
    
    const overlay = searchParams.get("overlay");
    if (overlay === "expenses") {
      setIsExpensesOpen(true);
      // Remove o parâmetro da URL
      router.replace("/display");
    } else if (overlay === "habits") {
      setIsHabitsOpen(true);
      router.replace("/display");
    } else if (overlay === "journal") {
      setIsJournalOpen(true);
      router.replace("/display");
    } else if (overlay === "cosmetics") {
      setIsCosmeticsOpen(true);
      router.replace("/display");
    } else if (overlay === "possessions") {
      setIsPossessionsOpen(true);
      router.replace("/display");
    }
  }, [searchParams, router, user, mode]);

  // Calcular dinheiro disponível e reserva (atualiza automaticamente)
  useEffect(() => {
    if (!user) return; // Não processar se não estiver autenticado
    
    const updateValues = () => {
      const today = new Date();
      const todayKey = formatDateKey(today);
      
      // Calcular Plano Diário: LimiteMensal - gastosAcumulados desde o resetDay do ciclo
      const monthKey = formatMonthKey(today);
      const monthlyLimit = getDesiredMonthlyExpense(monthKey) || 0;
      const resetDay = getResetDate(monthKey) || 1;
      const currentDay = today.getDate();
      const todayYear = today.getFullYear();
      const todayMonth = today.getMonth(); // 0-11
      
      let planoDiario = 0;
      if (monthlyLimit > 0 && resetDay > 0) {
        // Calcular ciclo usando a lógica correta
        let cycleStart: Date;
        if (currentDay >= resetDay) {
          // Ciclo começou no resetDay deste mês
          cycleStart = new Date(todayYear, todayMonth, resetDay);
        } else {
          // Ciclo começou no resetDay do mês anterior
          const prevMonth = todayMonth - 1;
          const prevYear = prevMonth < 0 ? todayYear - 1 : todayYear;
          const prevMonthIndex = prevMonth < 0 ? 11 : prevMonth;
          cycleStart = new Date(prevYear, prevMonthIndex, resetDay);
        }
        
        // Calcular gastos acumulados desde o início do ciclo até hoje
        let gastosAcumulados = 0;
        let currentDate = new Date(cycleStart);
        currentDate.setHours(0, 0, 0, 0);
        const targetDate = new Date(todayYear, todayMonth, currentDay);
        targetDate.setHours(0, 0, 0, 0);
        
        while (currentDate <= targetDate) {
          const checkDateKey = formatDateKey(currentDate);
          const dailyTotal = calculateDailyTotal(checkDateKey);
          // Soma apenas valores negativos (gastos), não ganhos
          if (dailyTotal < 0) {
            gastosAcumulados += Math.abs(dailyTotal);
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Plano Diário = Limite Mensal - Gastos Acumulados (desde início do ciclo)
        planoDiario = Math.max(0, monthlyLimit - gastosAcumulados);
      }
      
      // Dinheiro disponível = Plano Diário se puder ser calculado, senão Dinheiro em conta
      let dinheiroDisponivel = 0;
      if (planoDiario > 0 && monthlyLimit > 0) {
        dinheiroDisponivel = planoDiario;
      } else {
        // Calcular Dinheiro em conta: dinheiroInicialDoMes + soma de totalDiario até hoje
        const day1Key = formatDateKey(new Date(today.getFullYear(), today.getMonth(), 1));
        const day1Initial = getAccountMoneyInitialByDate(day1Key);
        const dinheiroInicialDoMes = day1Initial !== null ? day1Initial : 0;
        
        let somaTotalDiario = 0;
        for (let d = 1; d <= currentDay; d++) {
          const dateKey = formatDateKey(new Date(today.getFullYear(), today.getMonth(), d));
          somaTotalDiario += calculateDailyTotal(dateKey);
        }
        
        dinheiroDisponivel = dinheiroInicialDoMes + somaTotalDiario;
      }
      
      setAvailableMoney(dinheiroDisponivel);
      
      // Obter reserva atual
      const currentReserve = getCurrentReserve();
      setReserve(currentReserve);
    };

    // Atualizar imediatamente
    updateValues();

    // Atualizar a cada 2 segundos para resposta mais rápida
    const interval = setInterval(updateValues, 2000);

    // Listener para mudanças no localStorage (quando expenses são atualizados)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.startsWith("pixel-life-expenses-v1")) {
        updateValues();
      }
    };

    // Listener para mudanças no mesmo tab (usando custom event)
    const handleCustomStorageChange = () => {
      updateValues();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("pixel-life-storage-change", handleCustomStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("pixel-life-storage-change", handleCustomStorageChange);
    };
  }, [getBudget, formatDateKey, getCurrentReserve, user, formatMonthKey, getDesiredMonthlyExpense, getResetDate, calculateDailyTotal, getAccountMoney]);

  // AGORA SIM, PODEMOS TER RETURNS CONDICIONAIS DEPOIS DE TODOS OS HOOKS
  // Se estiver no modo board, redirecionar (o useEffect acima já faz isso, mas retornamos null para evitar renderização)
  if (mode === 'board') {
    return null;
  }

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="relative w-full h-screen overflow-hidden flex items-center justify-center">
        <div className="font-mono text-lg">Verificando autenticação...</div>
      </div>
    );
  }

  // Não renderizar nada se não estiver autenticado (será redirecionado)
  if (!user) {
    return null;
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">

      {/* Menu hambúrguer dropdown (top-left) */}
      <PixelMenu 
        onHabitsClick={() => setIsHabitsOpen(true)}
        onJournalClick={() => setIsJournalOpen(true)}
        onExpensesClick={() => setIsExpensesOpen(true)}
        onCosmeticsClick={() => setIsCosmeticsOpen(true)}
        onPossessionsClick={() => setIsPossessionsOpen(true)}
      />

      {/* Botão de texto retangular no canto direito superior */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed top-4 right-4 z-40 bg-white border-4 border-black px-3 py-2 flex items-center justify-center hover:bg-gray-100"
        style={{
          width: "160px",
          height: "32px",
        }}
      >
        <span className="font-mono text-sm font-bold text-black">Adicionar Nota</span>
      </button>

      {/* Ícone central azul acima do avatar - posicionado independentemente */}
      <div
        className="absolute z-30"
        style={{
          top: "calc(40% - 200px)", // Posição fixa acima do avatar (descido mais 20px)
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        <img
          src="/icon1.gif"
          alt="Icon1"
          className="w-19 h-auto image-render-pixel"
          draggable="false"
        />
      </div>

      {/* Avatar centralizado horizontal e verticalmente */}
      <div
        className="absolute z-10"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <div className="relative w-fit mx-auto">
          <img
            src={avatar}
            alt="Avatar Pixel Art"
            className="h-auto image-render-pixel"
            style={{ width: '272px' }}
            draggable="false"
          />

          {/* Texto posicionado RELATIVO ao avatar */}
          <div
            className="absolute font-mono text-xs text-black font-bold z-20"
            style={{
              top: "210px",
              left: "335px"
            }}
          >
            <p>
              Dinheiro disponível: <span className="text-black-500 font-bold">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(availableMoney)}
              </span>
            </p>
            <p className="mt-1">
              Reserva: <span className="text-black-500 font-bold">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(reserve)}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Losangos verdes - abaixo do avatar, na parte inferior */}
      <div
        className="absolute z-30"
        style={{
          bottom: "10%",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        {/* Losangos verdes (esquerda e direita) */}
        <div className="flex justify-between max-w-xs mx-auto">
          {/* Coluna esquerda */}
          <div className="space-y-8">
            <img
              src="/icon2.1.png"
              alt="Icon2.1"
              className="w-5 h-5 image-render-pixel"
            />
            <img
              src="/icon2.1.png"
              alt="Icon2.1"
              className="w-5 h-5 image-render-pixel"
            />
          </div>
          {/* Coluna direita */}
          <div className="space-y-8">
            <img
              src="/icon2.1.png"
              alt="Icon2.1"
              className="w-5 h-5 image-render-pixel"
            />
            <img
              src="/icon2.1.png"
              alt="Icon2.1"
              className="w-5 h-5 image-render-pixel"
            />
          </div>
        </div>
      </div>

      {/* Seta e link para Árvore - região do quadrado vermelho */}
      <div
        className="absolute z-20"
        style={{
          top: "50%",
          right: "10%",
          transform: "translateY(-50%)",
        }}
      >
        <Link
          href="/tree"
          className="flex items-center justify-center bg-white border-4 border-black w-12 h-12 shadow-[4px_4px_0_0_#000] hover:bg-gray-100 hover:shadow-[6px_6px_0_0_#000] transition-all"
        >
          <span className="font-mono text-2xl font-bold">→</span>
        </Link>
      </div>

      {/* Seção de Status - meio entre fim da tela esquerda e avatar */}
      <div
        className="absolute z-20"
        style={{
          top: "20%",
          left: "25%",
          transform: "translateX(-50%)",
        }}
      >
        <div className="bg-white p-4 w-64">
          {/* Nome e Títulos */}
          <div className="mb-4">
            <h2 className="font-mono text-base font-bold text-black mb-1">Nome do Personagem</h2>
            <p className="font-mono text-xs text-gray-600 mb-1">Título Geral</p>
            <p className="font-mono text-xs text-gray-600">Título Especial</p>
          </div>

          {/* Itens de Cosméticos Ativos */}
          <div className="space-y-3">
            <div>
              <p className="font-mono text-xs text-black font-bold mb-1">Avatar</p>
              <img
                src={avatar}
                alt="Avatar Ativo"
                className="w-16 h-16 object-contain image-render-pixel border-2 border-black"
                draggable="false"
              />
            </div>
            <div>
              <p className="font-mono text-xs text-black font-bold mb-1">Fundo</p>
              <div
                className="w-16 h-16 border-2 border-black"
                style={{
                  backgroundImage: background !== "none" ? `url(${background})` : "none",
                  backgroundColor: background === "none" ? "#d8d8d8" : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  imageRendering: "pixelated",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Quick Note */}
      <QuickNoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={(text) => {
          addQuickNote(getTodayDate(), text);
        }}
      />

      {/* Overlay de Hábitos */}
      <HabitsOverlay
        isOpen={isHabitsOpen}
        onClose={() => setIsHabitsOpen(false)}
      />

      {/* Overlay de Journal */}
      <JournalOverlay
        isOpen={isJournalOpen}
        onClose={() => setIsJournalOpen(false)}
      />

      {/* Overlay de Expenses */}
      <ExpensesOverlay
        isOpen={isExpensesOpen}
        onClose={() => setIsExpensesOpen(false)}
      />

      {/* Overlay de Cosmetics */}
      <CosmeticsOverlay
        isOpen={isCosmeticsOpen}
        onClose={() => setIsCosmeticsOpen(false)}
      />

      {/* Overlay de Possessions */}
      <PossessionsOverlay
        isOpen={isPossessionsOpen}
        onClose={() => setIsPossessionsOpen(false)}
      />
    </div>
  );
}




