#!/bin/bash
# Wrapper script para análise de código com Gemini

# Verificar se a API key está configurada
if [ -z "$NEXT_PUBLIC_GEMINI_API_KEY" ] && [ -z "$GEMINI_API_KEY" ]; then
    echo "❌ Erro: GEMINI_API_KEY não configurada"
    echo "Configure NEXT_PUBLIC_GEMINI_API_KEY ou GEMINI_API_KEY"
    exit 1
fi

# Executar análise
npx tsx scripts/gemini-code-analyzer.ts "$@"

