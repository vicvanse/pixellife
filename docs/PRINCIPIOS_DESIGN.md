# Princípios de Design - PixelLife

## Filosofia Central

O PixelLife é um sistema de **observação da vida**, não de **prescrição de comportamento**.

## Princípios Fundamentais

### 1. Neutralidade Interpretativa

O sistema não impõe interpretações psicológicas por padrão.

**O que faz:**
- Organiza dados
- Devolve contagens, históricos e relações temporais
- Permite que o usuário interprete

**O que não faz:**
- Não julga comportamentos como "bons" ou "ruins"
- Não sugere metas normativas
- Não diagnostica ou categoriza psicologicamente

**Implementação:**
- Métricas são descritivas, não prescritivas
- Feedback é opcional e reversível
- Interpretações são transparentes e auditáveis

### 2. Separação de Responsabilidades

A arquitetura separa explicitamente:

#### Dados Brutos (Input Layer)
- Captura de eventos
- Armazenamento de timestamp e metadados
- Sem análise ou interpretação

#### Agregações (Aggregation Layer)
- Contagens
- Frequências
- Séries temporais
- Streaks
- Determinístico e auditável

#### Exibição (Presentation Layer)
- Stats personalizados
- Histórico cronológico
- Biografia narrativa
- Controle do usuário sobre o que aparece onde

#### Feedback (Optional Insight Layer)
- Padrões simples
- Frases descritivas
- Conexões temporais
- Apenas quando solicitado e com dados suficientes

### 3. Sistema Centrado em Atividades

**Tudo é uma Activity.**

Isso permite:

- Unificação de dados heterogêneos
- Comparabilidade entre diferentes tipos de eventos
- Extensibilidade sem quebrar o modelo existente
- Interoperabilidade entre módulos

### 4. Progressividade

O sistema funciona bem em qualquer escala:

**Com poucos dados:**
- 10 hábitos
- 20 entradas de diário
- Já gera valor e insights básicos

**Com muitos dados:**
- Integrações com APIs externas
- Dados de sensores
- Análises avançadas
- Mantém performance e clareza

**Evolução incremental:**
- Começa simples (manual, local)
- Adiciona integrações gradualmente
- Introduz IA como camada auxiliar
- Mantém uso pleno mesmo offline

### 5. Controle do Usuário

**O usuário decide:**

- O que registrar
- O que exibir
- O que interpretar
- Quando receber feedback

**Nada é obrigatório:**
- Todas as features são opt-in
- Interpretações são reversíveis
- Dados podem ser ocultados ou removidos
- Feedback pode ser desativado

### 6. Transparência

**Tudo é auditável:**

- Fonte dos dados é sempre conhecida (`source`)
- Métricas são calculáveis e verificáveis
- Insights mostram base de dados e confiança
- Nada é "mágico" ou oculto

### 7. Memória Imprecisa

**Suporta imprecisão temporal:**

- `timePrecision: "exact"` - momento exato
- `timePrecision: "day"` - dia específico
- `timePrecision: "month"` - mês aproximado
- `timePrecision: "range"` - período (ex: 2017-2018)

Isso é crítico para:
- Biografia (memórias antigas)
- Eventos significativos sem data exata
- Fases da vida com duração indefinida

### 8. Extensibilidade Sem Quebra

**Novos tipos de dados:**

- Não requerem mudanças no modelo base
- Usam `subtype` e `metadata` para especialização
- Integram-se naturalmente ao sistema de atividades

**Novas integrações:**

- APIs externas são tratadas como `source: "api"`
- Dados importados como `source: "imported"`
- Insights gerados como `source: "derived"`

**Novas visualizações:**

- São projeções do modelo Activity
- Não alteram dados primários
- Podem ser adicionadas/removidas sem impacto

## Diretrizes de Implementação

### Ao adicionar novas features:

1. **Mapeie para o modelo Activity**
   - Como essa feature se encaixa no sistema de atividades?
   - Qual `type` e `subtype` usar?
   - Quais `metadata` são necessários?

2. **Respeite a separação de camadas**
   - Input → Agregação → Exibição → Feedback
   - Não misture responsabilidades

3. **Mantenha neutralidade**
   - Métricas descritivas, não prescritivas
   - Feedback opcional e reversível
   - Sem julgamentos de valor

4. **Garanta controle do usuário**
   - Opt-in, não opt-out
   - Configurável e reversível
   - Transparente sobre o que está sendo feito

5. **Suporte progressividade**
   - Funciona com poucos dados
   - Melhora com mais dados
   - Não quebra com dados ausentes

## Anti-padrões a Evitar

### ❌ Prescrição Normativa

**Não fazer:**
- "Você deveria treinar mais"
- "Sua produtividade está baixa"
- "Meta: 10.000 passos por dia"

**Fazer:**
- "Você treinou 12 vezes este mês"
- "Sua frequência de treino diminuiu 30% comparado ao mês anterior"
- "Você caminhou em média 7.500 passos por dia"

### ❌ Interpretação Psicológica Forçada

**Não fazer:**
- "Você parece ansioso"
- "Seu humor está deprimido"
- "Você tem TDAH baseado nos padrões"

**Fazer:**
- "Você registrou mais eventos relacionados a 'ansiedade' esta semana"
- "Seus registros de humor mostraram mais variação"
- "Padrão observado: maior atividade durante manhãs"

### ❌ Acoplamento Excessivo

**Não fazer:**
- Misturar lógica de agregação com exibição
- Hardcode de interpretações nos dados
- Dependências circulares entre módulos

**Fazer:**
- Camadas bem definidas
- Dados independentes de visualização
- Módulos comunicam via modelo Activity

### ❌ Rigidez de Tipos

**Não fazer:**
- Criar um novo tipo para cada variação
- Enums gigantes de tipos específicos
- Tipos que não se relacionam

**Fazer:**
- Usar `subtype` para especialização
- Usar `metadata` para detalhes específicos
- Manter tipos genéricos e extensíveis

## Conclusão

Esses princípios garantem que o PixelLife:

- Respeite a complexidade da vida humana
- Não reduza o usuário a scores ou diagnósticos
- Permaneça útil e significativo em qualquer escala
- Evolua sem perder simplicidade
- Mantenha o usuário no controle

