# Como Criar Sprites de Pixel Art para Interface

## Passo a Passo

### 1. Escolha o Tamanho dos Pixels
Recomendado: **16x16px** ou **32x32px** por sprite
- 16px: Mais leve, estilo mais pixelado
- 32px: Mais detalhes, ainda mantém estilo pixel art

### 2. Crie as Imagens

#### Estrutura de uma Janela (9-Slice):
```
┌─────────┬─────────┬─────────┐
│ Top-Left│   Top   │Top-Right│
├─────────┼─────────┼─────────┤
│  Left   │ Content │  Right  │
├─────────┼─────────┼─────────┤
│Bot-Left │ Bottom  │Bot-Right│
└─────────┴─────────┴─────────┘
```

#### Arquivos Necessários:

**Cantos (não repetem):**
- `border-top-left.png` - 16x16px
- `border-top-right.png` - 16x16px
- `border-bottom-left.png` - 16x16px
- `border-bottom-right.png` - 16x16px

**Bordas (repetem):**
- `border-top.png` - 16x16px (se repete horizontalmente)
- `border-bottom.png` - 16x16px (se repete horizontalmente)
- `border-left.png` - 16x16px (se repete verticalmente)
- `border-right.png` - 16x16px (se repete verticalmente)

**Barra de título:**
- `title-bar.png` - 16x32px (se repete horizontalmente)

**Botões:**
- `close.png` - 16x16px
- `minimize.png` - 16x16px
- `maximize.png` - 16x16px

### 3. Ferramentas Recomendadas

**Para criar pixel art:**
- **Aseprite** (pago, mas excelente) - https://www.aseprite.org/
- **Piskel** (gratuito, online) - https://www.piskelapp.com/
- **GIMP** (gratuito) - com grid de pixels
- **Photoshop** - com modo pixel art

**Dicas:**
- Use paleta de cores limitada (ex: 16-32 cores)
- Mantenha consistência no tamanho dos pixels
- Use cores sólidas (sem anti-aliasing)
- Exporte como PNG com transparência quando necessário

### 4. Estrutura de Pastas

```
public/
  pixel-ui/
    window/
      border-top-left.png
      border-top.png
      border-top-right.png
      border-left.png
      border-right.png
      border-bottom-left.png
      border-bottom.png
      border-bottom-right.png
      title-bar.png
    buttons/
      close.png
      minimize.png
      maximize.png
```

### 5. Exemplo de Cores para Pixel Art Retro

```css
/* Paleta sugerida (estilo Windows 95/98) */
--gray-dark: #808080;    /* Borda escura */
--gray-medium: #c0c0c0;  /* Fundo */
--gray-light: #ffffff;   /* Highlight */
--black: #000000;        /* Sombra */
--red: #ff0000;          /* Botão fechar hover */
```

### 6. Como Testar

1. Crie uma imagem simples primeiro (ex: quadrado 16x16px)
2. Coloque em `public/pixel-ui/window/border-top-left.png`
3. Use o componente `PixelArtWindow` (descomente a seção de sprites)
4. Ajuste o `borderSize` conforme necessário

### 7. Dicas de Design

- **Bordas 3D**: Use 2-3 pixels de highlight (claro) e shadow (escuro)
- **Consistência**: Todos os sprites devem ter o mesmo estilo
- **Tamanho fixo**: Mantenha todos os sprites no mesmo tamanho (ex: 16x16)
- **Transparência**: Use PNG com alpha channel para cantos arredondados (se quiser)

### 8. Exemplo Visual de Sprite

```
Canto Superior Esquerdo (16x16px):
████████████████
████████████████
████░░░░░░░░████
████░░░░░░░░████
████░░░░░░░░████
████░░░░░░░░████
████░░░░░░░░████
████░░░░░░░░████
████░░░░░░░░████
████░░░░░░░░████
████░░░░░░░░████
████░░░░░░░░████
████████████████
████████████████
████████████████
████████████████

Legenda:
█ = Borda escura (#000)
░ = Área interna (transparente ou cor de fundo)
```

### 9. Alternativa: Usar Ferramentas Online

Se não quiser criar do zero, pode usar:
- **Kenney.nl** - Assets gratuitos de pixel art
- **OpenGameArt.org** - Sprites de UI gratuitos
- **itch.io** - Assets de pixel art (alguns gratuitos)

### 10. Integração no Código

Depois de criar os sprites, descomente a seção de código no `PixelArtWindow.tsx` e ajuste:

```tsx
borderSize={16} // Ajuste conforme o tamanho dos seus sprites
```


