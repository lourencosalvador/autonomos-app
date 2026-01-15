import { AntDesign, Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Alert, Image, Keyboard, Platform, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { z } from 'zod';
import { useAuthStore } from '../../stores/authStore';
import { useAppStore } from '../../stores/appStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { toast } from '../../lib/sonner';

const loginSchema = z.object({
  email: z.string().email("E-mail inválido."),
  password: z.string().min(6, "A palavra passe deve ter no mínimo 6 caracteres."),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signInWithOAuth, isLoading } = useAuthStore();
  const { setHasSeenSplash } = useAppStore();
  const [error, setError] = useState<string | null>(null);

  const handleResetSplash = () => {
    Alert.alert('Reset Splash', 'Deseja resetar a splash screen?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Resetar',
        onPress: () => {
          setHasSeenSplash(false);
          toast.success('Splash resetada. Feche e reabra o app.');
        },
      },
    ]);
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    const id = toast.loading('Conectando com Google...');
    try {
      await signInWithOAuth('google');
      toast.dismiss(id);
      const name = (useAuthStore.getState().user?.name || '').trim();
      toast.success(name ? `Bem vindo ${name} 💙` : 'Bem vindo 💙');
    } catch (e: any) {
      toast.dismiss(id);
      toast.error(e?.message || 'Falha ao conectar com Google');
    }
  };

  const handleAppleSignIn = async () => {
    setError(null);
    try {
      toast('Entrar com Apple está em manutenção.');
      return;
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao conectar com Apple');
    }
  };

  const { control, handleSubmit, formState: { errors }, setValue } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    }
  });

  const handleDebugLogin = (email: string, password: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', password, { shouldValidate: true });
    handleSubmit(onSubmit)();
  };

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    const id = toast.loading('Entrando...');
    try {
      await signIn(data.email, data.password);
      toast.dismiss(id);
      const name = (useAuthStore.getState().user?.name || '').trim();
      toast.success(name ? `Bem vindo ${name} 💙` : 'Bem vindo 💙');
    } catch (err) {
      setError('Credenciais inválidas ou erro no servidor.');
      toast.dismiss(id);
      toast.error('Credenciais inválidas.');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View className="flex-1 bg-white px-6 pt-28">
        <StatusBar style="dark" />
      
      <View className="mb-10">
        <Text className="text-[2rem] font-bold text-gray-900">
          Entrar
        </Text>
        <View className="flex-row items-center mt-2">
          <Text className="text-[14px] text-gray-600">
            Novo usuário?{' '}
          </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/account-type')}>
            <Text className="text-[16px] font-bold text-gray-900">
              Criar uma conta!
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="gap-6">
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <View>
              <View 
                className={`flex-row items-center rounded-2xl px-4 py-5 border-2 ${
                  errors.email 
                    ? 'bg-red-300/30 border-red-800' 
                    : 'bg-[#F4F4F4] border-transparent'
                }`}
              >
                <Ionicons 
                  name="mail-outline" 
                  size={20} 
                  color={errors.email ? '#991B1B' : '#6B7280'} 
                  style={{ marginRight: 12 }} 
                />
                <TextInput
                  className={`flex-1 text-base ${errors.email ? 'text-red-900' : 'text-[#4444449E]'}`}
                  placeholder="Inserir E-mail"
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

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <View>
              <View 
                className={`flex-row items-center rounded-2xl px-4 py-5 border-2 ${
                  errors.password 
                    ? 'bg-red-300/30 border-red-800' 
                    : 'bg-[#F4F4F4] border-transparent'
                }`}
              >
                <Ionicons 
                  name="lock-closed-outline" 
                  size={20} 
                  color={errors.password ? '#991B1B' : '#6B7280'} 
                  style={{ marginRight: 12 }} 
                />
                <TextInput
                  className={`flex-1 text-base ${errors.password ? 'text-red-900' : 'text-[#4444449E]'}`}
                  placeholder="Palavra Passe"
                  placeholderTextColor={errors.password ? '#991B1B' : '#9CA3AF'}
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry
                  editable={!isLoading}
                />
              </View>
              {errors.password && (
                <Text className="mt-1 ml-1 text-sm font-bold text-red-800">
                  {errors.password.message}
                </Text>
              )}
            </View>
          )}
        />

        <TouchableOpacity 
          activeOpacity={0.7}
          onPress={() => router.push('/(auth)/forgot-password')}
        >
          <Text className="text-[14px] font-bold text-gray-900">
            Esqueceu a Palavra Passe?
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="mt-4 rounded-full bg-brand-cyan py-5 flex-row justify-center items-center"
          activeOpacity={0.8}
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" className="mr-2" />
          ) : null}
          <Text className="text-center text-[16px] font-bold text-white">
            {isLoading ? 'Entrando...' : 'Entrar'}
          </Text>
        </TouchableOpacity>
        
        {error && (
          <Text className="text-center text-sm font-bold text-red-500">
            {error}
          </Text>
        )}

        <View className="mt-2 items-center gap-2">
          <TouchableOpacity
            onPress={() => handleDebugLogin('makendragomes@gmail.com', 'make1234')}
            activeOpacity={0.7}
            disabled={isLoading}
            className="items-center"
          >
            <Text className="text-[12px] font-bold text-gray-400">
              Login Prestador (debug)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleDebugLogin('makenzegomes@gmailcom', 'makenze1234')}
            activeOpacity={0.7}
            disabled={isLoading}
            className="items-center"
          >
            <Text className="text-[12px] font-bold text-gray-400">
              Login Cliente (debug)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="my-8 flex-row items-center">
        <View className="h-[1px] flex-1 bg-gray-200" />
        <Text className="mx-12 text-md font-bold text-gray-500">Ou</Text>
        <View className="h-[1px] flex-1 bg-gray-200" />
      </View>

      <View className="gap-4">
        <TouchableOpacity
          className="flex-row items-center justify-center rounded-full bg-[#F4F4F4] py-5"
          activeOpacity={0.8}
          onPress={handleGoogleSignIn}
          disabled={isLoading}
        >
          <AntDesign name="google" size={27} color="#DB4437" style={{ marginRight: 12 }} />
          <Text className="text-[16px] font-bold text-gray-600">
            Continuar com Google
          </Text>
        </TouchableOpacity>

        {Platform.OS === 'ios' && (
          <TouchableOpacity
            className="flex-row items-center justify-center rounded-full bg-[#F4F4F4] py-5"
            activeOpacity={0.8}
            onPress={handleAppleSignIn}
            disabled={isLoading}
          >
            <AntDesign name='apple' size={27} color="black" style={{ marginRight: 12 }} />
            <Text className="text-[16px] font-bold text-gray-600">
              Continuar com Apple
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View className="flex-1 justify-end pb-8 items-center">
        <TouchableOpacity 
          onPress={async () => {
            await AsyncStorage.clear();
            Alert.alert('Storage Limpo!', 'Feche e reabra o app para ver a splash.', [
              { text: 'OK', onPress: () => router.replace('/') }
            ]);
          }}
          activeOpacity={0.6}
        >
          <View className="flex-row items-center opacity-80">
             <Image 
               source={require('../../../assets/images/splash-icon.png')}
               style={{ width: 160, height: 40, tintColor: '#444444', opacity: 0.4 }}
               resizeMode="contain"
             />
          </View>
        </TouchableOpacity>
      </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
