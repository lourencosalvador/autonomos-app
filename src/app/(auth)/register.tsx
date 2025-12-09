import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore, UserRole } from '../../stores/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ accountType?: UserRole }>();
  const { signUp, isLoading } = useAuthStore();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('client');

  useEffect(() => {
    if (params.accountType) {
      setRole(params.accountType);
    }
  }, [params.accountType]);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    try {
      await signUp(name, email, password, role);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao criar conta. Tente novamente.');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView className="flex-1 bg-white">
        <StatusBar style="dark" />
      
      <View className="flex-1 px-6 pt-16">
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
            Criar Conta
          </Text>
          <Text className="mt-2 text-base text-gray-600">
            Preencha seus dados para começar como{' '}
            <Text className="font-semibold text-brand-cyan">
              {role === 'client' ? 'Cliente' : 'Prestador'}
            </Text>
          </Text>
        </View>

        <View className="gap-4">
          <View>
            <Text className="mb-2 text-sm font-medium text-gray-700">
              Nome completo
            </Text>
            <TextInput
              className="rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-base"
              placeholder="João Silva"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
              editable={!isLoading}
            />
          </View>

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

          <View className="rounded-2xl border-2 border-brand-cyan/20 bg-brand-cyan/5 p-4">
            <View className="flex-row items-center">
              <View className="mr-3 h-12 w-12 items-center justify-center rounded-xl bg-brand-cyan">
                <Ionicons 
                  name={role === 'professional' ? 'briefcase' : 'person'} 
                  size={24} 
                  color="white"
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-medium text-gray-600">
                  Tipo de conta
                </Text>
                <Text className="text-lg font-bold text-gray-900">
                  {role === 'client' ? 'Cliente' : 'Prestador'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.back()}
                className="rounded-lg bg-gray-100 px-3 py-2"
              >
                <Text className="text-xs font-medium text-gray-700">
                  Alterar
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            className="mt-6 rounded-full bg-brand-cyan py-4"
            activeOpacity={0.8}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text className="text-center text-base font-semibold text-white">
              {isLoading ? 'Criando conta...' : 'Criar Conta'}
            </Text>
          </TouchableOpacity>

          <View className="mb-8 mt-4 flex-row justify-center gap-2">
            <Text className="text-gray-600">Já tem conta?</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="font-semibold text-brand-cyan">
                Fazer login
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      </ScrollView>
    </TouchableWithoutFeedback>
  );
}
