"use client";

import { useCallback } from "react";

// ===============================
// TYPES
// ===============================

export interface SkillAction {
  id: string;
  name: string;
  description?: string;
  completed: boolean;
}

export interface Skill {
  id: string;
  name: string;
  icon: string;
  description: string;
  actions: SkillAction[];
  progress: number; // 0 - 100%
  type: "leisure"; // Tronco 1
}

export interface PersonalSkill {
  id: string;
  name: string;
  icon: string;
  description: string;
  categories: string[]; // ex: "social", "emocional", "autocuidado"
  actions: SkillAction[];
  progress: number;
  type: "personal"; // Tronco 2
}

export type TreeSkill = Skill | PersonalSkill;

// Prefixo para isolar as chaves do localStorage
const STORAGE_PREFIX = "pixel-life-tree-v1";
const STORAGE_KEY_LEISURE = `${STORAGE_PREFIX}:leisure-skills`;
const STORAGE_KEY_PERSONAL = `${STORAGE_PREFIX}:personal-skills`;

// Helpers seguros de leitura/gravação
function readJSON<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

function writeJSON<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // se der erro de quota ou algo assim, apenas ignora
  }
}

// ===============================
// DADOS INICIAIS
// ===============================

const initialLeisureSkills: Skill[] = [
  {
    id: "skate",
    name: "Skate",
    icon: "/icon2.1.png",
    description: "Aprender e praticar manobras de skate",
    actions: [
      { id: "ollie", name: "Ollie", completed: false },
      { id: "flip", name: "Flip", completed: false },
      { id: "360", name: "360", completed: false },
      { id: "ramp", name: "Descer rampa", completed: false },
    ],
    progress: 0,
    type: "leisure",
  },
  {
    id: "cooking",
    name: "Cozinhar",
    icon: "/icon2.1.png",
    description: "Desenvolver habilidades culinárias",
    actions: [
      { id: "onion", name: "Cortar cebola", completed: false },
      { id: "rice", name: "Fazer arroz", completed: false },
      { id: "chicken", name: "Grelhar frango", completed: false },
    ],
    progress: 0,
    type: "leisure",
  },
  {
    id: "painting",
    name: "Pintura",
    icon: "/icon2.1.png",
    description: "Aprender técnicas de pintura",
    actions: [
      { id: "line", name: "Traço reto", completed: false },
      { id: "colors", name: "Misturar cores", completed: false },
      { id: "shade", name: "Sombrear", completed: false },
    ],
    progress: 0,
    type: "leisure",
  },
  {
    id: "reading",
    name: "Leitura",
    icon: "/icon2.1.png",
    description: "Desenvolver hábito de leitura",
    actions: [
      { id: "30min", name: "Ler 30min", completed: false },
      { id: "10pages", name: "Ler 10 páginas", completed: false },
      { id: "notes", name: "Anotar ideias", completed: false },
    ],
    progress: 0,
    type: "leisure",
  },
  {
    id: "photography",
    name: "Fotografia",
    icon: "/icon2.1.png",
    description: "Aprender técnicas fotográficas",
    actions: [
      { id: "focus", name: "Foco manual", completed: false },
      { id: "composition", name: "Composição", completed: false },
      { id: "edit", name: "Editar foto", completed: false },
    ],
    progress: 0,
    type: "leisure",
  },
];

const initialPersonalSkills: PersonalSkill[] = [
  {
    id: "social-conversation",
    name: "Conversar com Desconhecidos",
    icon: "/icon2.1.png",
    description: "Desenvolver confiança para iniciar conversas",
    categories: ["social"],
    actions: [
      { id: "start", name: "Iniciar conversa", completed: false },
      { id: "maintain", name: "Manter conversa", completed: false },
      { id: "ask", name: "Fazer perguntas", completed: false },
    ],
    progress: 0,
    type: "personal",
  },
  {
    id: "self-care",
    name: "Autocuidado",
    icon: "/icon2.1.png",
    description: "Rotinas básicas de cuidado pessoal",
    categories: ["autocuidado", "emocional"],
    actions: [
      { id: "routine1", name: "Rotina matinal", completed: false },
      { id: "routine2", name: "Rotina noturna", completed: false },
      { id: "mindfulness", name: "Momento de atenção plena", completed: false },
    ],
    progress: 0,
    type: "personal",
  },
  {
    id: "ask-help",
    name: "Pedir Ajuda",
    icon: "/icon2.1.png",
    description: "Aprender a pedir ajuda quando necessário",
    categories: ["social", "emocional"],
    actions: [
      { id: "identify", name: "Identificar necessidade", completed: false },
      { id: "ask", name: "Pedir ajuda", completed: false },
      { id: "accept", name: "Aceitar ajuda", completed: false },
    ],
    progress: 0,
    type: "personal",
  },
];

// ===============================
// HOOK PRINCIPAL
// ===============================

export function useTree() {
  // ---------- LEISURE SKILLS (Tronco 1) ----------
  const getLeisureSkills = useCallback((): Skill[] => {
    const stored = readJSON<Skill[]>(STORAGE_KEY_LEISURE, []);
    if (stored.length === 0) {
      // Primeira vez: salvar dados iniciais
      writeJSON(STORAGE_KEY_LEISURE, initialLeisureSkills);
      return initialLeisureSkills;
    }
    // Recalcular progresso para habilidades existentes
    return stored.map(skill => ({
      ...skill,
      progress: computeProgressInternal(skill.actions),
    }));
  }, []);

  const addLeisureSkill = useCallback((skill: Omit<Skill, "id" | "progress">): Skill => {
    const all = getLeisureSkills();
    const newSkill: Skill = {
      ...skill,
      id: `skill-${Date.now()}`,
      progress: 0,
      type: "leisure",
    };
    const updated = [...all, newSkill];
    writeJSON(STORAGE_KEY_LEISURE, updated);
    return newSkill;
  }, [getLeisureSkills]);

  const removeLeisureSkill = useCallback((id: string): boolean => {
    const all = getLeisureSkills();
    const filtered = all.filter((s) => s.id !== id);
    if (filtered.length === all.length) return false;
    writeJSON(STORAGE_KEY_LEISURE, filtered);
    return true;
  }, [getLeisureSkills]);

  // ---------- PERSONAL SKILLS (Tronco 2) ----------
  const getPersonalSkills = useCallback((): PersonalSkill[] => {
    const stored = readJSON<PersonalSkill[]>(STORAGE_KEY_PERSONAL, []);
    if (stored.length === 0) {
      // Primeira vez: salvar dados iniciais
      writeJSON(STORAGE_KEY_PERSONAL, initialPersonalSkills);
      return initialPersonalSkills;
    }
    // Recalcular progresso para habilidades existentes
    return stored.map(skill => ({
      ...skill,
      progress: computeProgressInternal(skill.actions),
    }));
  }, []);

  const addPersonalSkill = useCallback((skill: Omit<PersonalSkill, "id" | "progress">): PersonalSkill => {
    const all = getPersonalSkills();
    const newSkill: PersonalSkill = {
      ...skill,
      id: `personal-${Date.now()}`,
      progress: 0,
      type: "personal",
    };
    const updated = [...all, newSkill];
    writeJSON(STORAGE_KEY_PERSONAL, updated);
    return newSkill;
  }, [getPersonalSkills]);

  const removePersonalSkill = useCallback((id: string): boolean => {
    const all = getPersonalSkills();
    const filtered = all.filter((s) => s.id !== id);
    if (filtered.length === all.length) return false;
    writeJSON(STORAGE_KEY_PERSONAL, filtered);
    return true;
  }, [getPersonalSkills]);

  // ---------- AÇÕES COMUNS ----------
  const computeProgressInternal = (actions: SkillAction[]): number => {
    if (actions.length === 0) return 0;
    const completed = actions.filter((a) => a.completed).length;
    return Math.round((completed / actions.length) * 100);
  };

  const toggleAction = useCallback(
    (skillId: string, actionId: string, type: "leisure" | "personal"): boolean => {
      if (type === "leisure") {
        const all = getLeisureSkills();
        const skill = all.find((s) => s.id === skillId);
        if (!skill) return false;

        const action = skill.actions.find((a) => a.id === actionId);
        if (!action) return false;

        action.completed = !action.completed;
        skill.progress = computeProgressInternal(skill.actions);

        writeJSON(STORAGE_KEY_LEISURE, all);
        return true;
      } else {
        const all = getPersonalSkills();
        const skill = all.find((s) => s.id === skillId);
        if (!skill) return false;

        const action = skill.actions.find((a) => a.id === actionId);
        if (!action) return false;

        action.completed = !action.completed;
        skill.progress = computeProgressInternal(skill.actions);

        writeJSON(STORAGE_KEY_PERSONAL, all);
        return true;
      }
    },
    [getLeisureSkills, getPersonalSkills]
  );

  const resetSkill = useCallback(
    (skillId: string, type: "leisure" | "personal"): boolean => {
      if (type === "leisure") {
        const all = getLeisureSkills();
        const skill = all.find((s) => s.id === skillId);
        if (!skill) return false;

        skill.actions.forEach((a) => (a.completed = false));
        skill.progress = 0;

        writeJSON(STORAGE_KEY_LEISURE, all);
        return true;
      } else {
        const all = getPersonalSkills();
        const skill = all.find((s) => s.id === skillId);
        if (!skill) return false;

        skill.actions.forEach((a) => (a.completed = false));
        skill.progress = 0;

        writeJSON(STORAGE_KEY_PERSONAL, all);
        return true;
      }
    },
    [getLeisureSkills, getPersonalSkills]
  );

  const updateSkill = useCallback(
    (skillId: string, updates: Partial<Skill | PersonalSkill>, type: "leisure" | "personal"): boolean => {
      if (type === "leisure") {
        const all = getLeisureSkills();
        const index = all.findIndex((s) => s.id === skillId);
        if (index === -1) return false;

        all[index] = { ...all[index], ...updates } as Skill;
        writeJSON(STORAGE_KEY_LEISURE, all);
        return true;
      } else {
        const all = getPersonalSkills();
        const index = all.findIndex((s) => s.id === skillId);
        if (index === -1) return false;

        all[index] = { ...all[index], ...updates } as PersonalSkill;
        writeJSON(STORAGE_KEY_PERSONAL, all);
        return true;
      }
    },
    [getLeisureSkills, getPersonalSkills]
  );

  return {
    // Leisure Skills
    getLeisureSkills,
    addLeisureSkill,
    removeLeisureSkill,
    // Personal Skills
    getPersonalSkills,
    addPersonalSkill,
    removePersonalSkill,
    // Common
    toggleAction,
    resetSkill,
    updateSkill,
    computeProgress: computeProgressInternal,
  };
}
























