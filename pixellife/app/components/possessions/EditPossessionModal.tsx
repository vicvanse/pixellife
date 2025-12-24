"use client";

import { useState, useEffect } from "react";
import { AssetGoal } from "../../hooks/usePossessions";
import { useLanguage } from "../../context/LanguageContext";

interface EditPossessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  possession: AssetGoal | null;
  onUpdate: (id: number, data: Partial<AssetGoal>) => void;
}

// Lista de ícones disponíveis
// Adicione novos ícones aqui quando necessário
const AVAILABLE_ICONS: string[] = [
  "/item1.png",
  "/item2.png",
];

export function EditPossessionModal({
  isOpen,
  onClose,
  possession,
  onUpdate,
}: EditPossessionModalProps) {
  const { t, tString } = useLanguage();
  
  const POSSESSION_TYPES: Array<{ value: AssetGoal["type"]; label: string }> = [
    { value: "house", label: tString('goals.typeHouse') },
    { value: "vehicle", label: tString('goals.typeVehicle') },
    { value: "investment", label: tString('goals.typeInvestment') },
    { value: "education", label: tString('goals.typeEducation') },
    { value: "custom", label: tString('goals.typeCustom') },
  ];
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<AssetGoal["type"]>("custom");
  const [icon, setIcon] = useState(AVAILABLE_ICONS[0]);
  const [targetValue, setTargetValue] = useState("");
  const [status, setStatus] = useState<"in-progress" | "completed" | "legal-issues">("in-progress");

  // Carregar dados do objetivo quando o modal abrir
  useEffect(() => {
    if (possession && isOpen) {
      setTitle(possession.title || (possession as any).name || ""); // Suporte para migração
      setDescription(possession.description || "");
      setType(possession.type);
      setIcon(possession.icon);
      setTargetValue(possession.targetValue.toString().replace(".", ","));
      setStatus(possession.status === "completed" || possession.status === "legal-issues" ? possession.status : "in-progress");
    }
  }, [possession, isOpen]);

  if (!isOpen || !possession) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetValue) return;

    const value = parseFloat(targetValue.replace(",", "."));
    if (isNaN(value) || value <= 0) {
      alert("Valor alvo inválido!");
      return;
    }

    onUpdate(possession.id, {
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      icon,
      targetValue: value,
      status,
    });

    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
        style={{
          borderRadius: '10px',
          border: '1px solid #e0e0e0',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.12)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-pixel-bold" style={{ color: '#333', fontSize: '18px', fontWeight: 600 }}>{t('common.editGoal')}</h2>
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
          {/* Título */}
          <div>
            <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>Título:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded font-pixel focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{
                backgroundColor: '#fff',
                border: '1px solid #d6d6d6',
                fontSize: '16px',
              }}
              maxLength={24}
              required
              placeholder="Ex: Casa própria"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>{t('common.description')}:</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded font-pixel focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{
                backgroundColor: '#fff',
                border: '1px solid #d6d6d6',
                fontSize: '16px',
                minHeight: '80px',
                resize: 'vertical',
              }}
              maxLength={200}
              placeholder="Descrição opcional do objetivo"
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>{t('common.type')}:</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as AssetGoal["type"])}
              className="w-full px-3 py-2 rounded font-pixel focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{
                backgroundColor: '#fff',
                border: '1px solid #d6d6d6',
                fontSize: '16px',
              }}
            >
              {POSSESSION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Ícone */}
          <div>
            <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>{t('goals.icon')}</label>
            <div className="grid grid-cols-3 gap-2">
              {AVAILABLE_ICONS.map((iconPath) => (
                <button
                  key={iconPath}
                  type="button"
                  onClick={() => setIcon(iconPath)}
                  className={`p-2 rounded transition-colors ${
                    icon === iconPath ? "ring-2 ring-blue-400 bg-blue-50" : "border border-[#dcdcdc] hover:bg-gray-50"
                  }`}
                >
                  <img
                    src={iconPath}
                    alt="Icon"
                    className="object-contain image-render-pixel mx-auto"
                    style={{ 
                      width: '64px',
                      height: '64px',
                      objectFit: 'contain'
                    }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Valor Alvo */}
          <div>
            <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>{t('goals.targetValue')}:</label>
            <input
              type="text"
              value={targetValue}
              onChange={(e) => {
                const val = e.target.value.replace(/[^\d,.-]/g, "");
                setTargetValue(val);
              }}
              className="w-full px-3 py-2 rounded font-pixel focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{
                backgroundColor: '#fff',
                border: '1px solid #d6d6d6',
                fontSize: '16px',
              }}
              required
              placeholder="10000.00"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>{t('common.status')}</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "in-progress" | "completed" | "legal-issues")}
              className="w-full px-3 py-2 rounded font-pixel focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{
                backgroundColor: '#fff',
                border: '1px solid #d6d6d6',
                fontSize: '16px',
              }}
            >
              <option value="in-progress">{tString('goals.statusInProgress')}</option>
              <option value="completed">{tString('goals.completed')}</option>
              <option value="legal-issues">Problemas Legais</option>
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
              {t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

