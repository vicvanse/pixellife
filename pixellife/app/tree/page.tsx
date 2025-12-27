"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PixelMenu from "../components/PixelMenu";
import { useTree, TreeSkill } from "../hooks/useTree";
import { SkillCard } from "../components/tree/SkillCard";
import { SkillModal } from "../components/tree/SkillModal";

export default function TreePage() {
  const {
    getLeisureSkills,
    getPersonalSkills,
    toggleAction,
    resetSkill,
    removeLeisureSkill,
    removePersonalSkill,
  } = useTree();

  const [leisureSkills, setLeisureSkills] = useState<TreeSkill[]>([]);
  const [personalSkills, setPersonalSkills] = useState<TreeSkill[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<TreeSkill | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Carregar habilidades
  useEffect(() => {
    const loadSkills = () => {
      setLeisureSkills(getLeisureSkills());
      setPersonalSkills(getPersonalSkills());
    };
    loadSkills();

    // Escutar mudanças no localStorage
    const handleStorageChange = () => {
      loadSkills();
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [getLeisureSkills, getPersonalSkills]);

  const handleCardClick = (skill: TreeSkill) => {
    setSelectedSkill(skill);
    setIsModalOpen(true);
  };

  const handleToggleAction = (skillId: string, actionId: string) => {
    const skill = [...leisureSkills, ...personalSkills].find((s) => s.id === skillId);
    if (!skill) return;

    const type = skill.type;
    toggleAction(skillId, actionId, type);

    // Recarregar habilidades
    const updatedLeisure = getLeisureSkills();
    const updatedPersonal = getPersonalSkills();
    setLeisureSkills(updatedLeisure);
    setPersonalSkills(updatedPersonal);

    // Atualizar skill selecionada
    if (selectedSkill && selectedSkill.id === skillId) {
      const updated = [...updatedLeisure, ...updatedPersonal].find((s) => s.id === skillId);
      if (updated) {
        setSelectedSkill(updated);
      }
    }
  };

  const handleReset = (skillId: string) => {
    const skill = [...leisureSkills, ...personalSkills].find((s) => s.id === skillId);
    if (!skill) return;

    const type = skill.type;
    resetSkill(skillId, type);

    // Recarregar habilidades
    const updatedLeisure = getLeisureSkills();
    const updatedPersonal = getPersonalSkills();
    setLeisureSkills(updatedLeisure);
    setPersonalSkills(updatedPersonal);

    // Atualizar skill selecionada
    if (selectedSkill && selectedSkill.id === skillId) {
      const updated = [...updatedLeisure, ...updatedPersonal].find((s) => s.id === skillId);
      if (updated) {
        setSelectedSkill(updated);
      }
    }
  };

  const handleDelete = (skillId: string) => {
    const skill = [...leisureSkills, ...personalSkills].find((s) => s.id === skillId);
    if (!skill) return;

    const type = skill.type;
    if (type === "leisure") {
      removeLeisureSkill(skillId);
    } else {
      removePersonalSkill(skillId);
    }

    // Recarregar habilidades
    setLeisureSkills(getLeisureSkills());
    setPersonalSkills(getPersonalSkills());

    // Fechar modal se a skill deletada estava selecionada
    if (selectedSkill && selectedSkill.id === skillId) {
      setIsModalOpen(false);
      setSelectedSkill(null);
    }
  };

  return (
    <div className="relative min-h-screen p-6 font-mono">
      <PixelMenu />

      {/* Seta para voltar ao display - lado esquerdo centralizado verticalmente */}
      <div
        className="fixed z-20"
        style={{
          top: "50%",
          left: "4%",
          transform: "translateY(-50%)",
        }}
      >
        <Link
          href="/display"
          className="flex items-center justify-center bg-white border-4 border-black w-12 h-12 shadow-[4px_4px_0_0_#000] hover:bg-gray-100 hover:shadow-[6px_6px_0_0_#000] transition-all"
        >
          <span className="font-mono text-2xl font-bold">←</span>
        </Link>
      </div>

      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">🗺️ Mapas de Atividades</h1>

        {/* Tronco 1 - Habilidades de Lazer */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 border-b-4 border-black pb-2">
            🌳 Habilidades / Atividades de Lazer
          </h2>
          {leisureSkills.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leisureSkills.map((skill) => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  onClick={() => handleCardClick(skill)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white border-4 border-black p-8 text-center shadow-[6px_6px_0_0_#000]">
              <p className="text-gray-500">Nenhuma habilidade de lazer ainda.</p>
            </div>
          )}
        </section>

        {/* Tronco 2 - Desenvolvimento Pessoal */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 border-b-4 border-black pb-2">
            🌲 Desenvolvimento Pessoal / Social
          </h2>
          {personalSkills.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {personalSkills.map((skill) => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  onClick={() => handleCardClick(skill)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white border-4 border-black p-8 text-center shadow-[6px_6px_0_0_#000]">
              <p className="text-gray-500">Nenhuma habilidade pessoal ainda.</p>
            </div>
          )}
        </section>
      </div>

      {/* Modal */}
      <SkillModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSkill(null);
        }}
        skill={selectedSkill}
        onToggleAction={handleToggleAction}
        onReset={handleReset}
        onDelete={handleDelete}
      />
    </div>
  );
}

