# 🎮 Sistema de Autenticação Estilo Habbo - Guia Completo

Este documento explica o sistema completo de autenticação implementado no Pixel Life.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Tipos de Login](#tipos-de-login)
4. [Sessões Persistentes](#sessões-persistentes)
5. [Fluxo de Autenticação](#fluxo-de-autenticação)
6. [Configuração](#configuração)
7. [Uso dos Hooks](#uso-dos-hooks)

## 🎯 Visão Geral

O sistema implementa autenticação completa estilo Habbo com:
- ✅ Login por email (magic link)
- ✅ Login por senha tradicional
- ✅ Login via Apple OAuth
- ✅ Sessões persistentes com "Lembrar de mim"
- ✅ Refresh automático de tokens
- ✅ Logout seguro
- ✅ Recuperação de senha

## 🏗️ Arquitetura

### Estrutura de Arquivos

```
app/
├── auth/
│   ├── login/page.tsx          # Página de login
│   ├── register/page.tsx       # Página de registro
│   ├── reset/page.tsx          # Página de recuperação de senha
│   ├── verify-email/page.tsx   # Página de verificação de email
│   └── callback/
│       ├── route.ts            # Route handler (server)
│       └── page.tsx           # Callback page (client)
├── components/auth/
│   ├── LoginForm.tsx           # Formulário de login
│   ├── RegisterForm.tsx        # Formulário de registro
│   ├── ResetPasswordForm.tsx   # Formulário de reset
│   ├── GoogleSignInButton.tsx  # Botão Google OAuth
│   └── AppleSignInButton.tsx   # Botão Apple OAuth
├── context/
│   └── AuthContext.tsx         # Contexto de autenticação
└── lib/
    └── supabaseClient.ts       # Cliente Supabase otimizado
```

### Componentes Principais

#### 1. `AuthContext.tsx`
Contexto React que gerencia todo o estado de autenticação:
- Estado do usuário e sessão
- Funções de login (email, senha, Apple)
- Funções de registro e logout
- Refresh automático de tokens
- Integração com toasts

#### 2. `supabaseClient.ts`
Cliente Supabase configurado com:
- PKCE para OAuth seguro
- Persistência de sessão no localStorage
- Auto-refresh de tokens
- Storage key customizado: `pixel-life-auth`

#### 3. Páginas de Autenticação
Todas as páginas seguem o padrão:
- Suspense boundary para `useSearchParams`
- Redirecionamento automático se já autenticado
- UI estilo pixel-art consistente

## 🔐 Tipos de Login

### 1. Login por Email (Magic Link)

```typescript
const { loginEmail } = useAuth();

await loginEmail("usuario@email.com", rememberMe);
```

**Fluxo:**
1. Usuário insere email
2. Supabase envia email com link mágico
3. Usuário clica no link
4. Redireciona para `/auth/callback`
5. Código é trocado por sessão
6. Usuário é autenticado

### 2. Login por Senha

```typescript
const { loginPassword } = useAuth();

await loginPassword("usuario@email.com", "senha123", rememberMe);
```

**Fluxo:**
1. Usuário insere email e senha
2. Supabase valida credenciais
3. Sessão é criada imediatamente
4. Usuário é redirecionado para `/display`

### 3. Login via Google

```typescript
const { loginGoogle } = useAuth();

await loginGoogle(rememberMe);
```

**Fluxo:**
1. Usuário clica em "Continuar com Google"
2. Redireciona para Google OAuth
3. Usuário autoriza no Google
4. Google redireciona para `/auth/callback`
5. Código PKCE é trocado por sessão
6. Usuário é autenticado

### 4. Login via Apple

```typescript
const { loginApple } = useAuth();

await loginApple(rememberMe);
```

**Fluxo:**
1. Usuário clica em "Continuar com Apple"
2. Redireciona para Apple OAuth
3. Usuário autoriza no Apple
4. Apple redireciona para `/auth/callback`
5. Código PKCE é trocado por sessão
6. Usuário é autenticado

## 💾 Sessões Persistentes

### "Lembrar de Mim"

O sistema suporta dois tipos de sessão:

#### Sessão Longa (Lembrar de mim = true)
- Refresh token armazenado no localStorage
- Renovação automática antes de expirar
- Sessão persiste mesmo após fechar o navegador
- Duração: até o refresh token expirar (geralmente 30 dias)

#### Sessão Curta (Lembrar de mim = false)
- Sessão de 24 horas
- Não persiste após fechar o navegador
- Renovação automática durante uso ativo

### Refresh Automático

O `AuthContext` configura automaticamente:
- Renovação 5 minutos antes de expirar
- Tratamento de erros de renovação
- Toast de notificação se sessão expirar

```typescript
// Configuração automática no AuthContext
function setupAutoRefresh(session: Session) {
  const expiresIn = session.expires_at * 1000 - Date.now();
  const refreshIn = expiresIn - 5 * 60 * 1000; // 5 min antes
  
  setTimeout(async () => {
    await refreshSession();
  }, refreshIn);
}
```

## 🔄 Fluxo de Autenticação

### Fluxo Completo (Magic Link)

```
1. Usuário → /auth/login
2. Insere email → loginEmail()
3. Supabase envia email
4. Usuário clica no link
5. Supabase → /auth/callback?code=xxx
6. route.ts redireciona para /auth/callback?code=xxx
7. page.tsx processa código:
   - exchangeCodeForSession(code)
   - Salva sessão no localStorage
   - Configura refresh automático
8. Redireciona para /display
```

### Fluxo PKCE (OAuth)

```
1. Usuário → loginApple()
2. Supabase gera code_verifier
3. Salva code_verifier no localStorage
4. Redireciona para Apple
5. Apple → /auth/callback?code=xxx
6. page.tsx:
   - Recupera code_verifier do localStorage
   - exchangeCodeForSession(code, code_verifier)
   - Cria sessão
7. Redireciona para /display
```

## ⚙️ Configuração

### 1. Variáveis de Ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
```

### 2. Supabase Dashboard

#### Email Provider
1. Vá em **Authentication** → **Providers** → **Email**
2. Ative o provider
3. Configure templates de email

#### Apple OAuth
1. Vá em **Authentication** → **Providers** → **Apple**
2. Configure:
   - Service ID
   - Team ID
   - Key ID
   - Private Key (.p8)
3. Adicione callback URL:
   - `https://seu-dominio.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback`

#### Site URL e Redirect URLs
1. Vá em **Authentication** → **URL Configuration**
2. Configure:
   - **Site URL**: `https://seu-dominio.vercel.app`
   - **Redirect URLs**: 
     - `https://seu-dominio.vercel.app/auth/callback`
     - `http://localhost:3000/auth/callback`

### 3. RLS Policies

Execute o SQL em `SUPABASE_AUTH_RLS.md`:
- Criar tabela `user_profile`
- Configurar políticas RLS
- Criar trigger para perfil automático

## 🎣 Uso dos Hooks

### `useAuth()`

Hook principal que retorna tudo relacionado à autenticação:

```typescript
const {
  user,              // User | null
  session,           // Session | null
  loading,           // boolean
  loginEmail,        // (email, rememberMe?) => Promise
  loginPassword,     // (email, password, rememberMe?) => Promise
  loginGoogle,       // (rememberMe?) => Promise
  loginApple,        // (rememberMe?) => Promise
  register,          // (email, password, rememberMe?) => Promise
  logout,            // () => Promise<void>
  refreshSession,    // () => Promise
  updatePassword,    // (newPassword) => Promise
  resetPassword,     // (email) => Promise
} = useAuth();
```

### `useUser()`

Hook simplificado que retorna apenas o usuário:

```typescript
const user = useUser(); // User | null
```

### Exemplos de Uso

#### Login com Senha

```typescript
function LoginComponent() {
  const { loginPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const { error } = await loginPassword(email, password, true);
    if (error) {
      console.error("Erro:", error);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      {/* ... */}
    </form>
  );
}
```

#### Verificar Autenticação

```typescript
function ProtectedComponent() {
  const { user, loading } = useAuth();

  if (loading) return <p>Carregando...</p>;
  if (!user) return <p>Por favor, faça login</p>;

  return <div>Conteúdo protegido</div>;
}
```

#### Logout

```typescript
function LogoutButton() {
  const { logout } = useAuth();

  return (
    <button onClick={logout}>
      Sair
    </button>
  );
}
```

## 🔒 Segurança

### Boas Práticas Implementadas

1. **PKCE para OAuth**: Previne ataques de code interception
2. **RLS Policies**: Usuários só acessam seus próprios dados
3. **Tokens no localStorage**: Seguro para SPAs
4. **Refresh automático**: Mantém sessão válida
5. **Logout seguro**: Invalida tokens e limpa storage

### Armazenamento

- **Sessão**: `localStorage` com key `pixel-life-auth`
- **Lembrar de mim**: `localStorage` com key `pixel-life-remember-me`
- **Nunca** armazene tokens no servidor (apenas no cliente)

## 🐛 Troubleshooting

### "Erro ao trocar código por sessão"

- Verifique se PKCE está habilitado no Supabase
- Confirme que o callback URL está correto
- Verifique se `code_verifier` está no localStorage

### "Sessão não persiste"

- Verifique se `persistSession: true` está configurado
- Confirme que localStorage está habilitado
- Verifique se não há bloqueio de cookies/storage

### "Apple OAuth não funciona"

- Verifique configuração no Apple Developer Console
- Confirme Service ID, Team ID e Key ID
- Verifique se a chave privada (.p8) está correta

## 📚 Referências

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [PKCE Flow](https://oauth.net/2/pkce/)
- [Next.js App Router](https://nextjs.org/docs/app)

---

**Sistema implementado e pronto para uso!** 🎉

