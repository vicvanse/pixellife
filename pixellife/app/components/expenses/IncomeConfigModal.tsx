'use client';

import { useState, useEffect } from 'react';

interface IncomeConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (value: number, paymentDay: number, type: 'fixed' | 'variable') => void;
  initialValue?: number;
  initialPaymentDay?: number;
  initialType?: 'fixed' | 'variable';
}

export function IncomeConfigModal({
  isOpen,
  onClose,
  onSave,
  initialValue,
  initialPaymentDay,
  initialType,
}: IncomeConfigModalProps) {
  const [value, setValue] = useState('');
  const [paymentDay, setPaymentDay] = useState('1');
  const [type, setType] = useState<'fixed' | 'variable'>('fixed');

  useEffect(() => {
    if (isOpen) {
      if (initialValue !== undefined) setValue(String(initialValue));
      if (initialPaymentDay !== undefined) setPaymentDay(String(initialPaymentDay));
      if (initialType) setType(initialType);
    }
  }, [isOpen, initialValue, initialPaymentDay, initialType]);

  if (!isOpen) return null;

  const handleSave = () => {
    const numValue = parseFloat(value.replace(',', '.'));
    const day = parseInt(paymentDay);

    if (isNaN(numValue) || numValue <= 0) {
      alert('Valor inválido!');
      return;
    }

    if (isNaN(day) || day < 1 || day > 31) {
      alert('Dia inválido! Use um valor entre 1 e 31.');
      return;
    }

    onSave(numValue, day, type);
    onClose();
  };

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
            Renda Mensal
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
          {/* Valor da Renda */}
          <div>
            <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>
              Valor da Renda (R$):
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => {
                const val = e.target.value.replace(/[^\d,.]/g, '');
                setValue(val);
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

          {/* Dia de Recebimento */}
          <div>
            <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>
              Dia de Recebimento (1-31):
            </label>
            <input
              type="number"
              value={paymentDay}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || (parseInt(val) >= 1 && parseInt(val) <= 31)) {
                  setPaymentDay(val);
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

          {/* Tipo */}
          <div>
            <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>
              Tipo:
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setType('fixed')}
                className="flex-1 px-4 py-2 rounded transition-colors"
                style={{
                  backgroundColor: type === 'fixed' ? '#2563eb' : '#f5f5f5',
                  border: `1px solid ${type === 'fixed' ? '#1b5cff' : '#d4d4d4'}`,
                  color: type === 'fixed' ? '#fff' : '#555',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: '8px',
                }}
              >
                Fixo
              </button>
              <button
                onClick={() => setType('variable')}
                className="flex-1 px-4 py-2 rounded transition-colors"
                style={{
                  backgroundColor: type === 'variable' ? '#2563eb' : '#f5f5f5',
                  border: `1px solid ${type === 'variable' ? '#1b5cff' : '#d4d4d4'}`,
                  color: type === 'variable' ? '#fff' : '#555',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: '8px',
                }}
              >
                Variável
              </button>
            </div>
          </div>
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
            Salvar Renda
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

