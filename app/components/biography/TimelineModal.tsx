'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/app/context/LanguageContext';
import { TimelineEvent, useTimeline } from '@/app/hooks/useTimeline';

interface TimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Omit<TimelineEvent, 'id'>) => void;
  editingEvent?: TimelineEvent;
}

export function TimelineModal({ isOpen, onClose, onSave, editingEvent }: TimelineModalProps) {
  const { t } = useLanguage();
  const { getAllEvents } = useTimeline();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [type, setType] = useState<'event' | 'chapter'>('event');
  const [scope, setScope] = useState<'period' | 'event'>('event');
  const [summary, setSummary] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [endDate, setEndDate] = useState('');
  const [parentPeriodId, setParentPeriodId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title);
      setDate(editingEvent.date);
      setType(editingEvent.type || 'event');
      setScope(editingEvent.scope || 'event');
      setSummary(editingEvent.summary || '');
      setParentPeriodId(editingEvent.parentPeriodId);
      // Se for capítulo, extrair datas de início e fim
      if (editingEvent.type === 'chapter') {
        if (editingEvent.startDate) {
          setStartDate(editingEvent.startDate);
        } else {
          const dateObj = new Date(editingEvent.date);
          setStartDate(`${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`);
        }
        setEndDate(editingEvent.endDate || '');
      }
    } else {
      setTitle('');
      setDate(new Date().toISOString().substring(0, 10));
      setType('event');
      setScope('event');
      setSummary('');
      setParentPeriodId(undefined);
      const now = new Date();
      setStartDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
      setEndDate('');
    }
  }, [editingEvent, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim()) {
      alert('Por favor, preencha o título');
      return;
    }

    // Para capítulos, usar primeiro dia do mês de início selecionado
    let finalDate = date;
    if (type === 'chapter') {
      const [year, month] = startDate.split('-');
      finalDate = `${year}-${month}-01`;
    }

    // Validar resumo (máximo 280 caracteres)
    if (type === 'chapter' && summary.length > 280) {
      alert('O resumo deve ter no máximo 280 caracteres');
      return;
    }

    // Para capítulos, usar scope selecionado; para eventos, sempre usar 'event' (sem escopo)
    const finalScope = type === 'chapter' ? scope : 'event';
    
    // Para capítulos, se tem parentPeriodId, está dentro de uma era
    // Para eventos, sempre são 'event' e podem estar dentro de um capítulo ou ser independentes

    onSave({
      title: title.trim(),
      date: finalDate,
      type: type,
      scope: finalScope,
      summary: type === 'chapter' && summary.trim() ? summary.trim() : undefined,
      startDate: type === 'chapter' ? startDate : undefined,
      endDate: type === 'chapter' && endDate.trim() ? endDate : undefined,
      parentPeriodId: parentPeriodId ? parentPeriodId : undefined,
    });

    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
        style={{ 
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.12)',
        }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-pixel-bold" style={{ color: '#333', fontSize: '18px', fontWeight: 600 }}>
            {editingEvent ? (type === 'chapter' ? 'Editar Era' : 'Editar Evento') : (type === 'chapter' ? 'Nova Era' : 'Novo Evento')}
          </h2>
          <button
            onClick={onClose}
            className="px-2 py-1 rounded transition-colors hover:bg-gray-100"
            style={{
              backgroundColor: '#f5f5f5',
              border: '1px solid #d4d4d4',
              color: '#555',
              fontSize: '14px',
              borderRadius: '6px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Tipo: Evento ou Capítulo */}
        <div className="mb-4">
          <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>
            Tipo:
          </label>
              <div className="flex gap-2">
            <button
              onClick={() => {
                setType('event');
                setScope('event'); // Eventos sempre têm scope 'event' (sem opção de escolher)
                setParentPeriodId(undefined);
              }}
              className="flex-1 px-3 py-2 rounded font-pixel transition-colors"
              style={{
                backgroundColor: type === 'event' ? '#e8f5e9' : '#f5f5f5',
                border: `1px solid ${type === 'event' ? '#4caf50' : '#d6d6d6'}`,
                color: type === 'event' ? '#111' : '#666',
              }}
            >
              Evento
            </button>
            <button
              onClick={() => {
                setType('chapter');
                setScope('period');
                setParentPeriodId(undefined);
              }}
              className="flex-1 px-3 py-2 rounded font-pixel transition-colors"
              style={{
                backgroundColor: type === 'chapter' ? '#e8f5e9' : '#f5f5f5',
                border: `1px solid ${type === 'chapter' ? '#4caf50' : '#d6d6d6'}`,
                color: type === 'chapter' ? '#111' : '#666',
              }}
            >
              Era
            </button>
          </div>
        </div>

        {/* Escopo: Período ou Capítulos (apenas para eras) */}
        {type === 'chapter' && (
          <div className="mb-4">
            <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>
              Escopo:
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setScope('period');
                  setParentPeriodId(undefined);
                }}
                className="flex-1 px-3 py-2 rounded font-pixel transition-colors"
                style={{
                  backgroundColor: scope === 'period' ? '#e3f2fd' : '#f5f5f5',
                  border: `1px solid ${scope === 'period' ? '#2196f3' : '#d6d6d6'}`,
                  color: scope === 'period' ? '#111' : '#666',
                }}
              >
                Período
              </button>
              <button
                onClick={() => setScope('event')}
                className="flex-1 px-3 py-2 rounded font-pixel transition-colors"
                style={{
                  backgroundColor: scope === 'event' ? '#fff3e0' : '#f5f5f5',
                  border: `1px solid ${scope === 'event' ? '#ff9800' : '#d6d6d6'}`,
                  color: scope === 'event' ? '#111' : '#666',
                }}
              >
                Capítulos
              </button>
            </div>
          </div>
        )}

        {/* Título */}
        <div className="mb-4">
          <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>
            {type === 'chapter' ? 'Título da Era:' : 'Título:'}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded font-pixel focus:outline-none focus:ring-2 focus:ring-green-400"
            style={{ 
              fontSize: '16px',
              backgroundColor: '#fff',
              border: '1px solid #d6d6d6',
            }}
            placeholder={type === 'chapter' ? 'Ex: Era Universitária (2020-2024)' : 'Ex: Comecei a estudar Psicologia'}
            maxLength={100}
          />
        </div>

        {/* Data ou Mês/Ano */}
        {type === 'chapter' ? (
          <div className="mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>
                  Começo (Mês/Ano):
                </label>
                <input
                  type="month"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded font-pixel focus:outline-none focus:ring-2 focus:ring-green-400"
                  style={{ 
                    fontSize: '16px',
                    backgroundColor: '#fff',
                    border: '1px solid #d6d6d6',
                  }}
                />
              </div>
              <div>
                <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>
                  Fim (Mês/Ano) <span style={{ color: '#999', fontSize: '12px' }}>(opcional)</span>:
                </label>
                <input
                  type="month"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded font-pixel focus:outline-none focus:ring-2 focus:ring-green-400"
                  style={{ 
                    fontSize: '16px',
                    backgroundColor: '#fff',
                    border: '1px solid #d6d6d6',
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
        <div className="mb-4">
          <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>
            Data:
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 rounded font-pixel focus:outline-none focus:ring-2 focus:ring-green-400"
            style={{ 
              fontSize: '16px',
              backgroundColor: '#fff',
              border: '1px solid #d6d6d6',
            }}
          />
        </div>
        )}

        {/* Resumo (apenas para eras) */}
        {type === 'chapter' && (
          <div className="mb-4">
            <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>
              Resumo:
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full px-3 py-2 rounded font-pixel focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
              style={{ 
                fontSize: '16px',
                backgroundColor: '#fff',
                border: '1px solid #d6d6d6',
                minHeight: '80px',
                maxHeight: '80px',
              }}
              placeholder="Registre o fato principal de forma objetiva."
              maxLength={280}
            />
            <div className="text-right mt-1 text-xs font-pixel" style={{ color: '#999' }}>
              {summary.length}/280
            </div>
          </div>
        )}

        {/* Seleção de Capítulo (apenas para eras) */}
        {type === 'chapter' && (
          <div className="mb-4">
          <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>
              Capítulos (Opcional):
          </label>
            <select
              value={parentPeriodId || ''}
              onChange={(e) => setParentPeriodId(e.target.value || undefined)}
              className="w-full px-3 py-2 rounded font-pixel focus:outline-none focus:ring-2 focus:ring-green-400"
                style={{
                fontSize: '16px',
                backgroundColor: '#fff',
                border: '1px solid #d6d6d6',
                }}
              >
              <option value="">Nenhum (era independente)</option>
              {getAllEvents()
                .filter(e => e.type === 'chapter')
                .map(chapter => (
                  <option key={chapter.id} value={chapter.id}>
                    {chapter.title}
                  </option>
            ))}
            </select>
          </div>
        )}

        {/* Seleção de Era Pai (apenas para eventos) */}
        {type === 'event' && (
          <div className="mb-4">
            <label className="block font-pixel-bold mb-2" style={{ color: '#333', fontSize: '16px' }}>
              Dentro da Era (Opcional):
            </label>
            <select
              value={parentPeriodId || ''}
              onChange={(e) => setParentPeriodId(e.target.value || undefined)}
              className="w-full px-3 py-2 rounded font-pixel focus:outline-none focus:ring-2 focus:ring-green-400"
              style={{ 
                fontSize: '16px',
                backgroundColor: '#fff',
                border: '1px solid #d6d6d6',
              }}
            >
              <option value="">Nenhum (evento independente)</option>
              {getAllEvents()
                .filter(e => e.type === 'chapter')
                .map(chapter => (
                  <option key={chapter.id} value={chapter.id}>
                    {chapter.title}
                  </option>
                ))}
            </select>
        </div>
        )}

        {/* Botões */}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 rounded transition-colors hover:opacity-90"
            style={{
              backgroundColor: '#7aff7a',
              border: '1px solid #0f9d58',
              color: '#111',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '8px',
            }}
          >
            Salvar
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded transition-colors hover:opacity-90"
            style={{
              backgroundColor: '#f5f5f5',
              border: '1px solid #d4d4d4',
              color: '#555',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '8px',
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

