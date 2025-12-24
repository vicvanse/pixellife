#!/usr/bin/env tsx
/**
 * Seed Data Generator
 * 
 * Gera dados de teste para desenvolvimento rápido
 * 
 * Uso:
 *   npm run seed:data
 *   npm run seed:data -- --clear (limpa dados existentes primeiro)
 */

import * as fs from 'fs';
import * as path from 'path';

interface SeedOptions {
  clear?: boolean;
  habits?: number;
  expenses?: number;
  journal?: number;
}

/**
 * Gera dados de hábitos
 */
function generateHabits(count: number = 5) {
  const habitNames = [
    'Exercitar',
    'Ler',
    'Meditar',
    'Estudar',
    'Beber Água',
    'Dormir 8h',
    'Escrever no Diário',
    'Sem Redes Sociais',
  ];

  const habits = [];
  const today = new Date();
  
  for (let i = 0; i < count && i < habitNames.length; i++) {
    const checks: boolean[] = [];
    
    // Gerar checks dos últimos 30 dias
    for (let day = 0; day < 30; day++) {
      const date = new Date(today);
      date.setDate(date.getDate() - day);
      
      // 70% de chance de estar marcado (simula consistência)
      checks.push(Math.random() > 0.3);
    }
    
    habits.push({
      id: i + 1,
      name: habitNames[i],
      checks: checks.reverse(), // Mais recente primeiro
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
    });
  }
  
  return habits;
}

/**
 * Gera dados de expenses
 */
function generateExpenses(days: number = 30) {
  const expenses: Record<string, any[]> = {};
  const today = new Date();
  
  const categories = [
    { name: 'Alimentação', avg: -50, variance: 20 },
    { name: 'Transporte', avg: -30, variance: 15 },
    { name: 'Lazer', avg: -25, variance: 20 },
    { name: 'Compras', avg: -100, variance: 50 },
  ];
  
  for (let day = 0; day < days; day++) {
    const date = new Date(today);
    date.setDate(date.getDate() - day);
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    const dayExpenses: any[] = [];
    
    // 1-3 expenses por dia
    const numExpenses = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numExpenses; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const value = category.avg + (Math.random() * category.variance * 2 - category.variance);
      
      dayExpenses.push({
        id: `${dateKey}-${i}`,
        description: category.name,
        value: Math.round(value * 100) / 100,
        category: category.name.toLowerCase(),
      });
    }
    
    expenses[dateKey] = dayExpenses;
  }
  
  return expenses;
}

/**
 * Gera dados de journal
 */
function generateJournal(days: number = 30) {
  const journal: Record<string, any> = {};
  const today = new Date();
  
  const moods: ('good' | 'neutral' | 'bad')[] = ['good', 'neutral', 'bad'];
  const sampleTexts = [
    'Dia produtivo! Consegui fazer bastante coisa.',
    'Dia tranquilo, sem grandes acontecimentos.',
    'Tive algumas dificuldades, mas consegui superar.',
    'Dia incrível! Muitas conquistas hoje.',
    'Dia difícil, mas aprendi muito.',
  ];
  
  for (let day = 0; day < days; day++) {
    const date = new Date(today);
    date.setDate(date.getDate() - day);
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    // 60% de chance de ter entrada
    if (Math.random() > 0.4) {
      journal[dateKey] = {
        mood: moods[Math.floor(Math.random() * moods.length)],
        moodNumber: Math.floor(Math.random() * 11),
        text: sampleTexts[Math.floor(Math.random() * sampleTexts.length)],
        quickNotes: [
          { time: '09:00', text: 'Acordei cedo' },
          { time: '14:30', text: 'Almoço com amigos' },
        ],
      };
    }
  }
  
  return journal;
}

/**
 * Salva dados no localStorage (simulado)
 */
function saveToLocalStorage(key: string, data: any) {
  if (typeof window === 'undefined') {
    // Em Node.js, salvar em arquivo JSON para importar depois
    const outputDir = path.join(process.cwd(), 'scripts', 'seed-output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputFile = path.join(outputDir, `${key}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
    console.log(`✅ Dados salvos em: ${outputFile}`);
  } else {
    // No browser, salvar no localStorage
    localStorage.setItem(key, JSON.stringify(data));
    console.log(`✅ Dados salvos no localStorage: ${key}`);
  }
}

/**
 * Gera script para importar dados
 */
function generateImportScript(data: {
  habits: any[];
  expenses: Record<string, any[]>;
  journal: Record<string, any>;
}) {
  const script = `
// Script gerado automaticamente - Execute no console do browser
// Ou adicione ao seu código de seed

const seedData = ${JSON.stringify(data, null, 2)};

// Importar hábitos
localStorage.setItem('habits', JSON.stringify(seedData.habits));

// Importar expenses
Object.entries(seedData.expenses).forEach(([dateKey, items]) => {
  localStorage.setItem(\`pixel-life-expenses-v1:daily:\${dateKey}\`, JSON.stringify(items));
});

// Importar journal
localStorage.setItem('journal', JSON.stringify(seedData.journal));

console.log('✅ Seed data importado com sucesso!');
console.log('Recarregue a página para ver os dados.');
  `.trim();
  
  const outputDir = path.join(process.cwd(), 'scripts', 'seed-output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputFile = path.join(outputDir, 'import-seed.js');
  fs.writeFileSync(outputFile, script);
  console.log(`\n📝 Script de importação gerado: ${outputFile}`);
  console.log(`   Execute no console do browser ou adicione ao seu código\n`);
}

/**
 * Main
 */
async function main() {
  const args = process.argv.slice(2);
  const options: SeedOptions = {
    clear: args.includes('--clear'),
    habits: 5,
    expenses: 30,
    journal: 30,
  };
  
  console.log('🌱 Gerando Seed Data...\n');
  
  if (options.clear) {
    console.log('🗑️  Limpando dados existentes...');
    // Limpar seria feito no browser
  }
  
  // Gerar dados
  console.log('📊 Gerando dados...');
  const habits = generateHabits(options.habits);
  const expenses = generateExpenses(options.expenses);
  const journal = generateJournal(options.journal);
  
  console.log(`✅ ${habits.length} hábitos gerados`);
  console.log(`✅ ${Object.keys(expenses).length} dias de expenses gerados`);
  console.log(`✅ ${Object.keys(journal).length} entradas de journal geradas\n`);
  
  // Salvar
  saveToLocalStorage('habits', habits);
  saveToLocalStorage('expenses', expenses);
  saveToLocalStorage('journal', journal);
  
  // Gerar script de importação
  generateImportScript({ habits, expenses, journal });
  
  console.log('\n✨ Seed data gerado com sucesso!');
  console.log('\n📖 Como usar:');
  console.log('   1. Abra o console do browser (F12)');
  console.log('   2. Execute o script em scripts/seed-output/import-seed.js');
  console.log('   3. Recarregue a página');
  console.log('\n   OU adicione ao seu código de desenvolvimento\n');
}

main().catch(console.error);

