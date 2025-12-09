import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { OTPInput } from 'input-otp-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { sendOTP, verifyOTPCode } from '../../services/apiService';

export default function VerifyCodeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ method?: string; contact?: string }>();
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleVerifyCode = async () => {
    if (code.length !== 5) {
      Alert.alert('Erro', 'Por favor, insira o código completo');
      return;
    }

    setIsVerifying(true);
    
    try {
      const type = params.method as 'email' | 'sms';
      const value = params.contact || '';
      
      await verifyOTPCode(type, value, code);
      
      setIsVerifying(false);
      Alert.alert('Sucesso!', 'Código verificado. Agora você pode redefinir sua senha.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') }
      ]);
    } catch (error: any) {
      setIsVerifying(false);
      Alert.alert('Erro', error.message || 'Código expirado ou inválido');
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    
    try {
      const type = params.method as 'email' | 'sms';
      const value = params.contact || '';
      
      await sendOTP(type, value);
      
      setIsResending(false);
      setCode('');
      Alert.alert('Código Reenviado', 'Um novo código foi enviado.');
    } catch (error: any) {
      setIsResending(false);
      Alert.alert('Erro', error.message || 'Falha ao reenviar código');
    }
  };

  const displayContact = params.contact || '+244 934 587 653';
  const methodText = params.method === 'sms' ? 'número' : 'e-mail';

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View className="flex-1 bg-white px-6 pt-24">
        <StatusBar style="dark" />
        
        <View className="mb-10">
          <Text className="text-[28px] font-bold leading-tight text-gray-900">
            Código de Confirmação Enviado!
          </Text>
          <Text className="mt-3 text-[15px] leading-relaxed text-gray-600">
            Código de confirmação enviado para o {methodText}{' '}
            <Text className="font-bold text-gray-900">{displayContact}</Text>
          </Text>
        </View>

        <View className="items-center mb-80">
          <OTPInput
            maxLength={5}
            value={code}
            onChange={setCode}
            onComplete={(value) => console.log('OTP Complete:', value)}
            render={({ slots }) => (
              <View className="flex-row gap-3">
                {slots.map((slot, index) => (
                  <View
                    key={index}
                    className={`h-16 w-16 items-center justify-center rounded-2xl border-2 ${
                      slot.isActive
                        ? 'border-brand-cyan bg-brand-cyan/5'
                        : slot.char
                        ? 'border-gray-300 bg-gray-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    {slot.char && (
                      <Text className="text-2xl font-bold text-gray-900">
                        {slot.char}
                      </Text>
                    )}
                    {slot.hasFakeCaret && (
                      <View className="absolute h-8 w-0.5 bg-brand-cyan animate-pulse" />
                    )}
                  </View>
                ))}
              </View>
            )}
          />
        </View>

        <View className="mt-8">
          <Text className="text-center text-[15px] text-gray-900">
            Não recebeu o código?
          </Text>
          
          <TouchableOpacity
            className="mt-4 rounded-full bg-gray-100 py-5"
            activeOpacity={0.8}
            onPress={handleResendCode}
            disabled={isResending}
          >
            {isResending ? (
              <ActivityIndicator color="#6B7280" />
            ) : (
              <Text className="text-center text-[16px] font-bold text-gray-700">
                Reenviar Código
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="mt-4 rounded-full bg-brand-cyan py-5 flex-row justify-center items-center"
            activeOpacity={0.8}
            onPress={handleVerifyCode}
            disabled={isVerifying || code.length !== 5}
          >
            {isVerifying && (
              <ActivityIndicator color="white" className="mr-2" />
            )}
            <Text className="text-center text-[16px] font-bold text-white">
              {isVerifying ? 'Verificando...' : 'Confirmar Código'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

