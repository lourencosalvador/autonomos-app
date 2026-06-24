import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import type { Channel as StreamChannelType } from 'stream-chat';
import { useChatContext } from 'stream-chat-expo';
import { useAuthStore } from '../../stores/authStore';
import { STREAM_CONFIG } from '../../config/stream.config';
import { toStreamSafeUserId } from '../../utils/stream';
import { EmptyState } from '../../components/EmptyState';
import { useStreamStore } from '../../stores/streamStore';
import { toast } from '../../lib/sonner';

const AvatarFallback = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200';

type TabKey = 'all' | 'unread' | 'groups' | 'archived';
const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'unread', label: 'Não lidas' },
  { key: 'groups', label: 'Grupos' },
  { key: 'archived', label: 'Arquivadas' },
];

function formatTime(d: Date | null) {
  if (!d) return '';
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Ontem';
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
}

function channelInfo(channel: StreamChannelType, myId: string) {
  const members = Object.values(channel.state.members || {}) as any[];
  const isGroup = members.length > 2;
  const other = members.find((m) => m.user?.id !== myId)?.user;
  const name = isGroup ? (channel.data as any)?.name || `Grupo (${members.length})` : other?.name || other?.id || 'Conversa';
  const image = (isGroup ? (channel.data as any)?.image : other?.image) || AvatarFallback;
  const msgs = (channel.state.messages || []) as any[];
  const last = msgs[msgs.length - 1];
  const lastText = last
    ? last.text || (Array.isArray(last.attachments) && last.attachments.length ? '📎 Anexo' : '')
    : 'Sem mensagens ainda';
  const lastAt = last?.created_at ? new Date(last.created_at) : null;
  let unread = 0;
  try {
    unread = channel.countUnread();
  } catch {
    unread = 0;
  }
  return { name, image, lastText, lastAt, unread, isGroup };
}

function MessagesHeaderShell({ title, children }: { title: string; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="px-6 pt-16 pb-3 flex-row items-center justify-between">
        <Text className="text-[28px] font-extrabold text-gray-900">{title}</Text>
        <TouchableOpacity onPress={() => router.push('/notificacoes')} activeOpacity={0.8} className="relative h-11 w-11 items-center justify-center rounded-full bg-gray-100">
          <Ionicons name="notifications-outline" size={22} color="#0F172A" />
          <View className="absolute h-2.5 w-2.5 rounded-full bg-brand-cyan" style={{ top: 9, right: 11, borderWidth: 1.5, borderColor: '#fff' }} />
        </TouchableOpacity>
      </View>
      {children}
    </View>
  );
}

export default function MessagesScreen() {
  const { user } = useAuthStore();
  const streamReady = useStreamStore((s) => s.ready);
  const streamError = useStreamStore((s) => s.error);
  const retryStream = useStreamStore((s) => s.retry);

  if (!STREAM_CONFIG.apiKey) {
    return (
      <MessagesHeaderShell title="Mensagens">
        <EmptyState icon="chatbubble-ellipses-outline" title="Chat em manutenção" description="O chat ainda não está configurado neste ambiente." />
      </MessagesHeaderShell>
    );
  }

  if (STREAM_CONFIG.apiKey && user && streamError) {
    return (
      <MessagesHeaderShell title="Mensagens">
        <EmptyState
          icon="cloud-offline-outline"
          title="Chat indisponível"
          description={streamError || 'Não foi possível conectar ao servidor agora.'}
          actionLabel="Tentar novamente"
          onAction={() => retryStream()}
        />
      </MessagesHeaderShell>
    );
  }

  if (STREAM_CONFIG.apiKey && user && streamReady) {
    return <StreamMessages />;
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="flex-1 items-center justify-center px-6">
        <ActivityIndicator size="large" color="#00E7FF" />
        <Text className="mt-3 text-[13px] font-bold text-gray-500">Conectando no chat...</Text>
        <TouchableOpacity activeOpacity={0.85} onPress={() => retryStream()} className="mt-6 h-11 px-6 items-center justify-center rounded-full bg-brand-cyan">
          <Text className="text-[13px] font-extrabold text-white">Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function StreamMessages() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { client } = useChatContext();

  const streamUserId = useMemo(() => toStreamSafeUserId(user!.id || user!.email), [user]);

  const [channels, setChannels] = useState<StreamChannelType[]>([]);
  const [archived, setArchived] = useState<StreamChannelType[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('all');
  const [query, setQuery] = useState('');
  const [, setTick] = useState(0);
  const debounce = useRef<any>(null);

  const load = async () => {
    try {
      const chans = await client.queryChannels(
        { type: 'messaging', members: { $in: [streamUserId] } } as any,
        [{ last_message_at: -1 }] as any,
        { watch: true, state: true, limit: 30 }
      );
      setChannels(chans);
    } catch {
      // mantém o que já tem
    } finally {
      setLoading(false);
    }
  };

  const loadArchived = async () => {
    try {
      const chans = await client.queryChannels(
        { type: 'messaging', members: { $in: [streamUserId] }, hidden: true } as any,
        [{ last_message_at: -1 }] as any,
        { watch: false, state: true, limit: 30 }
      );
      setArchived(chans);
    } catch {
      setArchived([]);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, streamUserId]);

  // Tempo real: atualiza a lista quando chega/lê mensagem ou (des)arquiva
  useEffect(() => {
    const refresh = () => {
      if (debounce.current) clearTimeout(debounce.current);
      debounce.current = setTimeout(() => {
        load();
        setTick((t) => t + 1);
      }, 250);
    };
    const events = ['message.new', 'notification.message_new', 'notification.mark_read', 'message.read', 'channel.hidden', 'channel.visible'];
    const subs = events.map((e) => client.on(e as any, refresh));
    return () => {
      subs.forEach((s) => s?.unsubscribe?.());
      if (debounce.current) clearTimeout(debounce.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);

  useEffect(() => {
    if (tab === 'archived') loadArchived();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Só conversas com pelo menos 1 mensagem (evita canais vazios/duplicados sem histórico)
  const hasMessages = (ch: StreamChannelType) => ((ch.state.messages?.length || 0) > 0);

  const recents = useMemo(() => channels.filter(hasMessages).slice(0, 10), [channels]);

  const visible = useMemo(() => {
    const base = tab === 'archived' ? archived : channels;
    const q = query.trim().toLowerCase();
    return base.filter((ch) => {
      if (!hasMessages(ch)) return false;
      const info = channelInfo(ch, streamUserId);
      if (tab === 'unread' && info.unread === 0) return false;
      if (tab === 'groups' && !info.isGroup) return false;
      if (q && !info.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [channels, archived, tab, query, streamUserId]);

  const openChat = (ch: StreamChannelType) => router.push({ pathname: '/chat', params: { cid: ch.cid } });

  const ListHeader = (
    <View>
      {/* Recentes */}
      {recents.length > 0 ? (
        <View className="mb-2">
          <Text className="px-6 text-[16px] font-extrabold text-gray-900">Recentes</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 4, gap: 18 }}>
            {recents.map((ch) => {
              const info = channelInfo(ch, streamUserId);
              return (
                <TouchableOpacity key={ch.cid} activeOpacity={0.85} onPress={() => openChat(ch)} className="items-center" style={{ width: 64 }}>
                  <Image source={{ uri: info.image }} style={{ width: 60, height: 60, borderRadius: 30 }} resizeMode="cover" />
                  <Text className="mt-1.5 text-[11px] font-bold text-gray-600" numberOfLines={1}>
                    {info.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {/* Tabs */}
      <View className="mt-2 px-6 flex-row items-center" style={{ gap: 22 }}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <TouchableOpacity key={t.key} activeOpacity={0.8} onPress={() => setTab(t.key)} className="pb-2">
              <Text className="text-[15px]" style={{ color: active ? '#0F172A' : '#9CA3AF', fontWeight: active ? '800' : '600' }}>
                {t.label}
              </Text>
              {active ? <View style={{ height: 3, borderRadius: 2, backgroundColor: '#00E7FF', marginTop: 6 }} /> : null}
            </TouchableOpacity>
          );
        })}
      </View>
      <View className="h-px bg-gray-100 mt-1" />
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      {/* Pesquisa */}
      <View className="px-6 pt-16 pb-3">
        <View className="flex-row items-center rounded-full bg-[#F4F6F8] px-4" style={{ height: 50 }}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Pesquisar conversa..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 ml-2 text-[15px] text-gray-800"
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery('')} activeOpacity={0.8}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#00E7FF" />
          <Text className="mt-3 text-[13px] font-bold text-gray-500">Carregando conversas...</Text>
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.cid}
          ListHeaderComponent={ListHeader}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View className="h-px bg-gray-100 ml-[86px]" />}
          ListEmptyComponent={
            <EmptyState
              icon="chatbubble-ellipses-outline"
              title={tab === 'archived' ? 'Sem conversas arquivadas' : tab === 'unread' ? 'Tudo lido' : tab === 'groups' ? 'Sem grupos' : 'Sem conversas'}
              description={tab === 'all' ? 'Envie a primeira mensagem para começar.' : 'Nada por aqui ainda.'}
            />
          }
          renderItem={({ item }) => {
            const info = channelInfo(item, streamUserId);
            const isArchivedTab = tab === 'archived';
            return (
              <Swipeable
                overshootRight={false}
                renderRightActions={() => (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={async () => {
                      try {
                        if (isArchivedTab) {
                          await (item as any).show?.();
                          toast.success('Conversa restaurada.');
                          loadArchived();
                          load();
                        } else {
                          await (item as any).hide?.();
                          toast.success('Conversa arquivada.');
                          load();
                        }
                      } catch (e: any) {
                        toast.error(e?.message || 'Não foi possível atualizar a conversa.');
                      }
                    }}
                    className="w-24 items-center justify-center"
                    style={{ backgroundColor: isArchivedTab ? '#00A9BA' : '#94A3B8' }}
                  >
                    <Ionicons name={isArchivedTab ? 'arrow-undo-outline' : 'archive-outline'} size={22} color="white" />
                    <Text className="mt-1 text-[11px] font-bold text-white">{isArchivedTab ? 'Restaurar' : 'Arquivar'}</Text>
                  </TouchableOpacity>
                )}
              >
                <TouchableOpacity activeOpacity={0.8} onPress={() => openChat(item)} className="flex-row items-center bg-white px-6 py-3.5">
                  <Image source={{ uri: info.image }} style={{ width: 54, height: 54, borderRadius: 27 }} resizeMode="cover" />
                  <View className="ml-3 flex-1">
                    <Text className="text-[15.5px] font-extrabold text-gray-900" numberOfLines={1}>
                      {info.name}
                    </Text>
                    <Text className={`mt-1 text-[13px] ${info.unread > 0 ? 'font-bold text-gray-700' : 'text-gray-400'}`} numberOfLines={1}>
                      {info.lastText}
                    </Text>
                  </View>
                  <View className="items-end ml-2" style={{ minWidth: 52 }}>
                    <Text className="text-[11.5px] font-bold text-gray-400">{formatTime(info.lastAt)}</Text>
                    {info.unread > 0 ? (
                      <View className="mt-2 items-center justify-center rounded-full" style={{ minWidth: 22, height: 22, paddingHorizontal: 6, backgroundColor: '#00A9BA' }}>
                        <Text className="text-[11px] font-extrabold text-white">{info.unread > 99 ? '99+' : info.unread}</Text>
                      </View>
                    ) : null}
                  </View>
                </TouchableOpacity>
              </Swipeable>
            );
          }}
        />
      )}
    </View>
  );
}
