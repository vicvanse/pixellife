"use client";

export function PixelArtBackground() {
  // Posições fixas para estrelas (para evitar re-render)
  const stars = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    x: (i * 7.3) % 100,
    y: (i * 11.7) % 50,
    size: 1 + (i % 3),
  }));

  return (
    <div 
      className="fixed inset-0 overflow-hidden z-0"
      style={{
        imageRendering: "pixelated",
        zIndex: 0,
      }}
    >
      {/* Céu com gradiente pixelado - azul escuro com tons roxos */}
      <div 
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to bottom, #0a0e27 0%, #1a1a3e 25%, #2d1b4e 50%, #3d2a5e 75%, #4a3a6e 100%)",
          imageRendering: "pixelated",
        }}
      >
        {/* Estrelas */}
        <div className="absolute inset-0">
          {stars.map((star) => (
            <div
              key={star.id}
              className="absolute bg-white rounded-sm"
              style={{
                width: `${star.size}px`,
                height: `${star.size}px`,
                left: `${star.x}%`,
                top: `${star.y}%`,
                boxShadow: star.size > 1 ? `0 0 ${star.size}px white` : "none",
                imageRendering: "pixelated",
              }}
            />
          ))}
        </div>

        {/* Nuvens pixeladas em tons quentes */}
        <div 
          className="absolute top-16 left-8 w-40 h-20 rounded-sm opacity-85" 
          style={{ 
            background: "#ffa366",
            imageRendering: "pixelated",
            clipPath: "polygon(10% 50%, 30% 20%, 50% 30%, 70% 10%, 90% 30%, 100% 50%, 90% 70%, 70% 80%, 50% 90%, 30% 85%, 10% 70%)",
          }} 
        />
        <div 
          className="absolute top-24 left-32 w-48 h-24 rounded-sm opacity-75" 
          style={{ 
            background: "#ffcc66",
            imageRendering: "pixelated",
            clipPath: "polygon(5% 40%, 25% 15%, 45% 25%, 65% 5%, 85% 25%, 95% 45%, 85% 65%, 65% 75%, 45% 85%, 25% 80%, 5% 60%)",
          }} 
        />
        <div 
          className="absolute top-12 right-16 w-36 h-18 rounded-sm opacity-80" 
          style={{ 
            background: "#ff9966",
            imageRendering: "pixelated",
            clipPath: "polygon(15% 45%, 35% 18%, 55% 28%, 75% 12%, 95% 32%, 100% 52%, 95% 72%, 75% 82%, 55% 88%, 35% 83%, 15% 65%)",
          }} 
        />
        <div 
          className="absolute top-20 right-32 w-32 h-16 rounded-sm opacity-70" 
          style={{ 
            background: "#ffdd88",
            imageRendering: "pixelated",
            clipPath: "polygon(8% 48%, 28% 22%, 48% 32%, 68% 15%, 88% 35%, 98% 55%, 88% 75%, 68% 82%, 48% 88%, 28% 78%, 8% 58%)",
          }} 
        />
      </div>

      {/* Montanhas */}
      <div className="absolute bottom-0 left-0 right-0 h-2/5">
        {/* Montanha direita (grande) - roxa/azul escura */}
        <div 
          className="absolute bottom-0 right-0"
          style={{
            width: "45%",
            height: "100%",
            background: "linear-gradient(to bottom, #3d2a5e 0%, #2d1b4e 40%, #1a0f3e 70%, #0a0526 100%)",
            clipPath: "polygon(25% 100%, 60% 50%, 100% 100%)",
            imageRendering: "pixelated",
          }}
        />
        {/* Montanha esquerda (menor) */}
        <div 
          className="absolute bottom-0 left-0"
          style={{
            width: "35%",
            height: "85%",
            background: "linear-gradient(to bottom, #35255a 0%, #251a4a 40%, #150f2e 70%, #0a0520 100%)",
            clipPath: "polygon(0% 100%, 35% 65%, 100% 100%)",
            imageRendering: "pixelated",
          }}
        />
        {/* Destaques nas montanhas (luz do sol - laranja/amarelo) */}
        <div 
          className="absolute bottom-0 right-0"
          style={{
            width: "40%",
            height: "55%",
            background: "linear-gradient(135deg, rgba(255, 180, 80, 0.4) 0%, rgba(255, 200, 120, 0.3) 30%, transparent 60%)",
            clipPath: "polygon(25% 100%, 55% 50%, 100% 100%)",
            imageRendering: "pixelated",
          }}
        />
        <div 
          className="absolute bottom-0 right-0"
          style={{
            width: "35%",
            height: "45%",
            background: "linear-gradient(135deg, rgba(255, 220, 140, 0.3) 0%, transparent 50%)",
            clipPath: "polygon(30% 100%, 60% 55%, 100% 100%)",
            imageRendering: "pixelated",
          }}
        />
      </div>

      {/* Floresta/Pinheiros escuros */}
      <div className="absolute bottom-0 left-0 right-0 h-1/5">
        {Array.from({ length: 25 }).map((_, i) => {
          const baseX = (i * 4);
          const variation = (i % 3) * 1.5;
          return (
            <div
              key={i}
              className="absolute bottom-0"
              style={{
                left: `${baseX + variation}%`,
                width: "6px",
                height: `${40 + (i % 3) * 15}px`,
                background: "#0d2e0d",
                clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
                imageRendering: "pixelated",
              }}
            />
          );
        })}
      </div>

      {/* Campo dourado (foreground) */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-1/5"
        style={{
          background: "linear-gradient(to bottom, #e6c896 0%, #d4b574 30%, #c4a564 60%, #b89554 100%)",
          imageRendering: "pixelated",
        }}
      >
        {/* Textura do campo - plantas/grama */}
        <div className="absolute inset-0 opacity-30">
          {Array.from({ length: 150 }).map((_, i) => (
            <div
              key={i}
              className="absolute bottom-0"
              style={{
                left: `${(i * 0.67) % 100}%`,
                width: `${1 + (i % 2)}px`,
                height: `${8 + (i % 5) * 3}px`,
                background: "#8b6f47",
                imageRendering: "pixelated",
              }}
            />
          ))}
        </div>
        {/* Silhuetas de plantas maiores nos cantos */}
        <div 
          className="absolute bottom-0 left-0 w-20 h-16"
          style={{
            background: "#5a4a2a",
            clipPath: "polygon(20% 100%, 30% 60%, 40% 80%, 50% 40%, 60% 70%, 70% 30%, 80% 50%, 90% 20%, 100% 100%)",
            imageRendering: "pixelated",
          }}
        />
        <div 
          className="absolute bottom-0 right-0 w-24 h-18"
          style={{
            background: "#5a4a2a",
            clipPath: "polygon(0% 100%, 10% 50%, 20% 70%, 30% 30%, 40% 60%, 50% 20%, 60% 50%, 70% 10%, 80% 40%, 90% 15%, 100% 100%)",
            imageRendering: "pixelated",
          }}
        />
      </div>

      {/* Overlay escuro sutil no topo para melhor contraste do texto */}
      <div 
        className="absolute top-0 left-0 right-0 h-1/4"
        style={{
          background: "linear-gradient(to bottom, rgba(0, 0, 0, 0.2) 0%, transparent 100%)",
        }}
      />
    </div>
  );
}

