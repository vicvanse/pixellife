"use client";

import { useState, useEffect } from "react";
import {
  FinancialEntry,
  EntryFrequency,
  EntryNature,
  RecurrenceType,
  PaymentMethod,
} from "@/app/hooks/useFinancialEntries";

interface AddFinancialEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: Omit<FinancialEntry, "id" | "createdAt" | "updatedAt">) => void;
  initialDate?: string; // YYYY-MM-DD
  editingEntry?: FinancialEntry;
}

export function AddFinancialEntryModal({
  isOpen,
  onClose,
  onSave,
  initialDate,
  editingEntry,
}: AddFinancialEntryModalProps) {
  const [frequency, setFrequency] = useState<EntryFrequency>("pontual");
  const [nature, setNature] = useState<EntryNature>("gasto");
  
  // Campos do formulário
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(initialDate || new Date().toISOString().substring(0, 10));
  const [startDate, setStartDate] = useState(initialDate || new Date().toISOString().substring(0, 10));
  const [endDate, setEndDate] = useState<string | null>(null);
  const [recurrence, setRecurrence] = useState<RecurrenceType>("mensal");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("dinheiro");
  const [category, setCategory] = useState("");
  const [installments, setInstallments] = useState<{ total: number; current: number } | null>(null);

  // Reset ao abrir/fechar ou quando editingEntry mudar
  useEffect(() => {
    if (isOpen) {
      if (editingEntry) {
        // Modo edição: preencher com dados existentes
        setFrequency(editingEntry.frequency);
        setNature(editingEntry.nature);
        setDescription(editingEntry.description);
        setAmount(Math.abs(editingEntry.amount).toFixed(2).replace('.', ','));
        setCategory(editingEntry.category || "");
        
        if (editingEntry.frequency === "pontual") {
          setDate(editingEntry.date || initialDate || new Date().toISOString().substring(0, 10));
          if (editingEntry.paymentMethod) {
            setPaymentMethod(editingEntry.paymentMethod);
          }
        } else {
          setStartDate(editingEntry.startDate || initialDate || new Date().toISOString().substring(0, 10));
          setEndDate(editingEntry.endDate || null);
          setRecurrence(editingEntry.recurrence || "mensal");
          if (editingEntry.paymentMethod) {
            setPaymentMethod(editingEntry.paymentMethod);
          }
          if (editingEntry.installments) {
            setInstallments(editingEntry.installments);
          }
        }
      } else {
        // Modo criação: resetar campos
        setFrequency("pontual");
        setNature("gasto");
        setDescription("");
        setAmount("");
        setDate(initialDate || new Date().toISOString().substring(0, 10));
        setStartDate(initialDate || new Date().toISOString().substring(0, 10));
        setEndDate(null);
        setRecurrence("mensal");
        setPaymentMethod("dinheiro");
        setCategory("");
        setInstallments(null);
      }
    }
  }, [isOpen, initialDate, editingEntry]);

  if (!isOpen) return null;

  const handleSave = () => {
    const parsedAmount = parseFloat(amount.replace(",", "."));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Por favor, insira um valor válido.");
      return;
    }
    if (!description.trim()) {
      alert("Por favor, insira uma descrição.");
      return;
    }

    const entry: Omit<FinancialEntry, "id" | "createdAt" | "updatedAt"> = {
      description: description.trim(),
      nature: nature,
      frequency: frequency,
      amount: nature === "gasto" ? -Math.abs(parsedAmount) : Math.abs(parsedAmount),
      category: category.trim() || undefined,
    };

    if (frequency === "pontual") {
      entry.date = date;
      if (nature === "gasto") {
        entry.paymentMethod = paymentMethod;
      }
    } else {
      entry.startDate = startDate;
      entry.endDate = endDate || null;
      entry.recurrence = recurrence;
      if (nature === "gasto") {
        entry.paymentMethod = paymentMethod;
        if (installments && installments.total > 1) {
          entry.installments = installments;
        }
      }
    }

    onSave(entry);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-4 max-w-lg w-full mx-4"
        onClick={(e) => e.stopPropagation()}
        style={{ 
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.12)',
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-pixel-bold" style={{ color: '#333', fontSize: '16px', fontWeight: 600 }}>
            {editingEntry ? 'Editar Entrada Financeira' : 'Adicionar Entrada Financeira'}
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

        {/* Frequência e Natureza lado a lado */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '14px' }}>
              Frequência:
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setFrequency("pontual")}
                className="flex-1 px-2 py-1.5 rounded font-pixel transition-colors text-sm"
                style={{
                  backgroundColor: frequency === "pontual" ? '#e8f5e9' : '#f5f5f5',
                  border: `1px solid ${frequency === "pontual" ? '#4caf50' : '#d6d6d6'}`,
                  color: frequency === "pontual" ? '#111' : '#666',
                }}
              >
                Pontual
              </button>
              <button
                onClick={() => setFrequency("recorrente")}
                className="flex-1 px-2 py-1.5 rounded font-pixel transition-colors text-sm"
                style={{
                  backgroundColor: frequency === "recorrente" ? '#e3f2fd' : '#f5f5f5',
                  border: `1px solid ${frequency === "recorrente" ? '#2196f3' : '#d6d6d6'}`,
                  color: frequency === "recorrente" ? '#111' : '#666',
                }}
              >
                Recorrente
              </button>
            </div>
          </div>
          <div>
            <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '14px' }}>
              Natureza:
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setNature("gasto")}
                className="flex-1 px-2 py-1.5 rounded font-pixel transition-colors text-sm"
                style={{
                  backgroundColor: nature === "gasto" ? '#ffebee' : '#f5f5f5',
                  border: `1px solid ${nature === "gasto" ? '#f44336' : '#d6d6d6'}`,
                  color: nature === "gasto" ? '#111' : '#666',
                }}
              >
                Gasto
              </button>
              <button
                onClick={() => setNature("ganho")}
                className="flex-1 px-2 py-1.5 rounded font-pixel transition-colors text-sm"
                style={{
                  backgroundColor: nature === "ganho" ? '#e8f5e9' : '#f5f5f5',
                  border: `1px solid ${nature === "ganho" ? '#4caf50' : '#d6d6d6'}`,
                  color: nature === "ganho" ? '#111' : '#666',
                }}
              >
                Ganho
              </button>
            </div>
          </div>
        </div>

        {/* Descrição */}
        <div className="mb-3">
          <label className="block font-pixel-bold mb-1.5" style={{ color: '#333', fontSize: '14px' }}>
            Descrição:
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded font-pixel focus:outline-none focus:ring-2 focus:ring-blue-400"
            style={{ 
              fontSize: '14px',
              backgroundColor: '#fff',
              border: '1px solid #d6d6d6',
            }}
            placeholder="Ex: Almoço, Salário, Aluguel"
          />
        </div>

        {/* Valor e Frequência (para recorrente) lado a lado */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <label className="block font-pixel-bold mb-1.5" style={{ color: '#333', fontSize: '14px' }}>
              Valor:
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9,.]/g, '').replace('.', ','))}
              className="w-full px-2.5 py-1.5 rounded font-pixel focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{ 
                fontSize: '14px',
                backgroundColor: '#fff',
                border: '1px solid #d6d6d6',
              }}
              placeholder="Ex: 1500,00"
            />
          </div>
          {frequency === "recorrente" && (
            <div>
              <label className="block font-pixel-bold mb-1.5" style={{ color: '#333', fontSize: '14px' }}>
                Frequência:
              </label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
                className="w-full px-2.5 py-1.5 rounded font-pixel focus:outline-none focus:ring-2 focus:ring-blue-400"
                style={{ 
                  fontSize: '14px',
                  backgroundColor: '#fff',
                  border: '1px solid #d6d6d6',
                }}
              >
                <option value="mensal">Mensal</option>
                <option value="quinzenal">Quinzenal</option>
                <option value="anual">Anual</option>
              </select>
            </div>
          )}
        </div>

        {/* Campos condicionais baseados em frequência */}
        {frequency === "pontual" ? (
          <>
            {/* Data e Método de pagamento lado a lado (para pontual) */}
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block font-pixel-bold mb-1.5" style={{ color: '#333', fontSize: '14px' }}>
                  Data:
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded font-pixel focus:outline-none focus:ring-2 focus:ring-blue-400"
                  style={{ 
                    fontSize: '14px',
                    backgroundColor: '#fff',
                    border: '1px solid #d6d6d6',
                  }}
                />
              </div>
              {nature === "gasto" && (
                <div>
                  <label className="block font-pixel-bold mb-1.5" style={{ color: '#333', fontSize: '14px' }}>
                    Método:
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-2.5 py-1.5 rounded font-pixel focus:outline-none focus:ring-2 focus:ring-blue-400"
                    style={{ 
                      fontSize: '14px',
                      backgroundColor: '#fff',
                      border: '1px solid #d6d6d6',
                    }}
                  >
                    <option value="dinheiro">Dinheiro</option>
                    <option value="debito">Débito</option>
                    <option value="credito">Crédito</option>
                  </select>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Data de início e Data de fim lado a lado */}
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block font-pixel-bold mb-1.5" style={{ color: '#333', fontSize: '14px' }}>
                  Data Início:
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded font-pixel focus:outline-none focus:ring-2 focus:ring-blue-400"
                  style={{ 
                    fontSize: '14px',
                    backgroundColor: '#fff',
                    border: '1px solid #d6d6d6',
                  }}
                />
              </div>
              <div>
                <label className="block font-pixel-bold mb-1.5" style={{ color: '#333', fontSize: '14px' }}>
                  Data Fim <span style={{ color: '#999', fontSize: '11px' }}>(opc.)</span>:
                </label>
                <input
                  type="date"
                  value={endDate || ""}
                  onChange={(e) => setEndDate(e.target.value || null)}
                  className="w-full px-2.5 py-1.5 rounded font-pixel focus:outline-none focus:ring-2 focus:ring-blue-400"
                  style={{ 
                    fontSize: '14px',
                    backgroundColor: '#fff',
                    border: '1px solid #d6d6d6',
                  }}
                />
              </div>
            </div>
            {/* Método de pagamento e Parcelas lado a lado (apenas para gasto recorrente) */}
            {nature === "gasto" && (
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <label className="block font-pixel-bold mb-1.5" style={{ color: '#333', fontSize: '14px' }}>
                    Método:
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-2.5 py-1.5 rounded font-pixel focus:outline-none focus:ring-2 focus:ring-blue-400"
                    style={{ 
                      fontSize: '14px',
                      backgroundColor: '#fff',
                      border: '1px solid #d6d6d6',
                    }}
                  >
                    <option value="dinheiro">Dinheiro</option>
                    <option value="debito">Débito</option>
                    <option value="credito">Crédito</option>
                  </select>
                </div>
                <div>
                  <label className="block font-pixel-bold mb-1.5" style={{ color: '#333', fontSize: '14px' }}>
                    Parcelas <span style={{ color: '#999', fontSize: '11px' }}>(opc.)</span>:
                  </label>
                  <input
                    type="number"
                    placeholder="Total"
                    value={installments?.total || ""}
                    onChange={(e) => {
                      const total = parseInt(e.target.value);
                      if (total > 0) {
                        setInstallments({ total, current: 1 });
                      } else {
                        setInstallments(null);
                      }
                    }}
                    className="w-full px-2.5 py-1.5 rounded font-pixel focus:outline-none focus:ring-2 focus:ring-blue-400"
                    style={{ 
                      fontSize: '14px',
                      backgroundColor: '#fff',
                      border: '1px solid #d6d6d6',
                    }}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* Categoria (sempre visível) */}
        <div className="mb-4">
          <label className="block font-pixel-bold mb-1.5" style={{ color: '#333', fontSize: '14px' }}>
            Categoria <span style={{ color: '#999', fontSize: '11px' }}>(opcional)</span>:
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded font-pixel focus:outline-none focus:ring-2 focus:ring-blue-400"
            style={{ 
              fontSize: '14px',
              backgroundColor: '#fff',
              border: '1px solid #d6d6d6',
            }}
            placeholder="Ex: Alimentação, Transporte, Trabalho"
          />
        </div>

        {/* Botões */}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 px-3 py-2 rounded font-pixel-bold transition-colors hover:opacity-90 bg-green-400 text-white text-sm"
            style={{ border: '1px solid #0f9d58' }}
          >
            {editingEntry ? 'Salvar Alterações' : 'Salvar'}
          </button>
          <button
            onClick={onClose}
            className="px-3 py-2 rounded font-pixel-bold transition-colors hover:opacity-90 bg-gray-200 text-gray-700 text-sm"
            style={{ border: '1px solid #d4d4d4' }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
