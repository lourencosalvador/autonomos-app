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

/**
 * Taxa de deslocação (Kz inteiros): base + (km × por_km).
 * Fórmula: 500 + (km × 200). É informativa no ecrã de Termos do Serviço;
 * o prestador confirma o valor final antes do pagamento.
 */
export const TRAVEL_BASE_KZ = 500;
export const TRAVEL_PER_KM_KZ = 200;

export function computeTravelFee(km: number) {
  const k = Math.max(0, Math.round(km || 0));
  return TRAVEL_BASE_KZ + k * TRAVEL_PER_KM_KZ;
}

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

// ── Serviço de vários dias (FlexPay 30/70) ──────────────────────────────
// Quando o cliente marca o serviço como "mais de 1 dia", o pagamento divide-se:
//   • 1ª parcela = 30% do total → vai DIRETO para o prestador (sacável já)
//   • 2ª parcela = 70% do total → fica RETIDA até "Serviço concluído"
export const MULTI_DAY_FIRST_RATE = 0.3; // 30% no arranque (liberado de imediato)
export const MULTI_DAY_FINAL_RATE = 0.7; // 70% na parcela final (retido até concluir)

export type InstallmentPlan = {
  isMultiDay: boolean;
  /** Nº de parcelas (1 para serviço normal, 2 para vários dias). */
  installmentsTotal: number;
  /** Valor que o CLIENTE paga na 1ª parcela (minor units). */
  firstClientAmount: number;
  /** Valor que o CLIENTE paga na parcela final (minor units). */
  finalClientAmount: number;
  /** Líquido do prestador referente à 1ª parcela (liberado já). */
  firstProviderNet: number;
  /** Líquido do prestador referente à parcela final (retido até concluir). */
  finalProviderNet: number;
};

/**
 * Divide um FeeBreakdown em parcelas conforme a duração do serviço.
 * A divisão é proporcional, por isso o cliente paga sempre o mesmo total e o
 * prestador recebe sempre o mesmo líquido — muda só o "quando" e o "quanto fica retido".
 */
export function computeInstallments(fees: FeeBreakdown, isMultiDay: boolean): InstallmentPlan {
  if (!isMultiDay) {
    return {
      isMultiDay: false,
      installmentsTotal: 1,
      firstClientAmount: fees.clientTotal,
      finalClientAmount: 0,
      firstProviderNet: fees.providerNet,
      finalProviderNet: 0,
    };
  }
  // A 2ª parte é sempre "o resto" para não perder cêntimos no arredondamento.
  const firstClientAmount = round(fees.clientTotal * MULTI_DAY_FIRST_RATE);
  const firstProviderNet = round(fees.providerNet * MULTI_DAY_FIRST_RATE);
  return {
    isMultiDay: true,
    installmentsTotal: 2,
    firstClientAmount,
    finalClientAmount: fees.clientTotal - firstClientAmount,
    firstProviderNet,
    finalProviderNet: fees.providerNet - firstProviderNet,
  };
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
