'use client';

import { useState, useRef, useEffect } from 'react';
import { useGemini } from '../../hooks/useGemini';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface GeminiChatProps {
  initialPrompt?: string;
  onClose?: () => void;
  mode?: 'chat' | 'deep-research';
}

export function GeminiChat({ initialPrompt, onClose, mode = 'chat' }: GeminiChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(initialPrompt || '');
  const [isResearchMode, setIsResearchMode] = useState(mode === 'deep-research');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { askGemini, doDeepResearch, loading, error } = useGemini();

  useEffect(() => {
    if (initialPrompt) {
      handleSend(initialPrompt);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const userMessage = text || input.trim();
    if (!userMessage) return;

    const newUserMessage: Message = {
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInput('');

    try {
      let responseText: string;

      if (isResearchMode) {
        const result = await doDeepResearch(userMessage);
        responseText = result.finalAnswer;
        
        // Adicionar steps de pesquisa se disponível
        if (result.researchSteps && result.researchSteps.length > 1) {
          responseText += '\n\n---\n\n**Etapas da Pesquisa:**\n\n';
          result.researchSteps.forEach((step: { iteration: number; query: string; findings: string }) => {
            responseText += `**Iteração ${step.iteration}:**\n${step.findings.substring(0, 200)}...\n\n`;
          });
        }
      } else {
        const result = await askGemini(userMessage);
        responseText = result.text;
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `Erro: ${err instanceof Error ? err.message : 'Erro desconhecido'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg border-4 border-black w-full max-w-2xl max-h-[80vh] flex flex-col"
        style={{ backgroundColor: '#f6f3eb' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b-4 border-black flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-pixel-bold text-lg">Gemini Assistant</h2>
            <button
              onClick={() => setIsResearchMode(!isResearchMode)}
              className="px-2 py-1 text-xs font-pixel border-2 border-black touch-manipulation min-h-[32px]"
              style={{
                backgroundColor: isResearchMode ? '#4caf50' : '#e0e0e0',
              }}
            >
              {isResearchMode ? '🔬 Deep Research' : '💬 Chat'}
            </button>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1 font-pixel-bold border-2 border-black touch-manipulation min-h-[32px] min-w-[32px]"
              style={{ backgroundColor: '#f44336', color: '#fff' }}
              aria-label="Fechar"
            >
              ×
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 font-pixel text-sm">
              {isResearchMode
                ? '🔬 Modo Deep Research: Faça uma pergunta para pesquisa profunda'
                : '💬 Faça uma pergunta ao Gemini'}
            </div>
          )}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className="max-w-[80%] p-3 rounded border-2 border-black font-pixel text-sm"
                style={{
                  backgroundColor: msg.role === 'user' ? '#e3f2fd' : '#fff',
                }}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {msg.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="p-3 rounded border-2 border-black bg-white font-pixel text-sm">
                Pensando...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t-4 border-black">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleSend();
                }
              }}
              className="flex-1 px-3 py-2 border-2 border-black rounded font-pixel resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{ minHeight: '60px' }}
              placeholder={isResearchMode ? 'Tópico para pesquisa profunda...' : 'Digite sua pergunta...'}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2 font-pixel-bold border-2 border-black touch-manipulation min-h-[48px] disabled:opacity-50"
              style={{
                backgroundColor: loading ? '#ccc' : '#4caf50',
                color: '#fff',
              }}
            >
              {loading ? '...' : 'Enviar'}
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-1 font-pixel">
            {isResearchMode ? 'Deep Research: múltiplas iterações para resposta profunda' : 'Enter+Ctrl/Cmd para enviar'}
          </div>
        </form>
      </div>
    </div>
  );
}

