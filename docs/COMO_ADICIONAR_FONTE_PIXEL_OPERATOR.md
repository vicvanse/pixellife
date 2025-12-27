# Como Adicionar a Fonte Pixel Operator Mono

Para que a fonte "Pixel Operator Mono" funcione corretamente no login e em toda a aplicação, siga estes passos:

## 1. Baixar a Fonte

Acesse: https://fontlibrary.org/pt/font/pixel-operator

Baixe a versão **"Pixel Operator Mono"** (não a versão regular).

## 2. Adicionar os Arquivos

Você tem duas opções:

### Opção A: Usar Next.js Font (Recomendado)
Coloque os arquivos `.ttf` em `app/fonts/`:
- `app/fonts/PixelOperatorMono-Regular.ttf`
- `app/fonts/PixelOperatorMono-Bold.ttf`

Depois, descomente o código em `app/layout.tsx` (linhas 26-43).

### Opção B: Usar CSS @font-face
Coloque os arquivos `.ttf` em `public/fonts/`:
- `public/fonts/PixelOperatorMono-Regular.ttf`
- `public/fonts/PixelOperatorMono-Bold.ttf`

Depois, descomente o código em `app/globals.css` (linhas 4-21).

## 3. Verificar

Após adicionar os arquivos e descomentar o código correspondente, a fonte será aplicada automaticamente em:
- ✅ Título "PIXEL LIFE"
- ✅ Tagline e subtítulo
- ✅ Formulário de login (ENTRAR)
- ✅ Botões sociais (Google/Apple)
- ✅ Todos os textos do login

A fonte já está configurada no código, só falta adicionar os arquivos!
