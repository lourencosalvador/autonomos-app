import cors from 'cors';
import express, { Request, Response } from 'express';
import './env.js';

import { isStripeConfigured, stripeMode } from './lib/stripe.js';
import { isSupabaseAdminConfigured } from './lib/supabaseAdmin.js';

import { sendOTPRoute } from './routes/send-otp.js';
import { streamTokenRoute } from './routes/stream-token.js';
import { stripeConfirmPaymentRoute } from './routes/stripe-confirm-payment.js';
import { stripeConnectOnboardRoute } from './routes/stripe-connect-onboard.js';
import { stripeCreatePaymentIntentRoute } from './routes/stripe-create-payment-intent.js';
import { stripeWebhookRoute } from './routes/stripe-webhook.js';
import { verifyOTPRoute } from './routes/verify-otp.js';

const app = express();
const PORT = process.env.PORT || 8082;
const HOST = process.env.HOST || '0.0.0.0';

app.use(cors());

// Stripe webhook precisa do body RAW (antes do express.json())
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhookRoute);

// Middleware JSON para as demais rotas
app.use(express.json());

// ==================== ROTAS ====================

// Rota raiz
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: "✅ Autonomos Backend está rodando com sucesso!",
    status: "online",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "production",
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    message: 'Autonomos Backend is running',
    stripeConfigured: isStripeConfigured,
    stripeMode,
    supabaseAdminConfigured: isSupabaseAdminConfigured,
    uptime: process.uptime()
  });
});

// Rotas da API
app.post('/api/send-otp', sendOTPRoute);
app.post('/api/verify-otp', verifyOTPRoute);
app.post('/api/stream/token', streamTokenRoute);
app.post('/api/stripe/payment-intent', stripeCreatePaymentIntentRoute);
app.post('/api/stripe/confirm', stripeConfirmPaymentRoute);
app.post('/api/stripe/connect/onboard', stripeConnectOnboardRoute);

// Rota 404 - Not Found
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Route not found",
    message: `Cannot ${req.method} ${req.path}`
  });
});

// Inicia o servidor
app.listen(Number(PORT), HOST, () => {
  console.log(`🚀 Servidor rodando em http://${HOST}:${PORT}`);
  console.log(`📧 Resend configurado: ${process.env.RESEND_API_KEY ? '✅' : '❌'}`);
  console.log(`📱 Twilio configurado: ${process.env.TWILIO_ACCOUNT_SID ? '✅' : '❌'}`);
  console.log(`💬 Stream configurado: ${process.env.STREAM_API_KEY && process.env.STREAM_API_SECRET ? '✅' : '❌'}`);
  console.log(`💳 Stripe configurado: ${process.env.STRIPE_SECRET_KEY ? '✅' : '❌'}`);
});