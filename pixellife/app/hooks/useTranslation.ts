'use client';

import { useState, useCallback, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';

// Cache de traduções em memória
// Formato: `${targetLanguage}:${originalText}` -> `translatedText`
const translationCache = new Map<string, string>();

// Cache reverso: armazena o texto original para cada tradução
// Formato: `${targetLanguage}:${translatedText}` -> `originalText`
const reverseTranslationCache = new Map<string, string>();

// Cache persistente no localStorage (para sobreviver a reloads)
function getCachedTranslation(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(`translation:${key}`);
    if (cached) {
      const { text, timestamp } = JSON.parse(cached);
      // Cache válido por 30 dias
      if (Date.now() - timestamp < 30 * 24 * 60 * 60 * 1000) {
        return text;
      }
    }
  } catch (e) {
    // Ignora erros de localStorage
  }
  return null;
}

function setCachedTranslation(key: string, text: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`translation:${key}`, JSON.stringify({
      text,
      timestamp: Date.now(),
    }));
  } catch (e) {
    // Ignora erros de localStorage (quota excedida, etc)
  }
}

// Mapeamento de códigos de idioma para códigos da API Gemini
const languageCodeMap: Record<string, string> = {
  'en': 'en',
  'pt': 'pt',
  'es': 'es',
  'ja': 'ja',
  'de': 'de',
  'fr': 'fr',
  'it': 'it',
  'ko': 'ko',
  'zh-CN': 'zh',
  'zh-TW': 'zh-TW',
};

export function useTranslation() {
  const { language } = useLanguage();
  const [translating, setTranslating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const translateText = useCallback(async (text: string): Promise<string> => {
    if (!text || text.trim() === '') return text;
    
    // Se o idioma atual é português (padrão), não traduz
    if (language === 'pt') return text;

    // Verifica cache em memória (usa texto original para chave)
    const cacheKey = `${language}:${text}`;
    if (translationCache.has(cacheKey)) {
      return translationCache.get(cacheKey)!;
    }

    // Verifica cache persistente (localStorage)
    const cached = getCachedTranslation(cacheKey);
    if (cached) {
      translationCache.set(cacheKey, cached);
      return cached;
    }

    // Limita o tamanho do texto para evitar custos altos (máximo 500 caracteres)
    // Textos maiores são truncados para tradução
    const textToTranslate = text.length > 500 ? text.substring(0, 500) + '...' : text;

    // Cancela tradução anterior se houver
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setTranslating(true);

    try {
      const targetLanguage = languageCodeMap[language] || 'en';
      
      // Usa o modelo mais barato (gemini-1.5-flash) e limita o tamanho da resposta
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        console.warn('Gemini API key not found, returning original text');
        return text;
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Translate the following text to ${targetLanguage}. Only return the translation, nothing else:\n\n${textToTranslate}`
            }]
          }]
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // Se for erro de quota/limite, retorna texto original sem cache
        if (response.status === 429 || response.status === 403) {
          console.warn('Translation API limit exceeded, returning original text');
          return text;
        }
        throw new Error(`Translation failed: ${response.status}`);
      }

      const data = await response.json();
      const translatedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || text;

      // Salva no cache (memória e localStorage)
      translationCache.set(cacheKey, translatedText);
      setCachedTranslation(cacheKey, translatedText);
      
      // Salva também no cache reverso para poder voltar ao original
      const reverseKey = `${language}:${translatedText}`;
      reverseTranslationCache.set(reverseKey, text);
      
      return translatedText;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return text; // Retorna texto original se foi cancelado
      }
      console.error('Translation error:', error);
      return text; // Retorna texto original em caso de erro
    } finally {
      setTranslating(false);
      abortControllerRef.current = null;
    }
  }, [language]);

  const translateBatch = useCallback(async (texts: string[]): Promise<string[]> => {
    if (language === 'pt') return texts;
    
    // Filtra textos já em cache
    const textsToTranslate: { text: string; index: number }[] = [];
    const results: string[] = new Array(texts.length);
    
    texts.forEach((text, index) => {
      if (!text || text.trim() === '') {
        results[index] = text;
        return;
      }
      
      const cacheKey = `${language}:${text}`;
      if (translationCache.has(cacheKey)) {
        results[index] = translationCache.get(cacheKey)!;
        return;
      }
      
      const cached = getCachedTranslation(cacheKey);
      if (cached) {
        translationCache.set(cacheKey, cached);
        results[index] = cached;
        return;
      }
      
      textsToTranslate.push({ text, index });
    });
    
    // Traduz apenas os que não estão em cache
    const translations = await Promise.all(
      textsToTranslate.map(({ text }) => translateText(text))
    );
    
    // Preenche os resultados
    textsToTranslate.forEach(({ index }, i) => {
      results[index] = translations[i];
    });
    
    return results;
  }, [language, translateText]);

  return {
    translateText,
    translateBatch,
    translating,
  };
}

