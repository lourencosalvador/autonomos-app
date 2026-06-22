/**
 * Regras de preço da Autonomos (Escrow + FlexPay).
 *
 * Modelo de negócio:
 * - Taxa de SOLICITAÇÃO: 10% sobre o valor acordado, cobrada ao CLIENTE (somada ao total).
 * - Taxa de SERVIÇO: 10% sobre o valor acordado, cobrada ao PRESTADOR (descontada do que recebe).
 * - Ganho total da plataforma na intermediação: 20% sobre o valor acordado.
 * - URGÊNCIA: o cliente paga o DOBRO da taxa de solicitação (20%). O acréscimo
 *   (os 10% extras) é dividido: 5% fica para a Autonomos e 5% vai para o prestador.
 *
 * Exemplo (acordado = 60.000):
 *   Normal:  cliente paga 66.000 | prestador recebe 54.000 | plataforma 12.000
 *   Urgente: cliente paga 72.000 | prestador recebe 57.000 | plataforma 15.000
 *
 * Todos os valores são em "minor units" (ex: cêntimos). 6000 = 60,00.
 */

export const REQUEST_FEE_RATE = 0.1; // taxa de solicitação (cliente)
export const SERVICE_FEE_RATE = 0.1; // taxa de serviço (prestador)
export const URGENT_REQUEST_FEE_RATE = 0.2; // urgente: o cliente paga o dobro
export const URGENT_PROVIDER_BONUS_RATE = 0.05; // 5% extra para o prestador quando urgente

export type FeeBreakdown = {
  /** Valor acordado pelo serviço (minor units). */
  agreed: number;
  isUrgent: boolean;
  /** Taxa de solicitação cobrada ao cliente (10% normal, 20% urgente). */
  requestFee: number;
  /** Taxa de serviço descontada do prestador (10%). */
  serviceFee: number;
  /** Bônus de urgência que vai para o prestador (5% do acordado, só se urgente). */
  urgentBonus: number;
  /** Total que o CLIENTE paga (acordado + taxa de solicitação). */
  clientTotal: number;
  /** Valor LÍQUIDO que o PRESTADOR recebe (sacável após liberação). */
  providerNet: number;
  /** Ganho líquido da plataforma. */
  platformNet: number;
};

/** Arredonda para o inteiro mais próximo de forma segura (minor units não têm fração). */
function round(n: number) {
  return Math.max(0, Math.round(n || 0));
}

/**
 * Calcula a quebra completa de taxas a partir do valor acordado.
 * É a fonte única usada no checkout (cliente), no backend (PaymentIntent) e na carteira.
 */
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

/** Formata minor units para exibição (ex: "Kz 66.000,00"). */
export function formatMoney(amount: number | null | undefined, currency?: string | null) {
  const c = (currency || '').toUpperCase() || 'USD';
  const major = Number(amount || 0) / 100;
  return `${currencySymbol(c)} ${major.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Rótulo curto da moeda (Kwanza aparece como "Kz"). */
export function currencySymbol(currency?: string | null) {
  const c = (currency || '').toUpperCase();
  if (c === 'AOA' || c === 'KZ' || c === 'KWANZA') return 'Kz';
  return c || 'USD';
}
