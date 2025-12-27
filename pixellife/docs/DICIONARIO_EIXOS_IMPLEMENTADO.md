# Dicionário de Eixos de Identidade - Implementado

## ✅ Status: Implementado

O dicionário de eixos foi atualizado conforme a especificação completa.

## Os 7 Eixos Iniciais

### 1. `body_movement` - Corpo & Movimento
- **Evidências**: hábitos (treino, academia), diário (menções), finanças (gastos), biografia (eventos)
- **Sinais mínimos**: ≥10 dias de hábito em ≥2 meses OU integração hábito + menção
- **Leitura neutra**: "O usuário mantém envolvimento consistente com atividades corporais ao longo do tempo."

### 2. `learning_study` - Estudo & Desenvolvimento Cognitivo
- **Evidências**: hábitos (estudar), diário (faculdade, provas), biografia (cursos)
- **Sinais mínimos**: Persistência mensal OU volume acumulado relevante
- **Leitura neutra**: "Há investimento contínuo em aquisição de conhecimento e habilidades cognitivas."

### 3. `creation_expression` - Criação & Expressão
- **Evidências**: hábitos (escrever, desenhar), diário (projetos), biografia (lançamentos)
- **Sinais mínimos**: Produção recorrente OU cruzamento hábito + texto
- **Leitura neutra**: "A pessoa utiliza práticas criativas como forma recorrente de expressão."

### 4. `work_projects` - Trabalho & Projetos
- **Evidências**: hábitos (trabalhar), diário (prazos, estresse), finanças (renda), biografia (emprego)
- **Sinais mínimos**: Alta frequência OU picos de intensidade recorrentes
- **Leitura neutra**: "O tempo do usuário é consistentemente organizado em torno de projetos e demandas produtivas."

### 5. `social_relational` - Relações & Vida Social
- **Evidências**: diário (encontros), biografia (relações), finanças (gastos sociais)
- **Sinais mínimos**: Menções narrativas recorrentes OU eventos biográficos
- **Leitura neutra**: "Relações interpessoais ocupam papel recorrente na organização da vida."

### 6. `emotional_regulation` - Regulação Emocional & Experiência Interna
- **Evidências**: diário (emoções), humor diário, hábitos (meditação, terapia)
- **Sinais mínimos**: Alta densidade narrativa emocional OU uso recorrente de práticas regulatórias
- **Leitura neutra**: "Há atenção frequente à experiência emocional ao longo do tempo."

### 7. `life_management` - Organização da Vida & Autogestão
- **Evidências**: finanças (registros), hábitos (rotina), diário (organização), metas
- **Sinais mínimos**: Uso consistente de ferramentas do app OU padrões de planejamento
- **Leitura neutra**: "A pessoa investe energia em estruturar e monitorar sua vida cotidiana."

## Estrutura Técnica

### Arquivo: `app/lib/axis_map.ts`

```typescript
interface AxisRule {
  axis: string; // ID estável
  label: string; // Nome exibido
  description: string; // Descrição funcional
  evidenceSources: {
    habits?: string[];
    journal?: string[];
    finance?: string[];
    biography?: string[];
  };
  minimumSignals: {
    habitDays?: number;
    monthsActive?: number;
    integration?: number; // Mínimo de fontes diferentes (1-4)
  };
  neutralReading: string; // Exemplo de leitura neutra
}
```

### Funções Principais

1. **`detectAxesForActivity()`** - Detecta quais eixos uma atividade pertence
   - Considera type, subtype, tags, texto
   - Mapeia para múltiplas fontes de evidência

2. **`meetsMinimumSignals()`** - Verifica se um eixo atende aos sinais mínimos
   - Valida dias de hábito
   - Valida meses ativos
   - Valida integração (quantas fontes diferentes)

3. **`getAxisRule()`** - Obtém regra completa de um eixo
4. **`getAxisLabel()`** - Obtém label amigável

### Integração com Cálculo

O `calculateObservedIdentity.ts` agora:
- Usa `meetsMinimumSignals()` para filtrar eixos válidos
- Só inclui eixos que atendem aos critérios mínimos
- Mantém evidências explícitas para auditoria

## Princípios Mantidos

✅ **Baseados em atividades, não em traços internos**  
✅ **Longitudinais, não episódicos**  
✅ **Com evidência explícita (auditável)**  
✅ **Comparáveis ao longo do tempo**  
✅ **Compatíveis com dados escassos**  
✅ **Não julgados, não são "bons" ou "ruins"**  

## Próximos Passos

1. ✅ Dicionário implementado
2. ⏳ Testar detecção com dados reais
3. ⏳ Ajustar sinais mínimos se necessário
4. ⏳ Criar UI para exibir eixos detectados

