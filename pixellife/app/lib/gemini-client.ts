/**
 * Cliente para integração com Google Gemini API
 * Suporta Gemini Pro e Deep Research
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Inicializar cliente Gemini
function getGeminiClient() {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY não configurada. Configure NEXT_PUBLIC_GEMINI_API_KEY nas variáveis de ambiente.');
  }
  
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Configurações de geração
 */
export interface GeminiConfig {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  model?: 'gemini-pro' | 'gemini-pro-vision' | 'gemini-1.5-pro';
}

/**
 * Resposta do Gemini
 */
export interface GeminiResponse {
  text: string;
  usage?: {
    promptTokens?: number;
    candidatesTokens?: number;
    totalTokens?: number;
  };
}

/**
 * Chama o Gemini com um prompt simples
 */
export async function callGemini(
  prompt: string,
  config: GeminiConfig = {}
): Promise<GeminiResponse> {
  try {
    const client = getGeminiClient();
    const model = client.getGenerativeModel({
      model: config.model || 'gemini-1.5-pro',
      generationConfig: {
        temperature: config.temperature ?? 0.7,
        topP: config.topP ?? 0.95,
        topK: config.topK ?? 40,
        maxOutputTokens: config.maxOutputTokens ?? 8192,
      },
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      text,
      usage: {
        promptTokens: result.response.usageMetadata?.promptTokenCount,
        candidatesTokens: result.response.usageMetadata?.candidatesTokenCount,
        totalTokens: result.response.usageMetadata?.totalTokenCount,
      },
    };
  } catch (error) {
    console.error('Erro ao chamar Gemini:', error);
    throw new Error(`Erro ao chamar Gemini: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

/**
 * Deep Research - Pesquisa profunda com múltiplas iterações
 * O Gemini Deep Research faz pesquisas iterativas sobre um tópico
 */
export interface DeepResearchConfig extends GeminiConfig {
  maxIterations?: number;
  researchDepth?: 'shallow' | 'medium' | 'deep';
}

export interface DeepResearchResult {
  finalAnswer: string;
  researchSteps: Array<{
    iteration: number;
    query: string;
    findings: string;
  }>;
  totalTokens: number;
}

/**
 * Simula Deep Research com múltiplas chamadas iterativas
 * Nota: O Deep Research real do Gemini requer API específica
 * Esta é uma implementação simulada com iterações
 */
export async function deepResearch(
  topic: string,
  config: DeepResearchConfig = {}
): Promise<DeepResearchResult> {
  const maxIterations = config.maxIterations ?? 3;
  const researchSteps: DeepResearchResult['researchSteps'] = [];
  let totalTokens = 0;
  
  // Prompt inicial para pesquisa profunda
  let currentQuery = `Faça uma pesquisa profunda sobre: ${topic}. 
Forneça informações detalhadas, contexto histórico, implicações práticas e diferentes perspectivas.`;

  for (let iteration = 1; iteration <= maxIterations; iteration++) {
    try {
      const response = await callGemini(currentQuery, config);
      totalTokens += response.usage?.totalTokens ?? 0;

      researchSteps.push({
        iteration,
        query: currentQuery,
        findings: response.text,
      });

      // Na última iteração, não precisa refinar mais
      if (iteration === maxIterations) {
        break;
      }

      // Refinar a pesquisa baseado nos achados
      currentQuery = `Baseado na pesquisa anterior sobre "${topic}", 
os achados foram: ${response.text.substring(0, 500)}...

Aprofunde aspectos específicos que ainda não foram cobertos ou que precisam de mais detalhes.`;
    } catch (error) {
      console.error(`Erro na iteração ${iteration} do Deep Research:`, error);
      throw error;
    }
  }

  const finalAnswer = researchSteps[researchSteps.length - 1]?.findings || '';

  return {
    finalAnswer,
    researchSteps,
    totalTokens,
  };
}

/**
 * Análise de dados financeiros com Gemini
 * Útil para insights sobre gastos, padrões, etc.
 */
export async function analyzeFinancialData(
  dataSummary: string,
  question: string
): Promise<GeminiResponse> {
  const prompt = `Você é um assistente financeiro especializado em análise de dados pessoais.

Dados fornecidos:
${dataSummary}

Pergunta do usuário: ${question}

Forneça uma análise clara, prática e acionável. Use formatação markdown quando apropriado.`;

  return callGemini(prompt, {
    temperature: 0.3, // Mais determinístico para análises financeiras
    model: 'gemini-1.5-pro',
  });
}

/**
 * Geração de insights sobre hábitos
 */
export async function generateHabitInsights(
  habitsData: string,
  streakData: string
): Promise<GeminiResponse> {
  const prompt = `Analise os seguintes dados de hábitos e forneça insights motivacionais:

Hábitos:
${habitsData}

Sequências (Streaks):
${streakData}

Forneça:
1. Análise de padrões
2. Sugestões de melhoria
3. Motivação personalizada baseada nos dados
4. Metas sugeridas

Seja encorajador e prático.`;

  return callGemini(prompt, {
    temperature: 0.7,
    model: 'gemini-1.5-pro',
  });
}

/**
 * Assistente de escrita para o diário
 */
export async function journalWritingAssistant(
  mood: string,
  quickNotes: string[],
  previousEntries?: string
): Promise<GeminiResponse> {
  const prompt = `Você é um assistente de escrita de diário pessoal.

Humor atual: ${mood}
Notas rápidas do dia: ${quickNotes.join(', ')}

${previousEntries ? `Entradas anteriores (para contexto):\n${previousEntries}` : ''}

Sugira:
1. Tópicos para reflexão baseados no humor e notas
2. Perguntas para auto-exploração
3. Uma estrutura sugerida para a entrada do diário de hoje

Seja empático e não invasivo.`;

  return callGemini(prompt, {
    temperature: 0.8,
    model: 'gemini-1.5-pro',
  });
}

