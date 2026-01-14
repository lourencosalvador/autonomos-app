import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Image, Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { getRandomPhotos } from '../../services/unsplashService';
import { useAuthStore } from '../../stores/authStore';
import { toast } from '../../lib/sonner';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { EmptyState } from '../../components/EmptyState';

const ProfileImage = require('../../../assets/images/Profile.jpg');

function AnimatedSuccessHeader({
  children,
  roundedBottom,
}: {
  children: React.ReactNode;
  roundedBottom?: boolean;
}) {
  const { width } = useWindowDimensions();

  const shimmerX = useSharedValue(-width);
  const pulse = useSharedValue(0);

  useEffect(() => {
    shimmerX.value = withRepeat(
      withTiming(width, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
      -1,
      false
    );
    pulse.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [pulse, shimmerX, width]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.18, 0.35]),
  }));

  return (
    <View className={`px-6 pt-16 pb-8 overflow-hidden ${roundedBottom ? 'rounded-b-[28px]' : ''}`}>
      {/* Base gradient */}
      <LinearGradient
        colors={['#012B3D', '#00BBD6', '#F2F4F7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Soft cyan glow */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top: -120,
            left: -80,
            right: -80,
            height: 260,
          },
          glowStyle,
        ]}
      >
        <LinearGradient
          colors={['rgba(0,231,255,0.65)', 'rgba(0,231,255,0.10)', 'rgba(255,255,255,0)']}
          start={{ x: 0.1, y: 0.2 }}
          end={{ x: 0.9, y: 0.9 }}
          style={{ flex: 1, borderRadius: 999 }}
        />
      </Animated.View>

      {/* Shimmer highlight */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: Math.max(260, width * 0.6),
            left: 0,
            opacity: 0.7,
          },
          shimmerStyle,
        ]}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.28)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>

      {children}
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const params = useLocalSearchParams<{ tab?: string }>();
  const initialTab = (params.tab || '').toString();

  if (user?.role === 'professional') {
    return <ProfessionalProfile initialTab={initialTab} />;
  }

  return <ClientProfile />;
}

function ClientProfile() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();

  const handleSignOut = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair', 
          style: 'destructive',
          onPress: signOut 
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />
      
      <AnimatedSuccessHeader>
        <View className="flex-row items-start justify-between mb-6">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          <View className="relative h-10 w-10 items-center justify-center">
            <TouchableOpacity
              onPress={() => router.push('/notificacoes')}
              className="relative h-10 w-10 items-center justify-center"
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={26} color="white" />
              <View className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-red-500" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="items-center">
          <View className="h-28 w-28 rounded-full border-4 border-orange-500 overflow-hidden mb-4">
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} className="h-full w-full" resizeMode="cover" />
            ) : (
              <Image source={ProfileImage} className="h-full w-full" resizeMode="cover" />
            )}
          </View>

          <Text className="text-[30px] font-bold text-white">
            {user?.name || 'Marcelo Vica'}
          </Text>
          <Text className="mt-1 text-[15px] text-black/80">
            {user?.email || 'marcelopedrovica@gmail.com'}
          </Text>
        </View>
      </AnimatedSuccessHeader>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          className="mb-4 flex-row items-center justify-between rounded-2xl bg-white p-5 shadow-sm"
          style={{ 
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
          activeOpacity={0.7}
          onPress={() => router.push('/atualizar-informacoes')}
        >
          <View className="flex-row items-center gap-4 flex-1">
            <Ionicons name="person-outline" size={24} color="#9CA3AF" />
            <Text className="text-[16px] text-gray-600">
              Informações Pessoais
            </Text>
          </View>
          <Ionicons name="create-outline" size={20} color="#00E7FF" />
        </TouchableOpacity>

        <TouchableOpacity
          className="mb-4 flex-row items-center justify-between rounded-2xl bg-white p-5 shadow-sm"
          style={{ 
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
          activeOpacity={0.7}
          onPress={() => router.push('/atualizar-senha')}
        >
          <View className="flex-row items-center gap-4 flex-1">
            <Ionicons name="key-outline" size={24} color="#9CA3AF" />
            <Text className="text-[16px] text-gray-600">
              Palavra-Passe
            </Text>
          </View>
          <Ionicons name="create-outline" size={20} color="#00E7FF" />
        </TouchableOpacity>

        <TouchableOpacity
          className="mb-4 flex-row items-center justify-between rounded-2xl bg-white p-5 shadow-sm"
          style={{ 
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
          activeOpacity={0.7}
        >
          <View className="flex-row items-center gap-4 flex-1">
            <Ionicons name="shield-checkmark-outline" size={24} color="#9CA3AF" />
            <Text className="text-[16px] text-gray-600">
              Privacidade
            </Text>
          </View>
          <Ionicons name="create-outline" size={20} color="#00E7FF" />
        </TouchableOpacity>

        <TouchableOpacity
          className="mb-4 flex-row items-center justify-between rounded-2xl bg-white p-5 shadow-sm"
          style={{ 
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
          activeOpacity={0.7}
          onPress={() => router.push('/atualizar-telefone')}
        >
          <View className="flex-row items-center gap-4 flex-1">
            <Ionicons name="phone-portrait-outline" size={24} color="#9CA3AF" />
            <Text className="text-[16px] text-gray-600">
              Número de Telefone
            </Text>
          </View>
          <Ionicons name="create-outline" size={20} color="#00E7FF" />
        </TouchableOpacity>

        <TouchableOpacity
          className="mb-4 flex-row items-center justify-between rounded-2xl bg-white p-5 shadow-sm"
          style={{ 
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
          activeOpacity={0.7}
          onPress={() => router.push('/perguntas-frequentes')}
        >
          <View className="flex-row items-center gap-4 flex-1">
            <Ionicons name="help-circle-outline" size={24} color="#9CA3AF" />
            <Text className="text-[16px] text-gray-600">
              Perguntas Frequentes
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className="mb-8 flex-row items-center justify-between rounded-2xl bg-white p-5 shadow-sm"
          style={{ 
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
          activeOpacity={0.7}
          onPress={handleSignOut}
        >
          <View className="flex-row items-center gap-4 flex-1">
            <Ionicons name="exit-outline" size={24} color="#9CA3AF" />
            <Text className="text-[16px] text-gray-600">
              Sair
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function ProfessionalProfile({ initialTab }: { initialTab?: string }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const [tab, setTab] = useState<'info' | 'portfolio' | 'reviews'>('info');
  const [photos, setPhotos] = useState<string[]>([]);
  const [headerAvatar, setHeaderAvatar] = useState<string | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [autoMsgOpen, setAutoMsgOpen] = useState(false);
  const [autoMsg, setAutoMsg] = useState('');

  useEffect(() => {
    load();
    refreshProfile().catch(() => {});
  }, []);

  useEffect(() => {
    setAutoMsg((user as any)?.autoAcceptMessage || '');
  }, [user?.id]);

  useEffect(() => {
    if (!initialTab) return;
    if (initialTab === 'reviews') setTab('reviews');
    if (initialTab === 'portfolio') setTab('portfolio');
    if (initialTab === 'info') setTab('info');
  }, [initialTab]);

  useEffect(() => {
    if (tab !== 'reviews') return;
    if (!user?.id) return;
    let mounted = true;
    async function run() {
      setReviewsLoading(true);
      try {
        if (!isSupabaseConfigured) {
          if (mounted) setReviews([]);
          return;
        }
        const { data, error } = await supabase
          .from('reviews')
          .select('id, rating, comment, created_at, client_avatar_url, request:requests(service_name, client_name)')
          .eq('provider_id', user.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        if (mounted) setReviews((data as any[]) || []);
      } catch {
        if (mounted) setReviews([]);
      } finally {
        if (mounted) setReviewsLoading(false);
      }
    }
    run();
    return () => {
      mounted = false;
    };
  }, [tab, user?.id]);

  const load = async () => {
    const data = await getRandomPhotos(24);
    const urls = data.map((p) => p.url).filter(Boolean);
    setPhotos(urls);
    setHeaderAvatar(urls[0] || null);
  };

  const handleAddPhotos = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão necessária', 'Permita o acesso à galeria para adicionar fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 10,
      quality: 0.9,
    });

    if (result.canceled) return;

    const uris = result.assets.map((a) => a.uri).filter(Boolean);
    if (!uris.length) return;

    setPhotos((prev) => {
      // Coloca as novas fotos no topo para aparecerem imediatamente no grid
      const merged = [...uris, ...prev];
      return Array.from(new Set(merged));
    });
  };

  const avatarUri = user?.avatar || null;

  const handleChangeAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      toast.error('Permita o acesso à galeria para trocar a foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (result.canceled) return;
    const uri = result.assets?.[0]?.uri;
    if (!uri) return;

    try {
      // Por enquanto salvamos o URI no perfil (persistente no app e sincronizável via Supabase).
      await updateProfile({ avatarUrl: uri });
      toast.success('Foto atualizada.');
    } catch (e: any) {
      toast.error(e?.message || 'Não foi possível atualizar a foto.');
    }
  };

  const categories = useMemo(
    () => [
      { key: 'street', label: 'Street', uri: photos[2] },
      { key: 'works', label: 'Works', uri: photos[3] },
      { key: 'nature', label: 'Nature', uri: photos[4] },
      { key: 'art', label: 'Art', uri: photos[5] },
      { key: 'landscape', label: 'Landscape', uri: photos[6] },
    ],
    [photos]
  );

  const handleSignOut = () => {
    Alert.alert('Sair', 'Tem certeza que deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />

      <AnimatedSuccessHeader roundedBottom>
        <View className="flex-row items-start justify-between">
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} className="h-10 w-10 items-center justify-center">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={() => router.push('/atualizar-informacoes')}
              activeOpacity={0.7}
              className="h-10 w-10 items-center justify-center"
            >
              <Ionicons name="create-outline" size={24} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/notificacoes')}
              activeOpacity={0.7}
              className="relative h-10 w-10 items-center justify-center"
            >
              <Ionicons name="notifications-outline" size={26} color="white" />
              <View className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="mt-4 flex-row items-center">
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleChangeAvatar}
            className="h-20 w-20 rounded-full border-4 border-white overflow-hidden"
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} className="h-full w-full" resizeMode="cover" />
            ) : (
              <Image source={ProfileImage} className="h-full w-full" resizeMode="cover" />
            )}
          </TouchableOpacity>

          <View className="ml-4 flex-1">
            <Text className="text-[26px] font-extrabold text-white">
              {user?.name || 'Edson Santos'}
            </Text>
            <Text className="text-[14px] text-white/85">
              {user?.email || 'edsonsantos@gmail.com'}
            </Text>
            <Text className="text-[14px] text-white/85">
              {user?.role === 'professional' ? 'Fotógrafo' : 'Prestador'}
            </Text>
          </View>
        </View>
      </AnimatedSuccessHeader>

      <View className="flex-1 px-6 pt-5">
        <View className="self-center flex-row rounded-full bg-gray-200 p-1">
          <TouchableOpacity
            onPress={() => setTab('info')}
            activeOpacity={0.85}
            className={`px-6 py-3 rounded-full ${tab === 'info' ? 'bg-brand-cyan' : 'bg-transparent'}`}
          >
            <Text className={`text-[14px] font-bold ${tab === 'info' ? 'text-white' : 'text-gray-500'}`}>
              Informações
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTab('portfolio')}
            activeOpacity={0.85}
            className={`px-6 py-3 rounded-full ${tab === 'portfolio' ? 'bg-brand-cyan' : 'bg-transparent'}`}
          >
            <Text className={`text-[14px] font-bold ${tab === 'portfolio' ? 'text-white' : 'text-gray-500'}`}>
              Portfolio
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTab('reviews')}
            activeOpacity={0.85}
            className={`px-6 py-3 rounded-full ${tab === 'reviews' ? 'bg-brand-cyan' : 'bg-transparent'}`}
          >
            <Text className={`text-[14px] font-bold ${tab === 'reviews' ? 'text-white' : 'text-gray-500'}`}>
              Avaliações
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mt-4 items-center flex-row justify-center gap-1">
          {[1, 1, 1, 1, 0].map((v, idx) => (
            <Ionicons
              key={idx}
              name={v ? 'star' : 'star-outline'}
              size={18}
              color={v ? '#FBBF24' : '#D1D5DB'}
            />
          ))}
        </View>

        {tab === 'info' ? (
          <ScrollView
            className="mt-6 flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            <InfoRow
              icon="person-outline"
              label="Informações Pessoais"
              onPress={() => router.push('/atualizar-informacoes')}
              showEdit
            />
            <InfoRow
              icon="chatbubble-ellipses-outline"
              label="Mensagem padrão (ao aceitar pedido)"
              onPress={() => setAutoMsgOpen(true)}
              showEdit
            />
            <InfoRow icon="key-outline" label="Palavra-Passe" onPress={() => router.push('/atualizar-senha')} showEdit />
            <InfoRow icon="shield-checkmark-outline" label="Privacidade" onPress={() => {}} showEdit />
            <InfoRow icon="phone-portrait-outline" label="Número de Telefone" onPress={() => router.push('/atualizar-telefone')} showEdit />
            <InfoRow icon="help-circle-outline" label="Perguntas Frequentes" onPress={() => router.push('/perguntas-frequentes')} />
            <TouchableOpacity
              onPress={handleSignOut}
              activeOpacity={0.8}
              className="mt-3 flex-row items-center rounded-2xl bg-white px-5 py-5"
            >
              <Ionicons name="exit-outline" size={26} color="#9CA3AF" />
              <Text className="ml-4 text-[16px] text-gray-500">Sair</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : tab === 'portfolio' ? (
          <View className="mt-6 flex-1">
            <FlatList
              data={photos}
              keyExtractor={(uri, idx) => `${uri}-${idx}`}
              numColumns={3}
              removeClippedSubviews={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 140 }}
              columnWrapperStyle={{ gap: 2 }}
              ListHeaderComponent={() => (
                <View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 4, gap: 18 }}
                  >
                    {categories.map((c) => (
                      <View key={c.key} className="items-center">
                        <View className="h-16 w-16 rounded-full overflow-hidden bg-gray-200">
                          <Image
                            source={{ uri: c.uri || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=200' }}
                            className="h-full w-full"
                            resizeMode="cover"
                          />
                        </View>
                        <Text className="mt-3 text-[13px] text-gray-300">{c.label}</Text>
                      </View>
                    ))}
                  </ScrollView>

                  <View className="mt-4 h-px bg-gray-200" />
                  <View style={{ height: 8 }} />
                </View>
              )}
              renderItem={({ item }) => (
                <View style={{ flex: 1, aspectRatio: 1, marginBottom: 2 }}>
                  <Image source={{ uri: item }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                </View>
              )}
            />

            <View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 26,
                alignItems: 'center',
              }}
              pointerEvents="box-none"
            >
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleAddPhotos}
                className="h-20 w-20 items-center justify-center rounded-full bg-white"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.15,
                  shadowRadius: 16,
                  elevation: 6,
                }}
              >
                <Ionicons name="add" size={34} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View className="mt-6 flex-1">
            {reviewsLoading ? (
              <View className="flex-1 items-center justify-center">
                <Text className="text-[13px] font-bold text-gray-500">Carregando avaliações...</Text>
              </View>
            ) : (
              <FlatList
                data={reviews}
                keyExtractor={(it) => String(it.id)}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
                ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                ListEmptyComponent={
                  <EmptyState
                    icon="star-outline"
                    title="Sem avaliações"
                    description="Quando os clientes avaliarem seus serviços, elas aparecem aqui."
                  />
                }
                renderItem={({ item }) => {
                  const rating = Number(item.rating || 0);
                  const req = item.request || {};
                  const serviceName = req.service_name || 'Serviço';
                  const clientName = req.client_name || 'Cliente';
                  const stars = [1, 2, 3, 4, 5];
                  return (
                    <View className="rounded-2xl bg-white px-5 py-4" style={{ borderWidth: 1, borderColor: '#E5E7EB' }}>
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1 pr-3">
                          <Image
                            source={
                              item.client_avatar_url
                                ? { uri: String(item.client_avatar_url) }
                                : ProfileImage
                            }
                            className="h-10 w-10 rounded-full"
                            resizeMode="cover"
                          />
                          <View className="ml-3 flex-1">
                          <Text className="text-[13px] font-extrabold text-gray-900">{serviceName}</Text>
                          <Text className="mt-0.5 text-[11px] font-bold text-gray-400">{clientName}</Text>
                          </View>
                        </View>
                        <View className="flex-row items-center gap-1">
                          {stars.map((s) => (
                            <Ionicons
                              key={s}
                              name={s <= rating ? 'star' : 'star-outline'}
                              size={16}
                              color={s <= rating ? '#FBBF24' : '#D1D5DB'}
                            />
                          ))}
                        </View>
                      </View>
                      {item.comment ? (
                        <Text className="mt-3 text-[12px] leading-5 text-gray-700">{String(item.comment)}</Text>
                      ) : null}
                    </View>
                  );
                }}
              />
            )}
          </View>
        )}
      </View>

      <Modal visible={autoMsgOpen} transparent animationType="fade" onRequestClose={() => setAutoMsgOpen(false)}>
        <Pressable className="flex-1 bg-black/40 px-6" onPress={() => setAutoMsgOpen(false)}>
          <Pressable
            className="mt-40 rounded-3xl bg-white p-5"
            onPress={() => {}}
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.12,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            <Text className="text-[16px] font-extrabold text-gray-900">Mensagem padrão</Text>
            <Text className="mt-1 text-[12px] text-gray-400">
              Enviada automaticamente quando você aceitar um pedido. Use {'{{cliente}}'} e {'{{servico}}'}.
            </Text>

            <View className="mt-4 rounded-2xl bg-gray-100 px-4 py-3">
              <TextInput
                value={autoMsg}
                onChangeText={setAutoMsg}
                placeholder="Ex: Olá {{cliente}}, aceitei o seu pedido de {{servico}}. Vamos combinar os detalhes?"
                placeholderTextColor="#9CA3AF"
                multiline
                textAlignVertical="top"
                className="min-h-[110px] text-[12px] leading-5 text-gray-700"
              />
            </View>

            <View className="mt-5 flex-row gap-3">
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setAutoMsgOpen(false)}
                className="flex-1 h-12 items-center justify-center rounded-full bg-gray-100"
              >
                <Text className="text-[13px] font-extrabold text-gray-700">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={async () => {
                  try {
                    await updateProfile({ autoAcceptMessage: autoMsg.trim() ? autoMsg.trim() : null });
                    toast.success('Mensagem salva.');
                    setAutoMsgOpen(false);
                  } catch (e: any) {
                    toast.error(e?.message || 'Não foi possível salvar.');
                  }
                }}
                className="flex-1 h-12 items-center justify-center rounded-full bg-brand-cyan"
              >
                <Text className="text-[13px] font-extrabold text-white">Salvar</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  onPress,
  showEdit,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  showEdit?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="mb-4 flex-row items-center justify-between rounded-2xl bg-white px-5 py-5"
      style={{
        borderWidth: 1,
        borderColor: '#E5E7EB',
      }}
    >
      <View className="flex-row items-center">
        <Ionicons name={icon} size={26} color="#B8B8B8" />
        <Text className="ml-4 text-[16px] text-gray-500">{label}</Text>
      </View>
      {showEdit ? (
        <Ionicons name="create-outline" size={22} color="#00E7FF" />
      ) : (
        <View />
      )}
    </TouchableOpacity>
  );
}
