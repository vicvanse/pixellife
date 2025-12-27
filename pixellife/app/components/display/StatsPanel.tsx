'use client';

import { useHabits } from '../../hooks/useHabits';
import { useJournal } from '../../hooks/useJournal';
import { usePossessions } from '../../hooks/usePossessions';
import { useTree } from '../../hooks/useTree';
import { useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';

export function StatsPanel() {
  const { t } = useLanguage();
  const { habits } = useHabits();
  const { getAllDates } = useJournal();
  const { getAllPossessions } = usePossessions();
  const { getLeisureSkills, getPersonalSkills } = useTree();

  const stats = useMemo(() => {
    // Calcular streaks (dias consecutivos de hábitos)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    for (let i = 0; i < 365; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().substring(0, 10);
      
      const hasAnyHabit = habits.some(habit => habit.checks[dateStr]);
      
      if (hasAnyHabit) {
        if (i === 0) {
          currentStreak = 1;
        } else {
          currentStreak++;
        }
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        if (i > 0) {
          currentStreak = 0;
        }
        tempStreak = 0;
      }
    }

    // Total de treinos (hábitos completados)
    const totalTrainings = habits.reduce((acc, habit) => {
      return acc + Object.values(habit.checks).filter(Boolean).length;
    }, 0);

    // Dias registrados no journal
    const journalDates = getAllDates();
    const daysRegistered = journalDates.length;

    // Objetivos completados
    const possessions = getAllPossessions();
    const completedGoals = possessions.filter(p => p.status === 'completed').length;

    // Habilidades completadas
    const leisureSkills = getLeisureSkills();
    const personalSkills = getPersonalSkills();
    const completedSkills = [...leisureSkills, ...personalSkills].filter(s => s.progress === 100).length;

    return {
      currentStreak,
      longestStreak,
      totalTrainings,
      daysRegistered,
      completedGoals,
      completedSkills,
      totalHabits: habits.length,
    };
  }, [habits, getAllDates, getAllPossessions, getLeisureSkills, getPersonalSkills]);

  return (
    <div 
      className="p-4 rounded-md"
      style={{
        backgroundColor: '#e8e8e8',
        border: '1px solid #e8e8e2',
      }}
    >
      <h2 className="font-pixel-bold mb-4" style={{ color: '#111', fontSize: '16px' }}>
        {t('display.myStats')}
      </h2>
      
      <div className="space-y-3">
        {/* Current Streak */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="font-pixel" style={{ color: '#111', fontSize: '16px' }}>
              {t('display.currentStreak')}
            </span>
            <span className="font-pixel-bold" style={{ color: '#111', fontSize: '16px' }}>
              {stats.currentStreak}
            </span>
          </div>
          {/* Linha divisória entre Current Streak e Longest Streak */}
          <div className="my-3" style={{ borderTop: '1px solid #c0c0c0' }}></div>
        </div>

        {/* Longest Streak */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="font-pixel" style={{ color: '#111', fontSize: '16px' }}>
              {t('display.longestStreak')}
            </span>
            <span className="font-pixel-bold" style={{ color: '#111', fontSize: '16px' }}>
              {stats.longestStreak}
            </span>
          </div>
        </div>

        {/* Total Trainings */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="font-pixel" style={{ color: '#111', fontSize: '16px' }}>
              {t('display.trainings')}
            </span>
            <span className="font-pixel-bold" style={{ color: '#111', fontSize: '16px' }}>
              {stats.totalTrainings}
            </span>
          </div>
        </div>

        {/* Days Registered */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="font-pixel" style={{ color: '#111', fontSize: '16px' }}>
              {t('display.daysRegistered')}
            </span>
            <span className="font-pixel-bold" style={{ color: '#111', fontSize: '16px' }}>
              {stats.daysRegistered}
            </span>
          </div>
        </div>

        {/* Completed Goals */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="font-pixel" style={{ color: '#111', fontSize: '16px' }}>
              {t('display.goalsCompleted')}
            </span>
            <span className="font-pixel-bold" style={{ color: '#111', fontSize: '16px' }}>
              {stats.completedGoals}
            </span>
          </div>
        </div>

        {/* Completed Skills */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="font-pixel" style={{ color: '#111', fontSize: '16px' }}>
              {t('display.skillsMastered')}
            </span>
            <span className="font-pixel-bold" style={{ color: '#111', fontSize: '16px' }}>
              {stats.completedSkills}
            </span>
          </div>
        </div>

        {/* Total Habits */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="font-pixel" style={{ color: '#111', fontSize: '16px' }}>
              {t('display.activeHabits')}
            </span>
            <span className="font-pixel-bold" style={{ color: '#111', fontSize: '16px' }}>
              {stats.totalHabits}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

