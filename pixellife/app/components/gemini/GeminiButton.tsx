'use client';

import { useState } from 'react';
import { GeminiChat } from './GeminiChat';

interface GeminiButtonProps {
  variant?: 'default' | 'small' | 'icon';
  initialMode?: 'chat' | 'deep-research';
}

export function GeminiButton({ variant = 'default', initialMode = 'chat' }: GeminiButtonProps) {
  const [showChat, setShowChat] = useState(false);

  if (variant === 'icon') {
    return (
      <>
        <button
          onClick={() => setShowChat(true)}
          className="p-2 border-2 border-black touch-manipulation min-h-[48px] min-w-[48px] flex items-center justify-center"
          style={{
            backgroundColor: '#4caf50',
            color: '#fff',
          }}
          title="Abrir Gemini"
          aria-label="Abrir Gemini Assistant"
        >
          💬
        </button>
        {showChat && (
          <GeminiChat
            mode={initialMode}
            onClose={() => setShowChat(false)}
          />
        )}
      </>
    );
  }

  if (variant === 'small') {
    return (
      <>
        <button
          onClick={() => setShowChat(true)}
          className="px-3 py-2 border-2 border-black font-pixel text-sm touch-manipulation min-h-[48px]"
          style={{
            backgroundColor: '#4caf50',
            color: '#fff',
          }}
        >
          💬 Gemini
        </button>
        {showChat && (
          <GeminiChat
            mode={initialMode}
            onClose={() => setShowChat(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowChat(true)}
        className="px-4 py-2 border-2 border-black font-pixel-bold touch-manipulation min-h-[48px]"
        style={{
          backgroundColor: '#4caf50',
          color: '#fff',
        }}
      >
        💬 Perguntar ao Gemini
      </button>
      {showChat && (
        <GeminiChat
          mode={initialMode}
          onClose={() => setShowChat(false)}
        />
      )}
    </>
  );
}

