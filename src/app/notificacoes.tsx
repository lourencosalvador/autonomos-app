import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text, TouchableOpacity, View } from 'react-native';
import { EmptyState } from '../components/EmptyState';

export default function NotificacoesScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      <View className="px-6 pt-16 pb-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>

        <Text className="mt-3 text-[22px] font-extrabold text-gray-900">Notificações</Text>
      </View>

      <View className="flex-1 items-center justify-center">
        <EmptyState
          icon="notifications-outline"
          title="Sem notificações"
          description="Quando houver novidades sobre os teus pedidos e pagamentos, elas aparecem aqui."
        />
      </View>
    </View>
  );
}
