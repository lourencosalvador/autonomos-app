import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifySid = process.env.TWILIO_VERIFY_SID;

const client = twilio(accountSid, authToken);

interface SendSMSOTPParams {
  phone: string;
  code: string;
}

export async function sendSMSOTP({ phone, code }: SendSMSOTPParams) {
  try {
    let formattedPhone = phone.trim().replace(/\s+/g, '');
    
    if (!formattedPhone.startsWith('+')) {
      if (formattedPhone.startsWith('244')) {
        formattedPhone = '+' + formattedPhone;
      } else if (formattedPhone.length === 9) {
        formattedPhone = '+244' + formattedPhone;
      } else {
        throw new Error('Formato de número inválido');
      }
    }

    const verification = await client.verify.v2
      .services(verifySid!)
      .verifications.create({
        to: formattedPhone,
        channel: 'sms',
        customCode: code,
        locale: 'pt',
      });

    return { 
      success: true, 
      status: verification.status,
      to: verification.to 
    };
  } catch (error: any) {
    console.error('Erro ao enviar SMS:', error);
    throw new Error('Falha ao enviar SMS: ' + error.message);
  }
}

export async function verifySMSOTP(phone: string, code: string) {
  try {
    let formattedPhone = phone.trim().replace(/\s+/g, '');
    
    if (!formattedPhone.startsWith('+')) {
      if (formattedPhone.startsWith('244')) {
        formattedPhone = '+' + formattedPhone;
      } else if (formattedPhone.length === 9) {
        formattedPhone = '+244' + formattedPhone;
      }
    }

    const verificationCheck = await client.verify.v2
      .services(verifySid!)
      .verificationChecks.create({
        to: formattedPhone,
        code: code,
      });

    return {
      valid: verificationCheck.status === 'approved',
      status: verificationCheck.status
    };
  } catch (error: any) {
    console.error('Erro ao verificar SMS:', error);
    return { valid: false, status: 'failed' };
  }
}

