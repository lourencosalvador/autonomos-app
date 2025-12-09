import { View, Text, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../../stores/authStore';

export default function HomeScreen() {
  const { user, signOut } = useAuthStore();

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      
      <View className="px-6 pt-16">
        <View className="mb-8">
          <Text className="text-2xl font-bold text-gray-900">
            Olá, {user?.name}! 👋
          </Text>
          <Text className="mt-2 text-base text-gray-600">
            Bem-vindo ao Autonomos
          </Text>
        </View>

        <View className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
          <Text className="mb-2 text-sm font-medium text-gray-500">
            Tipo de conta
          </Text>
          <Text className="text-xl font-bold capitalize text-gray-900">
            {user?.role === 'client' ? 'Cliente' : 'Profissional'}
          </Text>
        </View>

        <TouchableOpacity
          className="mt-8 rounded-full border-2 border-red-500 py-4"
          activeOpacity={0.8}
          onPress={signOut}
        >
          <Text className="text-center text-base font-semibold text-red-500">
            Sair
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

