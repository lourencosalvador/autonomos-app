import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, isLoading } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    try {
      await signIn(email, password);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao fazer login. Tente novamente.');
    }
  };

  return (
    <View className="flex-1 bg-white px-6">
      <StatusBar style="dark" />
      
      <View className="flex-1 justify-center">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mb-6 flex-row items-center"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
          <Text className="ml-2 text-base font-medium text-gray-900">
            Voltar
          </Text>
        </TouchableOpacity>

        <View className="mb-8">
          <Text className="text-3xl font-bold text-gray-900">
            Bem-vindo de volta
          </Text>
          <Text className="mt-2 text-base text-gray-600">
            Entre para continuar
          </Text>
        </View>

        <View className="gap-4">
          <View>
            <Text className="mb-2 text-sm font-medium text-gray-700">
              Email
            </Text>
            <TextInput
              className="rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-base"
              placeholder="seu@email.com"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <View>
            <Text className="mb-2 text-sm font-medium text-gray-700">
              Senha
            </Text>
            <TextInput
              className="rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-base"
              placeholder="••••••••"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity
            className="mt-6 rounded-full bg-brand-cyan py-4"
            activeOpacity={0.8}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text className="text-center text-base font-semibold text-white">
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Text>
          </TouchableOpacity>

          <View className="mt-4 flex-row justify-center gap-2">
            <Text className="text-gray-600">Não tem conta?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/account-type')}>
              <Text className="font-semibold text-brand-cyan">
                Criar conta
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

