"use client";

import React, { useState, useEffect } from "react";
import {
  FinancialCommitment,
  CommitmentType,
  PaymentMethod,
  RecurrenceFrequency,
} from "@/app/hooks/useFinancialCommitments";

interface FinancialCommitmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (commitment: Omit<FinancialCommitment, "id" | "createdAt" | "updatedAt">) => void;
  initialCommitment?: FinancialCommitment | null;
}

export function FinancialCommitmentModal({
  isOpen,
  onClose,
  onSave,
  initialCommitment,
}: FinancialCommitmentModalProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<CommitmentType>("recurring");
  const [value, setValue] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [category, setCategory] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("credit");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [frequency, setFrequency] = useState<RecurrenceFrequency>("monthly");
  const [totalInstallments, setTotalInstallments] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (initialCommitment) {
        setTitle(initialCommitment.title);
        setType(initialCommitment.type);
        setValue(initialCommitment.value.toString());
        setTotalValue(initialCommitment.totalValue?.toString() || "");
        setCategory(initialCommitment.category || "");
        setPaymentMethod(initialCommitment.paymentMethod);
        setStartDate(initialCommitment.startDate);
        setEndDate(initialCommitment.endDate || "");
        setFrequency(initialCommitment.frequency || "monthly");
        setTotalInstallments(initialCommitment.totalInstallments?.toString() || "");
      } else {
        // Reset para novo compromisso
        const today = new Date().toISOString().split("T")[0];
        setTitle("");
        setType("recurring");
        setValue("");
        setTotalValue("");
        setCategory("");
        setPaymentMethod("credit");
        setStartDate(today);
        setEndDate("");
        setFrequency("monthly");
        setTotalInstallments("");
      }
    }
  }, [isOpen, initialCommitment]);

  const handleSave = () => {
    if (!title.trim() || !value || !startDate) {
      alert("Preencha pelo menos: Descrição, Valor e Data de início");
      return;
    }

    const parsedValue = parseFloat(value.replace(",", "."));
    if (isNaN(parsedValue) || parsedValue <= 0) {
      alert("Valor inválido");
      return;
    }

    const commitmentData: Omit<FinancialCommitment, "id" | "createdAt" | "updatedAt"> = {
      title: title.trim(),
      type,
      value: parsedValue,
      category: category.trim() || undefined,
      paymentMethod,
      startDate,
      endDate: endDate || undefined,
      active: true,
    };

    if (type === "recurring") {
      commitmentData.frequency = frequency;
    } else if (type === "installment") {
      const installments = parseInt(totalInstallments);
      if (isNaN(installments) || installments <= 0) {
        alert("Número de parcelas inválido");
        return;
      }
      commitmentData.totalInstallments = installments;
      
      // Se forneceu valor total, calcular valor da parcela
      if (totalValue) {
        const parsedTotal = parseFloat(totalValue.replace(",", "."));
        if (!isNaN(parsedTotal) && parsedTotal > 0) {
          commitmentData.totalValue = parsedTotal;
          commitmentData.value = parsedTotal / installments;
        }
      }
    }

    onSave(commitmentData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white border-4 border-black max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto p-6 shadow-[8px_8px_0_0_#000] font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {initialCommitment ? "Editar Compromisso" : "Novo Compromisso Financeiro"}
          </h2>
          <button
            onClick={onClose}
            className="bg-red-400 border-4 border-black px-4 py-2 font-bold hover:bg-red-500 shadow-[4px_4px_0_0_#000]"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Descrição */}
          <div>
            <label className="block font-bold mb-2">Descrição *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Academia, Notebook, Cartão Nubank"
              className="w-full px-3 py-2 border-2 border-black font-mono"
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block font-bold mb-2">Tipo *</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="recurring"
                  checked={type === "recurring"}
                  onChange={(e) => setType(e.target.value as CommitmentType)}
                />
                <span>Recorrente</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="installment"
                  checked={type === "installment"}
                  onChange={(e) => setType(e.target.value as CommitmentType)}
                />
                <span>Parcelado</span>
              </label>
            </div>
          </div>

          {/* Valor */}
          <div>
            <label className="block font-bold mb-2">
              {type === "installment" ? "Valor da Parcela *" : "Valor *"}
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0,00"
              className="w-full px-3 py-2 border-2 border-black font-mono"
            />
          </div>

          {/* Valor Total (apenas para parcelado) */}
          {type === "installment" && (
            <div>
              <label className="block font-bold mb-2">Valor Total (Opcional)</label>
              <input
                type="text"
                value={totalValue}
                onChange={(e) => setTotalValue(e.target.value)}
                placeholder="0,00"
                className="w-full px-3 py-2 border-2 border-black font-mono"
              />
              <p className="text-xs mt-1 text-gray-600">
                Se preenchido, o valor da parcela será calculado automaticamente
              </p>
            </div>
          )}

          {/* Número de Parcelas (apenas para parcelado) */}
          {type === "installment" && (
            <div>
              <label className="block font-bold mb-2">Número de Parcelas *</label>
              <input
                type="number"
                value={totalInstallments}
                onChange={(e) => setTotalInstallments(e.target.value)}
                placeholder="12"
                min="1"
                className="w-full px-3 py-2 border-2 border-black font-mono"
              />
            </div>
          )}

          {/* Frequência (apenas para recorrente) */}
          {type === "recurring" && (
            <div>
              <label className="block font-bold mb-2">Frequência *</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as RecurrenceFrequency)}
                className="w-full px-3 py-2 border-2 border-black font-mono"
              >
                <option value="monthly">Mensal</option>
                <option value="weekly">Semanal</option>
                <option value="annual">Anual</option>
              </select>
            </div>
          )}

          {/* Categoria */}
          <div>
            <label className="block font-bold mb-2">Categoria (Opcional)</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ex: Assinatura, Educação, Eletrônicos"
              className="w-full px-3 py-2 border-2 border-black font-mono"
            />
          </div>

          {/* Método de Pagamento */}
          <div>
            <label className="block font-bold mb-2">Método de Pagamento *</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2 border-2 border-black font-mono"
            >
              <option value="credit">Cartão de Crédito</option>
              <option value="debit">Débito</option>
              <option value="pix">Pix</option>
              <option value="cash">Dinheiro</option>
            </select>
          </div>

          {/* Data de Início */}
          <div>
            <label className="block font-bold mb-2">Data de Início *</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border-2 border-black font-mono"
            />
          </div>

          {/* Data de Fim (opcional, apenas para recorrente) */}
          {type === "recurring" && (
            <div>
              <label className="block font-bold mb-2">Data de Fim (Opcional)</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border-2 border-black font-mono"
              />
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={handleSave}
              className="flex-1 bg-green-400 border-4 border-black px-4 py-3 font-bold hover:bg-green-500 shadow-[4px_4px_0_0_#000]"
            >
              Salvar
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-400 border-4 border-black px-4 py-3 font-bold hover:bg-gray-500 shadow-[4px_4px_0_0_#000]"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


