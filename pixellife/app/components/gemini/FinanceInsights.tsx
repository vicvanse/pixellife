'use client';

import { useState } from 'react';
import { useGemini } from '../../hooks/useGemini';
import { useExpenses } from '../../hooks/useExpenses';

interface FinanceInsightsProps {
  dateKey: string;
}

export function FinanceInsights({ dateKey }: FinanceInsightsProps) {
  const [insights, setInsights] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const { analyzeFinance, loading } = useGemini();
  const { getAccountMoney, calculateDailyTotal, formatDateKey } = useExpenses();

  const handleAnalyze = async () => {
    try {
      // Preparar resumo dos dados
      const accountMoney = getAccountMoney(dateKey);
      const dailyTotal = calculateDailyTotal(dateKey);
      const dataSummary = `
Data: ${dateKey}
Dinheiro em Conta: R$ ${accountMoney.toFixed(2)}
Total Diário: R$ ${dailyTotal.toFixed(2)}
      `.trim();

      const result = await analyzeFinance(dataSummary, question || 'Analise minha situação financeira e dê insights.');
      setInsights(result.text);
    } catch (error) {
      console.error('Erro ao analisar:', error);
    }
  };

  return (
    <div className="p-4 border-2 border-black rounded" style={{ backgroundColor: '#fff' }}>
      <h3 className="font-pixel-bold mb-3">💡 Insights Financeiros (Gemini)</h3>
      
      <div className="mb-3">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ex: Como posso economizar mais?"
          className="w-full px-3 py-2 border-2 border-black rounded font-pixel"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleAnalyze();
            }
          }}
        />
      </div>

      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="w-full px-4 py-2 font-pixel-bold border-2 border-black touch-manipulation min-h-[48px] disabled:opacity-50"
        style={{
          backgroundColor: loading ? '#ccc' : '#2196f3',
          color: '#fff',
        }}
      >
        {loading ? 'Analisando...' : 'Obter Insights'}
      </button>

      {insights && (
        <div className="mt-4 p-3 border-2 border-black rounded bg-blue-50 font-pixel text-sm">
          <div className="whitespace-pre-wrap">{insights}</div>
        </div>
      )}
    </div>
  );
}

