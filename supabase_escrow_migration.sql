-- =====================================================================
-- Autonomos — Migração Escrow + FlexPay
-- Rode TODO este script no Supabase Dashboard → SQL Editor → New query → Run.
-- É idempotente (pode rodar mais de uma vez sem erro).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) requests: urgência, estado de escrow e "snapshot" das taxas
-- ---------------------------------------------------------------------
alter table public.requests add column if not exists is_urgent boolean not null default false;

-- escrow_status:
--   'none'      -> ainda não pago
--   'held'      -> pago e RETIDO (prestador vê mas não saca) = "em processamento"
--   'released'  -> liberado pelo cliente (sacável)           = "realizado"
--   'refunded'  -> devolvido
alter table public.requests add column if not exists escrow_status text not null default 'none';
alter table public.requests drop constraint if exists requests_escrow_status_check;
alter table public.requests
  add constraint requests_escrow_status_check
  check (escrow_status in ('none','held','released','refunded'));

-- Snapshot das taxas no momento do pagamento (minor units)
alter table public.requests add column if not exists agreed_amount int;   -- valor acordado (= price_amount)
alter table public.requests add column if not exists client_total int;    -- o que o cliente pagou
alter table public.requests add column if not exists request_fee int;     -- taxa de solicitação (cliente)
alter table public.requests add column if not exists service_fee int;     -- taxa de serviço (prestador)
alter table public.requests add column if not exists urgent_bonus int;    -- bônus de urgência (prestador)
alter table public.requests add column if not exists provider_net int;    -- líquido do prestador
alter table public.requests add column if not exists platform_net int;    -- ganho da plataforma
alter table public.requests add column if not exists released_at timestamptz;

-- ---------------------------------------------------------------------
-- 2) payments: mesmo snapshot (a carteira lê daqui)
-- ---------------------------------------------------------------------
alter table public.payments add column if not exists is_urgent boolean not null default false;
alter table public.payments add column if not exists escrow_status text not null default 'held';
alter table public.payments drop constraint if exists payments_escrow_status_check;
alter table public.payments
  add constraint payments_escrow_status_check
  check (escrow_status in ('held','released','refunded'));

alter table public.payments add column if not exists agreed_amount int;
alter table public.payments add column if not exists request_fee int;
alter table public.payments add column if not exists service_fee int;
alter table public.payments add column if not exists urgent_bonus int;
alter table public.payments add column if not exists provider_net int;
alter table public.payments add column if not exists platform_net int;
alter table public.payments add column if not exists released_at timestamptz;

-- ---------------------------------------------------------------------
-- 3) withdrawals: solicitações de saque (FlexPay)
-- ---------------------------------------------------------------------
create table if not exists public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.profiles(id) on delete cascade,
  amount int not null,                 -- minor units
  currency text not null default 'usd',
  status text not null default 'processing'
    check (status in ('processing','paid','failed','cancelled')),
  method text null,                    -- 'flex_pay' | 'bank'
  requested_at timestamptz not null default now(),
  estimated_arrival timestamptz null,  -- previsão (24h–48h)
  paid_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists withdrawals_provider_id_idx
  on public.withdrawals (provider_id, created_at desc);

alter table public.withdrawals enable row level security;

-- SELECT: prestador vê seus próprios saques
drop policy if exists "withdrawals_select_own" on public.withdrawals;
create policy "withdrawals_select_own"
on public.withdrawals for select
using (auth.uid() = provider_id);

-- INSERT: prestador cria saque para si mesmo (o backend valida o saldo via service role)
drop policy if exists "withdrawals_insert_own" on public.withdrawals;
create policy "withdrawals_insert_own"
on public.withdrawals for insert
with check (auth.uid() = provider_id);

-- ---------------------------------------------------------------------
-- 4) Backfill: pagamentos antigos (pré-escrow) já entram como liberados
--    para não travar saldos existentes.
-- ---------------------------------------------------------------------
update public.payments
  set escrow_status = 'released',
      provider_net = coalesce(provider_net, amount),
      agreed_amount = coalesce(agreed_amount, amount)
  where status = 'succeeded' and (escrow_status is null or escrow_status = 'held')
    and released_at is null and provider_net is null;
