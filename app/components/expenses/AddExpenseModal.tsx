"use client";

import { useState } from "react";
import { useLanguage } from "../../context/LanguageContext";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (description: string, value: number, relatedGoalId?: number, category?: string) => void;
  initialGoalId?: number;
}

const CATEGORIES = [
  'Geral',
  'Alimentação',
  'Transporte',
  'Lazer',
  'Saúde',
  'Compras',
  'Contas',
  'Educação',
  'Receita',
  'Outros',
];

export function AddExpenseModal({
  isOpen,
  onClose,
  onSave,
  initialGoalId,
}: AddExpenseModalProps) {
  const { t, tString } = useLanguage();
  const [description, setDescription] = useState("");
  const [value, setValue] = useState("");
  const [type, setType] = useState<"gasto" | "ganho">("gasto");
  const [category, setCategory] = useState("Geral");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !value) return;

    const numValue = parseFloat(value.replace(",", "."));
    if (isNaN(numValue) || numValue <= 0) {
      alert("Valor inválido! Digite apenas valores positivos.");
      return;
    }

    // Se for gasto, torna o valor negativo
    const finalValue = type === "gasto" ? -numValue : numValue;

    onSave(description.trim(), finalValue, initialGoalId, category);
    setDescription("");
    setValue("");
    setType("gasto");
    setCategory("Geral");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 max-w-md w-full mx-4"
        style={{
          borderRadius: '10px',
          border: '1px solid #e0e0e0',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.12)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-pixel-bold" style={{ color: '#333', fontSize: '18px', fontWeight: 600 }}>{t('common.addExpenseIncome')}</h2>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Descrição */}
          <div>
            <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>{t('common.description')}:</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded font-pixel focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{
                backgroundColor: '#fff',
                border: '1px solid #d6d6d6',
                fontSize: '16px',
              }}
              required
              maxLength={32}
              placeholder={tString('common.descriptionPlaceholder')}
            />
          </div>

          {/* Tipo: Gasto ou Ganho */}
          <div>
            <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>{t('common.type')}:</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType("gasto")}
                className={`flex-1 px-4 py-2 rounded transition-colors ${
                  type === "gasto"
                    ? ""
                    : ""
                }`}
                style={{
                  backgroundColor: type === "gasto" ? "#dc2626" : "#f5f5f5",
                  border: `1px solid ${type === "gasto" ? "#b91c1c" : "#d4d4d4"}`,
                  color: type === "gasto" ? "#fff" : "#555",
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: '8px',
                }}
              >
                {t('common.gasto')}
              </button>
              <button
                type="button"
                onClick={() => setType("ganho")}
                className={`flex-1 px-4 py-2 rounded transition-colors ${
                  type === "ganho"
                    ? ""
                    : ""
                }`}
                style={{
                  backgroundColor: type === "ganho" ? "#16a34a" : "#f5f5f5",
                  border: `1px solid ${type === "ganho" ? "#0f9d58" : "#d4d4d4"}`,
                  color: type === "ganho" ? "#fff" : "#555",
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: '8px',
                }}
              >
                {t('common.ganho')}
              </button>
            </div>
          </div>

          {/* Valor */}
          <div>
            <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>{t('common.value')}:</label>
            <div className="flex items-center gap-2">
              {type === "gasto" && (
                <span className="text-2xl font-pixel-bold" style={{ color: '#dc2626' }}>-</span>
              )}
              <input
                type="text"
                value={value}
                onChange={(e) => {
                  // Permite apenas números positivos e vírgula/ponto
                  const val = e.target.value.replace(/[^\d,.]/g, "");
                  setValue(val);
                }}
                className="flex-1 px-3 py-2 rounded font-pixel focus:outline-none focus:ring-2 focus:ring-blue-400"
                style={{
                  backgroundColor: '#fff',
                  border: '1px solid #d6d6d6',
                  fontSize: '16px',
                }}
                required
                placeholder="100.00"
              />
            </div>
            <p className="font-pixel mt-1" style={{ color: '#666', fontSize: '12px' }}>
              {type === "gasto" 
                ? "O valor será automaticamente convertido para negativo (-)" 
                : "O valor será registrado como positivo (+)"}
            </p>
          </div>

          {/* Categoria */}
          <div>
            <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>{t('common.category')}:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded font-pixel focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{
                backgroundColor: '#fff',
                border: '1px solid #d6d6d6',
                fontSize: '16px',
              }}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Botões */}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded transition-colors hover:opacity-90"
              style={{
                backgroundColor: '#f5f5f5',
                border: '1px solid #d4d4d4',
                color: '#555',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '8px',
              }}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded transition-colors hover:opacity-90"
              style={{
                backgroundColor: '#7aff7a',
                border: '1px solid #0f9d58',
                color: '#111',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '8px',
              }}
            >
              {t('common.add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

