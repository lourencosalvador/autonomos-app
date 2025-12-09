import { verifyOTP } from '../services/otpService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, value, code } = body;

    if (!type || !value || !code) {
      return Response.json(
        { success: false, message: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    if (code.length !== 5) {
      return Response.json(
        { success: false, message: 'O código deve ter exatamente 5 dígitos' },
        { status: 400 }
      );
    }

    const result = verifyOTP(value, code);

    if (result.valid) {
      return Response.json({
        success: true,
        message: 'Código verificado com sucesso!'
      });
    } else {
      return Response.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Erro ao verificar OTP:', error);
    return Response.json(
      { success: false, message: 'Erro ao verificar código: ' + error.message },
      { status: 500 }
    );
  }
}

