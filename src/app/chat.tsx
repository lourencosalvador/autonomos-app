import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, ImageBackground, Text, TouchableOpacity, View } from 'react-native';
import type { Channel as StreamChannelType } from 'stream-chat';
import { Channel, MessageInput, MessageList, ThemeProvider, useChatContext } from 'stream-chat-expo';
import { MOCK_USERS } from '../config/auth.config';
import { buildCallRoom, buildJitsiUrl, openCall } from '../lib/call';
import { toast } from '../lib/sonner';
import { useAuthStore } from '../stores/authStore';
import { toStreamSafeChannelId, toStreamSafeUserId } from '../utils/stream';
import { useStreamStore } from '../stores/streamStore';

// Wallpaper criativo padrão do chat (aquarela azul suave — Unsplash).
const CHAT_WALLPAPER = 'https://images.unsplash.com/photo-1628882836842-d5ffd7c7278e?w=800&q=70&auto=format&fit=crop';

// Tema do Stream para um visual moderno estilo WhatsApp (sobre o wallpaper).
const chatTheme = {
  messageList: {
    container: { backgroundColor: 'transparent' as const },
  },
  messageSimple: {
    content: {
      senderMessageBackgroundColor: '#C8F2F9', // minhas mensagens (cyan suave)
      receiverMessageBackgroundColor: '#FFFFFF', // mensagens do outro (branco)
      containerInner: { borderWidth: 0 },
      markdown: { text: { color: '#0F172A', fontSize: 14.5 } },
      metaText: { fontSize: 10.5, color: '#64748B' },
    },
  },
  messageInput: {
    container: { backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#EEF2F7' },
    inputBoxContainer: { backgroundColor: '#F4F6F8', borderColor: '#E5E7EB', borderRadius: 24 },
    inputBox: { color: '#0F172A', fontSize: 14.5 },
  },
};

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || '';
  const b = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (a + b).toUpperCase() || '?';
}

function HeaderAvatar({ uri, name, online }: { uri?: string; name: string; online?: boolean }) {
  return (
    <View>
      {uri ? (
        <Image source={{ uri }} style={{ width: 42, height: 42, borderRadius: 21 }} resizeMode="cover" />
      ) : (
        <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: '#CFFAFE', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#0E7490', fontWeight: '800', fontSize: 15 }}>{initialsOf(name)}</Text>
        </View>
      )}
      {online ? (
        <View style={{ position: 'absolute', right: -1, bottom: -1, width: 13, height: 13, borderRadius: 7, backgroundColor: '#10B981', borderWidth: 2, borderColor: '#fff' }} />
      ) : null}
    </View>
  );
}

export default function ChatScreen() {
  const router = useRouter();
  const { cid, otherUserId: otherUserIdParam, otherUserName, initialMessage, sendKey } = useLocalSearchParams<{
    cid?: string;
    otherUserId?: string;
    otherUserName?: string;
    initialMessage?: string;
    sendKey?: string;
  }>();
  const { user } = useAuthStore();
  const streamReady = useStreamStore((s) => s.ready);
  const { client } = useChatContext();

  const [channel, setChannel] = useState<StreamChannelType | null>(null);
  const [channelError, setChannelError] = useState<string | null>(null);
  const sentRef = useRef<Record<string, boolean>>({});
  const retryKey = useStreamStore((s) => s.retryKey);
  const retryStream = useStreamStore((s) => s.retry);

  const myId = useMemo(() => {
    if (!user) return null;
    return toStreamSafeUserId(user.id || user.email);
  }, [user]);

  const otherUserId = useMemo(() => {
    if (!user) return null;
    const raw = (otherUserIdParam || '').toString().trim();
    if (raw) return toStreamSafeUserId(raw);
    const other = MOCK_USERS.find((u) => u.email !== user.email);
    return other?.email ? toStreamSafeUserId(other.email) : null;
  }, [user, otherUserIdParam]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!user || !streamReady || !client) return;

      try {
        setChannelError(null);
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

        // Timeout simples para não ficar "Carregando..." infinito
        await Promise.race([
          ch.watch(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 12000)),
        ]);
        // Envia primeira mensagem automaticamente (somente se o canal ainda não tiver mensagens)
        const text = (initialMessage || '').toString().trim();
        const key = (sendKey || '').toString().trim();
        if (text && key && !sentRef.current[key]) {
          const hasMessages = (ch.state?.messages?.length || 0) > 0;
          if (!hasMessages) {
            try {
              await ch.sendMessage({ text });
            } catch {}
          }
          sentRef.current[key] = true;
        }
        if (!cancelled) setChannel(ch);
      } catch (e: any) {
        if (!cancelled) {
          setChannel(null);
          const raw = e instanceof Error ? e.message : String(e);
          const msg =
            e instanceof Error && e.message === 'TIMEOUT'
              ? 'Demorou demais para carregar a conversa.'
              : 'Não foi possível carregar a conversa.';
          setChannelError(`${msg}\n\nDetalhes: ${raw}`);
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [cid, client, otherUserId, user, initialMessage, sendKey, retryKey, streamReady, myId]);

  // Inicia uma chamada de voz: cria sala única, envia o convite no chat e abre a chamada.
  const startVoiceCall = async () => {
    if (!channel) return toast.error('Conversa ainda a carregar.');
    try {
      const base = channel.id || [myId, otherUserId].filter(Boolean).join('-');
      const room = buildCallRoom(base);
      const callerName = user?.name || 'Cliente';
      const inviteUrl = buildJitsiUrl(room, { audioOnly: true });
      try {
        await channel.sendMessage({
          text: `📞 Chamada de voz iniciada por ${callerName}.\nToque para entrar: ${inviteUrl}`,
        });
      } catch {}
      await openCall(buildJitsiUrl(room, { audioOnly: true, displayName: callerName }));
    } catch {
      toast.error('Não foi possível iniciar a chamada.');
    }
  };

  // Dados do interlocutor (a partir dos membros do canal) com fallback nos params.
  const peer = useMemo(() => {
    const fallbackName = (otherUserName || '').toString().trim() || 'Conversa';
    if (!channel) return { name: fallbackName, image: undefined as string | undefined, online: false };
    const members = Object.values(channel.state?.members || {}) as any[];
    const other = members.find((m) => m?.user?.id && m.user.id !== myId)?.user;
    return {
      name: (other?.name as string) || fallbackName,
      image: (other?.image as string) || undefined,
      online: !!other?.online,
    };
  }, [channel, myId, otherUserName]);

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

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      {/* Header estilo WhatsApp */}
      <View style={{ paddingTop: 50 }} className="px-3 pb-3 bg-white border-b border-gray-100">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="h-10 w-9 items-center justify-center" activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={26} color="#1F2937" />
          </TouchableOpacity>

          <HeaderAvatar uri={peer.image} name={peer.name} online={peer.online} />

          <View className="ml-3 flex-1">
            <Text numberOfLines={1} className="text-[16px] font-extrabold text-gray-900">
              {peer.name}
            </Text>
            <Text className="text-[11.5px] font-bold" style={{ color: peer.online ? '#10B981' : '#9CA3AF' }}>
              {peer.online ? 'online' : 'toque para conversar'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={startVoiceCall}
            disabled={!channel}
            className="h-10 w-10 items-center justify-center rounded-full bg-cyan-50"
            activeOpacity={0.7}
            style={{ opacity: channel ? 1 : 0.4 }}
          >
            <Ionicons name="call" size={20} color="#00A9BA" />
          </TouchableOpacity>
        </View>
      </View>

      {!channel ? (
        <View className="flex-1 items-center justify-center px-6">
          <ActivityIndicator size="large" color="#00E7FF" />
          <Text className="mt-3 text-[13px] font-bold text-gray-500 text-center">
            {channelError ? channelError : 'Carregando conversa...'}
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => retryStream()}
            className="mt-6 h-11 px-6 items-center justify-center rounded-full bg-brand-cyan"
          >
            <Text className="text-[13px] font-extrabold text-white">Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ImageBackground
          source={{ uri: CHAT_WALLPAPER }}
          resizeMode="cover"
          style={{ flex: 1, backgroundColor: '#EAF7FB' }}
          imageStyle={{ opacity: 0.4 }}
        >
          <ThemeProvider style={chatTheme}>
            <Channel
              channel={channel}
              // Garante espaço do header para o KeyboardCompatibleView não esconder o input
              keyboardVerticalOffset={100}
              additionalKeyboardAvoidingViewProps={{ style: { flex: 1 } }}
            >
              <MessageList
                EmptyStateIndicator={() => (
                  <View className="flex-1 items-center justify-center px-8">
                    <View className="h-16 w-16 items-center justify-center rounded-full bg-white/80">
                      <Ionicons name="chatbubbles-outline" size={30} color="#00A9BA" />
                    </View>
                    <Text className="mt-4 text-[17px] font-extrabold text-gray-900 text-center">
                      Comece a conversar
                    </Text>
                    <Text className="mt-1.5 text-[13px] font-bold text-gray-500 text-center">
                      Envie a primeira mensagem para iniciar a conversa com {peer.name}.
                    </Text>
                  </View>
                )}
              />
              <MessageInput
                additionalTextInputProps={{
                  placeholder: 'Mensagem',
                  placeholderTextColor: '#9CA3AF',
                }}
              />
            </Channel>
          </ThemeProvider>
        </ImageBackground>
      )}
    </View>
  );
}
