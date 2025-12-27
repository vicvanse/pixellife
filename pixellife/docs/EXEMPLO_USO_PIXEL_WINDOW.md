# Exemplo de Uso - PixelWindow Component

## 📁 Estrutura de Arquivos Necessária

Certifique-se de ter os sprites em:
```
public/
  ui/
    frame/
      tl.png  (top-left corner)
      t.png   (top edge - se repete horizontalmente)
      tr.png  (top-right corner)
      l.png   (left edge - se repete verticalmente)
      mid.png (middle/content area - se repete)
      r.png   (right edge - se repete verticalmente)
      bl.png  (bottom-left corner)
      b.png   (bottom edge - se repete horizontalmente)
      br.png  (bottom-right corner)
```

## 🚀 Como Usar

### Importação Básica

```tsx
import PixelWindow from "../components/PixelWindow";

export default function MinhaPage() {
  return (
    <PixelWindow className="p-4 w-[300px]">
      <h1 className="text-white font-mono">Meu Conteúdo</h1>
    </PixelWindow>
  );
}
```

### Exemplo Completo - Janela de Hábitos

```tsx
"use client";

import PixelWindow from "../components/PixelWindow";
import { useState } from "react";

export default function HabitsWindow() {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <PixelWindow className="p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Barra de título customizada */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold font-mono">Hábitos</h1>
          <button
            onClick={() => setIsOpen(false)}
            className="bg-red-400 border-4 border-black px-4 py-2 font-bold hover:bg-red-500"
          >
            X
          </button>
        </div>

        {/* Conteúdo com scroll */}
        <div className="overflow-y-auto flex-1">
          {/* Seu conteúdo aqui */}
          <p>Conteúdo da janela...</p>
        </div>
      </PixelWindow>
    </div>
  );
}
```

### Exemplo com Tamanhos Diferentes

```tsx
// Janela pequena
<PixelWindow className="p-4 w-[200px]">
  <p>Janela pequena</p>
</PixelWindow>

// Janela média
<PixelWindow className="p-6 w-[500px]">
  <p>Janela média</p>
</PixelWindow>

// Janela grande (full width com max-width)
<PixelWindow className="p-8 max-w-6xl w-full">
  <p>Janela grande</p>
</PixelWindow>
```

### Exemplo com Padding Customizado

```tsx
<PixelWindow className="p-8">
  <div className="space-y-4">
    <h2 className="text-xl font-bold">Título</h2>
    <p>Conteúdo com espaçamento</p>
  </div>
</PixelWindow>
```

## 🎨 Customização

O componente aceita qualquer `className` do Tailwind:

- **Tamanho**: `w-[300px]`, `max-w-4xl`, `h-[400px]`
- **Padding**: `p-4`, `p-6`, `p-8`
- **Posicionamento**: `mx-auto`, `my-4`
- **Overflow**: `overflow-hidden`, `overflow-y-auto`

## ⚠️ Importante

1. **Sprites devem existir**: Certifique-se de que todos os arquivos PNG estão em `/public/ui/frame/`
2. **Tamanho dos sprites**: O CSS assume sprites de 16x16px. Se seus sprites forem de outro tamanho, ajuste no `globals.css`
3. **image-rendering**: Já está configurado para manter o estilo pixelado

## 🔧 Ajustar Tamanho dos Sprites

Se seus sprites forem de outro tamanho (ex: 32x32px), edite o `globals.css`:

```css
.pixel-window > .tl {
  width: 32px;  /* Ajuste conforme necessário */
  height: 32px;
}
/* Repita para todos os cantos e bordas */
```


