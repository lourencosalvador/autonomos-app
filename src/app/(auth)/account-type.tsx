import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MotiView } from 'moti';
import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import type { UserRole } from '../../stores/authStore';
import { useAuthStore } from '../../stores/authStore';

export default function AccountTypeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const [selectedType, setSelectedType] = useState<UserRole | null>(null);
  const setRole = useAuthStore((s) => s.setRole);
  const isLoading = useAuthStore((s) => s.isLoading);

  const handleContinue = () => {
    if (selectedType) {
      // Modo "complete": utilizador já autenticado (Google/Apple) e precisa escolher role.
      if (params.mode === 'complete') {
        setRole(selectedType)
          .then(() => router.replace('/(tabs)/home'))
          .catch(() => {});
        return;
      }

      router.push({ pathname: '/(auth)/register', params: { accountType: selectedType } });
    }
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      
      <View className="flex-1 px-6 pt-28">
        <View className="mb-12 items-center">
          <Text className="text-center text-[28px] font-bold leading-tight text-gray-900">
            Escolha o tipo de conta.
          </Text>
          <Text className="mt-2 text-center text-base text-gray-500">
            Selecione o tipo de conta para ti!
          </Text>
        </View>

        <View className="flex-row gap-4">
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setSelectedType('professional')}
            className={`flex-1 flex-row items-center justify-between rounded-2xl p-4 py-6 ${
              selectedType === 'professional' ? 'bg-gray-50' : 'bg-gray-50'
            }`}
            style={{
               backgroundColor: '#F9FAFB',
            }}
          >
            <View
              className={`h-6 w-6 rounded-full border-2 items-center justify-center ${
                selectedType === 'professional'
                  ? 'border-brand-cyan bg-brand-cyan'
                  : 'border-brand-cyan/20 bg-brand-cyan/10'
              }`}
            >
            </View>

            <Text className="text-base font-medium text-gray-600 ml-3 mr-auto">
              Prestador
            </Text>

            <Ionicons name="briefcase" size={20} color="black" />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setSelectedType('client')}
            className={`flex-1 flex-row items-center justify-between rounded-2xl p-4 py-6 ${
              selectedType === 'client' ? 'bg-gray-50' : 'bg-gray-50'
            }`}
            style={{
               backgroundColor: '#F9FAFB',
            }}
          >
            <View
              className={`h-6 w-6 rounded-full border-2 items-center justify-center ${
                selectedType === 'client'
                   ? 'border-brand-cyan bg-brand-cyan'
                   : 'border-brand-cyan/20 bg-brand-cyan/10'
              }`}
            >
            </View>

            <Text className="text-base font-medium text-gray-600 ml-3 mr-auto">
              Cliente
            </Text>

            <Ionicons name="person" size={20} color="black" />
          </TouchableOpacity>
        </View>
      </View>

      {selectedType && (
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 300 }}
          className="px-6 pb-12"
        >
          <TouchableOpacity
            className="rounded-full bg-brand-cyan py-4"
            activeOpacity={0.8}
            onPress={handleContinue}
            disabled={isLoading}
          >
            <Text className="text-center text-lg font-bold text-white">
              Continuar
            </Text>
          </TouchableOpacity>
        </MotiView>
      )}
    </View>
  );
}
