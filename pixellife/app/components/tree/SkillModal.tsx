"use client";

import { useState, useEffect } from "react";
import { TreeSkill, SkillAction } from "../../hooks/useTree";
import { ProgressBar } from "./ProgressBar";
import { useConfirmation } from "../../context/ConfirmationContext";

interface SkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  skill: TreeSkill | null;
  onToggleAction: (skillId: string, actionId: string) => void;
  onReset: (skillId: string) => void;
  onDelete?: (skillId: string) => void;
}

export function SkillModal({
  isOpen,
  onClose,
  skill,
  onToggleAction,
  onReset,
  onDelete,
}: SkillModalProps) {
  const [localActions, setLocalActions] = useState<SkillAction[]>([]);
  const { showConfirmation } = useConfirmation();

  useEffect(() => {
    if (skill) {
      setLocalActions(skill.actions.map(a => ({ ...a })));
    }
  }, [skill]);

  if (!isOpen || !skill) return null;

  const handleToggleAction = (actionId: string) => {
    onToggleAction(skill.id, actionId);
    // Atualizar localmente para feedback imediato
    setLocalActions((prev) =>
      prev.map((a) => (a.id === actionId ? { ...a, completed: !a.completed } : a))
    );
  };

  const handleReset = () => {
    showConfirmation({
      message: "Tem certeza que deseja resetar todas as ações desta habilidade?",
      onConfirm: () => {
        onReset(skill.id);
        setLocalActions((prev) => prev.map((a) => ({ ...a, completed: false })));
      },
    });
  };

  const handleDelete = () => {
    showConfirmation({
      message: `Tem certeza que deseja excluir "${skill.name}"?\n\nEsta ação não pode ser desfeita.`,
      onConfirm: () => {
        if (onDelete) {
          onDelete(skill.id);
          onClose();
        }
      },
    });
  };

  // Recalcular progresso local
  const localProgress =
    localActions.length > 0
      ? Math.round((localActions.filter((a) => a.completed).length / localActions.length) * 100)
      : 0;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white border-4 border-black p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-[8px_8px_0_0_#000] font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <img
              src={skill.icon}
              alt={skill.name}
              className="w-16 h-16 object-contain image-render-pixel"
              style={{ imageRendering: "pixelated" }}
            />
            <div>
              <h2 className="text-2xl font-bold">{skill.name}</h2>
              {skill.type === "personal" && "categories" in skill && skill.categories.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {skill.categories.map((cat) => (
                    <span
                      key={cat}
                      className="bg-blue-200 border-2 border-black px-2 py-0.5 text-xs font-bold"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-red-400 border-4 border-black px-4 py-2 font-bold hover:bg-red-500"
          >
            X
          </button>
        </div>

        {/* Descrição */}
        <div className="bg-white border-2 border-black p-3 mb-4">
          <p className="text-sm">{skill.description}</p>
        </div>

        {/* Barra de Progresso */}
        <div className="mb-4">
          <div className="flex justify-between text-sm font-bold mb-2">
            <span>Progresso Geral</span>
            <span>{localProgress}%</span>
          </div>
          <ProgressBar progress={localProgress} />
        </div>

        {/* Lista de Ações */}
        <div className="bg-white border-4 border-black p-4 mb-4 shadow-[6px_6px_0_0_#000]">
          <h3 className="font-bold text-lg mb-3">Ações:</h3>
          {localActions.length > 0 ? (
            <div className="space-y-2">
              {localActions.map((action) => (
                <label
                  key={action.id}
                  className="flex items-start gap-3 p-2 border-2 border-black hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={action.completed}
                    onChange={() => handleToggleAction(action.id)}
                    className="mt-1 w-5 h-5 border-4 border-black cursor-pointer"
                    style={{ accentColor: "#4ade80" }}
                  />
                  <div className="flex-1">
                    <span className={`font-semibold ${action.completed ? "line-through text-gray-500" : ""}`}>
                      {action.name}
                    </span>
                    {action.description && (
                      <p className="text-xs text-gray-600 mt-1">{action.description}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Nenhuma ação definida ainda.</p>
          )}
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="flex-1 bg-yellow-400 border-4 border-black px-4 py-2 font-bold hover:bg-yellow-500 shadow-[4px_4px_0_0_#000]"
          >
            Resetar
          </button>
          {onDelete && (
            <button
              onClick={handleDelete}
              className="flex-1 bg-red-400 border-4 border-black px-4 py-2 font-bold hover:bg-red-500 shadow-[4px_4px_0_0_#000]"
            >
              Excluir
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

