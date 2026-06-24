-- =====================================================================
-- Autonomos — Migração Avaliações (formulários cliente↔prestador)
-- Rode no Supabase Dashboard → SQL Editor → Run. Idempotente.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) reviews (cliente avalia o PRESTADOR): novas perguntas de múltipla escolha
-- ---------------------------------------------------------------------
alter table public.reviews add column if not exists well_executed boolean;          -- "O trabalho foi bem executado?"
alter table public.reviews add column if not exists would_recommend boolean;         -- "Recomendaria?"
alter table public.reviews add column if not exists inappropriate_behavior boolean;  -- "O prestador teve comportamento inadequado?"
-- (rating int 1..5 = "Que nota daria?" e comment = "observação" já existem)

-- ---------------------------------------------------------------------
-- 2) client_reviews (prestador avalia o CLIENTE)
-- ---------------------------------------------------------------------
create table if not exists public.client_reviews (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  provider_id uuid not null references public.profiles(id) on delete cascade, -- quem avalia
  client_id uuid not null references public.profiles(id) on delete cascade,   -- avaliado
  provider_avatar_url text null,
  polite boolean,         -- "O cliente foi educado durante a interação?"
  changed_scope boolean,  -- "O cliente mudou o tipo do serviço depois do acordo feito?"
  rating int not null check (rating between 1 and 5), -- derivado (5 - 2*(!polite) - 2*(changed))
  comment text null,
  created_at timestamptz not null default now()
);

create unique index if not exists client_reviews_request_id_unique on public.client_reviews (request_id);
create index if not exists client_reviews_client_id_idx on public.client_reviews (client_id);

alter table public.client_reviews enable row level security;

-- SELECT: cliente e prestador envolvidos conseguem ver
drop policy if exists "client_reviews_select_participants" on public.client_reviews;
create policy "client_reviews_select_participants"
on public.client_reviews for select
using (auth.uid() = client_id or auth.uid() = provider_id);

-- INSERT: apenas o PRESTADOR cria, para si mesmo
drop policy if exists "client_reviews_insert_provider" on public.client_reviews;
create policy "client_reviews_insert_provider"
on public.client_reviews for insert
with check (auth.uid() = provider_id);

-- Marca no pedido que o prestador já avaliou o cliente
alter table public.requests add column if not exists client_reviewed_at timestamptz;
