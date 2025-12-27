# 📱 Como Funciona a Versão Mobile

Este documento explica como o layout responsivo funciona no Pixel Life, especialmente para dispositivos móveis (iPhone, Android).

## 🎯 Sistema de Breakpoints

O app usa **Tailwind CSS** com breakpoints padrão:

- **Mobile**: `< 768px` (telas pequenas, smartphones)
- **Desktop**: `≥ 768px` (tablets, desktops)

## 📐 Layout Responsivo

### 1. **Sidebar (PixelMenu)**

#### Mobile (< 768px):
- **Estado padrão**: Oculto (fora da tela)
- **Botão flutuante**: Aparece no canto superior esquerdo
- **Ao clicar**: Sidebar desliza da esquerda com overlay escuro
- **Ao fechar**: Clicar no overlay ou no botão hamburger novamente

#### Desktop (≥ 768px):
- **Estado padrão**: Sempre visível
- **Largura fixa**: 80px
- **Posição**: Fixa à esquerda da tela

**Código relevante**: `app/components/PixelMenu.tsx`

### 2. **Seção Display (ProfileSection)**

#### Mobile (< 768px):
**Ordem dos elementos (de cima para baixo):**
1. **DisplayMain** (Perfil do usuário) - `order-1`
2. **StatsPanel** (MY STATS) - `order-2`
3. **ProfilePanel** (MY PROFILE) - `order-3`

**Layout**: Cards empilhados verticalmente em coluna única

#### Desktop (≥ 768px):
**Ordem dos elementos (da esquerda para direita):**
1. **StatsPanel** (MY STATS) - `md:order-1` - 3 colunas
2. **DisplayMain** (Perfil do usuário) - `md:order-2` - 6 colunas
3. **ProfilePanel** (MY PROFILE) - `md:order-3` - 3 colunas

**Layout**: Grid de 12 colunas com 3 cards lado a lado

**Código relevante**: `app/components/ProfileSection.tsx`

### 3. **Board Page**

#### Mobile (< 768px):
- **Padding lateral**: `pl-0` (sem padding)
- **Padding vertical**: `py-6` (reduzido)
- **Padding horizontal**: `px-4` (reduzido)
- **Tabelas**: Scroll horizontal quando necessário (`overflow-x-auto`)
- **Grids**: Coluna única ou com scroll horizontal

#### Desktop (≥ 768px):
- **Padding lateral**: `md:pl-[80px]` (espaço para sidebar)
- **Padding vertical**: `md:py-12` (maior)
- **Padding horizontal**: `md:px-6` (maior)
- **Tabelas**: Largura completa
- **Grids**: Múltiplas colunas

**Código relevante**: `app/board/page.tsx`

## 🎨 Classes Tailwind Responsivas

### Padrão de Nomenclatura

```tsx
// Mobile primeiro, depois desktop
className="mobile-class md:desktop-class"

// Exemplos:
className="order-2 md:order-1"        // Ordem diferente
className="pl-0 md:pl-[80px]"         // Padding diferente
className="text-sm md:text-base"       // Tamanho de fonte diferente
className="grid-cols-1 md:grid-cols-3" // Grid diferente
```

### Classes Comuns

- **Display**: `hidden md:block` (oculto no mobile, visível no desktop)
- **Flex Direction**: `flex-col md:flex-row` (coluna no mobile, linha no desktop)
- **Width**: `w-full md:w-auto` (largura total no mobile)
- **Gap**: `gap-2 md:gap-4` (espaçamento menor no mobile)

## 📱 Recursos Mobile-Specific

### 1. **Touch Targets**
Todos os botões têm mínimo de **44px** de altura/largura (padrão Apple/Google):

```tsx
className="min-h-[44px] min-w-[44px] touch-manipulation"
```

### 2. **Safe Area (iPhone com notch)**
Suporte para áreas seguras do iPhone:

```tsx
style={{
  paddingLeft: 'env(safe-area-inset-left)',
  paddingRight: 'env(safe-area-inset-right)',
  paddingTop: 'env(safe-area-inset-top)',
  paddingBottom: 'env(safe-area-inset-bottom)',
}}
```

### 3. **Scroll Horizontal Suave**
Tabelas e grids com scroll horizontal:

```tsx
className="overflow-x-auto"
style={{ WebkitOverflowScrolling: 'touch' }}
```

### 4. **Overlay para Sidebar**
Overlay escuro quando sidebar está aberta:

```tsx
{isMenuOpen && (
  <div 
    className="mobile-sidebar-overlay md:hidden active"
    onClick={() => setIsMenuOpen(false)}
  />
)}
```

## 🔧 Como Testar

### No Navegador:
1. Abra DevTools (F12)
2. Ative modo responsivo (Ctrl+Shift+M)
3. Selecione dispositivo mobile (iPhone, etc.)
4. Teste em diferentes tamanhos de tela

### No Dispositivo Real:
1. Acesse o site no iPhone/Android
2. Teste a sidebar (deve estar oculta por padrão)
3. Teste a ordem dos elementos no Display
4. Teste scroll horizontal em tabelas

## 📋 Checklist de Responsividade

- [x] Sidebar colapsável no mobile
- [x] Cards empilhados verticalmente no mobile
- [x] Ordem diferente no mobile (DisplayMain antes de StatsPanel)
- [x] Padding ajustado para mobile
- [x] Tabelas com scroll horizontal quando necessário
- [x] Touch targets de 44px mínimo
- [x] Safe area para iPhone com notch
- [x] Botões com wrap responsivo

## 🎯 Próximas Melhorias

1. **Tabela de Hábitos**: Layout de cards no mobile
2. **Navegação de Data**: Mais compacta no mobile
3. **Tabs**: Scroll horizontal suave
4. **Loading States**: Skeletons durante carregamento

## 📚 Referências

- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design Touch Targets](https://material.io/design/usability/accessibility.html#layout-and-typography)

