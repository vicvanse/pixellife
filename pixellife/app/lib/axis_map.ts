/**
 * Dicionário de Eixos de Identidade - PixelLife
 * 
 * Um eixo é uma dimensão recorrente de investimento comportamental e narrativo ao longo do tempo.
 * 
 * Princípios:
 * - Baseados em atividades, não em traços internos
 * - Longitudinais, não episódicos
 * - Com evidência explícita (auditável)
 * - Comparáveis ao longo do tempo
 * - Compatíveis com dados escassos
 * 
 * ⚠️ Eixos não são julgados, não são "bons" ou "ruins".
 * Eles apenas organizam a vida observável.
 */

export interface AxisRule {
  axis: string; // ID estável do eixo
  label: string; // Nome exibido
  description: string; // Descrição funcional
  evidenceSources: {
    habits?: string[]; // Subtypes de hábitos que indicam este eixo
    journal?: string[]; // Palavras-chave no diário
    finance?: string[]; // Tags ou descrições em finanças
    biography?: string[]; // Palavras-chave em biografia
  };
  minimumSignals: {
    habitDays?: number; // Mínimo de dias de hábito
    monthsActive?: number; // Mínimo de meses distintos
    integration?: number; // Mínimo de fontes diferentes (1-4)
  };
  neutralReading: string; // Exemplo de leitura neutra
}

export const AXIS_RULES: AxisRule[] = [
  {
    axis: 'body_movement',
    label: 'Corpo & Movimento',
    description: 'Investimento recorrente em atividades físicas, cuidado corporal e movimento voluntário.',
    evidenceSources: {
      habits: ['treino', 'workout', 'exercicio', 'academia', 'corrida', 'caminhada', 'yoga', 'natação', 'ciclismo'],
      journal: ['treino', 'treinar', 'exercício', 'academia', 'corrida', 'cansaço físico', 'disposição', 'fitness', 'musculação'],
      finance: ['academia', 'esporte', 'suplemento', 'ginásio', 'personal trainer'],
      biography: ['comecei a treinar', 'voltei a correr', 'academia', 'treino'],
    },
    minimumSignals: {
      habitDays: 10, // ≥ 10 dias de hábito
      monthsActive: 2, // em ≥ 2 meses distintos
      integration: 2, // OU integração hábito + menção textual
    },
    neutralReading: 'O usuário mantém envolvimento consistente com atividades corporais ao longo do tempo.',
  },
  {
    axis: 'learning_study',
    label: 'Estudo & Desenvolvimento Cognitivo',
    description: 'Engajamento com aprendizado estruturado, estudo, leitura orientada a crescimento.',
    evidenceSources: {
      habits: ['estudar', 'estudo', 'leitura', 'curso', 'aprendizado'],
      journal: ['faculdade', 'prova', 'projeto intelectual', 'estudar', 'aprender', 'curso', 'aula'],
      finance: ['curso', 'livro', 'material de estudo', 'educação'],
      biography: ['início de curso', 'formação', 'graduação', 'pós-graduação'],
    },
    minimumSignals: {
      monthsActive: 2, // Persistência mensal
      integration: 2, // OU volume acumulado relevante
    },
    neutralReading: 'Há investimento contínuo em aquisição de conhecimento e habilidades cognitivas.',
  },
  {
    axis: 'creation_expression',
    label: 'Criação & Expressão',
    description: 'Produção criativa ou expressiva, independentemente de reconhecimento externo.',
    evidenceSources: {
      habits: ['escrever', 'desenhar', 'produzir música', 'programar', 'criar', 'arte'],
      journal: ['reflexões autorais', 'projetos pessoais', 'criar', 'desenvolver', 'arte', 'expressão'],
      finance: ['ferramentas criativas', 'material artístico', 'software criativo'],
      biography: ['lançamento', 'início de projeto', 'criação', 'obra'],
    },
    minimumSignals: {
      habitDays: 5, // Produção recorrente
      integration: 2, // OU cruzamento hábito + texto
    },
    neutralReading: 'A pessoa utiliza práticas criativas como forma recorrente de expressão.',
  },
  {
    axis: 'work_projects',
    label: 'Trabalho & Projetos',
    description: 'Esforço direcionado a objetivos produtivos, acadêmicos ou profissionais.',
    evidenceSources: {
      habits: ['trabalhar', 'projeto', 'estudar para prova', 'entregar'],
      journal: ['estresse', 'prazos', 'entregas', 'trabalho', 'projeto', 'deadline'],
      finance: ['renda', 'salário', 'freelance', 'trabalho'],
      biography: ['emprego novo', 'mudança de área', 'promoção', 'projeto concluído'],
    },
    minimumSignals: {
      habitDays: 15, // Alta frequência
      integration: 2, // OU picos de intensidade recorrentes
    },
    neutralReading: 'O tempo do usuário é consistentemente organizado em torno de projetos e demandas produtivas.',
  },
  {
    axis: 'social_relational',
    label: 'Relações & Vida Social',
    description: 'Interações interpessoais significativas, vínculos, vida social.',
    evidenceSources: {
      habits: ['socializar', 'encontrar amigos'],
      journal: ['encontros', 'conflitos', 'apoio', 'amigos', 'família', 'relacionamento', 'pessoas'],
      finance: ['gastos sociais', 'restaurante', 'presente', 'encontro'],
      biography: ['início de relação', 'fim de relação', 'casamento', 'amizade'],
    },
    minimumSignals: {
      habitDays: 3, // Menções narrativas recorrentes
      integration: 1, // OU eventos biográficos
    },
    neutralReading: 'Relações interpessoais ocupam papel recorrente na organização da vida.',
  },
  {
    axis: 'emotional_regulation',
    label: 'Regulação Emocional & Experiência Interna',
    description: 'Contato explícito com estados emocionais, humor, sofrimento ou bem-estar.',
    evidenceSources: {
      habits: ['meditação', 'terapia', 'descanso', 'autocuidado'],
      journal: ['emoções', 'reflexões internas', 'humor', 'sentimentos', 'ansiedade', 'tristeza', 'alegria'],
      finance: ['terapia', 'psicólogo', 'bem-estar'],
      biography: ['eventos emocionais marcantes', 'mudança emocional'],
    },
    minimumSignals: {
      habitDays: 5, // Alta densidade narrativa emocional
      integration: 2, // OU uso recorrente de práticas regulatórias
    },
    neutralReading: 'Há atenção frequente à experiência emocional ao longo do tempo.',
  },
  {
    axis: 'life_management',
    label: 'Organização da Vida & Autogestão',
    description: 'Tentativas de organizar tempo, dinheiro, rotina e compromissos.',
    evidenceSources: {
      habits: ['rotina', 'planejamento', 'organização'],
      journal: ['organização', 'metas', 'planejamento', 'rotina', 'compromissos'],
      finance: ['registros frequentes', 'orçamento', 'planejamento financeiro'],
      biography: ['mudança de rotina', 'nova organização'],
    },
    minimumSignals: {
      habitDays: 10, // Uso consistente de ferramentas do app
      integration: 2, // OU padrões de planejamento
    },
    neutralReading: 'A pessoa investe energia em estruturar e monitorar sua vida cotidiana.',
  },
];

/**
 * Detecta quais eixos uma atividade pertence
 * 
 * Considera múltiplas fontes de evidência conforme o dicionário de eixos.
 */
export function detectAxesForActivity(activity: {
  type: string;
  subtype?: string | null;
  tags?: string[] | null;
  text?: string | null;
  metadata?: Record<string, any> | null;
}): string[] {
  const matchedAxes: string[] = [];

  for (const rule of AXIS_RULES) {
    let matches = false;

    // Match por hábitos (type='habit' + subtype)
    if (activity.type === 'habit' && rule.evidenceSources.habits && activity.subtype) {
      const subtypeLower = activity.subtype.toLowerCase();
      if (rule.evidenceSources.habits.some(h => subtypeLower.includes(h.toLowerCase()))) {
        matches = true;
      }
    }

    // Match por diário (type='journal' + texto)
    if (activity.type === 'journal' && rule.evidenceSources.journal && activity.text) {
      const textLower = activity.text.toLowerCase();
      if (rule.evidenceSources.journal.some(j => textLower.includes(j.toLowerCase()))) {
        matches = true;
      }
    }

    // Match por finanças (type='finance' + tags ou texto)
    if (activity.type === 'finance') {
      if (rule.evidenceSources.finance) {
        const textLower = (activity.text || '').toLowerCase();
        const tagsLower = (activity.tags || []).map(t => t.toLowerCase());
        const financeKeywords = rule.evidenceSources.finance.map(f => f.toLowerCase());
        
        if (financeKeywords.some(f => textLower.includes(f) || tagsLower.includes(f))) {
          matches = true;
        }
      }
    }

    // Match por biografia (type='biography' + texto)
    if (activity.type === 'biography' && rule.evidenceSources.biography && activity.text) {
      const textLower = activity.text.toLowerCase();
      if (rule.evidenceSources.biography.some(b => textLower.includes(b.toLowerCase()))) {
        matches = true;
      }
    }

    // Match por tags (qualquer tipo)
    if (activity.tags && rule.evidenceSources.journal) {
      const activityTags = activity.tags.map(t => t.toLowerCase());
      const journalKeywords = rule.evidenceSources.journal.map(j => j.toLowerCase());
      if (journalKeywords.some(j => activityTags.includes(j))) {
        matches = true;
      }
    }

    if (matches) {
      matchedAxes.push(rule.axis);
    }
  }

  return matchedAxes;
}

/**
 * Obtém label de um eixo pelo ID
 */
export function getAxisLabel(axisId: string): string {
  const rule = AXIS_RULES.find(r => r.axis === axisId);
  return rule?.label || axisId;
}

/**
 * Obtém regra completa de um eixo pelo ID
 */
export function getAxisRule(axisId: string): AxisRule | undefined {
  return AXIS_RULES.find(r => r.axis === axisId);
}

/**
 * Verifica se um eixo atende aos sinais mínimos
 */
export function meetsMinimumSignals(
  axisId: string,
  signals: {
    habit_days: number;
    journal_mentions: number;
    finance_related: number;
    biography_events: number;
    months_active: number;
  }
): boolean {
  const rule = getAxisRule(axisId);
  if (!rule) return false;

  const { minimumSignals } = rule;

  // Verificar dias de hábito
  if (minimumSignals.habitDays && signals.habit_days < minimumSignals.habitDays) {
    return false;
  }

  // Verificar meses ativos
  if (minimumSignals.monthsActive && signals.months_active < minimumSignals.monthsActive) {
    return false;
  }

  // Verificar integração (quantas fontes diferentes)
  const sources = [
    signals.habit_days > 0,
    signals.journal_mentions > 0,
    signals.finance_related > 0,
    signals.biography_events > 0,
  ].filter(Boolean).length;

  if (minimumSignals.integration && sources < minimumSignals.integration) {
    return false;
  }

  return true;
}

