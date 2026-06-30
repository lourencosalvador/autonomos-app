-- =====================================================================
-- Autonomos — Migração GPay (Multicaixa Express + Referência)
-- Rode no Supabase Dashboard → SQL Editor → Run. Idempotente.
-- =====================================================================

-- Método de pagamento usado no pedido:
--   'card' (Stripe) | 'gpay_multicaixa' | 'gpay_reference'
alter table public.requests add column if not exists payment_method text;

-- ID da transação no GPay (usado pelo webhook para mapear o pedido).
alter table public.requests add column if not exists gpay_transaction_id text;

create index if not exists requests_gpay_tx_idx
  on public.requests (gpay_transaction_id);
