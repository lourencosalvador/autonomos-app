import { getApiBaseUrl } from '../lib/apiBaseUrl';

const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
  sendOTP: `${API_BASE_URL}/api/send-otp`,
  verifyOTP: `${API_BASE_URL}/api/verify-otp`,
  stripePaymentIntent: `${API_BASE_URL}/api/stripe/payment-intent`,
  stripeConfirm: `${API_BASE_URL}/api/stripe/confirm`,
  stripeConnectOnboard: `${API_BASE_URL}/api/stripe/connect/onboard`,
  health: `${API_BASE_URL}/health`,
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

export async function createStripePaymentIntent(args: { requestId: string; clientId?: string }) {
  const response = await fetch(API_ENDPOINTS.stripePaymentIntent, {
    method: 'POST',
    headers: buildJsonHeaders(API_ENDPOINTS.stripePaymentIntent),
    body: JSON.stringify(args),
  });
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
    connect?: {
      attempted: boolean;
      used: boolean;
      destination?: string;
      reason?: string;
    };
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

