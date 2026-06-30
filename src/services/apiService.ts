import { getApiBaseUrl } from '../lib/apiBaseUrl';

const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
  sendOTP: `${API_BASE_URL}/api/send-otp`,
  verifyOTP: `${API_BASE_URL}/api/verify-otp`,
  stripePaymentIntent: `${API_BASE_URL}/api/stripe/payment-intent`,
  stripeConfirm: `${API_BASE_URL}/api/stripe/confirm`,
  gpayPay: `${API_BASE_URL}/api/gpay/pay`,
  stripeConnectOnboard: `${API_BASE_URL}/api/stripe/connect/onboard`,
  escrowRelease: `${API_BASE_URL}/api/escrow/release`,
  withdrawalRequest: `${API_BASE_URL}/api/withdrawals/request`,
  health: `${API_BASE_URL}/health`,
};

export type FeeBreakdownDTO = {
  agreed: number;
  isUrgent: boolean;
  requestFee: number;
  serviceFee: number;
  urgentBonus: number;
  clientTotal: number;
  providerNet: number;
  platformNet: number;
};

function buildJsonHeaders(url: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  // Ngrok (free) às vezes injeta uma página HTML de "browser warning".
  // Esse header evita a página e retorna o JSON do nosso backend.
  if (/ngrok/i.test(url)) headers['ngrok-skip-browser-warning'] = 'true';
  return headers;
}

async function safeReadJson(response: Response) {
  const ct = response.headers.get('content-type') || '';
  const text = await response.text();
  if (ct.includes('application/json')) {
    try {
      return text ? JSON.parse(text) : {};
    } catch {
      // cai no fallback abaixo
    }
  }
  return { __raw: text, __contentType: ct };
}

/**
 * POST com timeout e retry opcional. O backend (Render free) hiberna; a 1ª chamada
 * pode demorar/expirar acordando o servidor — a 2ª então passa rápido.
 * `retries: 0` para mutações NÃO idempotentes (ex: saque), pra não duplicar.
 */
async function postJson(url: string, body: any, opts?: { timeoutMs?: number; retries?: number }) {
  const timeoutMs = opts?.timeoutMs ?? 45000;
  const retries = opts?.retries ?? 1;
  let lastErr: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: buildJsonHeaders(url),
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timer);
      return response;
    } catch (e) {
      clearTimeout(timer);
      lastErr = e;
      // abort (timeout) ou erro de rede → tenta de novo (servidor pode estar acordando)
    }
  }
  throw new Error(
    `O servidor demorou a responder${lastErr ? '' : ''} (pode estar reiniciando após inatividade). Aguarde alguns segundos e tente novamente.`
  );
}

export async function sendOTP(type: 'email' | 'sms', value: string) {
  const response = await fetch(API_ENDPOINTS.sendOTP, {
    method: 'POST',
    headers: buildJsonHeaders(API_ENDPOINTS.sendOTP),
    body: JSON.stringify({ type, value }),
  });

  const data: any = await safeReadJson(response);
  
  if (!response.ok) {
    throw new Error(data.message || 'Erro ao enviar código');
  }

  return data;
}

export async function verifyOTPCode(type: 'email' | 'sms', value: string, code: string) {
  const response = await fetch(API_ENDPOINTS.verifyOTP, {
    method: 'POST',
    headers: buildJsonHeaders(API_ENDPOINTS.verifyOTP),
    body: JSON.stringify({ type, value, code }),
  });

  const data: any = await safeReadJson(response);
  
  if (!response.ok) {
    throw new Error(data.message || 'Erro ao verificar código');
  }

  return data;
}

export async function createStripePaymentIntent(args: { requestId: string; clientId?: string; isUrgent?: boolean; installment?: number }) {
  // Reutilizar o PI é seguro no backend, então pode tentar de novo após cold start.
  const response = await postJson(API_ENDPOINTS.stripePaymentIntent, args, { timeoutMs: 40000, retries: 1 });
  const data: any = await safeReadJson(response);
  if (!response.ok) {
    const raw = typeof data?.__raw === 'string' ? data.__raw.trim() : '';
    const snippet = raw ? ` (${raw.slice(0, 80)}${raw.length > 80 ? '...' : ''})` : '';
    throw new Error(data.message || `Erro ao iniciar pagamento${snippet}`);
  }
  return data as {
    ok: true;
    paymentIntentClientSecret: string;
    paymentIntentId?: string;
    stripeMode?: 'test' | 'live' | 'unknown';
    livemode?: boolean;
    fees?: FeeBreakdownDTO;
    connect?: {
      attempted: boolean;
      used: boolean;
      destination?: string;
      reason?: string;
    };
  };
}

/**
 * Inicia um pagamento via GPay Angola.
 * - method 'multicaixa' → push na app Multicaixa Express (cliente confirma no telemóvel)
 * - method 'reference'  → devolve um número de referência para o cliente pagar (ATM/banco)
 * A confirmação chega ao webhook do backend, que retém o escrow.
 */
export async function createGpayPayment(args: {
  requestId: string;
  clientId?: string;
  method: 'multicaixa' | 'reference';
  phone?: string;
  name?: string;
  email?: string;
  isUrgent?: boolean;
}) {
  // Sem retry automático: criar pagamento não é idempotente (evita duplicar).
  const response = await postJson(API_ENDPOINTS.gpayPay, args, { timeoutMs: 45000, retries: 0 });
  const data: any = await safeReadJson(response);
  if (!response.ok) {
    const raw = typeof data?.__raw === 'string' ? data.__raw.trim() : '';
    const snippet = raw ? ` (${raw.slice(0, 80)}${raw.length > 80 ? '...' : ''})` : '';
    throw new Error(data.message || `Erro ao iniciar pagamento${snippet}`);
  }
  return data as {
    ok: true;
    method: 'multicaixa' | 'reference';
    transactionId: string;
    amount: number;
    referenceNumber?: string | null;
    entity?: string | null;
  };
}

/** Cliente libera o escrow ("Serviço concluído") — torna o valor do prestador sacável. */
export async function releaseEscrow(args: { requestId: string; clientId?: string }) {
  // Idempotente no backend → pode tentar de novo após cold start.
  const response = await postJson(API_ENDPOINTS.escrowRelease, args, { timeoutMs: 40000, retries: 1 });
  const data: any = await safeReadJson(response);
  if (!response.ok) {
    const raw = typeof data?.__raw === 'string' ? data.__raw.trim() : '';
    const snippet = raw ? ` (${raw.slice(0, 80)}${raw.length > 80 ? '...' : ''})` : '';
    throw new Error(data.message || `Erro ao liberar pagamento${snippet}`);
  }
  return data as { ok: true; escrowStatus: 'released'; alreadyReleased?: boolean; releasedAt: string };
}

/** Prestador solicita saque (FlexPay). Retorna a previsão de chegada (24h–48h). */
export async function requestWithdrawal(args: { providerId: string; amount?: number }) {
  // Sem retry automático: o saque NÃO é idempotente (evita criar saque duplicado).
  const response = await postJson(API_ENDPOINTS.withdrawalRequest, args, { timeoutMs: 60000, retries: 0 });
  const data: any = await safeReadJson(response);
  if (!response.ok) {
    const raw = typeof data?.__raw === 'string' ? data.__raw.trim() : '';
    const snippet = raw ? ` (${raw.slice(0, 80)}${raw.length > 80 ? '...' : ''})` : '';
    throw new Error(data.message || `Erro ao solicitar saque${snippet}`);
  }
  return data as {
    ok: true;
    amount: number;
    currency: string;
    available: number;
    estimatedArrival: string;
    etaHoursMin: number;
    etaHoursMax: number;
  };
}

export async function createStripeConnectOnboarding(args: { providerId: string; returnUrl: string; refreshUrl?: string }) {
  const response = await fetch(API_ENDPOINTS.stripeConnectOnboard, {
    method: 'POST',
    headers: buildJsonHeaders(API_ENDPOINTS.stripeConnectOnboard),
    body: JSON.stringify(args),
  });
  const data: any = await safeReadJson(response);
  if (!response.ok) {
    const raw = typeof data?.__raw === 'string' ? data.__raw.trim() : '';
    const snippet = raw ? ` (${raw.slice(0, 80)}${raw.length > 80 ? '...' : ''})` : '';
    throw new Error(data.message || `Erro ao iniciar ativação de recebimentos${snippet}`);
  }
  return data as { ok: true; url: string; stripeAccountId: string };
}

export async function confirmStripePayment(args: { requestId: string; paymentIntentId: string }) {
  const response = await fetch(API_ENDPOINTS.stripeConfirm, {
    method: 'POST',
    headers: buildJsonHeaders(API_ENDPOINTS.stripeConfirm),
    body: JSON.stringify(args),
  });
  const data: any = await safeReadJson(response);
  if (!response.ok) {
    const raw = typeof data?.__raw === 'string' ? data.__raw.trim() : '';
    const snippet = raw ? ` (${raw.slice(0, 80)}${raw.length > 80 ? '...' : ''})` : '';
    throw new Error(data.message || `Erro ao confirmar pagamento${snippet}`);
  }
  return data as { ok: true; status: string; livemode?: boolean };
}

export async function getBackendHealth() {
  const response = await fetch(API_ENDPOINTS.health, {
    method: 'GET',
    headers: buildJsonHeaders(API_ENDPOINTS.health),
  });
  const data: any = await safeReadJson(response);
  if (!response.ok) {
    const raw = typeof data?.__raw === 'string' ? data.__raw.trim() : '';
    const snippet = raw ? ` (${raw.slice(0, 80)}${raw.length > 80 ? '...' : ''})` : '';
    throw new Error(data.message || `Erro ao ler /health${snippet}`);
  }
  return data as {
    status: string;
    message: string;
    stripeConfigured?: boolean;
    stripeMode?: 'test' | 'live' | 'unknown';
    supabaseAdminConfigured?: boolean;
  };
}

