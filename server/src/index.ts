import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sendOTPRoute } from './routes/send-otp.js';
import { verifyOTPRoute } from './routes/verify-otp.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Autonomos Backend is running' });
});

app.post('/api/send-otp', sendOTPRoute);
app.post('/api/verify-otp', verifyOTPRoute);

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📧 Resend configurado: ${process.env.RESEND_API_KEY ? '✅' : '❌'}`);
  console.log(`📱 Twilio configurado: ${process.env.TWILIO_ACCOUNT_SID ? '✅' : '❌'}`);
});

