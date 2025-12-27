"use client";

import { TreeSkill } from "../../hooks/useTree";
import { ProgressBar } from "./ProgressBar";

interface SkillCardProps {
  skill: TreeSkill;
  onClick: () => void;
}

export function SkillCard({ skill, onClick }: SkillCardProps) {
  return (
    <button
      onClick={onClick}
      className="bg-white border-4 border-black p-4 shadow-[4px_4px_0_0_#000] hover:shadow-[6px_6px_0_0_#000] transition-all text-left"
    >
      <div className="flex items-start gap-3 mb-3">
        <img
          src={skill.icon}
          alt={skill.name}
          className="w-16 h-16 object-contain image-render-pixel flex-shrink-0"
          style={{ imageRendering: "pixelated" }}
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg mb-1 truncate">{skill.name}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">{skill.description}</p>
        </div>
      </div>
      
      <div className="mt-3">
        <div className="flex justify-between text-xs font-bold mb-1">
          <span>Progresso</span>
          <span>{skill.progress}%</span>
        </div>
        <ProgressBar progress={skill.progress} />
      </div>

      {skill.type === "personal" && "categories" in skill && skill.categories.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
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
    </button>
  );
}
























