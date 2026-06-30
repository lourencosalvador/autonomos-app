import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { CatalogView } from '../components/catalog/CatalogView';
import { EmptyState } from '../components/EmptyState';
import { PortfolioView } from '../components/portfolio/PortfolioView';
import { formatKz, services } from '../data/services';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { toast } from '../lib/sonner';
import { useAuthStore } from '../stores/authStore';
import { useRequestsStore } from '../stores/requestsStore';

const HERO_FALLBACK = 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=900';
const AvatarFallback = { uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200' };

function titleCase(s: string) {
  return s
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(' ');
}

function normalizeName(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim();
}

/** Preço inicial (Kz) do serviço a partir do catálogo, casando pelo nome. */
function servicePriceFor(serviceName: string): number | null {
  const n = normalizeName(serviceName);
  if (!n) return null;
  const found =
    services.find((s) => normalizeName(s.name) === n) ||
    services.find((s) => normalizeName(s.name).includes(n) || n.includes(normalizeName(s.name)));
  return found?.priceFrom ?? null;
}

// Disponibilidade: domingo primeiro, como no design.
const DAY_ORDER = [7, 1, 2, 3, 4, 5, 6];
const DAY_NAMES: Record<number, string> = {
  1: 'Segunda-feira',
  2: 'Terça-feira',
  3: 'Quarta-feira',
  4: 'Quinta-feira',
  5: 'Sexta-feira',
  6: 'Sábado',
  7: 'Domingo',
};

function AvailabilitySection({ availability }: { availability?: { days?: number[]; start?: string; end?: string } | null }) {
  const [open, setOpen] = useState(true);
  const days = Array.isArray(availability?.days) ? (availability!.days as number[]) : [];
  const start = availability?.start || '09:00';
  const end = availability?.end || '17:00';

  return (
    <View>
      <TouchableOpacity activeOpacity={0.7} onPress={() => setOpen((v) => !v)} className="flex-row items-center justify-between">
        <Text className="text-[16px] font-extrabold text-gray-900">Disponibilidade</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color="#9CA3AF" />
      </TouchableOpacity>

      {days.length === 0 ? (
        <Text className="mt-2 text-[12px] text-gray-400">Horário ainda não definido pelo prestador.</Text>
      ) : open ? (
        <View className="mt-3 rounded-2xl bg-gray-50 px-4" style={{ borderWidth: 1, borderColor: '#EEF2F7' }}>
          {DAY_ORDER.map((n, i) => {
            const available = days.includes(n);
            return (
              <View
                key={n}
                className="flex-row items-center justify-between py-3"
                style={i < DAY_ORDER.length - 1 ? { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' } : undefined}
              >
                <Text className="text-[13px] font-bold text-gray-700">{DAY_NAMES[n]}</Text>
                <Text className="text-[13px] font-extrabold" style={{ color: available ? '#0F172A' : '#EF4444' }}>
                  {available ? `${start} - ${end}` : 'Fechado'}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

export default function PerfilPrestadorScreen() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const HERO_H = Math.round(height * 0.5);

  const params = useLocalSearchParams<{
    providerId?: string;
    serviceName?: string;
    providerName?: string;
    providerJob?: string;
    providerAvatarUrl?: string;
  }>();

  const providerId = String(params.providerId || '').trim();
  const serviceName = String(params.serviceName || '').trim();

  const user = useAuthStore((s) => s.user);
  const requests = useRequestsStore((s) => s.requests);
  const fetchRequests = useRequestsStore((s) => s.fetchRequests);

  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState<{ avg: number; count: number }>({ avg: 0, count: 0 });
  const [descExpanded, setDescExpanded] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const [portfolioY, setPortfolioY] = useState(0);

  const displayName = String(profile?.name || params.providerName || 'Prestador');
  const displayJob = String(profile?.work_area || params.providerJob || 'Profissional');
  // Avatar estável: prioriza o que veio por params (disponível na hora) pra não trocar a imagem.
  const avatarUrl = String(params.providerAvatarUrl || profile?.avatar_url || '');
  const heroSource = avatarUrl || HERO_FALLBACK;

  const title = serviceName ? titleCase(serviceName) : displayName;
  const description = useMemo(
    () =>
      `${displayName} é um(a) profissional de ${displayJob.toLowerCase()} na plataforma Autonomos. ` +
      `Confira os trabalhos no portfólio abaixo${serviceName ? ` e combine os detalhes do serviço de ${serviceName.toLowerCase()}` : ''} ` +
      `diretamente pela mensagem. Qualidade, pontualidade e segurança no pagamento garantidos pelo Escrow da Autonomos.`,
    [displayName, displayJob, serviceName]
  );

  const priceFrom = useMemo(() => servicePriceFor(serviceName), [serviceName]);
  const priceLabel = priceFrom != null ? `A partir de ${formatKz(priceFrom)}` : 'A combinar';

  // Pedido em andamento (pendente/aceite) deste cliente com este prestador para este serviço.
  // Enquanto existir, escondemos o "Solicitar serviço" e oferecemos "Ver pedido".
  const activeRequest = useMemo(() => {
    if (!user?.id || user.role !== 'client') return null;
    return (
      requests
        .filter(
          (r) =>
            r.clientId === user.id &&
            r.providerId === providerId &&
            normalizeName(r.serviceName) === normalizeName(serviceName) &&
            (r.status === 'pending' || r.status === 'accepted')
        )
        .sort((a, b) => {
          const ta = Date.parse(a.createdAt);
          const tb = Date.parse(b.createdAt);
          if (Number.isFinite(ta) && Number.isFinite(tb)) return tb - ta;
          return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
        })[0] || null
    );
  }, [requests, user?.id, user?.role, providerId, serviceName]);

  useEffect(() => {
    if (!providerId || !isSupabaseConfigured) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('profiles').select('id, name, avatar_url, work_area, availability').eq('id', providerId).maybeSingle();
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
    if (!providerId || !isSupabaseConfigured) return;
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase.from('reviews').select('rating').eq('provider_id', providerId);
        if (error) throw error;
        const list = Array.isArray(data) ? data : [];
        const count = list.length;
        const sum = list.reduce((acc: number, r: any) => acc + Number(r?.rating || 0), 0);
        if (mounted) setRating({ avg: count ? sum / count : 0, count });
      } catch {
        if (mounted) setRating({ avg: 0, count: 0 });
      }
    })();
    return () => {
      mounted = false;
    };
  }, [providerId]);

  // Mantém o estado do pedido atualizado ao focar (ex.: voltar do detalhe do pedido).
  useFocusEffect(
    useCallback(() => {
      if (user?.id) fetchRequests(user.id).catch(() => {});
    }, [fetchRequests, user?.id])
  );

  const openRequest = () => {
    if (activeRequest) router.push({ pathname: '/request-details', params: { requestId: activeRequest.id } });
  };

  const startRequest = () => {
    if (!serviceName) return toast.error('Abra a partir de um serviço para solicitar.');
    router.push({
      pathname: '/termos-servico',
      params: { serviceName, providerId, providerName: displayName, providerJob: displayJob, providerAvatarUrl: avatarUrl || undefined },
    });
  };

  const goToPortfolio = () => scrollRef.current?.scrollTo({ y: Math.max(0, portfolioY - 24), animated: true });

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

      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }} bounces={false}>
        {/* HERO — uma única imagem (avatar do prestador), sem troca */}
        <View style={{ height: HERO_H, width: '100%', backgroundColor: '#E5E7EB' }}>
          <Image source={{ uri: heroSource }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          <LinearGradient colors={['rgba(0,0,0,0.45)', 'transparent']} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 130 }} />

          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingTop: 56, paddingHorizontal: 18 }} className="flex-row items-center justify-between">
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8} className="h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.30)' }}>
              <Ionicons name="chevron-back" size={22} color="white" />
            </TouchableOpacity>
            <Text className="text-white font-extrabold text-[15px] tracking-wider">DETALHES DO PERFIL</Text>
            <View className="h-11 w-11" />
          </View>

          <TouchableOpacity onPress={goToPortfolio} activeOpacity={0.85} style={{ position: 'absolute', right: 18, bottom: 34 }}>
            <View className="h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.85)' }}>
              <Ionicons name="images-outline" size={20} color="#034660" />
            </View>
          </TouchableOpacity>
        </View>

        {/* SHEET */}
        <View className="rounded-t-[28px] bg-white px-5 pt-5" style={{ marginTop: -26 }}>
          <Text className="text-[12px] font-bold text-gray-400">{displayJob}</Text>

          <View className="mt-1 flex-row items-start justify-between">
            <Text className="flex-1 pr-3 text-[24px] font-extrabold text-gray-900" numberOfLines={2}>
              {title}
            </Text>
            <View className="items-end">
              <Text className="text-[12px] font-bold text-gray-400">Preço</Text>
              <Text className="text-[18px] font-extrabold text-brand-cyan">{priceLabel}</Text>
            </View>
          </View>

          <View className="mt-3 flex-row items-center">
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="star" size={16} color="#FBBF24" />
              <Text className="text-[14px] font-extrabold text-gray-900">{rating.count ? rating.avg.toFixed(1) : '—'}</Text>
              <Text className="text-[13px] font-bold text-gray-400">| {rating.count} avaliações</Text>
            </View>
          </View>

          <View className="mt-4 flex-row items-center rounded-2xl bg-gray-50 px-3.5 py-3" style={{ borderWidth: 1, borderColor: '#EEF2F7' }}>
            <Image source={avatarUrl ? { uri: avatarUrl } : AvatarFallback} className="h-11 w-11 rounded-full" resizeMode="cover" />
            <View className="ml-3 flex-1">
              <View className="flex-row items-center gap-1">
                <Text className="text-[14px] font-extrabold text-gray-900" numberOfLines={1}>
                  {displayName}
                </Text>
                <Ionicons name="checkmark-circle" size={15} color="#3897F0" />
              </View>
              <Text className="text-[11.5px] font-bold text-gray-400" numberOfLines={1}>
                {displayJob}
              </Text>
            </View>
            <TouchableOpacity onPress={goToPortfolio} activeOpacity={0.85} className="rounded-full px-4 py-2" style={{ backgroundColor: '#CFFAFE' }}>
              <Text className="text-[12px] font-extrabold text-cyan-800">Ver trabalhos</Text>
            </TouchableOpacity>
          </View>

          <Text className="mt-6 text-[16px] font-extrabold text-gray-900">Sobre o prestador</Text>
          <Text className="mt-2 text-[13px] leading-5 text-gray-500" numberOfLines={descExpanded ? undefined : 3}>
            {description}
          </Text>
          <TouchableOpacity onPress={() => setDescExpanded((v) => !v)} activeOpacity={0.7}>
            <Text className="mt-1 text-[13px] font-extrabold text-gray-900">{descExpanded ? 'Ler menos' : 'Ler mais'}</Text>
          </TouchableOpacity>

          {/* Catálogo */}
          <View className="mt-7">
            <Text className="text-[16px] font-extrabold text-gray-900">Catálogo</Text>
            <Text className="mt-1 text-[12px] text-gray-400">Itens e serviços que pode solicitar.</Text>
            <View className="mt-4">
              <CatalogView
                mode="public"
                providerId={providerId}
                providerName={displayName}
                providerJob={displayJob}
                providerAvatarUrl={avatarUrl || undefined}
                serviceName={serviceName || undefined}
              />
            </View>

            {/* Pedido personalizado: quando o serviço não está no catálogo */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={startRequest}
              className="mt-3 flex-row items-center rounded-2xl bg-gray-50 px-4 py-3.5"
              style={{ borderWidth: 1, borderColor: '#EEF2F7' }}
            >
              <View className="flex-1">
                <Text className="text-[13.5px] font-extrabold text-gray-900">Não encontrou o que procura?</Text>
                <Text className="mt-0.5 text-[11.5px] font-bold text-gray-400">Solicite um serviço personalizado.</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Disponibilidade */}
          <View className="mt-7">
            <AvailabilitySection availability={profile?.availability} />
          </View>

          <View onLayout={(e) => setPortfolioY(e.nativeEvent.layout.y)} className="mt-7">
            <Text className="text-[16px] font-extrabold text-gray-900">Portfólio</Text>
            <Text className="mt-1 text-[12px] text-gray-400">Estados, destaques e trabalhos do prestador.</Text>
            <View className="mt-4">
              <PortfolioView mode="public" providerId={providerId} accentColors={['#034660', '#00E7FF']} />
            </View>
            {loading ? (
              <View className="py-6 items-center justify-center">
                <ActivityIndicator color="#00E7FF" />
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>

      <View
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 28, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#F1F5F9' }}
      >
        {activeRequest ? (
          // Já existe um pedido em andamento: leva ao detalhe (o chat fica no pedido).
          <TouchableOpacity onPress={openRequest} activeOpacity={0.85} className="flex-row items-center justify-center gap-2 rounded-full bg-brand-cyan" style={{ height: 54 }}>
            <Ionicons name="receipt-outline" size={18} color="#fff" />
            <Text className="text-[14px] font-extrabold text-white">
              {activeRequest.status === 'accepted' ? 'Ver pedido (aceite)' : 'Ver pedido (pendente)'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={startRequest} activeOpacity={0.85} className="flex-row items-center justify-center gap-2 rounded-full bg-brand-cyan" style={{ height: 54 }}>
            <Ionicons name="briefcase-outline" size={18} color="#fff" />
            <Text className="text-[14px] font-extrabold text-white">Solicitar serviço</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
