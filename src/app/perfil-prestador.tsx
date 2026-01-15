import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { EmptyState } from '../components/EmptyState';
import { PortfolioView } from '../components/portfolio/PortfolioView';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { toast } from '../lib/sonner';

const AvatarFallback = { uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200' };

export default function PerfilPrestadorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    providerId?: string;
    serviceName?: string;
    providerName?: string;
    providerJob?: string;
    providerAvatarUrl?: string;
  }>();

  const providerId = String(params.providerId || '').trim();
  const serviceName = String(params.serviceName || '').trim();
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState<{ avg: number; count: number }>({ avg: 0, count: 0 });

  const displayName = String(profile?.name || params.providerName || 'Prestador');
  const displayJob = String(profile?.work_area || params.providerJob || 'Profissional');
  const avatarUrl = String(profile?.avatar_url || params.providerAvatarUrl || '');

  useEffect(() => {
    if (!providerId) return;
    if (!isSupabaseConfigured) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('profiles').select('id, name, avatar_url, work_area').eq('id', providerId).maybeSingle();
        if (error) throw error;
        if (mounted) setProfile(data as any);
      } catch (e: any) {
        toast.error(e?.message || 'Não foi possível carregar o perfil.');
        if (mounted) setProfile(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [providerId]);

  useEffect(() => {
    if (!providerId) return;
    if (!isSupabaseConfigured) return;
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase.from('reviews').select('rating').eq('provider_id', providerId);
        if (error) throw error;
        const list = Array.isArray(data) ? data : [];
        const count = list.length;
        const sum = list.reduce((acc: number, r: any) => acc + Number(r?.rating || 0), 0);
        const avg = count ? sum / count : 0;
        if (mounted) setRating({ avg, count });
      } catch {
        if (mounted) setRating({ avg: 0, count: 0 });
      }
    })();
    return () => {
      mounted = false;
    };
  }, [providerId]);

  const stars = useMemo(() => {
    const full = Math.round(rating.avg);
    return [1, 2, 3, 4, 5].map((i) => i <= full);
  }, [rating.avg]);

  if (!providerId) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <StatusBar style="dark" />
        <EmptyState icon="person-outline" title="Prestador inválido" description="Volte e selecione um prestador." actionLabel="Voltar" onAction={() => router.back()} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />

      <LinearGradient colors={['#012B3D', '#00BBD6', '#F2F4F7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingTop: 64, paddingBottom: 22, paddingHorizontal: 20 }}>
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} className="h-10 w-10 items-center justify-center">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white font-extrabold text-[16px]">Perfil</Text>
          <View className="h-10 w-10" />
        </View>

        <View className="mt-5 flex-row items-center">
          <View className="h-20 w-20 rounded-full border-4 border-white overflow-hidden bg-white">
            <Image source={avatarUrl ? { uri: avatarUrl } : AvatarFallback} className="h-full w-full" resizeMode="cover" />
          </View>
          <View className="ml-4 flex-1">
            <Text className="text-white text-[22px] font-extrabold">{displayName}</Text>
            <Text className="text-white/85 text-[13px] font-bold">{displayJob}</Text>
            <View className="mt-2 flex-row items-center gap-1">
              {stars.map((on, idx) => (
                <Ionicons key={idx} name={on ? 'star' : 'star-outline'} size={14} color={on ? '#FBBF24' : 'rgba(255,255,255,0.7)'} />
              ))}
              <Text className="ml-2 text-white/85 text-[12px] font-bold">
                {rating.count ? `${rating.avg.toFixed(1)} (${rating.count})` : 'Sem avaliações'}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 110 }}>
        <Text className="mt-5 text-[16px] font-extrabold text-gray-900">Publicações</Text>
        <Text className="mt-1 text-[12px] text-gray-400">Estados, destaques e portfólio do prestador.</Text>

        <View className="mt-4">
          <PortfolioView mode="public" providerId={providerId} accentColors={['#034660', '#00E7FF']} />
        </View>

        {loading ? (
          <View className="py-6 items-center justify-center">
            <Text className="text-[12px] font-bold text-gray-500">Carregando...</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 22, paddingHorizontal: 18 }}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            if (!serviceName) return toast.error('Serviço inválido.');
            router.push({
              pathname: '/termos-servico',
              params: {
                serviceName,
                providerId,
                providerName: displayName,
                providerJob: displayJob,
                providerAvatarUrl: avatarUrl || undefined,
              },
            });
          }}
          className="h-12 items-center justify-center rounded-full bg-brand-cyan"
        >
          <Text className="text-[14px] font-extrabold text-white">Termos</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

