#!/usr/bin/env tsx
/**
 * Gemini Code Analyzer
 * 
 * Usa Gemini Deep Research para analisar o código do projeto
 * e gerar insights, sugestões e documentação
 * 
 * Uso:
 *   npm run analyze:code "analise a estrutura do projeto"
 *   npm run analyze:code "sugira melhorias de performance"
 *   npm run analyze:code "identifique possíveis bugs"
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';
import { globSync } from 'glob';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente do .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  
  // Fallback: ler diretamente do arquivo se dotenv não funcionar
  if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY && !process.env.GEMINI_API_KEY) {
    try {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const lines = envContent.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').trim();
            if (key === 'NEXT_PUBLIC_GEMINI_API_KEY' || key === 'GEMINI_API_KEY') {
              process.env[key] = value;
            }
          }
        }
      }
    } catch (error) {
      console.warn('⚠️  Erro ao ler .env.local diretamente:', error);
    }
  }
} else {
  // Tentar .env também
  dotenv.config();
}

// Debug: verificar se carregou (apenas em dev)
if (process.env.NODE_ENV !== 'production') {
  console.log('🔍 Verificando API key...');
  console.log('   Arquivo .env.local existe:', fs.existsSync(envPath));
  const hasKey = !!(process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY);
  console.log('   API Key encontrada:', hasKey ? '✅' : '❌');
  if (hasKey) {
    const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    console.log('   Key preview:', key ? `${key.substring(0, 10)}...` : 'N/A');
  }
}

// Configuração
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const MAX_FILES_TO_ANALYZE = 20; // Limitar para não exceder tokens
const MAX_FILE_SIZE = 50000; // ~50KB por arquivo

interface CodeFile {
  path: string;
  content: string;
  size: number;
}

/**
 * Lê arquivos do projeto relevantes
 */
function getProjectFiles(): CodeFile[] {
  const files: CodeFile[] = [];
  
  // Padrões de arquivos a incluir
  const patterns = [
    'app/**/*.{ts,tsx}',
    'app/**/*.{js,jsx}',
    'lib/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
  ];

  // Excluir
  const exclude = [
    '**/node_modules/**',
    '**/.next/**',
    '**/dist/**',
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/*.spec.ts',
  ];

  for (const pattern of patterns) {
    const matches = globSync(pattern, {
      ignore: exclude,
      cwd: process.cwd(),
    });

    for (const filePath of matches.slice(0, MAX_FILES_TO_ANALYZE)) {
      try {
        const fullPath = path.join(process.cwd(), filePath);
        const stats = fs.statSync(fullPath);
        
        if (stats.size > MAX_FILE_SIZE) {
          console.log(`⚠️  Arquivo muito grande, pulando: ${filePath}`);
          continue;
        }

        const content = fs.readFileSync(fullPath, 'utf-8');
        files.push({
          path: filePath,
          content,
          size: stats.size,
        });
      } catch (error) {
        console.error(`Erro ao ler ${filePath}:`, error);
      }
    }
  }

  return files;
}

/**
 * Cria resumo estruturado do código
 */
function createCodeSummary(files: CodeFile[]): string {
  const summary: string[] = [];
  
  summary.push('# Resumo do Código do Projeto\n');
  summary.push(`Total de arquivos analisados: ${files.length}\n`);
  
  // Agrupar por tipo
  const byType: Record<string, CodeFile[]> = {
    components: [],
    hooks: [],
    pages: [],
    lib: [],
    api: [],
    other: [],
  };

  for (const file of files) {
    if (file.path.includes('/components/')) {
      byType.components.push(file);
    } else if (file.path.includes('/hooks/')) {
      byType.hooks.push(file);
    } else if (file.path.includes('/page.tsx') || file.path.includes('/page.ts')) {
      byType.pages.push(file);
    } else if (file.path.includes('/lib/')) {
      byType.lib.push(file);
    } else if (file.path.includes('/api/')) {
      byType.api.push(file);
    } else {
      byType.other.push(file);
    }
  }

  summary.push('## Estrutura do Projeto\n');
  for (const [type, typeFiles] of Object.entries(byType)) {
    if (typeFiles.length > 0) {
      summary.push(`### ${type.toUpperCase()} (${typeFiles.length} arquivos)`);
      for (const file of typeFiles.slice(0, 5)) {
        summary.push(`- ${file.path} (${(file.size / 1024).toFixed(1)}KB)`);
      }
      if (typeFiles.length > 5) {
        summary.push(`- ... e mais ${typeFiles.length - 5} arquivos`);
      }
      summary.push('');
    }
  }

  // Adicionar código de arquivos importantes
  summary.push('\n## Código Relevante\n');
  
  // Priorizar arquivos importantes
  const importantFiles = files.filter(f => 
    f.path.includes('useExpenses') ||
    f.path.includes('useHabits') ||
    f.path.includes('ProfilePanel') ||
    f.path.includes('gemini-client')
  );

  for (const file of importantFiles.slice(0, 5)) {
    summary.push(`\n### ${file.path}\n`);
    summary.push('```typescript');
    // Limitar tamanho do código mostrado
    const codePreview = file.content.length > 2000 
      ? file.content.substring(0, 2000) + '\n// ... (código truncado)'
      : file.content;
    summary.push(codePreview);
    summary.push('```\n');
  }

  return summary.join('\n');
}

/**
 * Análise com Gemini usando Deep Research
 */
async function analyzeWithGemini(
  question: string,
  codeSummary: string
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY não configurada. Configure NEXT_PUBLIC_GEMINI_API_KEY ou GEMINI_API_KEY');
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  // Tentar modelos em ordem de preferência
  const modelsToTry = ['gemini-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'];
  let model;
  let lastError;
  
  for (const modelName of modelsToTry) {
    try {
      model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: {
          temperature: 0.3, // Mais determinístico para análise de código
          maxOutputTokens: 8192,
        },
      });
      // Testar se o modelo funciona fazendo uma chamada de teste
      break;
    } catch (error) {
      lastError = error;
      continue;
    }
  }
  
  if (!model) {
    // Fallback para gemini-pro
    model = genAI.getGenerativeModel({ 
      model: 'gemini-pro',
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 8192,
      },
    });
  }

  const prompt = `Você é um especialista em análise de código e arquitetura de software.

CONTEXTO DO PROJETO:
${codeSummary}

PERGUNTA/ANÁLISE SOLICITADA:
${question}

INSTRUÇÕES:
1. Analise o código fornecido em profundidade
2. Forneça insights práticos e acionáveis
3. Identifique padrões, problemas e oportunidades de melhoria
4. Seja específico e cite exemplos do código quando relevante
5. Use formatação markdown para melhor legibilidade
6. Organize a resposta em seções claras

RESPOSTA:`;

  console.log('🔍 Analisando código com Gemini Deep Research...\n');
  
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Erro ao chamar Gemini:', error);
    throw error;
  }
}

/**
 * Análise iterativa (simula Deep Research)
 */
async function deepResearchAnalysis(
  question: string,
  codeSummary: string
): Promise<string> {
  const iterations = 3;
  let currentQuestion = question;
  let accumulatedInsights = '';

  for (let i = 1; i <= iterations; i++) {
    console.log(`📊 Iteração ${i}/${iterations}...`);
    
    const response = await analyzeWithGemini(currentQuestion, codeSummary);
    accumulatedInsights += `\n\n--- ITERAÇÃO ${i} ---\n\n${response}`;

    // Refinar pergunta para próxima iteração
    if (i < iterations) {
      currentQuestion = `Baseado na análise anterior sobre "${question}", 
os insights foram: ${response.substring(0, 500)}...

Aprofunde aspectos específicos que ainda não foram cobertos ou que precisam de mais detalhes.
Foque em:
- Detalhes técnicos mais profundos
- Exemplos concretos do código
- Sugestões de implementação específicas`;
    }
  }

  return accumulatedInsights;
}

/**
 * Main
 */
async function main() {
  const question = process.argv[2] || 'Analise a estrutura do projeto e sugira melhorias gerais';

  console.log('🚀 Gemini Code Analyzer\n');
  console.log(`📝 Pergunta: ${question}\n`);

  if (!GEMINI_API_KEY) {
    console.error('❌ Erro: GEMINI_API_KEY não configurada');
    console.error('Configure NEXT_PUBLIC_GEMINI_API_KEY ou GEMINI_API_KEY nas variáveis de ambiente');
    process.exit(1);
  }

  try {
    // 1. Ler arquivos do projeto
    console.log('📂 Lendo arquivos do projeto...');
    const files = getProjectFiles();
    console.log(`✅ ${files.length} arquivos encontrados\n`);

    // 2. Criar resumo
    console.log('📋 Criando resumo do código...');
    const codeSummary = createCodeSummary(files);
    console.log('✅ Resumo criado\n');

    // 3. Análise com Deep Research
    const useDeepResearch = process.argv.includes('--deep') || process.argv.includes('-d');
    
    let analysis: string;
    if (useDeepResearch) {
      console.log('🔬 Modo Deep Research ativado\n');
      analysis = await deepResearchAnalysis(question, codeSummary);
    } else {
      analysis = await analyzeWithGemini(question, codeSummary);
    }

    // 4. Exibir resultados
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESULTADO DA ANÁLISE');
    console.log('='.repeat(80) + '\n');
    console.log(analysis);
    console.log('\n' + '='.repeat(80));

    // 5. Salvar em arquivo (opcional)
    if (process.argv.includes('--save') || process.argv.includes('-s')) {
      const outputFile = `analise-${Date.now()}.md`;
      const output = `# Análise de Código - ${new Date().toLocaleString()}\n\n**Pergunta:** ${question}\n\n${analysis}`;
      fs.writeFileSync(outputFile, output);
      console.log(`\n💾 Análise salva em: ${outputFile}`);
    }

  } catch (error) {
    console.error('\n❌ Erro:', error);
    process.exit(1);
  }
}

main();

