import type { PaymentRow, WithdrawalRow } from './supabase';
import { computeFees } from './pricing';

/**
 * Converte uma linha de `requests` (paga) numa estrutura de pagamento para a carteira.
 * `requests` é a fonte CONFIÁVEL (escrita direto pelo app); a tabela `payments` depende
 * do backend (confirm/webhook) e nem sempre é populada.
 */
/** PaymentRow + o split liberado/retido (preenchido para serviços de vários dias). */
export type WalletPayment = PaymentRow & { released_net?: number; held_net?: number };

export function requestRowToPayment(r: any): WalletPayment {
  const agreed = Number(r.price_amount || 0);
  const isUrgent = !!r.is_urgent;
  const net = r.provider_net != null ? Number(r.provider_net) : computeFees(agreed, isUrgent).providerNet;
  const escrow: 'held' | 'released' =
    r.escrow_status === 'released' || r.status === 'completed' ? 'released' : 'held';

  // Serviço de vários dias: o líquido fica em duas caixas (já liberado vs. ainda retido).
  // Para serviço normal, derivamos do escrow_status (uma caixa só, como antes).
  const hasSplit = r.provider_released_amount != null || r.provider_held_amount != null;
  const releasedNet = hasSplit ? Number(r.provider_released_amount || 0) : escrow === 'released' ? net : 0;
  const heldNet = hasSplit ? Number(r.provider_held_amount || 0) : escrow === 'held' ? net : 0;

  return {
    id: String(r.id),
    request_id: String(r.id),
    client_id: null,
    provider_id: r.provider_id ?? null,
    amount: Number(r.client_total ?? agreed),
    currency: String(r.currency || 'usd'),
    status: 'succeeded',
    stripe_payment_intent_id: String(r.id),
    paid_at: r.paid_at ?? null,
    escrow_status: escrow,
    provider_net: net,
    released_net: releasedNet,
    held_net: heldNet,
    created_at: r.created_at,
    updated_at: r.created_at,
  } as WalletPayment;
}

export type WalletBalance = {
  /** Retido em escrow (pago mas não liberado) — visível, não sacável. */
  pending: number;
  /** Total já liberado (realizado). */
  releasedTotal: number;
  /** Em saque (solicitações em processamento). */
  inWithdrawal: number;
  /** Disponível para sacar = liberado − (em saque + já pago). */
  available: number;
  currency: string;
};

/** Valor líquido do prestador para um pagamento (com fallback p/ dados legados). */
export function paymentProviderNet(p: PaymentRow): number {
  const net = Number(p.provider_net ?? NaN);
  if (Number.isFinite(net)) return net;
  return Number(p.amount || 0); // legado: sem snapshot, usa o valor cheio
}

/** Escrow efetivo (legado sem escrow_status conta como liberado). */
export function paymentEscrow(p: PaymentRow): 'held' | 'released' | 'refunded' {
  const s = p.escrow_status;
  if (s === 'held' || s === 'released' || s === 'refunded') return s;
  return 'released';
}

export function computeWalletBalance(payments: WalletPayment[], withdrawals: WithdrawalRow[]): WalletBalance {
  const succeeded = (payments || []).filter((p) => p.status === 'succeeded');

  let pending = 0;
  let releasedTotal = 0;
  for (const p of succeeded) {
    // Quando há split (vários dias), as caixas vêm prontas. Senão, deriva do escrow.
    const released = p.released_net ?? (paymentEscrow(p) === 'released' ? paymentProviderNet(p) : 0);
    const held = p.held_net ?? (paymentEscrow(p) === 'held' ? paymentProviderNet(p) : 0);
    releasedTotal += released;
    pending += held;
  }

  const committed = (withdrawals || [])
    .filter((w) => w.status === 'processing' || w.status === 'paid')
    .reduce((sum, w) => sum + Number(w.amount || 0), 0);

  const inWithdrawal = (withdrawals || [])
    .filter((w) => w.status === 'processing')
    .reduce((sum, w) => sum + Number(w.amount || 0), 0);

  const available = Math.max(0, releasedTotal - committed);

  const currency = (
    succeeded.find((p) => p.currency)?.currency ||
    withdrawals?.find((w) => w.currency)?.currency ||
    'USD'
  ).toUpperCase();

  return { pending, releasedTotal, inWithdrawal, available, currency };
}
