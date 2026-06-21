/**
 * Regras de preço da Autonomos (Escrow + FlexPay) — espelho de src/lib/pricing.ts.
 *
 * - Taxa de SOLICITAÇÃO: 10% sobre o acordado, cobrada ao CLIENTE (somada ao total).
 * - Taxa de SERVIÇO: 10% sobre o acordado, cobrada ao PRESTADOR (descontada).
 * - URGÊNCIA: cliente paga o dobro da taxa de solicitação (20%); o extra divide-se
 *   em 5% para a Autonomos e 5% para o prestador.
 *
 * Valores em minor units (cêntimos).
 */

export const REQUEST_FEE_RATE = 0.1;
export const SERVICE_FEE_RATE = 0.1;
export const URGENT_REQUEST_FEE_RATE = 0.2;
export const URGENT_PROVIDER_BONUS_RATE = 0.05;

export type FeeBreakdown = {
  agreed: number;
  isUrgent: boolean;
  requestFee: number;
  serviceFee: number;
  urgentBonus: number;
  clientTotal: number;
  providerNet: number;
  platformNet: number;
};

function round(n: number) {
  return Math.max(0, Math.round(n || 0));
}

export function computeFees(agreed: number, isUrgent = false): FeeBreakdown {
  const a = round(agreed);
  const requestFee = round(a * (isUrgent ? URGENT_REQUEST_FEE_RATE : REQUEST_FEE_RATE));
  const serviceFee = round(a * SERVICE_FEE_RATE);
  const urgentBonus = isUrgent ? round(a * URGENT_PROVIDER_BONUS_RATE) : 0;

  const clientTotal = a + requestFee;
  const providerNet = a - serviceFee + urgentBonus;
  const platformNet = clientTotal - providerNet;

  return { agreed: a, isUrgent, requestFee, serviceFee, urgentBonus, clientTotal, providerNet, platformNet };
}
