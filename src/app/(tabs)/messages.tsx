import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Check, Trash2 } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { getRandomPhotos } from '../../services/unsplashService';
import { useAuthStore } from '../../stores/authStore';
import { STREAM_CONFIG } from '../../config/stream.config';
import { ChannelList, useChatContext } from 'stream-chat-expo';
import { toStreamSafeChannelId, toStreamSafeUserId } from '../../utils/stream';
import { MOCK_USERS } from '../../config/auth.config';
import { EmptyState } from '../../components/EmptyState';
import { useStreamStore } from '../../stores/streamStore';

interface Message {
  id: string;
  avatar: string;
  text: string;
  author: string;
  read: boolean;
}

export default function MessagesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const streamReady = useStreamStore((s) => s.ready);

  if (STREAM_CONFIG.apiKey && user && streamReady) {
    return <StreamMessages />;
  }

  return <LegacyMessages />;
}

function StreamMessages() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { client } = useChatContext();

  if (!user) return null;
  const streamUserId = toStreamSafeUserId(user.id || user.email);

  // Demo: garante que exista pelo menos 1 canal 1:1 (Cliente ↔ Prestador) para aparecer na lista
  useEffect(() => {
    const other = MOCK_USERS.find((u) => u.email !== user.email);
    if (!other) return;
    const otherId = toStreamSafeUserId(other.email);
    const members = [streamUserId, otherId].sort();
    const channelId = toStreamSafeChannelId(members.join('--'));
    const ch = client.channel('messaging', channelId, { members });
    ch.watch().catch(() => {});
  }, [client, streamUserId, user.email]);

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      <View className="px-6 pt-16 pb-5">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>

          <Text className="flex-1 text-center text-[22.5px] font-bold text-gray-900">
            Mensagens
          </Text>

          <TouchableOpacity
            onPress={() => router.push('/notificacoes')}
            activeOpacity={0.7}
            className="relative h-10 w-10 items-center justify-center"
          >
            <Ionicons name="notifications-outline" size={26} color="#1F2937" />
            <View className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-brand-cyan" />
          </TouchableOpacity>
        </View>
      </View>

      <ChannelList
        filters={{ members: { $in: [streamUserId] } }}
        sort={{ last_message_at: -1 }}
        onSelect={(channel) => {
          router.push({
            pathname: '/chat',
            params: { cid: channel.cid },
          });
        }}
        // A UI do Stream já inclui presença, typing, etc.
        // Aqui mantemos o layout do header do app e deixamos a lista pronta do Stream.
        ListEmptyComponent={() => (
          <EmptyState
            icon="chatbubble-ellipses-outline"
            title="Sem conversas"
            description="Envie a primeira mensagem para começar."
          />
        )}
      />
    </View>
  );
}

function LegacyMessages() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const swipeableRefs = useRef(new Map()).current;

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    setLoading(true);
    const photos = await getRandomPhotos(10);

    const mockMessages = photos.map((photo, index) => ({
      id: photo.id,
      avatar: photo.url,
      text: 'Figma ipsum component variant main layer. Scrolling pencil library draft align. Rectangle editor slice frame flatten union image blur flows.',
      author: photo.author,
      read: index % 3 === 0,
    }));

    setMessages(mockMessages);
    setLoading(false);
  };

  const handleDelete = (id: string) => {
    const ref = swipeableRefs.get(id);
    if (ref) ref.close();
    setTimeout(() => {
      setMessages(prev => prev.filter(msg => msg.id !== id));
    }, 200);
  };

  const handleMarkAsRead = (id: string) => {
    const ref = swipeableRefs.get(id);
    if (ref) ref.close();
    setMessages(prev =>
      prev.map(msg => (msg.id === id ? { ...msg, read: true } : msg))
    );
  };

  const renderRightActions = (item: Message) => (progress: any, dragX: any) => {
    const trans = dragX.interpolate({
      inputRange: [-160, 0],
      outputRange: [0, 160],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={{
          transform: [{ translateX: trans }],
          flexDirection: 'row',
        }}
      >
        <TouchableOpacity
          className="h-full w-20 items-center justify-center bg-gray-400"
          onPress={() => handleMarkAsRead(item.id)}
          activeOpacity={0.8}
        >
          <Check size={24} color="white" strokeWidth={2.5} />
          <Text className="mt-1 text-xs font-bold text-white">Lida</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="h-full w-20 items-center justify-center bg-brand-cyan"
          onPress={() => handleDelete(item.id)}
          activeOpacity={0.8}
        >
          <Trash2 size={24} color="white" strokeWidth={2.5} />
          <Text className="mt-1 text-xs font-bold text-white">Deletar</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#00E7FF" />
      </View>
    );
  }

  if (user?.role === 'professional') {
    return (
      <View className="flex-1 bg-white">
        <StatusBar style="dark" />

        <View className="px-6 pt-16 pb-4">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => router.back()}
              className="h-10 w-10 items-center justify-center"
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>

            <Text className="flex-1 text-center text-[28px] font-bold text-gray-900">
              Mensagens
            </Text>

          <TouchableOpacity
            onPress={() => router.push('/notificacoes')}
            activeOpacity={0.7}
            className="relative h-10 w-10 items-center justify-center"
          >
              <Ionicons name="notifications-outline" size={26} color="#1F2937" />
              <View className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-brand-cyan" />
          </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View className="h-px bg-gray-200 my-4" />}
        ListEmptyComponent={
          <EmptyState
            icon="chatbubble-ellipses-outline"
            title="Sem mensagens"
            description="Quando receber mensagens, elas aparecem aqui."
          />
        }
          renderItem={({ item }) => (
            <View className="flex-row items-start bg-white">
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/chat',
                    params: { name: item.author, role: 'Profissional', avatar: item.avatar },
                  })
                }
                activeOpacity={0.7}
                className="flex-1 flex-row"
              >
                <Image
                  source={{ uri: item.avatar }}
                  className="h-14 w-14 rounded-full"
                  resizeMode="cover"
                />
                <View className="ml-4 flex-1 pr-4">
                  <Text
                    className={`text-[13px] leading-5 ${
                      item.read ? 'text-gray-600' : 'text-gray-900 font-semibold'
                    }`}
                    numberOfLines={3}
                  >
                    {item.text}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleDelete(item.id)}
                activeOpacity={0.8}
                className="h-10 w-10 items-center justify-center"
              >
                <Ionicons name="trash" size={18} color="#00E7FF" />
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    );
  }

  return (
    <GestureHandlerRootView className="flex-1">
      <View className="flex-1 bg-white">
        <StatusBar style="dark" />

        <View className="px-6 pt-16 pb-5">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => router.back()}
              className="h-10 w-10 items-center justify-center"
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>

            <Text className="flex-1 text-center text-[22.5px] font-bold text-gray-900">
              Mensagens
            </Text>

            <TouchableOpacity
              onPress={() => router.push('/notificacoes')}
              activeOpacity={0.7}
              className="relative h-10 w-10 items-center justify-center"
            >
              <Ionicons name="notifications-outline" size={26} color="#1F2937" />
              <View className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-brand-cyan" />
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24 }}
          ItemSeparatorComponent={() => <View className="h-px bg-gray-200 my-4" />}
          ListEmptyComponent={
            <EmptyState
              icon="chatbubble-ellipses-outline"
              title="Sem mensagens"
              description="Quando receber mensagens, elas aparecem aqui."
            />
          }
          renderItem={({ item }) => (
            <Swipeable
              ref={(ref) => {
                if (ref) swipeableRefs.set(item.id, ref);
              }}
              renderRightActions={renderRightActions(item)}
              overshootRight={false}
              friction={2}
            >
              <TouchableOpacity
                onPress={() => router.push({
                  pathname: '/chat',
                  params: { 
                    name: item.author, 
                    role: 'Profissional',
                    avatar: item.avatar 
                  }
                })}
                activeOpacity={0.7}
              >
              <View className="flex-row items-center gap-4 bg-white py-2">
                  <Image
                    source={{ uri: item.avatar }}
                    className="h-16 w-16 rounded-full"
                    resizeMode="cover"
                  />

                  <View className="flex-1">
                    <Text
                      className={`text-[15px] ${item.read ? 'text-gray-500' : 'text-gray-900 font-medium'}`}
                      numberOfLines={3}
                    >
                      {item.text}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </Swipeable>
          )}
        />
      </View>
    </GestureHandlerRootView>
  );
}
