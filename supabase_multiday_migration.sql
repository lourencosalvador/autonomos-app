-- ============================================================
-- Autonomos · Serviço de vários dias (FlexPay 30/70)
-- ------------------------------------------------------------
-- Cliente pode marcar um pedido como "vários dias". Nesse caso
-- o pagamento é feito em 2 parcelas:
--   • Parcela 1 = 30% do total → vai DIRETO para o prestador (sacável já)
--   • Parcela 2 = 70% do total → fica RETIDA até "Serviço concluído"
--
-- Para suportar release parcial, guardamos o líquido do prestador
-- em duas "caixas": já liberado vs. ainda retido.
-- Idempotente: pode rodar várias vezes sem erro.
-- ============================================================

alter table requests add column if not exists is_multi_day boolean default false;

-- Quantas parcelas já foram confirmadas (0, 1 ou 2). Para 'vários dias' o total é 2.
alter table requests add column if not exists installments_paid integer default 0;

-- Qual parcela está pendente de confirmação no GPay (webhook usa para idempotência).
alter table requests add column if not exists gpay_pending_installment integer;

-- Líquido do prestador JÁ liberado (sacável) — em minor units (Kz × 100).
alter table requests add column if not exists provider_released_amount integer;

-- Líquido do prestador AINDA retido (escrow) — em minor units (Kz × 100).
alter table requests add column if not exists provider_held_amount integer;
