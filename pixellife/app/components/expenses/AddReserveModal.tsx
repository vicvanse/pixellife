"use client";

import { useState, useEffect } from "react";

interface AddReserveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (description: string, value: number, dateKey: string) => void;
  initialDate?: string; // YYYY-MM-DD
}

export function AddReserveModal({
  isOpen,
  onClose,
  onSave,
  initialDate,
}: AddReserveModalProps) {
  const [description, setDescription] = useState("");
  const [value, setValue] = useState("");
  const [type, setType] = useState<"retirar" | "adicionar">("adicionar");
  // Usar Date internamente, converter para string só no input
  const [date, setDate] = useState<Date>(new Date());
  
  // Sincronizar data quando modal abrir
  useEffect(() => {
    if (isOpen && initialDate) {
      setDate(new Date(initialDate + "T00:00:00"));
    } else if (isOpen && !initialDate) {
      setDate(new Date());
    }
  }, [isOpen, initialDate]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !value) return;

    const numValue = parseFloat(value.replace(",", "."));
    if (isNaN(numValue) || numValue <= 0) {
      alert("Valor inválido! Digite apenas valores positivos.");
      return;
    }

    // Se for retirar, torna o valor negativo
    const finalValue = type === "retirar" ? -numValue : numValue;

    // Converter Date para dateKey string (YYYY-MM-DD)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateKey = `${year}-${month}-${day}`;

    onSave(description.trim(), finalValue, dateKey);
    setDescription("");
    setValue("");
    setType("adicionar");
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
          <h2 className="font-pixel-bold" style={{ color: '#333', fontSize: '18px', fontWeight: 600 }}>Movimentar Reserva</h2>
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
          {/* Data */}
          <div>
            <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>Data:</label>
            <input
              type="date"
              value={(() => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const day = String(date.getDate()).padStart(2, "0");
                return `${year}-${month}-${day}`;
              })()}
              onChange={(e) => {
                if (e.target.value) {
                  setDate(new Date(e.target.value + "T00:00:00"));
                }
              }}
              className="w-full px-3 py-2 rounded font-pixel focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{
                backgroundColor: '#fff',
                border: '1px solid #d6d6d6',
                fontSize: '16px',
              }}
              required
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>Descrição:</label>
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
              placeholder="Ex: Transferência para poupança"
            />
          </div>

          {/* Tipo: Adicionar ou Retirar */}
          <div>
            <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>Tipo:</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType("adicionar")}
                className={`flex-1 px-4 py-2 rounded transition-colors`}
                style={{
                  backgroundColor: type === "adicionar" ? "#16a34a" : "#f5f5f5",
                  border: `1px solid ${type === "adicionar" ? "#0f9d58" : "#d4d4d4"}`,
                  color: type === "adicionar" ? "#fff" : "#555",
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: '8px',
                }}
              >
                Adicionar
              </button>
              <button
                type="button"
                onClick={() => setType("retirar")}
                className={`flex-1 px-4 py-2 rounded transition-colors`}
                style={{
                  backgroundColor: type === "retirar" ? "#dc2626" : "#f5f5f5",
                  border: `1px solid ${type === "retirar" ? "#b91c1c" : "#d4d4d4"}`,
                  color: type === "retirar" ? "#fff" : "#555",
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: '8px',
                }}
              >
                Retirar
              </button>
            </div>
          </div>

          {/* Valor */}
          <div>
            <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>Valor (apenas valores positivos):</label>
            <div className="flex items-center gap-2">
              {type === "retirar" && (
                <span className="text-2xl font-pixel-bold" style={{ color: '#dc2626' }}>-</span>
              )}
              {type === "adicionar" && (
                <span className="text-2xl font-pixel-bold" style={{ color: '#16a34a' }}>+</span>
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
              {type === "retirar" 
                ? "O valor será automaticamente convertido para negativo (-)" 
                : "O valor será registrado como positivo (+)"}
            </p>
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
              Cancelar
            </button>
            <button
              type="submit"
              className={`flex-1 px-4 py-2 rounded transition-colors hover:opacity-90`}
              style={{
                backgroundColor: type === "adicionar" ? "#7aff7a" : "#dc2626",
                border: `1px solid ${type === "adicionar" ? "#0f9d58" : "#b91c1c"}`,
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '8px',
              }}
            >
              Adicionar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


















