# 📋 Guia de Execução - Sistema Mapas

## Passo 1: Executar Schema no Supabase

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Abra o arquivo `supabase/mapas_schema.sql`
4. Copie e cole todo o conteúdo
5. Execute (Run)

**O que será criado**:
- ✅ 4 tabelas novas
- ✅ 6 categorias iniciais
- ✅ ~25 elementos iniciais de exemplo
- ✅ RLS policies configuradas
- ✅ Índices para performance

---

## Passo 2: Verificar Criação

Execute no SQL Editor:

```sql
-- Verificar categorias
SELECT * FROM mapas_categories;

-- Verificar elementos
SELECT * FROM mapas_elements;

-- Verificar estrutura
SELECT 
  c.name as categoria,
  COUNT(e.id) as elementos
FROM mapas_categories c
LEFT JOIN mapas_elements e ON e.category_key = c.key
GROUP BY c.id, c.name
ORDER BY c.name;
```

**Resultado esperado**: 6 categorias com elementos associados.

---

## Passo 3: Testar Hook no Frontend

O hook `useMapas` já está criado e pronto para uso.

**Exemplo de uso**:

```typescript
import { useMapas } from '@/app/hooks/useMapas';

function MyComponent() {
  const { 
    categories, 
    elements, 
    userElements, 
    updateElementState,
    loading 
  } = useMapas();

  // Atualizar estado de um elemento
  const handleUpdate = async (elementId: string) => {
    await updateElementState(elementId, 'experienced', 'manual');
  };

  return (
    <div>
      {categories.map(cat => (
        <div key={cat.id}>
          <h3>{cat.icon} {cat.name}</h3>
        </div>
      ))}
    </div>
  );
}
```

---

## Passo 4: Próximos Passos (Opcional)

1. **Criar UI do Mapas** (tela estilo Pokédex)
2. **Conectar com Activities** (detecção automática)
3. **Simplificar Conquistas** (remover complexidade psicológica)

---

## ⚠️ Importante

- **NÃO** usar sistema de identidade agora (congelado)
- **Focar** apenas em fatos e experiências
- **Manter** simples e factual

