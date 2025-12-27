# Skill Tree Component - Documentação

## Visão Geral

O sistema de Skill Tree foi criado para representar "Guias de Comportamento" como uma árvore visual (skill tree), em estilo semi-whiteboard, limpo e minimalista, inspirado em árvores de habilidades de RPG.

## Componentes

### 1. SkillNode
Componente que representa um nó individual na árvore.

**Estados visuais:**
- **Ativo/Atual** (`available` ou `in_progress`): 
  - Preenchimento branco
  - Borda preta
  - Ícone preto
  - Leve sombra suave
  
- **Concluído** (`integrated`):
  - Preenchimento verde (#7aff7a - mesmo verde dos hábitos)
  - Borda verde (#0f9d58)
  - Ícone verde escuro
  - Sombra verde suave

- **Bloqueado** (`locked`):
  - Preenchimento transparente
  - Borda preta
  - Ícone cinza escuro
  - Opacidade reduzida

**Características:**
- Forma: Círculo (raio 28px)
- Ícone: Baseado no tipo do nó (skill, experience, habit, etc.)
- Texto: Título posicionado abaixo do círculo
- Tooltip: Aparece ao hover/clique, posicionado próximo ao nó (não dentro)

### 2. SkillEdge
Componente que representa conexões entre nós.

**Características:**
- Linhas curvas suaves (Bézier)
- Cores variam baseado no estado:
  - Verde para conexões concluídas
  - Preto para conexões ativas
  - Cinza claro para conexões bloqueadas
- Espessura: 1.5px (bloqueadas) ou 2px (ativas/concluídas)

### 3. SkillTreeContainer
Container principal que organiza e renderiza a árvore completa.

**Características:**
- Fundo: Off-white (#fafafa) - estilo whiteboard
- Layout: Horizontal (da esquerda para direita)
- Responsivo: Ajusta automaticamente ao tamanho do container
- Scroll: Automático quando necessário

## Estrutura de Dados

### GuideNode
```typescript
interface GuideNode {
  id: string;
  guideId: string;
  parentNodeId: string | null; // null para nó raiz
  title: string;
  description: string;
  type: NodeType; // 'skill' | 'experience' | 'habit' | 'challenge' | 'reflection' | 'knowledge'
  state: NodeState; // 'locked' | 'available' | 'in_progress' | 'integrated' | 'abandoned'
  order: number;
  branch?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Exemplo de Árvore Mockada

```typescript
const mockGuide: Guide = {
  id: 'social-skills',
  name: 'Habilidades Sociais',
  description: 'Caminho de desenvolvimento social',
  initialNodeId: 'node-1',
  // ...
};

const mockNodes: GuideNode[] = [
  {
    id: 'node-1',
    guideId: 'social-skills',
    parentNodeId: null, // Nó raiz
    title: 'Perceber o Outro',
    description: 'Nem toda interação exige resposta. Às vezes exige atenção.',
    type: 'reflection',
    state: 'available',
    order: 0,
  },
  {
    id: 'node-2',
    guideId: 'social-skills',
    parentNodeId: 'node-1',
    title: 'Ouvir sem preparar resposta',
    description: 'Praticar escuta ativa, focando no que o outro diz.',
    type: 'experience',
    state: 'locked',
    order: 1,
    branch: 'Ramo A — Comunicação Básica',
  },
  {
    id: 'node-3',
    guideId: 'social-skills',
    parentNodeId: 'node-1',
    title: 'Manter contato visual',
    description: 'Praticar presença através do olhar.',
    type: 'experience',
    state: 'locked',
    order: 2,
    branch: 'Ramo A — Comunicação Básica',
  },
];
```

## Uso

```tsx
import { SkillTreeContainer } from './SkillTreeContainer';
import { useGuides } from '../../hooks/useGuides';

function MyComponent() {
  const { getGuideNodes, getNodeState } = useGuides();
  const guide = { /* ... */ };
  const nodes = getGuideNodes(guide.id);

  return (
    <SkillTreeContainer
      guide={guide}
      nodes={nodes}
      getNodeState={getNodeState}
      onNodeClick={(node) => {
        console.log('Node clicked:', node);
      }}
    />
  );
}
```

## Decisões de Design

### Layout Horizontal
- Escolhido para facilitar leitura da esquerda para direita
- Níveis da árvore são colunas verticais
- Permite expansão natural conforme novos nós são adicionados

### Cores Minimalistas
- Fundo off-white para sensação de whiteboard
- Preto/cinza para elementos neutros
- Verde apenas para estados concluídos (consistente com hábitos)
- Evita cores vibrantes que distraem

### Texto Fora dos Nós
- Título posicionado abaixo do círculo
- Tooltip aparece ao lado (não dentro)
- Mantém os nós limpos e minimalistas
- Facilita leitura em diferentes tamanhos

### Responsividade
- Container ajusta automaticamente
- Scroll horizontal quando necessário
- Mantém proporções em diferentes tamanhos de tela

## Futuras Melhorias

- [ ] Zoom e pan para árvores grandes
- [ ] Alternar visualização "Árvore" ↔ "Lista"
- [ ] Animações suaves ao expandir/colapsar ramos
- [ ] Exportar árvore como imagem
- [ ] Busca e filtros de nós

