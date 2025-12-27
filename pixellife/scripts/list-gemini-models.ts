#!/usr/bin/env tsx
/**
 * Lista modelos Gemini disponíveis
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Carregar .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error('❌ API Key não configurada');
  process.exit(1);
}

// TypeScript: garantir que API_KEY é string
const apiKey: string = API_KEY;

async function listModels() {
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Não há método listModels na API, então vamos testar modelos diretamente
  console.log('💡 Testando modelos disponíveis...\n');
  
  // Tentar modelos comuns
  const modelsToTry = [
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-pro',
    'models/gemini-1.5-flash',
    'models/gemini-1.5-pro',
    'models/gemini-pro',
  ];
  
  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('teste');
      await result.response;
      console.log(`✅ ${modelName} - FUNCIONA!`);
    } catch (err: any) {
      console.log(`❌ ${modelName} - ${err.message.substring(0, 50)}...`);
    }
  }
}

listModels();

