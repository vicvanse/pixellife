/**
 * API Route para chamadas ao Gemini
 * Server-side para proteger a API key
 */

import { NextRequest, NextResponse } from 'next/server';
import { callGemini, deepResearch, analyzeFinancialData, generateHabitInsights, journalWritingAssistant } from '@/app/lib/gemini-client';
import type { GeminiConfig, DeepResearchConfig } from '@/app/lib/gemini-client';

// Usar Node.js runtime (edge não suporta @google/generative-ai)
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    // Verificar se a API key está configurada
    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY não configurada' },
        { status: 500 }
      );
    }

    let result;

    switch (action) {
      case 'simple':
        result = await callGemini(params.prompt, params.config as GeminiConfig);
        break;

      case 'deep-research':
        result = await deepResearch(params.topic, params.config as DeepResearchConfig);
        break;

      case 'analyze-financial':
        result = await analyzeFinancialData(params.dataSummary, params.question);
        break;

      case 'habit-insights':
        result = await generateHabitInsights(params.habitsData, params.streakData);
        break;

      case 'journal-assistant':
        result = await journalWritingAssistant(
          params.mood,
          params.quickNotes,
          params.previousEntries
        );
        break;

      default:
        return NextResponse.json(
          { error: `Ação desconhecida: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Erro na API Gemini:', error);
    return NextResponse.json(
      {
        error: 'Erro ao processar requisição',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

