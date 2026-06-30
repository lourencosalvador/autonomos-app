-- =====================================================================
-- Autonomos — Motivo de cancelamento do pedido
-- Rode no Supabase Dashboard → SQL Editor → Run. Idempotente.
-- =====================================================================

alter table public.requests add column if not exists cancel_reason text;
alter table public.requests add column if not exists cancelled_by text; -- 'client' | 'provider'
