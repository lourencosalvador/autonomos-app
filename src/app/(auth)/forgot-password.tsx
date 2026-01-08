import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Alert, Keyboard, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import PhoneInput from 'react-native-phone-number-input';
import { Flag } from 'react-native-country-picker-modal';
import { z } from 'zod';
import { SuccessModal } from '../../components/SuccessModal';
import { sendOTP } from '../../services/apiService';

type VerificationMethod = 'email' | 'sms';

const forgotPasswordSchema = z.object({
  email: z.string().email("E-mail inválido.").optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')).refine((val) => {
    if (!val) return true;
    const digits = val.replace(/\D/g, '');
    return digits.length >= 9;
  }, "Telefone inválido."),
}).refine((data) => {
  return data.email || data.phone;
}, {
  message: "Preencha pelo menos um campo",
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [method, setMethod] = useState<VerificationMethod>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const { control, handleSubmit, formState: { errors }, trigger, setValue } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
      phone: '',
    },
    mode: 'onChange',
  });

  const handleMethodChange = (newMethod: VerificationMethod) => {
    setMethod(newMethod);
    if (newMethod === 'email') {
      setValue('phone', '');
    } else {
      setValue('email', '');
    }
    trigger();
  };

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    
    try {
      const value = method === 'email' ? data.email : data.phone;
      await sendOTP(method, value!);
      
      setIsLoading(false);
      setShowSuccess(true);
    } catch (error: any) {
      setIsLoading(false);
      Alert.alert('Erro', error.message || 'Falha ao enviar código');
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    router.back();
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View className="flex-1 bg-white">
        <StatusBar style="dark" />
      
      <View className="px-6 pt-8 pb-6">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="mb-4"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View className="h-1 w-12 mb-4 rounded-full bg-gray-300 self-center" />
        </TouchableOpacity>

        <View className="mb-8">
          <Text className="text-[28px] font-bold text-gray-900">
            Recuperar Senha
          </Text>
          <Text className="mt-2 text-[15px] text-gray-600">
            Escolha como quer receber o{'\n'}código de confirmação!
          </Text>
        </View>

        <View className="mb-6">
          <Text className="mb-4 text-[16px] font-bold text-gray-900">
            Modo de Verificação
          </Text>

          <View className="gap-3">
            <TouchableOpacity
              onPress={() => handleMethodChange('email')}
              className={`flex-row items-center rounded-2xl px-4 py-5 ${
                method === 'email' ? 'bg-gray-100' : 'bg-gray-50'
              }`}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <View
                className={`mr-3 h-5 w-5 rounded-full border-2 items-center justify-center ${
                  method === 'email'
                    ? 'border-green-500 bg-green-500'
                    : 'border-gray-300 bg-white'
                }`}
              >
                {method === 'email' && (
                  <View className="h-2 w-2 rounded-full bg-white" />
                )}
              </View>
              <Ionicons name="mail-outline" size={22} color="#6B7280" style={{ marginRight: 12 }} />
              <Text className="text-[16px] font-medium text-gray-700">
                E-mail
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleMethodChange('sms')}
              className={`flex-row items-center rounded-2xl px-4 py-5 ${
                method === 'sms' ? 'bg-gray-100' : 'bg-gray-50'
              }`}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <View
                className={`mr-3 h-5 w-5 rounded-full border-2 items-center justify-center ${
                  method === 'sms'
                    ? 'border-green-500 bg-green-500'
                    : 'border-gray-300 bg-white'
                }`}
              >
                {method === 'sms' && (
                  <View className="h-2 w-2 rounded-full bg-white" />
                )}
              </View>
              <Ionicons name="call-outline" size={22} color="#6B7280" style={{ marginRight: 12 }} />
              <Text className="text-[16px] font-medium text-gray-700">
                Telefone(SMS)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {method === 'email' ? (
          <Controller
            control={control}
            name="email"
            rules={{ required: method === 'email' }}
            render={({ field: { onChange, value } }) => (
              <View className="mb-6">
                <Text className="mb-3 text-[16px] font-bold text-gray-900">
                  E-mail
                </Text>
                <View 
                  className={`rounded-2xl px-4 py-5 border-2 ${
                    errors.email 
                      ? 'bg-red-300/30 border-red-800' 
                      : 'bg-gray-100 border-transparent'
                  }`}
                >
                  <TextInput
                    className={`text-[16px] ${errors.email ? 'text-red-900' : 'text-gray-700'}`}
                    placeholder="seuemail@gmail.com"
                    placeholderTextColor={errors.email ? '#991B1B' : '#9CA3AF'}
                    value={value}
                    onChangeText={onChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </View>
                {errors.email && (
                  <Text className="mt-1 ml-1 text-sm font-bold text-red-800">
                    {errors.email.message}
                  </Text>
                )}
              </View>
            )}
          />
        ) : (
          <Controller
            control={control}
            name="phone"
            rules={{ required: method === 'sms' }}
            render={({ field: { onChange, value } }) => (
              <View className="mb-6">
                <Text className="mb-3 text-[16px] font-bold text-gray-900">
                  Telefone
                </Text>
                <View 
                  className={`rounded-2xl px-4 py-5 border-2 ${
                    errors.phone 
                      ? 'bg-red-300/30 border-red-800' 
                      : 'bg-gray-100 border-transparent'
                  }`}
                >
                  <PhoneInput
                    defaultCode="AO"
                    layout="first"
                    value={(value || '').replace(/^\+244/, '')}
                    onChangeText={() => {}}
                    onChangeFormattedText={(formatted) => onChange(formatted)}
                    placeholder="Inserir número"
                    countryPickerProps={{
                      withEmoji: false,
                      renderFlagButton: (props: any) => (
                        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                          <Flag countryCode={props.countryCode} withEmoji={false} />
                        </View>
                      ),
                    }}
                    containerStyle={{
                      width: '100%',
                      backgroundColor: 'transparent',
                      borderRadius: 16,
                      height: 56,
                    }}
                    textContainerStyle={{
                      backgroundColor: 'transparent',
                      borderRadius: 16,
                      paddingVertical: 0,
                      paddingHorizontal: 0,
                    }}
                    textInputStyle={{
                      color: errors.phone ? '#7F1D1D' : '#000000',
                      fontSize: 16,
                      paddingVertical: 0,
                    }}
                    codeTextStyle={{
                      color: errors.phone ? '#7F1D1D' : '#111827',
                      fontSize: 16,
                      fontWeight: '600',
                    }}
                    flagButtonStyle={{ width: 56 }}
                    withShadow={false}
                    withDarkTheme={false}
                    disableArrowIcon={false}
                    disabled={isLoading}
                  />
                </View>
                {errors.phone && (
                  <Text className="mt-1 ml-1 text-sm font-bold text-red-800">
                    {errors.phone.message}
                  </Text>
                )}
              </View>
            )}
          />
        )}

        <TouchableOpacity
          className="rounded-full bg-brand-cyan py-5 flex-row justify-center items-center"
          activeOpacity={0.8}
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
        >
          {isLoading && (
            <ActivityIndicator color="white" className="mr-2" />
          )}
          <Text className="text-center text-[17px] font-bold text-white">
            {isLoading ? 'Enviando...' : 'Enviar Código'}
          </Text>
        </TouchableOpacity>
      </View>

      <SuccessModal
        visible={showSuccess}
        onClose={handleSuccessClose}
        title="Código Enviado!"
        message={`Um código de verificação foi enviado para seu ${method === 'email' ? 'e-mail' : 'telefone'}.`}
        navigateTo="/(auth)/verify-code"
        navigationParams={{
          method: method,
          contact: method === 'email' ? control._formValues.email || '' : control._formValues.phone || ''
        }}
      />
      </View>
    </TouchableWithoutFeedback>
  );
}
