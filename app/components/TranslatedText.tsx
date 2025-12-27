'use client';

import { useEffect, useState, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../hooks/useTranslation';

interface TranslatedTextProps {
  text: string;
  fallback?: string;
  className?: string;
  style?: React.CSSProperties;
}

// Função para obter o timestamp da última mudança de idioma
function getLanguageChangeTime(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const stored = localStorage.getItem('languageChangeTime');
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
}

export function TranslatedText({ text, fallback, className, style }: TranslatedTextProps) {
  const { language } = useLanguage();
  const { translateText } = useTranslation();
  const [translated, setTranslated] = useState(text);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const delayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Limpa timeouts anteriores
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (delayTimeoutRef.current) clearTimeout(delayTimeoutRef.current);

    if (!text || text.trim() === '') {
      setTranslated(fallback || text);
      return;
    }

    // IMPORTANTE: O texto que vem do banco é SEMPRE o original (em qualquer idioma)
    // O sistema apenas traduz para visualização, nunca modifica o texto original
    // Quando o usuário volta para qualquer idioma, o texto original sempre é preservado
    
    // Verifica se há uma tradução reversa no cache
    // Se o texto atual é uma tradução e estamos voltando ao idioma original,
    // o cache reverso nos permite recuperar o texto original
    // Por enquanto, o texto do banco é sempre o original, então sempre mostramos ele
    // quando voltamos para o idioma original

    // Verifica se já passou 10 minutos desde a última mudança de idioma
    const lastChangeTime = getLanguageChangeTime();
    const now = Date.now();
    const timeSinceChange = now - lastChangeTime;
    const DELAY_MINUTES = 10;
    const DELAY_MS = DELAY_MINUTES * 60 * 1000; // 10 minutos em milissegundos

    // Se ainda não passou 10 minutos, aguarda
    if (timeSinceChange < DELAY_MS) {
      const remainingTime = DELAY_MS - timeSinceChange;
      delayTimeoutRef.current = setTimeout(() => {
        // Após o delay, traduz com debounce de 300ms
        timeoutRef.current = setTimeout(() => {
          translateText(text)
            .then(setTranslated)
            .catch((error) => {
              console.warn('Translation error:', error);
              setTranslated(text);
            });
        }, 300);
      }, remainingTime);
      
      // Mostra texto original enquanto aguarda
      setTranslated(text);
      return;
    }

    // Se já passou 10 minutos, traduz imediatamente (com debounce)
    timeoutRef.current = setTimeout(() => {
      translateText(text)
        .then(setTranslated)
        .catch((error) => {
          console.warn('Translation error:', error);
          setTranslated(text);
        });
    }, 300);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (delayTimeoutRef.current) clearTimeout(delayTimeoutRef.current);
    };
  }, [text, language, translateText, fallback]);

  return (
    <span className={className} style={style}>
      {translated || fallback || text}
    </span>
  );
}

