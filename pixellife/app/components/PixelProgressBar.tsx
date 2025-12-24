'use client';

interface PixelProgressBarProps {
  progress: number; // 0-1
  height?: number;
  width?: number;
  color?: string;
  backgroundColor?: string;
  blockCount?: number; // Número de blocos visíveis
  className?: string;
}

export function PixelProgressBar({
  progress,
  height = 300,
  width = 32,
  color = '#4ade80',
  backgroundColor = '#d1d5db',
  blockCount = 20, // 20 blocos = 5% cada
  className = '',
}: PixelProgressBarProps) {
  const filledBlocks = Math.floor(progress * blockCount);
  const blockHeight = height / blockCount;

  return (
    <div
      className={`relative ${className}`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor,
        border: '2px solid #000',
      }}
    >
      {/* Blocos preenchidos */}
      {Array.from({ length: filledBlocks }).map((_, index) => (
        <div
          key={index}
          className="absolute left-0 right-0"
          style={{
            bottom: `${index * blockHeight}px`,
            height: `${blockHeight}px`,
            backgroundColor: color,
            borderTop: '1px solid rgba(0,0,0,0.2)',
            borderBottom: '1px solid rgba(0,0,0,0.2)',
            // Efeito pixel art com sombra interna
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.2)',
          }}
        />
      ))}
      
      {/* Efeito de brilho pixelado opcional */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent ${blockHeight}px,
            rgba(0,0,0,0.05) ${blockHeight}px,
            rgba(0,0,0,0.05) ${blockHeight + 1}px
          )`,
        }}
      />
    </div>
  );
}

