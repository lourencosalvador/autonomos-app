import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sendOTPRoute } from './routes/send-otp.js';
import { verifyOTPRoute } from './routes/verify-otp.js';
import { streamTokenRoute } from './routes/stream-token.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8081;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Autonomos Backend is running' });
});

app.post('/api/send-otp', sendOTPRoute);
app.post('/api/verify-otp', verifyOTPRoute);
app.post('/api/stream/token', streamTokenRoute);

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📧 Resend configurado: ${process.env.RESEND_API_KEY ? '✅' : '❌'}`);
  console.log(`📱 Twilio configurado: ${process.env.TWILIO_ACCOUNT_SID ? '✅' : '❌'}`);
  console.log(`💬 Stream configurado: ${process.env.STREAM_API_KEY && process.env.STREAM_API_SECRET ? '✅' : '❌'}`);
});

