import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { getRandomPhotos } from '../services/unsplashService';

type NotificationItem = {
  id: string;
  avatar: string;
  title: string;
  subtitle: string;
};

export default function NotificacoesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<NotificationItem[]>([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const photos = await getRandomPhotos(12);
    const data: NotificationItem[] = photos.map((p) => ({
      id: p.id,
      avatar: p.url,
      title: 'Figma ipsum component variant main layer. Scrolling',
      subtitle: 'pencil library draft align. Rectangle editor slice frame.',
    }));
    setItems(data);
    setLoading(false);
  };

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

        <Text className="mt-3 text-[22px] font-extrabold text-gray-900">
          Notificações
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center bg-white">
          <ActivityIndicator size="large" color="#00E7FF" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View className="h-3" />}
          renderItem={({ item }) => (
            <View className="flex-row items-center rounded-2xl bg-gray-100 px-4 py-3">
              <Image
                source={{ uri: item.avatar }}
                className="h-10 w-10 rounded-xl"
                resizeMode="cover"
              />

              <View className="ml-3 flex-1">
                <Text className="text-[11px] font-semibold text-gray-900" numberOfLines={1}>
                  {item.title}
                </Text>
                <Text className="mt-1 text-[10px] text-gray-600" numberOfLines={1}>
                  {item.subtitle}
                </Text>
              </View>

              <TouchableOpacity className="h-10 w-10 items-center justify-center" activeOpacity={0.7}>
                <Ionicons name="ellipsis-vertical" size={18} color="#111827" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}


