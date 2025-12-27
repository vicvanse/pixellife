# Custos da Tradução Automática

## ⚠️ IMPORTANTE: Limite é por Aplicativo, não por Usuário

O limite de **1.500 requisições por dia** é compartilhado por **TODOS os usuários** do aplicativo. Se você tiver 10 usuários ativos, eles compartilham esse mesmo limite.

## API Gemini - Informações de Custo

A tradução automática usa a API do Google Gemini, que tem um **tier gratuito generoso**, mas pode ter custos se exceder os limites.

### Tier Gratuito (Gemini 1.5 Flash)
- **15 requisições por minuto** (para todo o app)
- **1.500 requisições por dia** (para todo o app)
- **1 milhão de tokens por dia** (para todo o app)

### ⚠️ IMPORTANTE: Não há cobrança automática no tier gratuito
- Quando o limite é excedido, as requisições **simplesmente param de funcionar**
- Você recebe um erro (429 ou 403) e o sistema retorna o texto original
- **NÃO há cobrança automática** - você precisa habilitar o faturamento manualmente
- O limite é resetado no dia seguinte

### Após o Tier Gratuito (só se habilitar faturamento manualmente)
- **$0.075 por 1 milhão de tokens de entrada**
- **$0.30 por 1 milhão de tokens de saída**
- ⚠️ Se habilitar faturamento, TODAS as requisições são cobradas (não há mais cota gratuita)

### Exemplo Real
- **1 usuário**: 1.500 requisições/dia = ✅ Gratuito
- **10 usuários**: 15.000 requisições/dia = ❌ $1.13/dia (~$34/mês)
- **50 usuários**: 75.000 requisições/dia = ❌ $5.63/dia (~$169/mês)

### Otimizações Implementadas

Para reduzir custos, implementamos:

1. **Cache Persistente**: Traduções são salvas no localStorage e reutilizadas (válidas por 30 dias)
2. **Cache em Memória**: Evita chamadas duplicadas na mesma sessão
3. **Debounce**: Aguarda 300ms antes de traduzir para evitar múltiplas chamadas
4. **Limite de Tamanho**: Textos maiores que 500 caracteres são truncados
5. **Modelo Econômico**: Usa `gemini-1.5-flash` (o mais barato)

### Como Funciona

- **Primeira vez**: Traduz via API e salva no cache
- **Próximas vezes**: Usa o cache (sem custo)
- **Mudança de idioma**: Traduz apenas se não estiver em cache

### Estimativa de Custos

Para um usuário médio:
- **10 hábitos** = 10 traduções (1x cada, depois cache)
- **20 descrições de gastos** = 20 traduções (1x cada)
- **Total inicial**: ~30 requisições
- **Custo**: $0 (dentro do tier gratuito)

### Alternativas Gratuitas

Para aplicativos com muitos usuários, considere:

1. **Google Translate API (não oficial)**: Bibliotecas client-side gratuitas
2. **MyMemory Translation API**: 10.000 requisições/dia gratuitas (também compartilhado)
3. **LibreTranslate**: Open source, pode self-host
4. **Desabilitar tradução automática**: Usuários veem texto no idioma original

### Desabilitar Tradução Automática

Se preferir não usar tradução automática, você pode:
1. Remover a chave `NEXT_PUBLIC_GEMINI_API_KEY` do `.env.local`
2. O sistema retornará o texto original sem traduzir

### Recomendação

Para apps com **poucos usuários** (< 5): Gemini API está OK
Para apps com **muitos usuários** (> 10): Considere desabilitar ou usar alternativa gratuita

