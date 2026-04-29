import cors from 'cors';
import express from 'express';
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
// Expo/Metro normalmente usa 8081. Para não conflitar, o backend usa 8082 por padrão.
const PORT = process.env.PORT || 8082;
const HOST = process.env.HOST || '0.0.0.0';
 
app.use(cors());

// Stripe webhook precisa do body RAW para validar assinatura
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhookRoute);

// JSON para o resto das rotas
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Autonomos Backend is running',
    stripeConfigured: isStripeConfigured,
    stripeMode,
    supabaseAdminConfigured: isSupabaseAdminConfigured,
  });
});

app.post('/api/send-otp', sendOTPRoute);
app.post('/api/verify-otp', verifyOTPRoute);
app.post('/api/stream/token', streamTokenRoute);
app.post('/api/stripe/payment-intent', stripeCreatePaymentIntentRoute);
app.post('/api/stripe/confirm', stripeConfirmPaymentRoute);
app.post('/api/stripe/connect/onboard', stripeConnectOnboardRoute);

app.listen(Number(PORT), HOST, () => {
  console.log(`🚀 Servidor rodando em http://${HOST}:${PORT}`);
  console.log(`📧 Resend configurado: ${process.env.RESEND_API_KEY ? '✅' : '❌'}`);
  console.log(`📱 Twilio configurado: ${process.env.TWILIO_ACCOUNT_SID ? '✅' : '❌'}`);
  console.log(`💬 Stream configurado: ${process.env.STREAM_API_KEY && process.env.STREAM_API_SECRET ? '✅' : '❌'}`);
  console.log(`💳 Stripe configurado: ${process.env.STRIPE_SECRET_KEY ? '✅' : '❌'}`);
});

