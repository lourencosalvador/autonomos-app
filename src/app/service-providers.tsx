import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { PROVIDERS } from '../data/providers';
import { EmptyState } from '../components/EmptyState';

const stars = [1, 1, 1, 1, 0];

function clampRating(r: number) {
  if (r >= 4.75) return 5;
  if (r >= 4.25) return 4;
  if (r >= 3.75) return 3;
  if (r >= 3.25) return 2;
  return 1;
}

export default function ServiceProvidersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ serviceName?: string }>();

  const serviceName = (params.serviceName || 'Fotografia').toString();
  const title = serviceName.toLowerCase().includes('foto') ? 'Fotógrafos' : `${serviceName}s`;

  const [query, setQuery] = useState('');
  const [minRating, setMinRating] = useState<0 | 4 | 5>(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = PROVIDERS.filter((p) => {
      const okName = !q || p.name.toLowerCase().includes(q);
      const okRating = minRating === 0 || p.rating >= minRating;
      return okName && okRating;
    });

    return list.sort((a, b) => {
      const aEdson = a.name.toLowerCase().includes('edson') ? 1 : 0;
      const bEdson = b.name.toLowerCase().includes('edson') ? 1 : 0;
      if (aEdson !== bEdson) return bEdson - aEdson;
      return b.rating - a.rating;
    });
  }, [minRating, query]);

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
          <View className="p-3 flex justify-center items-center rounded-full bg-white">
            <Ionicons name="search" size={20} color="#9CA3AF" />
          </View>
        </View>

        <View className="mt-4 flex-row gap-3">
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setMinRating(0)}
            className={`px-4 py-2 rounded-full ${minRating === 0 ? 'bg-brand-cyan' : 'bg-gray-100'}`}
          >
            <Text className={`text-[12px] font-bold ${minRating === 0 ? 'text-white' : 'text-gray-600'}`}>Todos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setMinRating(4)}
            className={`px-4 py-2 rounded-full ${minRating === 4 ? 'bg-brand-cyan' : 'bg-gray-100'}`}
          >
            <Text className={`text-[12px] font-bold ${minRating === 4 ? 'text-white' : 'text-gray-600'}`}>4+</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setMinRating(5)}
            className={`px-4 py-2 rounded-full ${minRating === 5 ? 'bg-brand-cyan' : 'bg-gray-100'}`}
          >
            <Text className={`text-[12px] font-bold ${minRating === 5 ? 'text-white' : 'text-gray-600'}`}>5</Text>
          </TouchableOpacity>
        </View>
      </View>

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
            description="Tente mudar o filtro de avaliação ou pesquisar por outro nome."
            actionLabel="Limpar filtros"
            onAction={() => {
              setQuery('');
              setMinRating(0);
            }}
          />
        }
        renderItem={({ item }) => (
          <View className="flex-row items-center rounded-2xl bg-white px-4 py-3" style={{ borderWidth: 1, borderColor: '#EEF2F7' }}>
            <Image source={item.avatar} className="h-12 w-12 rounded-full" resizeMode="cover" />
            <View className="ml-3 flex-1">
              <Text className="text-[13px] font-extrabold text-gray-900">{item.name}</Text>
              <Text className="text-[11px] text-gray-400">{item.jobTitle}</Text>
              <View className="mt-2 flex-row items-center gap-1">
                {stars.map((_, idx) => {
                  const v = idx < clampRating(item.rating);
                  return (
                    <Ionicons
                      key={idx}
                      name={v ? 'star' : 'star-outline'}
                      size={14}
                      color={v ? '#FBBF24' : '#D1D5DB'}
                    />
                  );
                })}
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: '/termos-servico',
                  params: {
                    serviceName,
                    providerId: item.id,
                    providerName: item.name,
                    providerJob: item.jobTitle,
                  },
                })
              }
              className="px-5 py-2 rounded-full bg-brand-cyan"
            >
              <Text className="text-[12px] font-extrabold text-white">Termos</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}


