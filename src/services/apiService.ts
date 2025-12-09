const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const API_ENDPOINTS = {
  sendOTP: `${API_BASE_URL}/api/send-otp`,
  verifyOTP: `${API_BASE_URL}/api/verify-otp`,
};

export async function sendOTP(type: 'email' | 'sms', value: string) {
  const response = await fetch(API_ENDPOINTS.sendOTP, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, value }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Erro ao enviar código');
  }

  return data;
}

export async function verifyOTPCode(type: 'email' | 'sms', value: string, code: string) {
  const response = await fetch(API_ENDPOINTS.verifyOTP, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, value, code }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Erro ao verificar código');
  }

  return data;
}

