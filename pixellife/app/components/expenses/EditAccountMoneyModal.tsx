'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface EditAccountMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dateKey: string, value: number) => Promise<void>;
  initialDate?: Date;
  initialValue?: number;
}

export function EditAccountMoneyModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialDate = new Date(),
  initialValue = 0
}: EditAccountMoneyModalProps) {
  const { t } = useLanguage();
  const [date, setDate] = useState<Date>(initialDate);
  const [value, setValue] = useState<string>('');

  // Sincronizar date e value quando o modal abre
  useEffect(() => {
    if (isOpen) {
      setDate(initialDate);
      setValue(initialValue.toString());
    }
  }, [isOpen, initialDate, initialValue]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!value || value.trim() === '') {
      return;
    }

    const parsed = parseFloat(value.replace(",", "."));
    if (isNaN(parsed)) {
      return;
    }

    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    await onSave(dateKey, parsed);
    setValue('');
    onClose();
  };

  const handleCancel = () => {
    setValue('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 max-w-md w-full mx-4 rounded"
        style={{
          border: '1px solid #e5e5e5',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-pixel-bold" style={{ color: '#111', fontSize: '18px' }}>
            {t('common.editAccountMoney')}
          </h2>
          <button
            onClick={onClose}
            className="px-2 py-1 rounded font-pixel-bold transition-colors hover:bg-gray-100"
            style={{
              backgroundColor: '#f5f5f5',
              border: '1px solid #e5e5e5',
              color: '#555',
              fontSize: '14px',
            }}
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <label className="font-pixel text-xs block mb-1" style={{ color: '#666' }}>
            Data
          </label>
          <input
            type="date"
            value={`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`}
            onChange={(e) => {
              const newDate = new Date(e.target.value);
              if (!isNaN(newDate.getTime())) {
                setDate(newDate);
              }
            }}
            className="w-full px-3 py-2 rounded font-pixel"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #e5e5e5',
              color: '#111',
              fontSize: '14px',
            }}
          />
        </div>

        <div className="mb-6">
          <label className="font-pixel text-xs block mb-1" style={{ color: '#666' }}>
            Valor (R$)
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={value}
            onChange={(e) => {
              // Permite números, vírgula e ponto
              const cleaned = e.target.value.replace(/[^\d,.-]/g, '');
              setValue(cleaned);
            }}
            placeholder="0,00"
            className="w-full px-3 py-2 rounded font-pixel"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #e5e5e5',
              color: '#111',
              fontSize: '16px',
            }}
            autoFocus
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 rounded font-pixel transition-all hover:opacity-90"
            style={{
              backgroundColor: '#f5f5f5',
              border: '1px solid #e5e5e5',
              color: '#666',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 rounded font-pixel transition-all hover:opacity-90"
            style={{
              backgroundColor: '#9e9e9e',
              border: '1px solid #9e9e9e',
              color: '#FFFFFF',
            }}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

