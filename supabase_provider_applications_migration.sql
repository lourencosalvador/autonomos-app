-- =====================================================================
-- Autonomos — Candidaturas de prestador vindas do SITE (sem login)
-- Rode no Supabase Dashboard → SQL Editor → Run. Idempotente.
-- =====================================================================

create extension if not exists pgcrypto schema public;

create table if not exists public.provider_applications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  city text,
  work_area text not null,         -- Área de atuação
  specialty text,                  -- Especialidade
  experience_years integer,        -- Anos de experiência
  description text not null,       -- Descrição
  photo_url text,                  -- Fotografia (URL pública)
  id_document_url text,            -- Bilhete de Identidade (URL pública)
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  note text,                       -- motivo (em caso de recusa)
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists provider_applications_status_idx
  on public.provider_applications (status, created_at desc);

alter table public.provider_applications enable row level security;

-- INSERT: público (o site, com a anon key, pode enviar candidaturas).
drop policy if exists "applications_insert_public" on public.provider_applications;
create policy "applications_insert_public" on public.provider_applications for insert with check (true);
-- SELECT/UPDATE ficam só para o service role (admin) — que ignora o RLS.

-- ---------------------------------------------------------------------
-- Storage bucket "applications" (foto + BI). Público para o admin ver os links.
-- NOTA DE PRIVACIDADE: o BI é sensível. Antes de produção, considere tornar o
-- bucket privado e servir por URL assinada no painel admin.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('applications', 'applications', true)
on conflict (id) do nothing;

drop policy if exists "applications_storage_read" on storage.objects;
create policy "applications_storage_read" on storage.objects for select
  using (bucket_id = 'applications');

drop policy if exists "applications_storage_insert_public" on storage.objects;
create policy "applications_storage_insert_public" on storage.objects for insert
  with check (bucket_id = 'applications');
