"use client";

import { AssetGoal } from "../../hooks/usePossessions";
import { useLanguage } from "../../context/LanguageContext";

interface PossessionCardProps {
  possession: AssetGoal;
  accountMoney: number; // Dinheiro em conta do dia atual
  onClick: () => void;
  onBuy?: (id: number) => void;
}

export function PossessionCard({ possession, accountMoney, onClick, onBuy }: PossessionCardProps) {
  const { t, tString } = useLanguage();
  
  // Calcular progresso dinamicamente baseado no dinheiro em conta
  // Se quitado ou problemas legais, sempre 100%
  const currentProgress = possession.status === 'completed' || possession.status === 'legal-issues'
    ? possession.targetValue
    : Math.min(accountMoney, possession.targetValue); // Limitar ao target
  
  const progressPercentage = possession.targetValue > 0 
    ? Math.min((currentProgress / possession.targetValue) * 100, 100)
    : 0;

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStatusColor = (status: AssetGoal["status"]) => {
    switch (status) {
      case "completed":
        return ""; // Usar cor customizada via style (verde específico)
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
      case "completed":
        return { backgroundColor: '#7aff7a' }; // Verde específico como na imagem
      case "in-progress":
        return { backgroundColor: '#9e9e9e' };
      case "locked":
        return { backgroundColor: '#9e9e9e' }; // Mesma cor de "in-progress"
      default:
        return {};
    }
  };

  const getStatusText = (status: AssetGoal["status"]): string => {
    switch (status) {
      case "completed":
        return tString('goals.statusCompleted');
      case "legal-issues":
        return "Problemas Legais";
      case "in-progress":
        return tString('goals.statusInProgress');
      case "locked":
        return tString('goals.statusInProgress'); // Mostrar "Em progresso" ao invés de "Bloqueado"
      default:
        return "Desconhecido";
    }
  };

  const getTypeLabel = (type: AssetGoal["type"]): string => {
    switch (type) {
      case "house":
        return tString('goals.typeHouse');
      case "vehicle":
        return tString('goals.typeVehicle');
      case "investment":
        return tString('goals.typeInvestment');
      case "education":
        return tString('goals.typeEducation');
      case "custom":
        return tString('goals.typeCustom');
      default:
        return type;
    }
  };

  // Determinar cor da barra baseado no status
  const getProgressBarColor = () => {
    if (possession.status === 'completed') {
      return '#4caf50'; // Verde suave quando quitado
    }
    // Se chegou a 100%, usar verde (mesmo antes de comprar)
    if (progressPercentage >= 100) {
      return '#4caf50'; // Verde quando em 100%
    }
    return '#9e9e9e'; // Cinza para em progresso
  };

  const isReadyToBuy = progressPercentage >= 100 && possession.status !== 'completed' && possession.status !== 'legal-issues';

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-all"
      style={{ borderRadius: '4px' }}
    >
      {/* Cabeçalho do Card */}
      <div className="flex items-start justify-between mb-4">
        {/* Porcentagem na esquerda - não mostrar para completed ou legal-issues */}
        {possession.status !== 'completed' && possession.status !== 'legal-issues' && (
          <span className="font-pixel font-bold" style={{ color: '#111', fontSize: '16px' }}>
            {progressPercentage.toFixed(0)}%
          </span>
        )}
        
        {/* Título e Status no centro-direita */}
        <div className="flex-1 text-right mr-3">
          <h3 
            className="font-bold uppercase tracking-wide mb-1 line-clamp-2 flex items-center justify-end gap-1" 
            style={{ color: '#111', fontSize: '16px' }}
            title={possession.title}
          >
            <span>{possession.title}</span>
          </h3>
          {/* Status ou Botão Comprar */}
          {isReadyToBuy ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onBuy) {
                  onBuy(possession.id);
                }
              }}
              className="px-3 py-1 rounded font-pixel transition-colors hover:opacity-90"
              style={{
                backgroundColor: '#16a34a',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                border: 'none',
              }}
            >
              Comprar
            </button>
          ) : (
            <span 
              className="font-pixel"
              style={{ 
                color: possession.status === 'completed' ? '#4caf50' : possession.status === 'legal-issues' ? '#ffc107' : '#666',
                fontSize: '14px'
              }}
            >
              {getStatusText(possession.status)}
            </span>
          )}
        </div>
        
        {/* Ícone Pixel Art na direita */}
        <div className="bg-gray-50 flex items-center justify-center flex-shrink-0" style={{ borderRadius: '4px', overflow: 'hidden', width: '64px', height: '64px' }}>
          <img
            src={possession.icon}
            alt={possession.title || (possession as any).name || 'Objetivo'}
            className="image-render-pixel"
            style={{ 
              width: '64px',
              height: '64px',
              objectFit: 'contain',
              objectPosition: 'center',
              display: 'block',
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden' as any
            }}
          />
        </div>
      </div>

      {/* Barra de Progresso - Estilo Mapas */}
      <div className="relative mb-2">
        {possession.status !== 'completed' && possession.status !== 'legal-issues' ? (
          <div
            className="h-2 rounded"
            style={{ backgroundColor: "#e0e0e0" }}
          >
            <div
              className="h-full rounded transition-all duration-500"
              style={{
                width: `${progressPercentage}%`,
                backgroundColor: progressPercentage > 0 ? getProgressBarColor() : "#e0e0e0",
              }}
            />
          </div>
        ) : (
          // Espaço reservado para manter a mesma altura quando quitado ou problemas legais
          <div className="h-2" />
        )}
        {/* Símbolo de perigo para problemas legais - na região da barra */}
        {possession.status === 'legal-issues' && (
          <span 
            className="absolute right-0 top-0 font-pixel font-bold flex-shrink-0" 
            style={{ 
              color: '#ffc107', 
              fontSize: '18px',
              transform: 'translateY(-2px)'
            }}
          >
            ⚠
          </span>
        )}
      </div>

      {/* Valores Monetários (Rodapé) */}
      <div className="flex justify-between items-end font-pixel mt-1" style={{ color: '#666', fontSize: '14px' }}>
        <span>
          {t('goals.current')}: <b style={{ color: '#111' }}>{formatCurrency(currentProgress)}</b>
        </span>
        <span>
          {t('goals.target')}: {formatCurrency(possession.targetValue)}
        </span>
      </div>

      {/* Tipo */}
      <div className="font-pixel mt-2" style={{ color: '#999', fontSize: '14px' }}>
        {t('goals.type')}: {getTypeLabel(possession.type)}
      </div>
    </div>
  );
}


















