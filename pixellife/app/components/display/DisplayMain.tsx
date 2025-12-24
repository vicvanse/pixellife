'use client';

import { useAuth } from '../../context/AuthContext';
import { useCosmetics } from '../CosmeticsContext';
import { usePersistentState } from '../../hooks/usePersistentState';
import { useState, useEffect, useMemo, useRef } from 'react';
import { saveToSupabase, loadFromSupabase } from '../../lib/supabase-sync';
import { withRetry } from '../../lib/retry';
import type { PostgrestError } from '@supabase/supabase-js';
import { BioDisplay } from '../bio/BioDisplay';
import { BioEditor, BioEditorRef } from '../bio/BioEditor';
import { useProfileInfo } from '../../hooks/useProfileInfo';
import { useBio } from '../../hooks/useBio';
import { useLanguage } from '../../context/LanguageContext';

interface ProfileData {
  birthDate: string;
  city: string;
  title: string;
  bio: string; // Mantido para compatibilidade, mas não usado mais
}

export function DisplayMain() {
  const { t, tString } = useLanguage();
  const { user } = useAuth();
  const { avatar } = useCosmetics();
  const [birthDate, setBirthDate] = usePersistentState<string>('profile-birthDate', '');
  const [city, setCity] = usePersistentState<string>('profile-city', '');
  const [title, setTitle] = usePersistentState<string>('profile-title', '');
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const hasLoadedFromSupabaseRef = useRef(false);
  const bioEditorRef = useRef<BioEditorRef>(null);
  const { saveBirthDate, saveCity, saveTitle } = useProfileInfo();
  const { saveBio } = useBio();
  const previousValuesRef = useRef({ birthDate: '', city: '', title: '' });

  const userName = user?.email?.split('@')[0] || 'User';
  const displayName = userName.toUpperCase();

  // Carregar dados do perfil do Supabase
  useEffect(() => {
    async function loadProfileFromSupabase() {
      if (!user?.id) {
        hasLoadedFromSupabaseRef.current = false;
        return;
      }
      
      if (hasLoadedFromSupabaseRef.current) {
        return;
      }

      console.log('🔄 DisplayMain: Carregando profile do Supabase para usuário:', user.id);
      
      const { data: profileData, error: profileError } = await loadFromSupabase(user.id, 'profile');
      if (!profileError && profileData && typeof profileData === 'object') {
        const profile = profileData as ProfileData;
        console.log('✅ DisplayMain: Profile carregado do Supabase');
        if (profile.birthDate) setBirthDate(profile.birthDate);
        if (profile.city) setCity(profile.city);
        if (profile.title) setTitle(profile.title);
        // Bio não é mais carregada aqui, é gerenciada via Activities
      } else if (profileError && (profileError as PostgrestError).code !== 'PGRST116') {
        console.warn('⚠️ DisplayMain: Erro ao carregar profile do Supabase:', profileError);
      } else {
        console.log('ℹ️ DisplayMain: Nenhum profile encontrado no Supabase (primeira vez?)');
      }

      hasLoadedFromSupabaseRef.current = true;
    }

    loadProfileFromSupabase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Removendo setBirthDate, setCity, setTitle das dependências para evitar loop infinito

  // Função para salvar tudo (bio + perfil) quando o usuário clicar em "Salvar"
  const handleSave = async () => {
    if (!user?.id || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      // Salvar bio se estiver em modo de edição (permite salvar mesmo vazia)
      if (isEditingBio && bioEditorRef.current) {
        const bioText = bioEditorRef.current.getText();
        console.log('💾 DisplayMain: Salvando bio...', { bioText: bioText.substring(0, 50) });
        const bioResult = await bioEditorRef.current.saveBio();
        if (!bioResult.success) {
          console.error('❌ Erro ao salvar bio:', bioResult.error);
          alert(`Erro ao salvar bio: ${bioResult.error}`);
          setIsSaving(false);
          return; // Parar se bio falhar
        }
        console.log('✅ DisplayMain: Bio salva com sucesso!');
      }

      // Salvar como Activities se mudou (em paralelo para ser mais rápido)
      const activitiesToSave = [];
      if (birthDate && birthDate !== previousValuesRef.current.birthDate) {
        activitiesToSave.push(saveBirthDate(birthDate).then(() => {
          previousValuesRef.current.birthDate = birthDate;
        }));
      }
      if (city && city !== previousValuesRef.current.city) {
        activitiesToSave.push(saveCity(city).then(() => {
          previousValuesRef.current.city = city;
        }));
      }
      if (title && title !== previousValuesRef.current.title) {
        activitiesToSave.push(saveTitle(title).then(() => {
          previousValuesRef.current.title = title;
        }));
      }
      
      // Salvar no user_data para compatibilidade (em paralelo com Activities)
      const profileData: ProfileData = {
        birthDate,
        city,
        title,
        bio: '', // Bio agora é gerenciada separadamente via Activities
      };
      
      const saveUserDataPromise = saveToSupabase(user.id, 'profile', profileData).then(({ error }) => {
        if (error) console.warn('⚠️ Erro ao salvar profile no user_data:', error);
      });
      
      // Aguardar todas as operações em paralelo
      await Promise.all([...activitiesToSave, saveUserDataPromise]);
      console.log('✅ DisplayMain: Profile salvo com sucesso!');
      
      // Sair do modo de edição após salvar
      setIsEditing(false);
      setIsEditingBio(false);
    } catch (err) {
      console.error('❌ DisplayMain: Erro ao salvar profile após múltiplas tentativas:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setIsEditingBio(true);
  };

  // Calcular idade em anos, meses e dias
  const ageString = useMemo(() => {
    if (!birthDate) return null;
    
    try {
      const birth = new Date(birthDate);
      const today = new Date();
      
      let years = today.getFullYear() - birth.getFullYear();
      let months = today.getMonth() - birth.getMonth();
      let days = today.getDate() - birth.getDate();
      
      if (days < 0) {
        months--;
        const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        days += lastMonth.getDate();
      }
      
      if (months < 0) {
        years--;
        months += 12;
      }
      
      const parts = [];
      if (years > 0) parts.push(`${years} ${years === 1 ? 'ano' : 'anos'}`);
      if (months > 0) parts.push(`${months} ${months === 1 ? 'mês' : 'meses'}`);
      if (days > 0) parts.push(`${days} ${days === 1 ? 'dia' : 'dias'}`);
      
      return parts.length > 0 ? parts.join(', ') : '0 dias';
    } catch {
      return null;
    }
  }, [birthDate]);

  return (
    <div 
      className="flex flex-col items-center display-card mobile-profile-header"
      style={{
        padding: '24px',
        backgroundColor: '#FFFFFF',
        borderRadius: '8px',
        border: '1.5px solid #e0e0e0',
        transition: 'background-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#ececec';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#FFFFFF';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Avatar grande */}
      <div className="mb-4">
        <img
          src={avatar}
          alt="Avatar"
          className="object-contain"
          style={{ 
            imageRendering: 'pixelated',
            width: '163.2px',
            height: '163.2px'
          }}
        />
      </div>

      {/* Nome do usuário */}
      <h2 
        className="font-pixel-bold mb-2 mobile-username" 
        style={{ 
          color: '#111', 
          fontSize: '28px',
          letterSpacing: '1px',
        }}
      >
        {displayName}
      </h2>

      {/* Micro-título */}
      <p 
        className="font-pixel mb-4" 
        style={{ 
          color: '#888', 
          fontSize: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        • {t('display.personalProfile')} •
      </p>

      {/* Bio - Nova implementação baseada em Activities - mais curta no mobile */}
      <div className="w-full max-w-md mb-4 mobile-bio">
        {isEditingBio ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <span className="font-pixel-bold mobile-bio-label" style={{ color: '#111', fontSize: '16px' }}>{t('display.bio')}</span>
            </div>
            <BioEditor
              ref={bioEditorRef}
              hideButtons={true}
              onSave={() => {}}
              onCancel={() => {}}
            />
          </>
        ) : (
          <BioDisplay 
            showEditButton={true} 
            isEditing={false}
            onEditingChange={(editing) => {
              setIsEditingBio(editing);
              if (editing) {
                setIsEditing(true); // Ativar edição do perfil também quando editar bio
              }
            }}
            hideButtons={true}
          />
        )}
      </div>

      {/* Informações do perfil */}
      <div className="w-full max-w-md space-y-2 mobile-profile-info">
        {/* Idade */}
        <div className="flex items-center gap-2">
          <span className="font-pixel-bold" style={{ color: '#111', fontSize: '16px' }}>{t('display.age')}</span>
          {isEditing ? (
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="flex-1 px-2 py-1 font-pixel text-sm"
              style={{
                border: '1px solid #e0e0e0',
                backgroundColor: '#FFFFFF',
                borderRadius: '4px',
              }}
            />
          ) : (
            <span className="font-pixel" style={{ color: '#111', fontSize: '16px' }}>
              {ageString || t('display.notInformed')}
            </span>
          )}
        </div>

        {/* Cidade */}
        <div className="flex items-center gap-2">
          <span className="font-pixel-bold" style={{ color: '#111', fontSize: '16px' }}>{t('display.city')}</span>
          {isEditing ? (
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={tString('display.enterCity')}
              className="flex-1 px-2 py-1 font-pixel text-sm"
              style={{
                border: '1px solid #e0e0e0',
                backgroundColor: '#FFFFFF',
                borderRadius: '4px',
              }}
            />
          ) : (
            <span className="font-pixel" style={{ color: '#111', fontSize: '16px' }}>
              {city || t('display.notInformed')}
            </span>
          )}
        </div>

        {/* Título */}
        <div className="flex items-center gap-2">
          <span className="font-pixel-bold" style={{ color: '#111', fontSize: '16px' }}>{t('display.title')}</span>
          {isEditing ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={tString('display.titlePlaceholder')}
              className="flex-1 px-2 py-1 font-pixel text-sm"
              style={{
                border: '1px solid #e0e0e0',
                backgroundColor: '#FFFFFF',
                borderRadius: '4px',
              }}
            />
          ) : (
            <span className="font-pixel" style={{ color: '#111', fontSize: '16px' }}>
              {title || t('display.notInformed')}
            </span>
          )}
        </div>

        {/* Botão Salvar no final */}
        {(isEditing || isEditingBio) && (
          <div className="flex gap-2 justify-end mt-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-3 py-1 font-pixel text-xs transition-opacity"
              style={{
                backgroundColor: isSaving ? "#ccc" : "#9e9e9e",
                border: isSaving ? "1px solid #ccc" : "1px solid #9e9e9e",
                color: "#FFFFFF",
                borderRadius: "4px",
                opacity: isSaving ? 0.5 : 1,
              }}
            >
              {isSaving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

