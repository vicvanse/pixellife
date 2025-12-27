'use client';

import { useState, useMemo } from 'react';
import { useTimeline } from '@/app/hooks/useTimeline';
import { TimelineEvent } from '@/app/hooks/useTimeline';
import { TimelineMonthHeader } from './TimelineMonthHeader';
import { TimelineGap } from './TimelineGap';
import { useLanguage } from '@/app/context/LanguageContext';

interface TimelineViewProps {
  onEdit: (event: TimelineEvent) => void;
  onDelete: (id: string) => void;
}

interface TimelineItem {
  type: 'event' | 'month' | 'gap' | 'chapter-start' | 'chapter-end';
  event?: TimelineEvent;
  year?: number;
  month?: number;
  days?: number;
}

export function TimelineView({ onEdit, onDelete }: TimelineViewProps) {
  const { t } = useLanguage();
  const { events } = useTimeline();
  
  // Estado para controlar quais meses estão expandidos
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  
  // Função para alternar expansão de um mês
  const toggleMonth = (year: number, month: number) => {
    const key = `${year}-${month}`;
    setExpandedMonths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };
  
  // Verificar se um mês está expandido
  const isMonthExpanded = (year: number, month: number): boolean => {
    return expandedMonths.has(`${year}-${month}`);
  };

  // Criar uma string estável para usar como dependência
  const eventsSignature = useMemo(() => {
    if (!events || events.length === 0) return '';
    return events.map(e => `${e.id}|${e.date}|${e.type || ''}|${e.scope || ''}|${e.parentPeriodId || ''}`).join('||');
  }, [events]);

  // Separar capítulos e eventos (fora do useMemo para ser acessível na renderização)
  const chapters = useMemo(() => {
    return events ? events.filter(e => e.type === 'chapter') : [];
  }, [events]);

  // Processar eventos e criar timeline com gaps
  const timelineItems = useMemo(() => {
    if (!events || events.length === 0) {
      return [];
    }

    // Separar eventos regulares
    const regularEvents = events.filter(e => e.type !== 'chapter');
    
    // Criar lista de itens temporários com suas datas para ordenação
    interface TempItem {
      date: Date;
      type: 'chapter-start' | 'chapter-end' | 'event';
      event: TimelineEvent;
    }
    
    const tempItems: TempItem[] = [];
    
    // Adicionar marcações de início e fim dos capítulos
    chapters.forEach((chapter) => {
      // Determinar data de início
      let startDate: Date;
      if (chapter.startDate) {
        const [year, month] = chapter.startDate.split('-');
        startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      } else {
        startDate = new Date(chapter.date);
      }
      
      // Determinar data de fim (ou usar início se não houver fim)
      let endDate: Date;
      if (chapter.endDate) {
        const [year, month] = chapter.endDate.split('-');
        // Último dia do mês
        endDate = new Date(parseInt(year), parseInt(month), 0);
      } else {
        endDate = startDate;
      }
      
      tempItems.push({ date: startDate, type: 'chapter-start', event: chapter });
      tempItems.push({ date: endDate, type: 'chapter-end', event: chapter });
    });
    
    // Adicionar eventos independentes (sem período pai)
    regularEvents.forEach((event) => {
      if (!event.parentPeriodId) {
        tempItems.push({ date: new Date(event.date), type: 'event', event });
      }
    });
    
    // Ordenar do mais recente para o mais antigo
    tempItems.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    const items: TimelineItem[] = [];
    let lastDate: Date | null = null;
    let lastMonth: number | null = null;
    let lastYear: number | null = null;

    // Processar itens ordenados
    tempItems.forEach((tempItem) => {
      const itemDate = tempItem.date;
      const year = itemDate.getFullYear();
      const month = itemDate.getMonth();
      
      // Verificar se há gap (mais de 7 dias) - ANTES do mês
      if (lastDate) {
        const daysDiff = Math.floor((lastDate.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff > 7) {
          items.push({
            type: 'gap',
            days: daysDiff,
          });
        }
      }

      // Verificar se mudou o mês
      if (lastMonth === null || lastYear === null || month !== lastMonth || year !== lastYear) {
        items.push({
          type: 'month',
          year,
          month,
        });
        lastMonth = month;
        lastYear = year;
      }

      // Adicionar item
      if (tempItem.type === 'chapter-start') {
        items.push({
          type: 'chapter-start',
          event: tempItem.event,
        });
      } else if (tempItem.type === 'chapter-end') {
        items.push({
          type: 'chapter-end',
          event: tempItem.event,
        });
      } else {
          items.push({
          type: 'event',
          event: tempItem.event,
        });
      }
      
      lastDate = itemDate;
    });
    
    // Agora adicionar períodos dentro de eventos e eventos filhos dentro de capítulos
    const finalItems: TimelineItem[] = [];
    let currentMonth: number | null = null;
    let currentYear: number | null = null;
    
    items.forEach((item) => {
      // Atualizar mês atual se necessário
      if (item.type === 'month') {
        currentMonth = item.month!;
        currentYear = item.year!;
      }
      
      // Se encontramos o início de um capítulo (era), inserir seus períodos filhos ANTES do chapter-start
      if (item.type === 'chapter-start' && item.event) {
        const chapter = item.event;
        
        // Determinar intervalo do capítulo (início e fim)
        let chapterStartDate: Date;
        if (chapter.startDate) {
          const [year, month] = chapter.startDate.split('-');
          chapterStartDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        } else {
          chapterStartDate = new Date(chapter.date);
        }
        
        let chapterEndDate: Date;
        if (chapter.endDate) {
          const [year, month] = chapter.endDate.split('-');
          chapterEndDate = new Date(parseInt(year), parseInt(month), 0); // Último dia do mês
        } else {
          chapterEndDate = chapterStartDate;
        }
        
        // Filtrar períodos que pertencem a esta era E estão dentro do intervalo
        const childPeriods = regularEvents
          .filter(e => {
            if (e.parentPeriodId !== chapter.id || e.scope !== 'period') return false;
            const periodDate = new Date(e.date);
            // Verificar se está dentro do intervalo do capítulo
            return periodDate >= chapterStartDate && periodDate <= chapterEndDate;
          })
          .sort((a, b) => {
            // Ordenar: períodos com o mesmo mês/ano do capítulo primeiro (acima), depois por data decrescente
            const aDate = new Date(a.date);
            const bDate = new Date(b.date);
            const aSameMonth = aDate.getFullYear() === chapterStartDate.getFullYear() && 
                              aDate.getMonth() === chapterStartDate.getMonth();
            const bSameMonth = bDate.getFullYear() === chapterStartDate.getFullYear() && 
                              bDate.getMonth() === chapterStartDate.getMonth();
            
            if (aSameMonth && !bSameMonth) return -1; // a primeiro
            if (!aSameMonth && bSameMonth) return 1; // b primeiro
            return b.date.localeCompare(a.date); // Caso contrário, ordenar por data decrescente
          });
        
        // Inserir TODOS os períodos ANTES do chapter-start (períodos devem aparecer acima dos capítulos)
        childPeriods.forEach((childPeriod) => {
          const periodDate = new Date(childPeriod.date);
          const year = periodDate.getFullYear();
          const month = periodDate.getMonth();
          
          // Verificar se mudou o mês
          if (currentMonth === null || currentYear === null || month !== currentMonth || year !== currentYear) {
            finalItems.push({
              type: 'month',
              year,
              month,
            });
            currentMonth = month;
            currentYear = year;
          }
          
          finalItems.push({
            type: 'event',
            event: childPeriod,
          });
        });
      }
      
      // Adicionar o item atual (chapter-start, chapter-end, event, etc.)
      finalItems.push(item);
      
      // Se encontramos o início de um capítulo (era), inserir eventos filhos depois
      if (item.type === 'chapter-start' && item.event) {
        const chapter = item.event;
        
        // Determinar intervalo do capítulo (início e fim)
        let chapterStartDate: Date;
        if (chapter.startDate) {
          const [year, month] = chapter.startDate.split('-');
          chapterStartDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        } else {
          chapterStartDate = new Date(chapter.date);
        }
        
        let chapterEndDate: Date;
        if (chapter.endDate) {
          const [year, month] = chapter.endDate.split('-');
          chapterEndDate = new Date(parseInt(year), parseInt(month), 0); // Último dia do mês
        } else {
          chapterEndDate = chapterStartDate;
        }
        
        // Filtrar eventos (não períodos) que pertencem a esta era
        const childEvents = regularEvents
          .filter(e => {
            if (e.parentPeriodId !== chapter.id || e.scope !== 'event') return false;
            const eventDate = new Date(e.date);
            // Verificar se está dentro do intervalo do capítulo
            return eventDate >= chapterStartDate && eventDate <= chapterEndDate;
          })
          .sort((a, b) => b.date.localeCompare(a.date)); // Ordenar por data decrescente
        
        // Inserir eventos filhos DEPOIS do chapter-start
        childEvents.forEach((childEvent) => {
          const eventDate = new Date(childEvent.date);
          const year = eventDate.getFullYear();
          const month = eventDate.getMonth();
          
          // Verificar se mudou o mês
          if (currentMonth === null || currentYear === null || month !== currentMonth || year !== currentYear) {
            finalItems.push({
              type: 'month',
              year,
              month,
            });
            currentMonth = month;
            currentYear = year;
          }
          
          finalItems.push({
            type: 'event',
            event: childEvent,
          });
        });
      }
      
      // Períodos são sempre filhos de capítulos (eras), não de eventos
      // A estrutura é: Era [ Período ]
    });
    
    return finalItems;
  }, [eventsSignature]);

  const formatDay = (dateStr: string): string => {
    const date = new Date(dateStr);
    const day = date.getDate();
    
    // Obter array de dias
    const daysShort = t('journal.daysShort');
    const dayNames = Array.isArray(daysShort) ? daysShort : [];
    
    // Fallback para português
    const fallbackDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const dayName = dayNames[date.getDay()] || fallbackDays[date.getDay()] || 'Dom';
    
    return `${day} ${dayName}`;
  };

  // Agrupar itens por mês para controlar visibilidade
  const groupedItems = useMemo(() => {
    if (!timelineItems || timelineItems.length === 0) {
      return [];
    }

    const groups: Array<{ monthKey: string; year: number; month: number; items: TimelineItem[] }> = [];
    let currentGroup: { monthKey: string; year: number; month: number; items: TimelineItem[] } | null = null;

    timelineItems.forEach((item) => {
      if (item.type === 'month' && item.year !== undefined && item.month !== undefined) {
        // Novo grupo de mês
        currentGroup = {
          monthKey: `${item.year}-${item.month}`,
          year: item.year,
          month: item.month,
          items: [item],
        };
        groups.push(currentGroup);
      } else if (item.type === 'chapter-start' || item.type === 'chapter-end') {
        // Capítulos são sempre visíveis
        if (currentGroup) {
          currentGroup.items.push(item);
        } else {
          // Se não há grupo atual, criar um temporário
          groups.push({
            monthKey: 'chapters',
            year: 0,
            month: 0,
            items: [item],
          });
        }
      } else if (currentGroup) {
        // Adicionar ao grupo atual
        currentGroup.items.push(item);
      } else {
        // Item sem grupo (não deveria acontecer, mas por segurança)
        groups.push({
          monthKey: 'orphan',
          year: 0,
          month: 0,
          items: [item],
        });
      }
    });

    return groups;
  }, [timelineItems]);

  return (
    <div
      style={{
        position: 'relative',
        paddingLeft: '80px',
        maxHeight: '600px', // Altura máxima similar ao módulo de finanças
        overflowY: 'auto',
        overflowX: 'hidden',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        backgroundColor: '#fff',
      }}
    >
      {/* Linha vertical pontilhada */}
      <div
        style={{
          position: 'absolute',
          left: '0',
          top: '0',
          bottom: '0',
          width: '2px',
          borderLeft: '2px dashed #ccc',
          zIndex: 1,
        }}
      />

      {/* Itens da timeline agrupados por mês */}
      <div className="space-y-2" style={{ padding: '8px' }}>
        {groupedItems && groupedItems.length > 0 ? groupedItems.map((group) => {
          const isExpanded = group.monthKey === 'chapters' || group.monthKey === 'orphan' || isMonthExpanded(group.year, group.month);
          
          return (
            <div key={group.monthKey}>
              {/* Renderizar cabeçalho do mês */}
              {group.items.find(item => item.type === 'month') && (() => {
                const monthItem = group.items.find(item => item.type === 'month');
                if (monthItem && monthItem.year !== undefined && monthItem.month !== undefined) {
            return (
                    <div key={`month-${monthItem.year}-${monthItem.month}`}>
              <TimelineMonthHeader
                        year={monthItem.year}
                        month={monthItem.month}
                        isExpanded={isExpanded}
                        onToggle={() => toggleMonth(monthItem.year!, monthItem.month!)}
                      />
                    </div>
                  );
                }
                return null;
              })()}
              
              {/* Renderizar itens do grupo (apenas se expandido ou se for capítulo/gap) */}
              {group.items
                .filter(item => item.type !== 'month')
                .map((item, itemIndex) => {
                  // Capítulos e gaps sempre visíveis
                  if (item.type === 'chapter-start' || item.type === 'chapter-end' || item.type === 'gap') {
                    // Renderizar normalmente
                  } else if (item.type === 'event' && !isExpanded) {
                    // Eventos só aparecem se expandido
                    return null;
                  }

                  // Renderizar gap
                  if (item.type === 'gap' && item.days) {
                    return (
                      <div key={`gap-${group.monthKey}-${itemIndex}`}>
                        <TimelineGap days={item.days} />
                      </div>
                    );
                  }

                  // Renderizar marcação de início do capítulo
                  if (item.type === 'chapter-start' && item.event) {
                    const chapter = item.event;
                    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
                    
                    let formattedStartDate = '';
                    if (chapter.startDate) {
                      const [year, month] = chapter.startDate.split('-');
                      formattedStartDate = `${monthNames[parseInt(month) - 1]} de ${year}`;
                    } else {
                      const dateObj = new Date(chapter.date);
                      formattedStartDate = `${monthNames[dateObj.getMonth()]} de ${dateObj.getFullYear()}`;
                    }
                    
                    const scopeColor = chapter.scope === 'period' ? '#2196f3' : '#ff9800';
                    const scopeBorderColor = chapter.scope === 'period' ? '#1976d2' : '#f57c00';
                    
                    return (
                      <div key={`${chapter.id}-start`} className="relative my-4 w-full">
                        <div className="flex items-center">
                          {/* Marcação circular no início */}
                          <div
                            style={{
                              width: '12px',
                              height: '12px',
                              backgroundColor: scopeColor,
                              border: `2px solid ${scopeBorderColor}`,
                              borderRadius: '50%',
                              flexShrink: 0,
                              zIndex: 10,
                            }}
                          />
                          {/* Linha horizontal para a direita */}
                          <div className="flex-1 relative flex items-center py-2" style={{ marginLeft: '8px' }}>
                            <div
                              style={{
                                position: 'absolute',
                                left: '-8px',
                                right: '50%',
                                height: '2px',
                                backgroundColor: scopeColor,
                              }}
                            />
                            <div
                              className="px-4 cursor-pointer transition-all mx-auto"
                              onClick={() => onEdit(chapter)}
                              style={{
                                backgroundColor: '#fff',
                                position: 'relative',
                                zIndex: 2,
                                border: `2px solid ${scopeColor}`,
                                borderRadius: '4px',
                              }}
                            >
                              <div className="text-center">
                                <div className="font-pixel-bold mb-1" style={{ color: '#111', fontSize: '14px' }}>
                                  Início: {formattedStartDate}
                                </div>
                                <div className="font-pixel-bold" style={{ color: scopeColor, fontSize: '16px', letterSpacing: '0.5px' }}>
                                  {chapter.title}
                                </div>
                              </div>
                            </div>
                            <div
                              style={{
                                position: 'absolute',
                                left: '50%',
                                right: '-8px',
                                height: '2px',
                                backgroundColor: scopeColor,
                              }}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(chapter.id);
                              }}
                              className="absolute top-0 right-0 text-red-500 hover:text-red-700 transition-colors"
                              style={{ fontSize: '18px' }}
                            >
                              ×
                            </button>
                          </div>
                        </div>
                        {chapter.summary && (
                          <div
                            className="text-center mt-2 px-4 cursor-pointer"
                            onClick={() => onEdit(chapter)}
                            style={{
                              color: '#666',
                              fontSize: '13px',
                              fontStyle: 'italic',
                              lineHeight: '1.5',
                              marginLeft: '20px',
                            }}
                          >
                            {chapter.summary}
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Renderizar marcação de fim do capítulo
                  if (item.type === 'chapter-end' && item.event) {
                    const chapter = item.event;
                    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
                    
                    let formattedEndDate = '';
                    if (chapter.endDate) {
                      const [year, month] = chapter.endDate.split('-');
                      formattedEndDate = `${monthNames[parseInt(month) - 1]} de ${year}`;
                    } else if (chapter.startDate) {
                      const [year, month] = chapter.startDate.split('-');
                      formattedEndDate = `${monthNames[parseInt(month) - 1]} de ${year}`;
                    } else {
                      const dateObj = new Date(chapter.date);
                      formattedEndDate = `${monthNames[dateObj.getMonth()]} de ${dateObj.getFullYear()}`;
                    }
                    
                    const scopeColor = chapter.scope === 'period' ? '#2196f3' : '#ff9800';
                    const scopeBorderColor = chapter.scope === 'period' ? '#1976d2' : '#f57c00';
                    
            return (
                      <div key={`${chapter.id}-end`} className="relative my-4 flex items-center">
                        {/* Linha horizontal da esquerda */}
                        <div className="flex-1 relative flex items-center py-2" style={{ marginLeft: '8px' }}>
                          <div
                            style={{
                              position: 'absolute',
                              left: '-8px',
                              right: '50%',
                              height: '2px',
                              backgroundColor: scopeColor,
                            }}
                          />
                          <div
                            className="px-4 cursor-pointer transition-all mx-auto"
                            onClick={() => onEdit(chapter)}
                            style={{
                              backgroundColor: '#fff',
                              position: 'relative',
                              zIndex: 2,
                              border: `2px solid ${scopeColor}`,
                              borderRadius: '4px',
                            }}
                          >
                            <div className="text-center">
                              <div className="font-pixel-bold mb-1" style={{ color: '#111', fontSize: '14px' }}>
                                Fim: {formattedEndDate}
                              </div>
                              <div className="font-pixel-bold" style={{ color: scopeColor, fontSize: '16px', letterSpacing: '0.5px' }}>
                                {chapter.title}
                              </div>
                            </div>
                          </div>
                          <div
                            style={{
                              position: 'absolute',
                              left: '50%',
                              right: '-8px',
                              height: '2px',
                              backgroundColor: scopeColor,
                            }}
                          />
                        </div>
                        {/* Marcação circular no fim */}
                        <div
                          style={{
                            width: '12px',
                            height: '12px',
                            backgroundColor: scopeColor,
                            border: `2px solid ${scopeBorderColor}`,
                            borderRadius: '50%',
                            flexShrink: 0,
                            zIndex: 10,
                            marginLeft: '8px',
                          }}
                        />
                      </div>
                    );
                  }

                  // Renderizar evento
          if (item.type === 'event' && item.event) {
            const event = item.event;
                    // Eventos são laranja, períodos são azul
                    const isPeriod = event.scope === 'period';
                    const scopeColor = isPeriod ? '#2196f3' : '#ff9800';
                    const scopeBorderColor = isPeriod ? '#1976d2' : '#f57c00';
                    // Verificar se é filho de um capítulo (era) ou de um evento
                    const parentChapter = events?.find(e => e.type === 'chapter' && e.id === event.parentPeriodId);
                    const isNestedInChapter = parentChapter !== undefined;
                    // Períodos dentro de eras têm indentação maior
                    const isNested = isPeriod || event.parentPeriodId !== undefined;
                    const indentLevel = isPeriod && isNestedInChapter ? '60px' : (isNested ? '40px' : '0');
                    
            return (
              <div
                key={event.id}
                className="flex items-start gap-4 relative"
                        style={{ marginLeft: indentLevel }}
              >
                <div
                  className="font-pixel-bold text-right"
                  style={{
                    width: '60px',
                    color: '#111',
                    fontSize: isPeriod ? '12px' : '14px',
                    flexShrink: 0,
                  }}
                >
                  {formatDay(event.date)}
                </div>
                {/* Linha horizontal menor para períodos - mais fina e mais curta que capítulos */}
                {isPeriod && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '60px',
                      top: '50%',
                      width: '120px',
                      height: '1px',
                      backgroundColor: scopeColor,
                      transform: 'translateY(-50%)',
                      zIndex: 5,
                    }}
                  />
                )}
                <div
                  style={{
                    position: 'absolute',
                    left: isPeriod ? '60px' : '-6px',
                    width: isPeriod ? '8px' : '12px',
                    height: isPeriod ? '8px' : '12px',
                            backgroundColor: scopeColor,
                            border: isPeriod ? `1px solid ${scopeBorderColor}` : `2px solid ${scopeBorderColor}`,
                    borderRadius: '50%',
                    zIndex: 10,
                    flexShrink: 0,
                  }}
                        />
                <div
                  className="flex-1 cursor-pointer transition-all relative"
                  style={{
                    backgroundColor: '#FFFFFF',
                            border: isPeriod ? `1px solid ${scopeColor}` : `2px solid ${scopeColor}`,
                    borderRadius: '6px',
                    padding: isPeriod ? '8px' : '12px',
                    marginLeft: isPeriod ? '180px' : '0',
                  }}
                  onClick={() => onEdit(event)}
                  onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = scopeBorderColor;
                            e.currentTarget.style.boxShadow = `0 2px 8px rgba(${isPeriod ? '33, 150, 243' : '255, 152, 0'}, 0.3)`;
                  }}
                  onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = scopeColor;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                              <h3 className="font-pixel-bold mb-1" style={{ color: scopeColor, fontSize: isPeriod ? '14px' : '16px' }}>
                        {event.title}
                      </h3>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(event.id);
                      }}
                      className="text-red-500 hover:text-red-700 transition-colors ml-2"
                      style={{ fontSize: isPeriod ? '16px' : '18px', flexShrink: 0 }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          return null;
        })}
            </div>
          );
        }) : null}
      </div>
    </div>
  );
}
