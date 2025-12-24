export interface Habit {
  id: number;
  name: string;
  checks: boolean[];
}

export const initialHabits: Habit[] = [
  {
    id: 1,
    name: "Exercitar",
    checks: [false, false, false, false, false, false, false],
  },
  {
    id: 2,
    name: "Ler",
    checks: [false, false, false, false, false, false, false],
  },
];

export const days: string[] = [
  "01/01",
  "02/01",
  "03/01",
  "04/01",
  "05/01",
  "06/01",
  "07/01",
];







