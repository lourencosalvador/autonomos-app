import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, FlatList, Image, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import UnionArt from '../../../assets/images/Union.svg';
import { EmptyState } from '../../components/EmptyState';
import { HomeHeader } from '../../components/HomeHeader';
import { PendingReview } from '../../components/PendingReview';
import { PullToRefresh } from '../../components/PullToRefresh';
import { categories } from '../../data/categories';
import { formatKz, services, type Service } from '../../data/services';
import { isSupabaseConfigured, supabase, type PaymentRow, type WithdrawalRow } from '../../lib/supabase';
import { computeWalletBalance, requestRowToPayment } from '../../lib/walletBalance';
import { getRandomPhotos } from '../../services/unsplashService';
import { useAuthStore } from '../../stores/authStore';
import { useRequestsStore } from '../../stores/requestsStore';

type CategoryId =
  | 'casa'
  | 'beleza'
  | 'decoracao'
  | 'cocktail'
  | 'cabeleireiro'
  | 'fitness'
  | 'tecnologia'
  | 'educacao'
  | 'saude'
  | 'outros';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const firstName = user?.name?.split(' ')[0] || 'Usuário';

  if (user?.role === 'professional') {
    // Prestador ainda não aprovado: home mostra o estado "em análise".
    if (user.approvalStatus === 'pending' || user.approvalStatus === 'rejected') {
      return <PendingReview />;
    }
    return <ProfessionalDashboard firstName={firstName} />;
  }

  return <ClientHome firstName={firstName} />;
}

// Normaliza texto para pesquisa (minúsculas, sem acentos).
function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim();
}

// Placeholders mostrados durante o carregamento (skeleton).
const SKELETON_DATA = Array.from({ length: 6 }, (_, i) => ({ id: `sk-${i}` }));

// Mostra a intro de onboarding do prestador só uma vez por sessão.
let onboardingPrompted = false;

function ClientHome({ firstName }: { firstName: string }) {
  const router = useRouter();
  // null = todas as categorias. Tocar numa categoria filtra; tocar de novo limpa.
  const [selectedId, setSelectedId] = useState<CategoryId | null>(null);
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Skeleton no primeiro carregamento (enquanto as imagens remotas chegam).
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setLoading(true);
    // Limpa filtros e dá tempo de a lista/imagens reassentarem (sensação de "atualizado").
    setQuery('');
    setSelectedId(null);
    await new Promise((resolve) => setTimeout(resolve, 1100));
    setLoading(false);
    setRefreshing(false);
  }, []);

  const filtered = useMemo(() => {
    const q = normalize(query);
    return services.filter((service) => {
      if (selectedId && service.category !== selectedId) return false;
      if (!q) return true;
      return normalize(service.name).includes(q) || normalize(service.description).includes(q);
    });
  }, [query, selectedId]);

  const openService = (service: Service) =>
    router.push({ pathname: '/service-providers', params: { serviceName: service.name } });

  const listHeader = (
    <View className="px-4 pt-20">
      <View className="mb-6">
        <HomeHeader
          firstName={firstName}
          onNotificationPress={() => router.push('/notificacoes')}
          onAvatarPress={() => router.push('/(tabs)/profile')}
        />
      </View>

      <View className="mb-6 flex-row items-center rounded-full bg-white px-2 py-2">
        <TextInput
          value={query}
          onChangeText={setQuery}
          className="flex-1 text-[15px] text-gray-700 pl-4"
          placeholder="Pesquisar serviços"
          placeholderTextColor="#9CA3AF"
          returnKeyType="search"
        />
        {query.length > 0 ? (
          <TouchableOpacity onPress={() => setQuery('')} activeOpacity={0.7} className="px-2">
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ) : null}
        <View className="p-4 flex justify-center items-center rounded-full" style={{ backgroundColor: '#00E7FF' }}>
          <Ionicons name="search" size={22} color="#FFFFFF" />
        </View>
      </View>

      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-[17px] font-extrabold text-gray-900">Categorias</Text>
        <Text className="text-[12px] font-bold text-gray-400">Explore por área</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 16, paddingVertical: 6, paddingRight: 8 }}
      >
        {categories.map((category) => {
          const isActive = selectedId === category.id;
          return (
            <TouchableOpacity
              key={category.id}
              className="items-center"
              activeOpacity={0.85}
              // Toca para filtrar; toca na ativa para voltar a ver todos.
              onPress={() => setSelectedId((prev) => (prev === category.id ? null : (category.id as CategoryId)))}
              style={{ width: 68 }}
            >
              <View
                className="mb-2 h-[64px] w-[64px] items-center justify-center rounded-[22px]"
                style={
                  isActive
                    ? {
                        backgroundColor: '#00E7FF',
                        shadowColor: '#00E7FF',
                        shadowOpacity: 0.3,
                        shadowRadius: 22,
                        shadowOffset: { width: 0, height: 10 },
                        elevation: 8,
                      }
                    : { backgroundColor: '#F4F6F8' }
                }
              >
                <category.Icon size={28} color={isActive ? '#FFFFFF' : '#9CA3AF'} strokeWidth={category.stroke} />
              </View>
              <Text
                className="text-[11.5px]"
                numberOfLines={1}
                style={{ color: isActive ? '#0F172A' : '#9CA3AF', fontWeight: isActive ? '800' : '600' }}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View className="mt-7 mb-1 flex-row items-center justify-between">
        <Text className="text-[17px] font-extrabold text-gray-900">
          {selectedId ? categories.find((c) => c.id === selectedId)?.name : 'Todos os serviços'}
        </Text>
        <Text className="text-[12px] font-bold text-gray-400">
          {filtered.length} {filtered.length === 1 ? 'serviço' : 'serviços'}
        </Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      <LinearGradient
        colors={['#A7E8F3', '#E4F8FB', '#FFFFFF']}
        locations={[0, 0.55, 1]}
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 360 }}
      />

      <PullToRefresh
        refreshing={refreshing}
        onRefresh={onRefresh}
        indicatorTop={52}
        data={loading ? SKELETON_DATA : filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={listHeader}
        columnWrapperStyle={{ gap: 14, paddingHorizontal: 16 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListEmptyComponent={
          <View className="px-6 pt-6">
            <EmptyState
              icon="search-outline"
              title="Nenhum serviço encontrado"
              description={query ? `Não encontramos resultados para "${query}".` : 'Tente outra categoria.'}
              actionLabel={query || selectedId ? 'Limpar filtros' : undefined}
              onAction={
                query || selectedId
                  ? () => {
                      setQuery('');
                      setSelectedId(null);
                    }
                  : undefined
              }
            />
          </View>
        }
        renderItem={({ item }) =>
          loading ? (
            <ServiceCardSkeleton />
          ) : (
            <ServiceCard service={item as Service} onPress={() => openService(item as Service)} />
          )
        }
      />
    </View>
  );
}


// Card de serviço (grid da home) — imagem, nome, descrição, preço "A partir de" e avaliação.
function ServiceCard({ service, onPress }: { service: Service; onPress: () => void }) {
  return (
    <View style={{ flex: 1, marginBottom: 14 }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        className="overflow-hidden rounded-3xl bg-white"
        style={{
          shadowColor: '#0F172A',
          shadowOpacity: 0.08,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
          elevation: 3,
        }}
      >
        <Image source={service.image} resizeMode="cover" style={{ width: '100%', height: 116 }} />
        <View className="px-3.5 pb-3.5 pt-3">
          <Text className="text-[14px] font-extrabold text-gray-900" numberOfLines={1}>
            {service.name}
          </Text>
          <Text className="mt-1 text-[10.5px] leading-4 text-gray-400" numberOfLines={2}>
            {service.description}
          </Text>

          <View className="mt-3 flex-row items-end justify-between">
            <View>
              <Text className="text-[9.5px] font-semibold text-gray-400">A partir de</Text>
              <Text className="mt-0.5 text-[15px] font-extrabold text-gray-900">{formatKz(service.priceFrom)}</Text>
            </View>
          </View>

          <View className="mt-2 flex-row items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Ionicons key={i} name="star" size={12} color="#00E7FF" />
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

// Animação de "respiração" (shimmer) para os placeholders do skeleton.
function useShimmer() {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 650, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return opacity;
}

// Card "fantasma" exibido enquanto a lista carrega.
function ServiceCardSkeleton() {
  const opacity = useShimmer();
  const Block = ({ w, h, mt = 0 }: { w: any; h: number; mt?: number }) => (
    <Animated.View style={{ opacity, width: w, height: h, marginTop: mt, borderRadius: 6, backgroundColor: '#E5E7EB' }} />
  );
  return (
    <View style={{ flex: 1, marginBottom: 14 }}>
      <View
        className="overflow-hidden rounded-3xl bg-white"
        style={{
          shadowColor: '#0F172A',
          shadowOpacity: 0.06,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
          elevation: 2,
        }}
      >
        <Animated.View style={{ opacity, width: '100%', height: 116, backgroundColor: '#E5E7EB' }} />
        <View className="px-3.5 pb-3.5 pt-3">
          <Block w="70%" h={14} />
          <Block w="100%" h={10} mt={8} />
          <Block w="85%" h={10} mt={6} />
          <Block w="45%" h={16} mt={14} />
          <Block w="55%" h={12} mt={10} />
        </View>
      </View>
    </View>
  );
}

function ProfessionalDashboard({ firstName }: { firstName: string }) {
  const router = useRouter();
  const { user } = useAuthStore();
  const requests = useRequestsStore((s) => s.requests);
  const deleteRequest = useRequestsStore((s) => s.deleteRequest);
  const [loading, setLoading] = useState(true);
  const [avatars, setAvatars] = useState<{ a: string; b: string; c: string } | null>(null);
  const [latestReview, setLatestReview] = useState<null | { clientName: string; serviceName: string; comment: string | null; rating: number; clientAvatarUrl: string | null }>(null);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletCurrency, setWalletCurrency] = useState('USD');
  const [refreshing, setRefreshing] = useState(false);
  // Incrementa no pull-to-refresh para re-disparar as cargas (avaliações + carteira).
  const [refreshTick, setRefreshTick] = useState(0);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
      setRefreshTick((t) => t + 1);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Onboarding: leva o prestador novo (perfil incompleto) para configurar o perfil.
  // Só dispara quando a coluna existe e está explicitamente false (migração rodada).
  useEffect(() => {
    if (!user || user.role !== 'professional') return;
    if (user.onboardingCompleted !== false) return;
    if (onboardingPrompted) return;
    onboardingPrompted = true;
    router.push('/bem-vindo-prestador');
  }, [user?.id, user?.onboardingCompleted]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const photos = await getRandomPhotos(6);
    setAvatars({
      a: photos[0]?.url || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120',
      b: photos[1]?.url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120',
      c: photos[2]?.url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
    });
    setLoading(false);
  };

  useEffect(() => {
    let mounted = true;
    async function run() {
      setReviewsLoading(true);
      try {
        if (!user?.id || !isSupabaseConfigured) {
          if (mounted) setLatestReview(null);
          return;
        }
        const { data, error } = await supabase
          .from('reviews')
          .select('rating, comment, client_avatar_url, request:requests(service_name, client_name)')
          .eq('provider_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        const req: any = (data as any)?.request || {};
        const ratingNum = Number((data as any)?.rating || 0);
        if (mounted) {
          setLatestReview(
            data
              ? {
                  clientName: String(req.client_name || 'Cliente'),
                  serviceName: String(req.service_name || 'Serviço'),
                  comment: (data as any)?.comment ? String((data as any).comment) : null,
                  rating: Number.isFinite(ratingNum) ? Math.max(1, Math.min(5, ratingNum)) : 0,
                  clientAvatarUrl: (data as any)?.client_avatar_url ? String((data as any).client_avatar_url) : null,
                }
              : null
          );
        }
      } catch {
        if (mounted) setLatestReview(null);
      } finally {
        if (mounted) setReviewsLoading(false);
      }
    }
    run();
    return () => {
      mounted = false;
    };
  }, [user?.id, refreshTick]);

  useEffect(() => {
    let mounted = true;
    async function run() {
      try {
        if (!user?.id || !isSupabaseConfigured) return;
        // Saldo DISPONÍVEL a partir de `requests` (fonte confiável) + withdrawals.
        const { data: reqs } = await supabase
          .from('requests')
          .select('id, price_amount, currency, paid_at, payment_status, escrow_status, provider_net, is_urgent, client_total, status, created_at')
          .eq('provider_id', user.id)
          .eq('payment_status', 'succeeded');
        const { data: withs } = await supabase
          .from('withdrawals')
          .select('*')
          .eq('provider_id', user.id);

        const mapped = ((reqs || []) as any[]).map(requestRowToPayment);
        const bal = computeWalletBalance(mapped as PaymentRow[], (withs || []) as WithdrawalRow[]);
        if (mounted) {
          setWalletBalance(bal.available);
          setWalletCurrency(bal.currency);
        }
      } catch {
        // silêncio
      }
    }
    run();
    return () => {
      mounted = false;
    };
  }, [user?.id, refreshTick]);

  const walletLabel = useMemo(() => {
    return `${walletCurrency} ${(walletBalance / 100).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [walletBalance, walletCurrency]);

  const ratingStars = useMemo(() => {
    const n = latestReview?.rating || 0;
    return [1, 2, 3, 4, 5].map((i) => (i <= n ? 1 : 0));
  }, [latestReview?.rating]);
  const providerRequests = useMemo(() => {
    if (!user) return [];
    // Concluídos saem da lista de "Pedidos Recentes" (ficam no histórico/carteira)
    return requests
      .filter((r) => r.providerId === user.id && r.status !== 'cancelled' && r.status !== 'completed')
      .slice(0, 3);
  }, [requests, user]);
  const statusLabel = useMemo(
    () => ({
      pending: 'Pendente',
      accepted: 'Aceite',
      rejected: 'Rejeitado',
      cancelled: 'Cancelado',
      completed: 'Concluído',
    }),
    []
  );

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      <LinearGradient
        colors={['#A7E8F3', '#E4F8FB', '#FFFFFF']}
        locations={[0, 0.55, 1]}
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 360 }}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#00E7FF']}
            tintColor="#00E7FF"
            progressViewOffset={60}
          />
        }
      >
        <View className="px-6 pt-20">
          <HomeHeader
            firstName={firstName}
            onNotificationPress={() => router.push('/notificacoes')}
            onAvatarPress={() => router.push('/(tabs)/profile')}
          />

          <TouchableOpacity
            activeOpacity={0.9}
            className="mt-6 rounded-3xl overflow-hidden"
            onPress={() => router.push('/carteira')}
          >
            <LinearGradient
              colors={['#034660', '#00E7FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 18, borderRadius: 24 }}
            >
              <View className="flex-row items-start justify-between">
                <View>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-white/90 text-[13px] font-bold">Saldo disponível</Text>
                    <MaterialCommunityIcons name="flash" size={16} color="rgba(255,255,255,0.9)" />
                  </View>
                  <Text className="mt-6 text-white text-[26px] font-extrabold">{walletLabel}</Text>
                  <Text className="mt-2 text-white/80 text-[12px] tracking-widest">**** **** **** 6589</Text>
                </View>

                <View className="items-end">
                  <Image
                    source={require('../../../assets/images/logo-ligth.png')}
                    style={{ width: 90, height: 22, opacity: 0.9 }}
                    resizeMode="contain"
                  />
                </View>
              </View>

              <View className="mt-6 flex-row items-center gap-3">
                <TouchableOpacity
                  activeOpacity={0.85}
                  className="flex-row items-center justify-center rounded-full bg-white/15 px-4 py-2"
                  onPress={(e) => {
                    (e as any)?.stopPropagation?.();
                    router.push('/carteira');
                  }}
                >
                  <Text className="text-white text-[12px] font-bold mr-2">Levantar</Text>
                  <Ionicons name="wallet-outline" size={16} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  className="flex-row items-center justify-center rounded-full bg-white/15 px-4 py-2"
                  onPress={(e) => {
                    (e as any)?.stopPropagation?.();
                    router.push('/historico-servicos');
                  }}
                >
                  <Text className="text-white text-[12px] font-bold mr-2">Histórico</Text>
                  <Ionicons name="time-outline" size={16} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  className="h-10 w-10 items-center justify-center rounded-full bg-white/15"
                >
                  <Ionicons name="scan-outline" size={18} color="white" />
                </TouchableOpacity>
              </View>

              <View className="absolute top-0 -right-14 -z-10 ">
              <UnionArt width={250} height={182} />
            </View>
            </LinearGradient>
          </TouchableOpacity>

          <View className="mt-6 rounded-3xl bg-gray-100 px-5 py-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-[17px] font-extrabold text-gray-900">Avaliações</Text>
                <Text className="mt-1 text-[10px] text-gray-500">
                  As mais recentes avaliações de clientes para si.
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                className="flex-row items-center gap-2"
                onPress={() => router.push({ pathname: '/profile', params: { tab: 'reviews' } })}
              >
                <Text className="text-[13px] font-bold text-gray-900">Ver tudo</Text>
                <View className="h-9 w-9 items-center justify-center rounded-full bg-white">
                  <Ionicons name="arrow-forward" size={18} color="#00E7FF" />
                </View>
              </TouchableOpacity>
            </View>

            {reviewsLoading ? (
              <View className="py-8 items-center justify-center">
                <Text className="text-gray-500 font-bold">Carregando...</Text>
              </View>
            ) : latestReview ? (
              <View className="mt-4 flex-row items-center">
                <Image
                  source={{
                    uri:
                      latestReview.clientAvatarUrl ||
                      avatars?.a ||
                      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120',
                  }}
                  className="h-11 w-11 rounded-full"
                  resizeMode="cover"
                />
                <View className="ml-3 flex-1">
                  <Text className="text-[14px] font-bold text-gray-900">{latestReview.clientName}</Text>
                  <Text className="mt-1 text-[10px] text-gray-500" numberOfLines={1}>
                    {latestReview.comment ? latestReview.comment : `Serviço: ${latestReview.serviceName}`}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1">
                  {ratingStars.map((v, idx) => (
                    <Ionicons
                      key={idx}
                      name={v ? 'star' : 'star-outline'}
                      size={18}
                      color={v ? '#FBBF24' : '#D1D5DB'}
                    />
                  ))}
                </View>
              </View>
            ) : (
              <EmptyState
                size="sm"
                icon="star-outline"
                title="Ainda não tem uma avaliação"
                description="Quando os clientes avaliarem seus serviços, a última aparece aqui."
              />
            )}
          </View>

          <View className="mt-7 flex-row items-center justify-between">
            <Text className="text-[18px] font-extrabold text-gray-900">Pedidos Recentes</Text>
            <Text className="text-[15px] font-bold text-gray-900">Ver tudo</Text>
          </View>

          <View className="mt-4 rounded-3xl bg-gray-100 overflow-hidden">
            {loading ? (
              <View className="py-10 items-center justify-center">
                <Text className="text-gray-500 font-bold">Carregando...</Text>
              </View>
            ) : (
              <>
                {providerRequests.length ? (
                  providerRequests.map((r, idx) => (
                    <View key={r.id}>
                      <Swipeable
                        overshootLeft={false}
                        overshootRight={false}
                        renderRightActions={() => (
                          <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() => {
                              Alert.alert('Apagar pedido', 'Deseja apagar este pedido?', [
                                { text: 'Cancelar', style: 'cancel' },
                                { text: 'Apagar', style: 'destructive', onPress: () => deleteRequest(r.id) },
                              ]);
                            }}
                            className="w-24 items-center justify-center bg-red-500"
                          >
                            <Ionicons name="trash-outline" size={22} color="white" />
                            <Text className="mt-1 text-[11px] font-bold text-white">Apagar</Text>
                          </TouchableOpacity>
                        )}
                      >
                        <RecentRow
                          avatar={r.clientAvatarUrl || (idx === 0 ? avatars?.a : idx === 1 ? avatars?.b : avatars?.c)}
                          name={r.clientName}
                          subtitle={`${r.serviceName} • ${statusLabel[(((r as any).status || 'pending') as keyof typeof statusLabel)]}`}
                          onPress={() =>
                            router.push({
                              pathname: '/request-details',
                              params: { requestId: r.id },
                            })
                          }
                        />
                      </Swipeable>
                      {idx < providerRequests.length - 1 ? <View className="h-px bg-gray-200 mx-5" /> : null}
                    </View>
                  ))
                ) : (
                  <EmptyState
                    size="sm"
                    icon="clipboard-outline"
                    title="Ainda não há pedidos"
                    description="Quando um cliente enviar um pedido, ele aparece aqui."
                  />
                )}
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function RecentRow({
  avatar,
  name,
  subtitle,
  onPress,
}: {
  avatar?: string;
  name: string;
  subtitle?: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity activeOpacity={0.8} className="flex-row items-center px-5 py-4" onPress={onPress}>
      <Image
        source={{ uri: avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120' }}
        className="h-14 w-14 rounded-full"
        resizeMode="cover"
      />
      <View className="ml-4 flex-1">
        <Text className="text-[14px] font-extrabold text-gray-900">{name}</Text>
        <Text className="mt-1 text-[10px] text-gray-500" numberOfLines={2}>
          {subtitle || 'Figma ipsum component variant main layer. Scrolling pencil library draft align. Rectangle editor slice frame flatten union image blur flows.'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );
}


/*
 * Banner promocional antigo (3 cards "Encontre o profissional certo em minutos")
 * e as seções por categoria foram comentados/removidos: a home agora lista todos
 * os serviços num grid com preço e filtra por pesquisa + categoria. O histórico
 * completo deste código fica disponível no git, caso seja preciso reativar.
 */