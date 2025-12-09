import { AntDesign, Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Alert, Image, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { z } from 'zod';
import { GOOGLE_CONFIG } from '../../config/auth.config';
import { useAuthStore } from '../../stores/authStore';

WebBrowser.maybeCompleteAuthSession();

const loginSchema = z.object({
  email: z.string().email("E-mail inválido."),
  password: z.string().min(6, "A palavra passe deve ter no mínimo 6 caracteres."),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signInWithSocial, isLoading } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CONFIG.webClientId,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      // Aqui você normalmente enviaria o authentication.accessToken para seu backend
      // Para simular, vamos pegar os dados do usuário do Google
      fetchUserInfo(authentication?.accessToken);
    }
  }, [response]);

  async function fetchUserInfo(token?: string) {
    if (!token) return;
    try {
      const response = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const user = await response.json();
      await signInWithSocial({
        email: user.email,
        name: user.name,
        id: user.id,
        provider: 'google',
        avatar: user.picture
      });
    } catch (e) {
      Alert.alert('Erro', 'Falha ao conectar com Google');
    }
  }

  const handleGoogleSignIn = () => {
    promptAsync();
  };

  const handleAppleSignIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      
      // O email só vem na primeira vez, então em produção precisa lidar com isso
      const email = credential.email || "apple_user@hidden.com"; 
      const name = credential.fullName?.givenName 
        ? `${credential.fullName.givenName} ${credential.fullName.familyName || ''}`
        : "Usuário Apple";

      await signInWithSocial({
        email: email,
        name: name,
        id: credential.user,
        provider: 'apple'
      });
    } catch (e: any) {
      if (e.code === 'ERR_CANCELED') {
        // Usuário cancelou, não faz nada
      } else {
        Alert.alert('Erro', 'Falha ao conectar com Apple');
      }
    }
  };

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    }
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    try {
      await signIn(data.email, data.password);
    } catch (err) {
      setError('Credenciais inválidas ou erro no servidor.');
    }
  };

  return (
    <View className="flex-1 bg-white px-6 pt-28">
      <StatusBar style="dark" />
      
      <View className="mb-12">
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
                className={`flex-row items-center rounded-2xl px-4 py-6 border-2 ${
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
                className={`flex-row items-center rounded-2xl px-4 py-6 border-2 ${
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

        <TouchableOpacity activeOpacity={0.7}>
          <Text className="text-[14px] font-bold text-gray-900">
            Esqueceu a Palavra Passe?
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="mt-4 rounded-full bg-brand-cyan py-6 flex-row justify-center items-center"
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
      </View>

      <View className="my-8 flex-row items-center">
        <View className="h-[1px] flex-1 bg-gray-200" />
        <Text className="mx-12 text-md font-bold text-gray-500">Ou</Text>
        <View className="h-[1px] flex-1 bg-gray-200" />
      </View>

      <View className="gap-4">
        <TouchableOpacity
          className="flex-row items-center justify-center rounded-full bg-[#F4F4F4] py-6"
          activeOpacity={0.8}
          onPress={handleGoogleSignIn}
          disabled={!request || isLoading}
        >
          <AntDesign name="google" size={27} color="#DB4437" style={{ marginRight: 12 }} />
          <Text className="text-[16px] font-bold text-gray-600">
            Continuar com Google
          </Text>
        </TouchableOpacity>

        {Platform.OS === 'ios' && (
          <TouchableOpacity
            className="flex-row items-center justify-center rounded-full bg-[#F4F4F4] py-6"
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

      <View className="flex-1 justify-end pb-16 items-center">
        <View className="flex-row items-center opacity-80">
           <Image 
             source={require('../../../assets/images/splash-icon.png')}
             style={{ width: 160, height: 40, tintColor: '#444444', opacity: 0.4 }}
             resizeMode="contain"
           />
        </View>
      </View>
    </View>
  );
}
