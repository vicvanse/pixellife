# Pixel Life - Life Management App

Uma aplicação de gerenciamento de vida com estética pixel-art, construída com Next.js, React e TypeScript.

## 🎮 Features

- **Display**: Página principal com avatar personalizável e informações financeiras
- **Habits**: Sistema de rastreamento de hábitos diários
- **Journal**: Diário pessoal com registro de humor e pensamentos rápidos
- **Expenses**: Gerenciamento financeiro com controle de gastos mensais e reserva
- **Possessions**: Sistema de metas de bens com progresso gamificado
- **Tree**: Árvore de atividades para desenvolvimento de habilidades pessoais e de lazer
- **Cosmetics**: Personalização de avatar e fundo

## 🚀 Getting Started

### Pré-requisitos

- Node.js 18+ 
- npm, yarn, pnpm ou bun

### Instalação

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar servidor de produção
npm start

# Verificar tipos TypeScript
npm run type-check

# Executar linter
npm run lint
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

## 📁 Estrutura do Projeto

```
app/
├── components/          # Componentes React reutilizáveis
│   ├── expenses/       # Componentes relacionados a despesas
│   ├── journal/        # Componentes do diário
│   ├── possessions/    # Componentes de objetivos
│   └── tree/           # Componentes da árvore de atividades
├── context/            # Contextos React (AppContext, CosmeticsContext)
├── hooks/              # Custom hooks (useExpenses, useJournal, etc.)
├── lib/                # Utilitários e constantes
├── types/              # Tipos TypeScript compartilhados
└── [pages]/            # Páginas da aplicação
```

## 🛠️ Tecnologias

- **Next.js 16** - Framework React
- **React 19** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Tailwind CSS 4** - Estilização
- **LocalStorage** - Persistência de dados

## 💾 Armazenamento de Dados

Todos os dados são armazenados localmente no navegador usando `localStorage`. As chaves seguem o padrão:
- `pixel-life-[feature]-v[version]`

## 🎨 Design

O aplicativo utiliza um design pixel-art consistente com:
- Bordas grossas (4px para containers principais, 2px para elementos internos)
- Paleta de cores limitada e semântica
- Fontes monoespaçadas
- Sombras pixeladas

## 📝 Licença

Este projeto é privado.
