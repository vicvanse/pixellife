"use client";

import { useCosmetics } from "./CosmeticsContext";
import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";

interface AvatarSelectorOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVATARS = [
  { src: "/avatar1.gif", alt: "Avatar 1" },
  { src: "/avatar1.2.gif", alt: "Avatar 1.2" },
  { src: "/avatar2.gif", alt: "Avatar 2" },
  { src: "/avatar2.1.gif", alt: "Avatar 2.1" },
  { src: "/avatar3.gif", alt: "Avatar 3" },
];

export function AvatarSelectorOverlay({ isOpen, onClose }: AvatarSelectorOverlayProps) {
  const { avatar, setAvatar } = useCosmetics();
  const { t } = useLanguage();
  const [selectedAvatar, setSelectedAvatar] = useState<string>(avatar);

  // Atualiza o avatar selecionado quando o modal abre
  useEffect(() => {
    if (isOpen) {
      setSelectedAvatar(avatar);
    }
  }, [isOpen, avatar]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    setAvatar(selectedAvatar);
    onClose();
  };

  return (
    <>
      <style>{`
        @keyframes modalPop {
          0% {
            opacity: 0;
            transform: scale(0.95);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        .avatar-modal-content {
          animation: modalPop 0.15s ease-out;
        }
      `}</style>
      <div 
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <div 
          className="bg-white max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto avatar-modal-content"
          onClick={(e) => e.stopPropagation()}
          style={{
            border: '2px solid #000',
            borderRadius: '4px',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.3)',
            padding: '24px 16px',
          }}
        >
        {/* Cabeçalho com botão de fechar */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 
              className="font-pixel-bold mb-2" 
              style={{ 
                color: '#111', 
                fontSize: '1.25rem',
                fontWeight: 600,
              }}
            >
              {t('display.changeStyle')}
            </h1>
            <p 
              className="font-pixel" 
              style={{ 
                color: '#888', 
                fontSize: '14px',
              }}
            >
              Escolha seu estilo para exibi-lo no Display
            </p>
          </div>
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

        {/* Avatares em Grid */}
        <div 
          className="mb-6"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
            gap: '12px',
          }}
        >
          {AVATARS.map((avatarOption) => {
            const isSelected = selectedAvatar === avatarOption.src;
            return (
              <div
                key={avatarOption.src}
                onClick={() => setSelectedAvatar(avatarOption.src)}
                className="cursor-pointer transition-all"
                style={{
                  border: `1px solid ${isSelected ? '#6d9eff' : '#dcdcdc'}`,
                  backgroundColor: isSelected ? 'rgba(109, 158, 255, 0.1)' : '#f5f5f5',
                  borderRadius: '4px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isSelected 
                    ? '0 0 0 2px rgba(109, 158, 255, 0.2), 0 0 8px rgba(109, 158, 255, 0.3)' 
                    : 'none',
                  transform: 'scale(1)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = '#fafafa';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                <img
                  src={avatarOption.src}
                  className="image-render-pixel"
                  alt={avatarOption.alt}
                  style={{
                    width: '72px',
                    height: '72px',
                    objectFit: 'contain',
                    imageRendering: 'pixelated',
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Divisor */}
        <div 
          className="mb-4"
          style={{ 
            borderTop: '1px solid #e0e0e0',
            paddingTop: '16px',
          }}
        />

        {/* Botão de confirmar */}
        <button
          onClick={handleConfirm}
          className="w-full px-4 py-2 rounded font-pixel-bold transition-colors hover:opacity-90"
          style={{
            backgroundColor: '#7aff7a',
            border: '1px solid #0f9d58',
            color: '#111',
            fontSize: '16px',
            fontWeight: 600,
            borderRadius: '8px',
          }}
        >
          Usar este estilo
        </button>
      </div>
    </div>
    </>
  );
}

