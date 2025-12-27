-- ============================================
-- IDENTIDADE DECLARADA E OBSERVADA
-- ============================================

-- 1.1 Identidade Declarada (do usuário)
create table if not exists public.identity_declared (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  -- Bio curta abaixo do avatar (snapshot atual)
  bio_text text default '',

  -- "Pontos centrais" declarados (lista livre)
  core_labels text[] default '{}'::text[],

  -- Preferências de exibição (o que aparece no perfil)
  pinned_stats jsonb default '{}'::jsonb,

  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists idx_identity_declared_user
on public.identity_declared (user_id);

-- Histórico de versões (não sobrescreve)
create table if not exists public.identity_declared_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bio_text text,
  core_labels text[] default '{}'::text[],
  pinned_stats jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_identity_declared_versions_user_time
on public.identity_declared_versions (user_id, created_at desc);

-- RLS para identity_declared
alter table public.identity_declared enable row level security;

create policy "users_read_own_declared_identity"
  on public.identity_declared
  for select
  using (auth.uid() = user_id);

create policy "users_write_own_declared_identity"
  on public.identity_declared
  for insert
  with check (auth.uid() = user_id);

create policy "users_update_own_declared_identity"
  on public.identity_declared
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- RLS para identity_declared_versions
alter table public.identity_declared_versions enable row level security;

create policy "users_read_own_declared_versions"
  on public.identity_declared_versions
  for select
  using (auth.uid() = user_id);

create policy "users_write_own_declared_versions"
  on public.identity_declared_versions
  for insert
  with check (auth.uid() = user_id);

-- 1.2 Identidade Observada (cache agregada)
create table if not exists public.identity_observed (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  -- janela do cálculo
  time_window text not null check (time_window in ('30d','90d','365d','all')),
  computed_at timestamptz default now(),

  -- eixos centrais detectados + métricas
  axes jsonb not null default '[]'::jsonb,

  -- sinais usados (auditoria leve)
  signals jsonb not null default '{}'::jsonb
);

create unique index if not exists idx_identity_observed_user_time_window
on public.identity_observed (user_id, time_window);

create index if not exists idx_identity_observed_user_time
on public.identity_observed (user_id, computed_at desc);

-- RLS para identity_observed
alter table public.identity_observed enable row level security;

create policy "users_read_own_observed_identity"
  on public.identity_observed
  for select
  using (auth.uid() = user_id);

create policy "users_write_own_observed_identity"
  on public.identity_observed
  for insert
  with check (auth.uid() = user_id);

create policy "users_update_own_observed_identity"
  on public.identity_observed
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 1.3 Histórico de Feedback (snapshots)
create table if not exists public.feedback_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  period_start timestamptz not null,
  period_end timestamptz not null,

  -- o que foi exibido ao usuário
  summary text,
  highlights jsonb default '[]'::jsonb,
  achievements jsonb default '[]'::jsonb,
  recommendations jsonb default '[]'::jsonb,

  -- de onde veio (regras/ia/hibrido)
  generator text not null default 'rules' check (generator in ('rules','ai','hybrid')),
  based_on jsonb default '{}'::jsonb,

  created_at timestamptz default now()
);

create index if not exists idx_feedback_history_user_period
on public.feedback_history (user_id, period_start desc);

-- RLS para feedback_history
alter table public.feedback_history enable row level security;

create policy "users_read_own_feedback_history"
  on public.feedback_history
  for select
  using (auth.uid() = user_id);

create policy "users_write_own_feedback_history"
  on public.feedback_history
  for insert
  with check (auth.uid() = user_id);

