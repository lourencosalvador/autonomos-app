import { View, Text, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../../stores/authStore';

export default function ProfileScreen() {
  const { user } = useAuthStore();

  return (
    <ScrollView className="flex-1 bg-white">
      <StatusBar style="dark" />
      
      <View className="px-6 pt-16">
        <Text className="mb-8 text-2xl font-bold text-gray-900">
          Perfil
        </Text>

        <View className="gap-4">
          <View className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <Text className="mb-1 text-sm font-medium text-gray-500">
              Nome
            </Text>
            <Text className="text-base font-semibold text-gray-900">
              {user?.name}
            </Text>
          </View>

          <View className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <Text className="mb-1 text-sm font-medium text-gray-500">
              Email
            </Text>
            <Text className="text-base font-semibold text-gray-900">
              {user?.email}
            </Text>
          </View>

          <View className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <Text className="mb-1 text-sm font-medium text-gray-500">
              Tipo de conta
            </Text>
            <Text className="text-base font-semibold capitalize text-gray-900">
              {user?.role === 'client' ? 'Cliente' : 'Profissional'}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

