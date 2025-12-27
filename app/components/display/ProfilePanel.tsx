'use client';

import { useRouter } from 'next/navigation';
import { useExpenses } from '../../hooks/useExpenses';
import { useProfilePreferences } from '../../hooks/useProfilePreferences';
import { useState, useEffect } from 'react';
import { FinanceBox } from './FinanceBox';
import { useLanguage } from '../../context/LanguageContext';

interface ProfilePanelProps {
  onAvatarChangeClick?: () => void;
}

export function ProfilePanel({ onAvatarChangeClick }: ProfilePanelProps) {
  const { t, tString } = useLanguage();
  const router = useRouter();
  const { 
    formatDateKey, 
    formatMonthKey,
    getAccountMoney, 
    getCurrentReserve,
    getDesiredMonthlyExpense,
    getResetDate,
    getCycleDates,
    calculateDailyTotal,
  } = useExpenses();
  
  const {
    getHideAvailableMoney,
    setHideAvailableMoney,
    getHideReserve,
    setHideReserve,
    getDisplayMode,
    setDisplayMode,
  } = useProfilePreferences();

  const [availableMoney, setAvailableMoney] = useState(0);
  const [limiteRestante, setLimiteRestante] = useState(0);
  const [reserve, setReserve] = useState(0);
  const [hideAvailableMoney, setHideAvailableMoneyState] = useState(false);
  const [hideReserve, setHideReserveState] = useState(false);
  const [displayMode, setDisplayModeState] = useState<'dinheiro-disponivel' | 'limite-restante'>('dinheiro-disponivel');

  // Carregar preferências do localStorage
  useEffect(() => {
    setHideAvailableMoneyState(getHideAvailableMoney());
    setHideReserveState(getHideReserve());
    setDisplayModeState(getDisplayMode());
  }, [getHideAvailableMoney, getHideReserve, getDisplayMode]);

  // Calcular valores financeiros
  useEffect(() => {
    const today = new Date();
    const todayKey = formatDateKey(today);
    
    // Dinheiro em conta (conectado com getAccountMoney)
    const accountMoney = getAccountMoney(todayKey);
    // Garantir que o valor seja um número válido
    const validAccountMoney = typeof accountMoney === 'number' && !isNaN(accountMoney) ? accountMoney : 0;
    setAvailableMoney(validAccountMoney);
    
    // Reserva
    setReserve(getCurrentReserve(todayKey));
    
    // Calcular Limite Restante
    const resetDay = getResetDate(formatMonthKey(today));
    if (resetDay > 0) {
      const { cycleStart } = getCycleDates(todayKey, resetDay);
      const cycleStartMonthKey = formatMonthKey(cycleStart);
      const monthlyLimitDoCiclo = getDesiredMonthlyExpense(cycleStartMonthKey) || 0;
      
      if (monthlyLimitDoCiclo > 0) {
        let gastosAcumulados = 0;
        let currentDate = new Date(cycleStart);
        currentDate.setHours(0, 0, 0, 0);
        const targetDate = new Date(today);
        targetDate.setHours(0, 0, 0, 0);
        
        while (currentDate <= targetDate) {
          const checkDateKey = formatDateKey(currentDate);
          const dailyTotal = calculateDailyTotal(checkDateKey);
          // Soma apenas valores negativos (gastos), não ganhos
          if (dailyTotal < 0) {
            gastosAcumulados += Math.abs(dailyTotal);
          }
          currentDate.setDate(currentDate.getDate() + 1);
          currentDate.setHours(0, 0, 0, 0);
        }
        
        setLimiteRestante(Math.max(0, monthlyLimitDoCiclo - gastosAcumulados));
      } else {
        setLimiteRestante(0);
      }
    } else {
      setLimiteRestante(0);
    }
  }, [
    formatDateKey,
    formatMonthKey,
    getAccountMoney,
    getCurrentReserve,
    getDesiredMonthlyExpense,
    getResetDate,
    getCycleDates,
    calculateDailyTotal,
  ]);

  // Atualizar quando storage mudar (preferências)
  useEffect(() => {
    const handleStorageChange = () => {
      setHideAvailableMoneyState(getHideAvailableMoney());
      setHideReserveState(getHideReserve());
      setDisplayModeState(getDisplayMode());
      
      // Recalcular valores financeiros quando dados mudarem
      const today = new Date();
      const todayKey = formatDateKey(today);
      const accountMoney = getAccountMoney(todayKey);
      const validAccountMoney = typeof accountMoney === 'number' && !isNaN(accountMoney) ? accountMoney : 0;
      setAvailableMoney(validAccountMoney);
      setReserve(getCurrentReserve(todayKey));
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('pixel-life-storage-change', handleStorageChange);
      return () => {
        window.removeEventListener('pixel-life-storage-change', handleStorageChange);
      };
    }
  }, [getHideAvailableMoney, getHideReserve, getDisplayMode, formatDateKey, getAccountMoney, getCurrentReserve]);

  const handleEditProfile = () => {
    // Implementar navegação ou modal
    router.push('/cosmetics');
  };

  const handleChangeStyle = () => {
    if (onAvatarChangeClick) {
      onAvatarChangeClick();
    } else {
      router.push('/cosmetics');
    }
  };

  const handleViewHistory = () => {
    router.push('/journal/history');
  };

  const handleAchievements = () => {
    // Navegar para board e rolar para a seção de Achievements
    router.push('/board#achievements');
    setTimeout(() => {
      const achievementsSection = document.getElementById('achievements');
      if (achievementsSection) {
        const headerOffset = 100;
        const elementPosition = achievementsSection.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }, 100);
  };

  const handleToggleHideAvailableMoney = () => {
    const newValue = !hideAvailableMoney;
    setHideAvailableMoneyState(newValue);
    setHideAvailableMoney(newValue);
  };

  const handleToggleHideReserve = () => {
    const newValue = !hideReserve;
    setHideReserveState(newValue);
    setHideReserve(newValue);
  };

  const handleDisplayModeChange = () => {
    const newMode = displayMode === 'dinheiro-disponivel' ? 'limite-restante' : 'dinheiro-disponivel';
    setDisplayModeState(newMode);
    setDisplayMode(newMode);
  };

  const displayValue = displayMode === 'dinheiro-disponivel' ? availableMoney : limiteRestante;
  const displayLabel = displayMode === 'dinheiro-disponivel' ? tString('display.availableMoney') : tString('display.remainingLimit');

  return (
    <div 
      className="p-4 rounded-md mobile-profile-panel"
      style={{
        backgroundColor: '#e8e8e8',
        border: '1px solid #e8e8e2',
      }}
    >
      <h2 className="font-pixel-bold mb-4" style={{ color: '#111', fontSize: '16px' }}>
        {t('display.myProfile')}
      </h2>
      
      {/* Informações financeiras */}
      <div className="space-y-2 mb-4">
        <FinanceBox 
          label={displayLabel} 
          value={displayValue}
          hidden={hideAvailableMoney}
          onToggleVisibility={handleToggleHideAvailableMoney}
        />
        <FinanceBox 
          label={tString('display.reserve')} 
          value={reserve}
          hidden={hideReserve}
          onToggleVisibility={handleToggleHideReserve}
        />
      </div>

      {/* Opções de configuração */}
      <div className="mb-4 space-y-2">
        <button
          onClick={handleDisplayModeChange}
          className="w-full text-left px-3 py-2 font-pixel transition-all hover:bg-white/50 touch-manipulation min-h-[48px]"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #e8e8e2',
            color: '#111',
            fontSize: '14px',
            borderRadius: '8px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#666';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#111';
          }}
        >
          {displayMode === 'dinheiro-disponivel' 
            ? `↳ ${t('display.showRemainingLimit')}` 
            : `↳ ${t('display.showAvailableMoney')}`}
        </button>
      </div>
      
      {/* Faixa divisória */}
      <div className="mb-4" style={{ borderTop: '1px solid #d0d0d0', paddingTop: '12px' }}></div>
      
      <div className="space-y-2">
        <button
          onClick={handleEditProfile}
          className="w-full text-left px-3 py-2 font-pixel transition-all hover:bg-white/50 touch-manipulation min-h-[48px]"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #e8e8e2',
            color: '#111',
            fontSize: '16px',
            borderRadius: '8px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#666';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#111';
          }}
        >
          {t('display.selectStatus')}
        </button>

        <button
          onClick={handleChangeStyle}
          className="w-full text-left px-3 py-2 font-pixel transition-all hover:bg-white/50 touch-manipulation min-h-[48px]"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #e8e8e2',
            color: '#111',
            fontSize: '16px',
            borderRadius: '8px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#666';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#111';
          }}
        >
          {t('display.changeStyle')}
        </button>

        <button
          onClick={handleViewHistory}
          className="w-full text-left px-3 py-2 font-pixel transition-all hover:bg-white/50 touch-manipulation min-h-[48px]"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #e8e8e2',
            color: '#111',
            fontSize: '16px',
            borderRadius: '8px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#666';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#111';
          }}
        >
          {t('display.viewHistory')}
        </button>

        <button
          onClick={handleAchievements}
          className="w-full text-left px-3 py-2 font-pixel transition-all hover:bg-white/50 touch-manipulation min-h-[48px]"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #e8e8e2',
            color: '#111',
            fontSize: '16px',
            borderRadius: '8px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#666';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#111';
          }}
        >
          {t('display.achievements')}
        </button>
      </div>
    </div>
  );
}

