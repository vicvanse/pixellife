# Guia: Interface em Pixel Art

## Abordagens para Criar Interfaces Pixel Art

### 1. **Sprites de Borda (9-Slice) - RECOMENDADO** ✅
**Melhor para:** Bordas de janelas, botões, painéis

**Como funciona:**
- Cria imagens pequenas para cada parte da borda (cantos, laterais, topo/baixo)
- Usa CSS `background-image` com `repeat` ou `no-repeat`
- Permite janelas de qualquer tamanho

**Vantagens:**
- ✅ Escalável (funciona em qualquer tamanho)
- ✅ Performance (imagens pequenas)
- ✅ Reutilizável
- ✅ Mantém qualidade pixel art

**Exemplo de estrutura:**
```
window-border-top-left.png    (canto superior esquerdo)
window-border-top.png         (topo - se repete)
window-border-top-right.png   (canto superior direito)
window-border-left.png        (lateral esquerda - se repete)
window-border-right.png       (lateral direita - se repete)
window-border-bottom-left.png (canto inferior esquerdo)
window-border-bottom.png       (baixo - se repete)
window-border-bottom-right.png (canto inferior direito)
```

### 2. **Spritesheet Completo**
**Melhor para:** Muitos elementos pequenos

**Como funciona:**
- Uma imagem grande com todos os elementos
- Usa `background-position` para mostrar partes específicas

**Vantagens:**
- ✅ Menos requisições HTTP
- ✅ Fácil de organizar

**Desvantagens:**
- ❌ Menos flexível
- ❌ Imagem maior para carregar

### 3. **Imagens Estáticas Completas**
**Melhor para:** Elementos únicos e fixos

**Como funciona:**
- Uma imagem completa para cada elemento
- Usa `<img>` ou `background-image`

**Vantagens:**
- ✅ Simples
- ✅ Controle total do design

**Desvantagens:**
- ❌ Não escalável
- ❌ Precisa criar para cada tamanho

### 4. **CSS Puro (Não é Pixel Art Real)**
**Melhor para:** Efeitos simples

**Como funciona:**
- Tenta recriar o visual com CSS
- Usa `box-shadow`, `border`, etc.

**Desvantagens:**
- ❌ Não é pixel art autêntica
- ❌ Limitado em detalhes

## Recomendação para Este Projeto

**Use Sprites de Borda (9-Slice)** porque:
1. Você já usa `image-rendering: pixelated` no projeto
2. Permite janelas de qualquer tamanho
3. Mantém a estética pixel art autêntica
4. Performance otimizada

## Estrutura de Arquivos Sugerida

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
      title-bar.png (barra de título)
    buttons/
      close.png
      minimize.png
      maximize.png
```

## Como Usar no Código

```tsx
// Componente de janela com sprites
<div className="pixel-window">
  {/* Canto superior esquerdo */}
  <div className="absolute top-0 left-0 w-4 h-4">
    <img src="/pixel-ui/window/border-top-left.png" 
         className="image-render-pixel" />
  </div>
  
  {/* Topo (repete) */}
  <div className="absolute top-0 left-4 right-4 h-4"
       style={{
         backgroundImage: "url('/pixel-ui/window/border-top.png')",
         backgroundRepeat: "repeat-x",
         imageRendering: "pixelated"
       }} />
  
  {/* ... outros elementos ... */}
</div>
```


