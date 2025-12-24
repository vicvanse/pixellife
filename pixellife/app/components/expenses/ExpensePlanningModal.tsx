'use client';

import { useState, useEffect } from 'react';

interface ExpensePlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (limit: number, resetDay: number) => void;
  initialLimit?: number;
  initialResetDay?: number;
  daysRemaining?: number;
}

export function ExpensePlanningModal({
  isOpen,
  onClose,
  onSave,
  initialLimit,
  initialResetDay,
  daysRemaining,
}: ExpensePlanningModalProps) {
  const [limit, setLimit] = useState('');
  const [resetDay, setResetDay] = useState('1');

  useEffect(() => {
    if (isOpen) {
      if (initialLimit !== undefined) setLimit(String(initialLimit));
      if (initialResetDay !== undefined) setResetDay(String(initialResetDay));
    }
  }, [isOpen, initialLimit, initialResetDay]);

  if (!isOpen) return null;

  const handleSave = () => {
    const numLimit = parseFloat(limit.replace(',', '.'));
    const day = parseInt(resetDay);

    if (isNaN(numLimit) || numLimit <= 0) {
      alert('Limite inválido!');
      return;
    }

    if (isNaN(day) || day < 1 || day > 31) {
      alert('Dia inválido! Use um valor entre 1 e 31.');
      return;
    }

    onSave(numLimit, day);
    onClose();
  };

  const estimatedDaily = daysRemaining && daysRemaining > 0 
    ? (parseFloat(limit.replace(',', '.')) / daysRemaining).toFixed(2)
    : null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{
          borderRadius: '10px',
          border: '1px solid #e0e0e0',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.12)',
          padding: '24px 16px',
        }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-pixel-bold" style={{ color: '#333', fontSize: '18px', fontWeight: 600 }}>
            Planejamento de Gastos do Mês
          </h2>
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

        <div className="space-y-4">
          {/* Limite Total */}
          <div>
            <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>
              Limite Total do Mês (R$):
            </label>
            <input
              type="text"
              value={limit}
              onChange={(e) => {
                const val = e.target.value.replace(/[^\d,.]/g, '');
                setLimit(val);
              }}
              className="w-full px-3 py-2 rounded font-pixel focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{
                backgroundColor: '#fff',
                border: '1px solid #d6d6d6',
                fontSize: '16px',
                borderRadius: '6px',
              }}
              placeholder="2000.00"
            />
          </div>

          {/* Reset Diário */}
          <div>
            <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>
              Reset Diário (dia 1-31):
            </label>
            <input
              type="number"
              value={resetDay}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || (parseInt(val) >= 1 && parseInt(val) <= 31)) {
                  setResetDay(val);
                }
              }}
              min="1"
              max="31"
              className="w-full px-3 py-2 rounded font-pixel focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{
                backgroundColor: '#fff',
                border: '1px solid #d6d6d6',
                fontSize: '16px',
                borderRadius: '6px',
              }}
            />
          </div>

          {/* Mensagem automática */}
          {estimatedDaily && (
            <div 
              className="p-3 rounded"
              style={{
                backgroundColor: '#e3f2fd',
                border: '1px solid #6daffe',
              }}
            >
              <p className="font-pixel text-sm" style={{ color: '#1976d2' }}>
                Limite diário estimado: <strong>R$ {estimatedDaily}</strong> (limite total ÷ {daysRemaining} dias restantes)
              </p>
            </div>
          )}
        </div>

        {/* Botões */}
        <div className="flex gap-2 mt-6">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 rounded font-pixel-bold transition-colors hover:opacity-90"
            style={{
              backgroundColor: '#7aff7a',
              border: '1px solid #0f9d58',
              color: '#111',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '8px',
            }}
          >
            Salvar Planejamento
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded font-pixel-bold transition-colors hover:opacity-90"
            style={{
              backgroundColor: '#f5f5f5',
              border: '1px solid #d4d4d4',
              color: '#555',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '8px',
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

