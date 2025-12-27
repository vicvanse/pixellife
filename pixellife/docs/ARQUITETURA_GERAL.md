# Arquitetura Geral - PixelLife

## Visão Geral Técnica

O PixelLife é uma plataforma de life-tracking modular que integra registros manuais e dados externos para construir uma representação longitudinal, visual e narrativa da vida do usuário.

Diferente de aplicativos tradicionais de hábitos, produtividade ou journaling, o PixelLife não opera a partir de metas normativas ou intervenções prescritivas. Seu núcleo técnico é um sistema unificado de atividades, capaz de:

- registrar eventos cotidianos heterogêneos
- agregá-los ao longo do tempo
- gerar métricas descritivas
- permitir leituras narrativas opcionais

O sistema foi projetado para ser progressivamente extensível, permitindo desde uso simples (manual, local) até integração com APIs externas e camadas analíticas avançadas.

## Princípios de Arquitetura

### 2.1 Neutralidade interpretativa

O sistema não impõe interpretações psicológicas por padrão. Ele organiza dados e devolve ao usuário:

- contagens
- históricos
- relações temporais

Qualquer interpretação é:

- opcional
- reversível
- transparente

### 2.2 Separação clara entre dados, métricas e feedback

A arquitetura separa explicitamente:

- **Dados brutos** (inputs)
- **Agregações** (contagens, frequências, séries temporais)
- **Exibição** (stats, biografia, histórico)
- **Feedback narrativo** (opcional, contextual)

Isso evita acoplamento excessivo e facilita evolução incremental do sistema.

### 2.3 Sistema centrado em atividades

Todos os módulos do PixelLife (hábitos, diário, finanças, APIs externas) convergem para um modelo comum de atividade, garantindo interoperabilidade interna e escalabilidade.

## Tipos de Dados Suportados

### 3.1 Registros Manuais

- Hábitos (ex.: treino, estudo, meditação)
- Diário (texto livre, humor)
- Eventos biográficos
- Gastos e registros financeiros
- Metas e objetivos

### 3.2 Dados Externos (Opt-in)

Integrações futuras previstas:

- Goodreads (livros lidos)
- Letterboxd (filmes assistidos)
- Spotify (escuta — opcional)
- Screen time / uso de apps (dependente de permissões)

Esses dados não substituem os registros manuais, apenas os complementam.

## Camadas do Sistema

### 4.1 Camada de Registro (Input Layer)

Responsável por:

- capturar eventos
- armazenar timestamp, tipo e metadados
- garantir integridade temporal

Nenhuma análise ocorre aqui.

### 4.2 Camada de Agregação (Aggregation Layer)

Responsável por gerar métricas simples, como:

- número total de ocorrências
- frequência por período
- streaks
- variação temporal

Exemplos:

- "Você treinou 42 dias"
- "Você escreveu 18 entradas de diário"
- "Você leu 7 livros este ano"

Essa camada é determinística e auditável.

### 4.3 Camada de Exibição (Presentation Layer)

Responsável por distribuir as informações em diferentes contextos do app:

- **My Stats** → métricas fixadas pelo usuário
- **Histórico** → linha do tempo contínua
- **Biografia** → eventos significativos
- Seções específicas (hábitos, finanças etc.)

O usuário escolhe o que aparece onde.

### 4.4 Camada de Feedback (Optional Insight Layer)

Camada não obrigatória, ativada apenas quando:

- há dados suficientes
- o usuário opta por receber feedback

Função:

- resumir padrões simples
- gerar frases descritivas
- conectar períodos da vida

Exemplo:

"Você manteve maior regularidade de treino durante períodos com menos eventos sociais registrados."

Nenhuma inferência clínica é realizada.

## Fluxo de Dados (Simplificado)

```
Registro (manual ou API)
        ↓
Normalização em atividade
        ↓
Agregação temporal
        ↓
Disponibilização em:
  - Stats
  - Histórico
  - Biografia
        ↓
Feedback (se ativado)
```

## Interface e Navegação

A navegação do PixelLife segue uma lógica não linear, permitindo que o usuário:

- explore por seção (hábitos, diário, finanças)
- explore por tempo (histórico, biografia)
- explore por identidade (perfil, stats)

O feedback não interrompe o fluxo. Ele é acessado quando desejado.

## Escalabilidade e Evolução

A proposta técnica permite:

- iniciar sem APIs externas
- adicionar integrações gradualmente
- introduzir IA apenas como camada auxiliar
- manter uso pleno mesmo offline/parcial

O sistema é robusto mesmo com dados escassos e melhora conforme o uso.

## Diferencial Técnico-Conceitual

O PixelLife não é um:

- habit tracker tradicional
- diário emocional isolado
- dashboard de produtividade

Ele é um sistema de observação da vida, combinando:

- estrutura
- memória
- visualidade
- narrativa

## Encerramento

O PixelLife propõe uma arquitetura que respeita a complexidade da vida humana sem tentar reduzi-la a scores ou diagnósticos. Tecnicamente, isso se traduz em um sistema modular, extensível e centrado no usuário, capaz de crescer em profundidade sem perder simplicidade.

