-- =====================================================================
-- Autonomos — Migração Onboarding do Prestador
-- Rode no Supabase Dashboard → SQL Editor → Run. Idempotente.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) profiles: campos do perfil do prestador
-- ---------------------------------------------------------------------
alter table public.profiles add column if not exists bio text;                 -- biografia
alter table public.profiles add column if not exists work_description text;     -- descrição do trabalho
alter table public.profiles add column if not exists experience_time text;      -- 'lt1' | '2' | '3plus'
alter table public.profiles add column if not exists availability jsonb;        -- { days:[1..7], start:'08:00', end:'20:00' }
alter table public.profiles add column if not exists onboarding_completed boolean not null default false;

-- ---------------------------------------------------------------------
-- 2) provider_certificates: certificados enviados pelo prestador
-- ---------------------------------------------------------------------
create table if not exists public.provider_certificates (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.profiles(id) on delete cascade,
  name text,
  file_url text not null,
  created_at timestamptz not null default now()
);

create index if not exists provider_certificates_provider_idx
  on public.provider_certificates (provider_id, created_at desc);

alter table public.provider_certificates enable row level security;

-- SELECT: público (clientes veem os certificados no perfil do prestador)
drop policy if exists "certs_select_public" on public.provider_certificates;
create policy "certs_select_public" on public.provider_certificates for select using (true);

-- INSERT/DELETE: só o próprio prestador
drop policy if exists "certs_insert_own" on public.provider_certificates;
create policy "certs_insert_own" on public.provider_certificates for insert with check (auth.uid() = provider_id);

drop policy if exists "certs_delete_own" on public.provider_certificates;
create policy "certs_delete_own" on public.provider_certificates for delete using (auth.uid() = provider_id);

-- ---------------------------------------------------------------------
-- 3) Storage bucket "certificates" (público) + políticas
--    (Se preferires, cria o bucket "certificates" como Public pelo Dashboard.)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('certificates', 'certificates', true)
on conflict (id) do nothing;

drop policy if exists "certificates_read" on storage.objects;
create policy "certificates_read" on storage.objects for select
  using (bucket_id = 'certificates');

drop policy if exists "certificates_insert_own" on storage.objects;
create policy "certificates_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'certificates' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "certificates_delete_own" on storage.objects;
create policy "certificates_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'certificates' and (storage.foldername(name))[1] = auth.uid()::text);
