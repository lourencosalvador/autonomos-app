import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import type { Channel as StreamChannelType } from 'stream-chat';
import { Channel, MessageInput, MessageList, useChatContext } from 'stream-chat-expo';
import { MOCK_USERS } from '../config/auth.config';
import { useAuthStore } from '../stores/authStore';
import { toStreamSafeChannelId, toStreamSafeUserId } from '../utils/stream';
import { useStreamStore } from '../stores/streamStore';

export default function ChatScreen() {
  const router = useRouter();
  const { cid } = useLocalSearchParams<{ cid?: string }>();
  const { user } = useAuthStore();
  const streamReady = useStreamStore((s) => s.ready);
  const { client } = useChatContext();

  const [channel, setChannel] = useState<StreamChannelType | null>(null);

  if (!streamReady) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <StatusBar style="dark" />
        <Text className="text-[18px] font-extrabold text-gray-900">Chat em manutenção</Text>
        <Text className="mt-2 text-[13px] font-bold text-gray-400 text-center">
          O chat está temporariamente indisponível.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.85}
          className="mt-6 h-12 px-6 items-center justify-center rounded-full bg-brand-cyan"
        >
          <Text className="text-[14px] font-extrabold text-white">Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const myId = useMemo(() => {
    if (!user) return null;
    return toStreamSafeUserId(user.id || user.email);
  }, [user]);

  const otherUserId = useMemo(() => {
    if (!user) return null;
    const other = MOCK_USERS.find((u) => u.email !== user.email);
    return other?.email ? toStreamSafeUserId(other.email) : null;
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!user) return;

      try {
        let ch: StreamChannelType;

        if (cid && typeof cid === 'string' && cid.includes(':')) {
          const [type, id] = cid.split(':');
          ch = client.channel(type, id);
        } else {
          // Canal 1:1 determinístico (para evitar duplicados)
          const otherId = otherUserId;
          if (!otherId || !myId) return;
          const members = [myId, otherId].sort();
          const channelId = toStreamSafeChannelId(members.join('--'));
          ch = client.channel('messaging', channelId, { members });
        }

        await ch.watch();
        if (!cancelled) setChannel(ch);
      } catch {
        if (!cancelled) setChannel(null);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [cid, client, otherUserId, user]);

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      <View className="px-6 pt-14 pb-4 bg-white">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-gray-100"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color="#1F2937" />
          </TouchableOpacity>

          <Text className="flex-1 text-center text-[18px] font-bold text-gray-900">
            Chat
          </Text>

          <View className="h-10 w-10" />
        </View>
      </View>

      {!channel ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#00E7FF" />
          <Text className="mt-3 text-[13px] font-bold text-gray-500">Carregando conversa...</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <Channel
            channel={channel}
            // Garante espaço do header para o KeyboardCompatibleView não esconder o input
            keyboardVerticalOffset={96}
            additionalKeyboardAvoidingViewProps={{ style: { flex: 1 } }}
          >
            <MessageList
              EmptyStateIndicator={() => (
                <View className="flex-1 items-center justify-center px-8">
                  <Text className="text-[18px] font-extrabold text-gray-900 text-center">
                    Ainda não há mensagens
                  </Text>
                  <Text className="mt-2 text-[13px] font-bold text-gray-500 text-center">
                    Envie a primeira mensagem para começar a conversa.
                  </Text>
                </View>
              )}
            />
            <MessageInput
              additionalTextInputProps={{
                placeholder: 'Digite sua mensagem',
                placeholderTextColor: '#9CA3AF',
              }}
            />
          </Channel>
        </View>
      )}
    </View>
  );
}
