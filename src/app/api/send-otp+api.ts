import { generateOTP, saveOTP, verifyOTP } from '../services/otpService';
import { sendEmailOTP } from '../services/emailService';
import { sendSMSOTP } from '../services/smsService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, value } = body;

    if (!type || !value) {
      return Response.json(
        { success: false, message: 'Tipo e valor são obrigatórios' },
        { status: 400 }
      );
    }

    if (type !== 'email' && type !== 'sms') {
      return Response.json(
        { success: false, message: 'Tipo inválido. Use "email" ou "sms"' },
        { status: 400 }
      );
    }

    const code = saveOTP(value, type, value);

    if (type === 'email') {
      await sendEmailOTP({ email: value, code });
    } else {
      await sendSMSOTP({ phone: value, code });
    }

    return Response.json({
      success: true,
      message: 'Código enviado com sucesso!'
    });
  } catch (error: any) {
    console.error('Erro ao enviar OTP:', error);
    return Response.json(
      { success: false, message: 'Erro ao enviar código: ' + error.message },
      { status: 500 }
    );
  }
}

