-- =====================================================================
-- Autonomos — Migração Aprovação de Prestadores
-- Rode no Supabase Dashboard → SQL Editor → Run. Idempotente.
-- =====================================================================

-- approval_status: 'approved' (padrão) | 'pending' (aguarda admin) | 'rejected'
alter table public.profiles add column if not exists approval_status text not null default 'approved';
alter table public.profiles drop constraint if exists profiles_approval_status_check;
alter table public.profiles
  add constraint profiles_approval_status_check
  check (approval_status in ('approved', 'pending', 'rejected'));

alter table public.profiles add column if not exists approval_note text;            -- motivo (em caso de recusa)
alter table public.profiles add column if not exists approval_requested_at timestamptz;
alter table public.profiles add column if not exists approval_reviewed_at timestamptz;

-- Index para a dashboard listar pendentes rapidamente
create index if not exists profiles_approval_status_idx on public.profiles (approval_status, approval_requested_at desc);
