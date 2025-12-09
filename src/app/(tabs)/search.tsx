import { View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function SearchScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <StatusBar style="dark" />
      <Text className="text-2xl font-bold text-gray-900">
        Buscar Profissionais
      </Text>
      <Text className="mt-2 text-gray-600">
        Em breve...
      </Text>
    </View>
  );
}

