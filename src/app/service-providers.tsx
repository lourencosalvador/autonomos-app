import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { EmptyState } from '../components/EmptyState';
import { formatKz, services } from '../data/services';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useRequestsStore } from '../stores/requestsStore';
import { useFocusEffect } from '@react-navigation/native';

/** Preço inicial (Kz) do serviço a partir do catálogo, casando pelo nome. */
function servicePriceFor(serviceName: string): number | null {
  const n = normalizeText(serviceName);
  const found =
    services.find((s) => normalizeText(s.name) === n) ||
    services.find((s) => normalizeText(s.name).includes(n) || n.includes(normalizeText(s.name)));
  return found?.priceFrom ?? null;
}

type ProviderRow = {
  id: string;
  name: string | null;
  avatar_url: string | null;
  work_area?: string | null;
};

const AvatarFallback = { uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200' };

function normalizeText(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    // remove acentos
    .replace(/\p{Diacritic}/gu, '')
    .trim();
}

function categoryPatterns(serviceName: string) {
  const base = normalizeText(serviceName);
  const patterns = new Set<string>();
  if (base) patterns.add(base);

  // Tokens (ex: "design grafico" -> "design", "grafico")
  base
    .split(/\s+/g)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3)
    .forEach((t) => patterns.add(t));

  // Stems curtos para pegar variações ("fotografia" vs "fotografo")
  base
    .split(/\s+/g)
    .map((t) => t.trim())
    .filter((t) => t.length >= 5)
    .forEach((t) => patterns.add(t.slice(0, 6)));

  // Mapeamentos comuns (ex: Fotografia ↔ Fotógrafo ↔ foto)
  if (base.includes('fot')) {
    patterns.add('foto');
    patterns.add('fotograf');
  }
  if (base.includes('cabel')) {
    patterns.add('cabel');
    patterns.add('corte');
    patterns.add('salao');
  }
  if (base.includes('barb')) {
    patterns.add('barb');
    patterns.add('barbear');
    patterns.add('barbearia');
    patterns.add('corte');
  }
  if (base.includes('pastel')) {
    patterns.add('pastel');
    patterns.add('pastelar');
    patterns.add('doce');
    patterns.add('bolo');
    patterns.add('confeitar');
    patterns.add('confeitaria');
  }
  if (base.includes('cocktail') || base.includes('coquetel')) {
    patterns.add('cocktail');
    patterns.add('coquetel');
    patterns.add('bar');
    patterns.add('bartend');
    patterns.add('drink');
    patterns.add('mixolog');
  }
  if (base.includes('design') || base.includes('graf')) {
    patterns.add('design');
    patterns.add('graf');
    patterns.add('branding');
    patterns.add('logo');
  }

  // remove vazios / caracteres problemáticos pro filtro OR
  return Array.from(patterns)
    .map((p) => p.replace(/[(),]/g, '').trim())
    .filter(Boolean);
}

export default function ServiceProvidersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ serviceName?: string }>();
  const user = useAuthStore((s) => s.user);
  const requests = useRequestsStore((s) => s.requests);
  const fetchRequests = useRequestsStore((s) => s.fetchRequests);

  const serviceName = (params.serviceName || 'Fotografia').toString();
  const title = `Prestadores de ${serviceName}`;
  const priceFrom = useMemo(() => servicePriceFor(serviceName), [serviceName]);
  const priceLabel = priceFrom != null ? `A partir de ${formatKz(priceFrom)}` : 'A combinar';

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [ratings, setRatings] = useState<Record<string, { avg: number; count: number }>>({});
  const [error, setError] = useState<string | null>(null);

  const loadProviders = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!isSupabaseConfigured) {
        setProviders([]);
        setError('Supabase não configurado.');
        return;
      }

      // Importante: o Postgres `ILIKE` não é "accent-insensitive" por padrão.
      // Para suportar "Fotógrafo" vs "Fotografia", buscamos os prestadores e filtramos no app com normalizeText().
      const patterns = categoryPatterns(serviceName).map(normalizeText);

      const { data, error: sbError } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, work_area')
        .eq('role', 'professional')
        .order('updated_at', { ascending: false });

      if (sbError) {
        // Ajuda a debugar RLS/config
        throw new Error(sbError.message);
      }
      const list = ((data || []) as any as ProviderRow[]).filter((p) => {
        const area = normalizeText(p.work_area || '');
        if (!area) return false;
        return patterns.some((pat) => area.includes(pat));
      });
      setProviders(list);

      // Notas (estrelas) de cada prestador listado
      const ids = list.map((p) => p.id);
      if (ids.length) {
        const { data: revs } = await supabase.from('reviews').select('provider_id, rating').in('provider_id', ids);
        const agg: Record<string, { sum: number; count: number }> = {};
        (revs || []).forEach((r: any) => {
          const id = String(r.provider_id);
          if (!agg[id]) agg[id] = { sum: 0, count: 0 };
          agg[id].sum += Number(r.rating || 0);
          agg[id].count += 1;
        });
        const map: Record<string, { avg: number; count: number }> = {};
        Object.keys(agg).forEach((id) => {
          map[id] = { avg: agg[id].count ? agg[id].sum / agg[id].count : 0, count: agg[id].count };
        });
        setRatings(map);
      } else {
        setRatings({});
      }
    } catch (e) {
      setProviders([]);
      setError(e instanceof Error ? e.message : 'Não foi possível carregar os prestadores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceName]);

  // Atualiza os pedidos ao focar a tela, para o estado (pendente/aceite) do card ficar correto.
  useFocusEffect(
    useCallback(() => {
      if (user?.id) fetchRequests(user.id).catch(() => {});
    }, [fetchRequests, user?.id])
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = providers.filter((p) => {
      const name = (p.name || '').toLowerCase();
      const area = (p.work_area || '').toLowerCase();
      return !q || name.includes(q) || area.includes(q);
    });
    return list.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
  }, [providers, query]);

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      <View className="px-6 pt-16 pb-2">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} className="h-10 w-10 items-center justify-center">
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/notificacoes')}
            activeOpacity={0.7}
            className="relative h-10 w-10 items-center justify-center"
          >
            <Ionicons name="notifications-outline" size={26} color="#1F2937" />
            <View className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-brand-cyan" />
          </TouchableOpacity>
        </View>

        <Text className="mt-3 text-[26px] font-extrabold text-gray-900">{title}</Text>
        <Text className="mt-1 text-[12px] text-gray-500">
          Profissionais de {serviceName.toLowerCase()} para si.
          {'\n'}pesquise o Prestador.
        </Text>

        <View className="mt-4 flex-row items-center rounded-full bg-[#D9D9D966] px-2 py-2">
          <TextInput
            value={query}
            onChangeText={setQuery}
            className="flex-1 text-[14px] text-gray-700 pl-4"
            placeholder="Pesquisar"
            placeholderTextColor="#9CA3AF"
          />
          <View className="p-3 flex justify-center items-center rounded-full" style={{ backgroundColor: '#00E7FF' }}>
            <Ionicons name="search" size={20} color="#FFFFFF" />
          </View>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center bg-white">
          <ActivityIndicator size="large" color="#00E7FF" />
          <Text className="mt-3 text-[13px] font-bold text-gray-500">Carregando prestadores...</Text>
        </View>
      ) : (
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 14, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="Nenhum prestador encontrado"
            description={
              error
                ? error
                : query
                  ? `Nenhum resultado para "${query}" em ${serviceName}.`
                  : `Ainda não existe nenhum prestador cadastrado para ${serviceName}.`
            }
            actionLabel={error ? 'Tentar novamente' : query ? 'Limpar pesquisa' : 'Atualizar'}
            onAction={() => {
              if (error) return loadProviders();
              if (query) return setQuery('');
              return loadProviders();
            }}
          />
        }
        renderItem={({ item }) => {
          const r = ratings[item.id];
          const existing =
            user?.role === 'client' && user?.id
              ? requests
                  .filter(
                    (req) =>
                      req.clientId === user.id &&
                      req.providerId === item.id &&
                      req.serviceName === serviceName &&
                      req.status !== 'cancelled'
                  )
                  .sort((a, b) => {
                    const ta = Date.parse(a.createdAt);
                    const tb = Date.parse(b.createdAt);
                    if (Number.isFinite(ta) && Number.isFinite(tb)) return tb - ta;
                    return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
                  })[0]
              : null;
          const pending = !!existing && (existing.status === 'pending' || existing.status === 'accepted');

          // Sempre abre o perfil do prestador (mesmo com pedido pendente).
          // De lá, o cliente acede ao pedido pelo botão "Ver pedido".
          const onPress = () => {
            router.push({
              pathname: '/perfil-prestador',
              params: {
                serviceName,
                providerId: item.id,
                providerName: item.name || 'Prestador',
                providerJob: item.work_area || serviceName,
                providerAvatarUrl: item.avatar_url || undefined,
              },
            });
          };

          return (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onPress}
              className="flex-row items-center rounded-3xl bg-white p-3"
              style={{ borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#0B3A45', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 }}
            >
              <Image source={item.avatar_url ? { uri: item.avatar_url } : AvatarFallback} style={{ width: 68, height: 68, borderRadius: 18 }} resizeMode="cover" />

              <View className="ml-3 flex-1">
                <Text className="text-[15px] font-extrabold text-gray-900" numberOfLines={1}>
                  {item.name || 'Prestador'}
                </Text>
                <Text className="mt-0.5 text-[12px] font-bold text-gray-400" numberOfLines={1}>
                  {item.work_area || serviceName}
                </Text>
                <Text className="mt-1.5 text-[14px] font-extrabold text-brand-cyan">
                  {priceLabel} <Text className="text-[11px] font-bold text-gray-400">· por serviço</Text>
                </Text>
              </View>

              <View className="items-end justify-between self-stretch py-1">
                {pending && existing ? (
                  <View className={`rounded-full px-3 py-1 ${existing.status === 'accepted' ? 'bg-cyan-100' : 'bg-gray-100'}`}>
                    <Text className={`text-[11px] font-extrabold ${existing.status === 'accepted' ? 'text-brand-cyan' : 'text-gray-500'}`}>
                      {existing.status === 'accepted' ? 'Aceite' : 'Pendente'}
                    </Text>
                  </View>
                ) : (
                  <View style={{ height: 20 }} />
                )}

                <View className="flex-row items-center gap-1 rounded-full px-2.5 py-1" style={{ backgroundColor: '#FFF7E6' }}>
                  <Ionicons name="star" size={13} color="#F59E0B" />
                  <Text className="text-[12px] font-extrabold text-amber-700">{r?.count ? r.avg.toFixed(1) : 'novo'}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
      )}
    </View>
  );
}


