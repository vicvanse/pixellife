# 🎮 Guia Rápido - PixelWindow Component

## ✅ O que foi criado

1. **Componente `PixelWindow.tsx`** - Componente React usando 9-slice com CSS Grid
2. **Estilos CSS** - Adicionados ao `globals.css` com `image-rendering: pixelated`
3. **Estrutura de pastas** - `public/ui/frame/` criada para os sprites

## 📁 Estrutura de Arquivos Necessária

Coloque seus sprites em pixel art aqui:
```
public/
  ui/
    frame/
      tl.png  ← Canto superior esquerdo (16x16px)
      t.png   ← Topo - se repete horizontalmente (16x16px)
      tr.png  ← Canto superior direito (16x16px)
      l.png   ← Lateral esquerda - se repete verticalmente (16x16px)
      mid.png ← Área central - se repete (16x16px)
      r.png   ← Lateral direita - se repete verticalmente (16x16px)
      bl.png  ← Canto inferior esquerdo (16x16px)
      b.png   ← Baixo - se repete horizontalmente (16x16px)
      br.png  ← Canto inferior direito (16x16px)
```

## 🚀 Como Usar

### Importação

```tsx
import PixelWindow from "../components/PixelWindow";
```

### Uso Básico

```tsx
<PixelWindow className="p-4 w-[300px]">
  <h1 className="text-white font-mono">Meu Conteúdo</h1>
</PixelWindow>
```

### Exemplo Completo - Modal

```tsx
"use client";

import PixelWindow from "../components/PixelWindow";
import { useState } from "react";

export default function MeuModal() {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <PixelWindow className="p-6 max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Barra de título */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold font-mono">Título</h1>
          <button
            onClick={() => setIsOpen(false)}
            className="bg-red-400 border-4 border-black px-4 py-2 font-bold hover:bg-red-500"
          >
            X
          </button>
        </div>

        {/* Conteúdo com scroll */}
        <div className="overflow-y-auto flex-1">
          <p>Seu conteúdo aqui...</p>
        </div>
      </PixelWindow>
    </div>
  );
}
```

## 🎨 Customização com Tailwind

O componente aceita qualquer `className` do Tailwind:

```tsx
{/* Tamanhos */}
<PixelWindow className="w-[200px]">...</PixelWindow>
<PixelWindow className="max-w-4xl w-full">...</PixelWindow>

{/* Padding */}
<PixelWindow className="p-4">...</PixelWindow>
<PixelWindow className="p-8">...</PixelWindow>

{/* Layout */}
<PixelWindow className="flex flex-col">...</PixelWindow>
<PixelWindow className="grid grid-cols-2">...</PixelWindow>
```

## ⚙️ Como Funciona

O componente usa **CSS Grid 3x3** para criar o layout 9-slice:

```
┌─────┬─────────┬─────┐
│ tl  │    t    │ tr  │
├─────┼─────────┼─────┤
│  l  │   mid   │  r  │
├─────┼─────────┼─────┤
│ bl  │    b    │ br  │
└─────┴─────────┴─────┘
```

- **Cantos (tl, tr, bl, br)**: Tamanho fixo, não repetem
- **Bordas (t, b, l, r)**: Se repetem horizontalmente/verticalmente
- **Centro (mid)**: Se repete, contém o `children`

## 🔧 Ajustar Tamanho dos Sprites

Se seus sprites forem de outro tamanho (ex: 32x32px), edite `app/globals.css`:

```css
.pixel-window > .tl {
  width: 32px;  /* Ajuste conforme necessário */
  height: 32px;
}
/* Repita para todos: .t, .tr, .l, .r, .bl, .b, .br */
```

## ✅ Checklist

- [ ] Criar os 9 sprites em pixel art (16x16px cada)
- [ ] Colocar em `public/ui/frame/`
- [ ] Nomear corretamente (tl.png, t.png, tr.png, etc.)
- [ ] Importar o componente: `import PixelWindow from "../components/PixelWindow"`
- [ ] Usar: `<PixelWindow className="...">conteúdo</PixelWindow>`

## 🎯 Próximos Passos

1. **Criar os sprites** usando Aseprite, Piskel ou similar
2. **Exportar como PNG** com transparência (se necessário)
3. **Colocar em `public/ui/frame/`**
4. **Testar o componente** em uma página

## 💡 Dicas

- Use `image-rendering: pixelated` nos sprites (já está no CSS)
- Mantenha todos os sprites no mesmo tamanho
- Teste com diferentes tamanhos de janela para garantir que escala bem
- O componente já está integrado no `HabitsOverlay` como exemplo


