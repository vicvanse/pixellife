# 🧪 Guia de Teste - Sistema de Identidade

## Como Testar

### 1. Teste Básico: Verificar se os Hooks Funcionam

#### 1.1 Teste no Console do Navegador

1. Abra o app no navegador
2. Faça login
3. Abra o Console (F12)
4. Execute:

```javascript
// Testar useIdentityAxes
const { axes, loading } = window.__testIdentityAxes;
console.log('Eixos:', axes);
console.log('Loading:', loading);

// Testar useIdentityDeclared
const { identity } = window.__testIdentityDeclared;
console.log('Identidade Declarada:', identity);
```

#### 1.2 Teste via Componente de Teste

Crie uma página de teste temporária:

```typescript
// app/test-identity/page.tsx
"use client";

import { useIdentityAxes } from "../hooks/useIdentityAxes";
import { useIdentityDeclared } from "../hooks/useIdentityDeclared";
import { useIdentityObserved } from "../hooks/useIdentityObserved";

export default function TestIdentityPage() {
  const { axes, loading: axesLoading } = useIdentityAxes();
  const { identity, loading: declaredLoading } = useIdentityDeclared();
  const { observed, loading: observedLoading } = useIdentityObserved();

  return (
    <div className="p-6">
      <h1 className="font-pixel-bold text-2xl mb-4">Teste de Identidade</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="font-pixel-bold">Eixos ({axes.length})</h2>
          <pre>{JSON.stringify(axes, null, 2)}</pre>
        </div>
        
        <div>
          <h2 className="font-pixel-bold">Identidade Declarada</h2>
          <pre>{JSON.stringify(identity, null, 2)}</pre>
        </div>
        
        <div>
          <h2 className="font-pixel-bold">Identidade Observada</h2>
          <pre>{JSON.stringify(observed, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}
```

Acesse: `http://localhost:3000/test-identity`

---

### 2. Teste de Inserção de Dados

#### 2.1 Testar Inserção de Identidade Declarada

No app, você pode:

1. Ir para a seção Display
2. Editar a bio
3. Adicionar pontos centrais
4. Verificar no Supabase se foi salvo:

```sql
SELECT * FROM identity_declared WHERE user_id = auth.uid();
```

#### 2.2 Testar Cálculo de Eixos

1. Registre algumas atividades (hábitos, diário, finanças)
2. Execute o pipeline de cálculo (via botão na UI)
3. Verifique se eixos foram criados:

```sql
SELECT * FROM identity_axes WHERE user_id = auth.uid();
```

---

### 3. Teste Visual dos Componentes

#### 3.1 Teste Individual de Componentes

Crie uma página de teste para cada componente:

```typescript
// app/test-components/page.tsx
import { IdentityAxesPanel } from "../components/identity/IdentityAxesPanel";
import { AchievementsPanel } from "../components/identity/AchievementsPanel";
import { IdentityComparison } from "../components/identity/IdentityComparison";
import { FeedbackHistoryList } from "../components/identity/FeedbackHistoryList";

export default function TestComponentsPage() {
  return (
    <div className="p-6 space-y-8">
      <IdentityAxesPanel />
      <AchievementsPanel />
      <IdentityComparison />
      <FeedbackHistoryList />
    </div>
  );
}
```

---

### 4. Teste do Pipeline Completo

#### 4.1 Executar Pipeline Manualmente

```typescript
import { runIdentityPipeline } from "@/app/lib/pipelineIdentity";
import { useAuth } from "@/app/context/AuthContext";
import { supabase } from "@/app/lib/supabaseClient";

async function testPipeline() {
  const { user } = useAuth();
  
  // 1. Buscar activities
  const { data: activities } = await supabase
    .from("activities")
    .select("*")
    .eq("user_id", user.id);
  
  // 2. Executar pipeline
  const result = await runIdentityPipeline(activities || [], "90d", user.id);
  
  console.log("Resultado:", result);
}
```

---

## ✅ Checklist de Teste

- [ ] Hooks carregam dados do Supabase
- [ ] Identidade declarada pode ser salva
- [ ] Eixos são calculados a partir de activities
- [ ] Sinais são calculados corretamente
- [ ] Conquistas são avaliadas
- [ ] Componentes renderizam sem erros
- [ ] Comparação funciona (declarado vs observado)
- [ ] Feedback history pode ser adicionado

---

## 🐛 Troubleshooting

### Erro: "relation does not exist"
- **Solução**: Verifique se executou os schemas SQL no Supabase

### Erro: "permission denied"
- **Solução**: Verifique se RLS está configurado corretamente

### Erro: "column does not exist"
- **Solução**: Verifique se a coluna foi criada no schema

### Componentes não aparecem
- **Solução**: Verifique se os hooks estão retornando dados
- **Solução**: Verifique se há erros no console

