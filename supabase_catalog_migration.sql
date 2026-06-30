-- =====================================================================
-- Autonomos — Migração Catálogo do Prestador
-- Rode no Supabase Dashboard → SQL Editor → Run. Idempotente.
-- Reutiliza o bucket de Storage "portfolio" para as imagens do catálogo.
-- =====================================================================

create extension if not exists pgcrypto schema public;

create table if not exists public.provider_catalog (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  price_amount integer not null default 0, -- valor inteiro em Kwanzas (Kz)
  currency text not null default 'AOA',
  image_url text,
  created_at timestamptz not null default now()
);

create index if not exists provider_catalog_provider_idx
  on public.provider_catalog (provider_id, created_at desc);

alter table public.provider_catalog enable row level security;

-- SELECT: público (clientes veem o catálogo no perfil do prestador)
drop policy if exists "catalog_select_public" on public.provider_catalog;
create policy "catalog_select_public" on public.provider_catalog for select using (true);

-- INSERT/UPDATE/DELETE: só o próprio prestador
drop policy if exists "catalog_insert_own" on public.provider_catalog;
create policy "catalog_insert_own" on public.provider_catalog for insert
  with check (auth.uid() = provider_id);

drop policy if exists "catalog_update_own" on public.provider_catalog;
create policy "catalog_update_own" on public.provider_catalog for update
  using (auth.uid() = provider_id) with check (auth.uid() = provider_id);

drop policy if exists "catalog_delete_own" on public.provider_catalog;
create policy "catalog_delete_own" on public.provider_catalog for delete
  using (auth.uid() = provider_id);
