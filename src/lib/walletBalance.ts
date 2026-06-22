import type { PaymentRow, WithdrawalRow } from './supabase';

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

export function computeWalletBalance(payments: PaymentRow[], withdrawals: WithdrawalRow[]): WalletBalance {
  const succeeded = (payments || []).filter((p) => p.status === 'succeeded');

  let pending = 0;
  let releasedTotal = 0;
  for (const p of succeeded) {
    const net = paymentProviderNet(p);
    const esc = paymentEscrow(p);
    if (esc === 'held') pending += net;
    else if (esc === 'released') releasedTotal += net;
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
