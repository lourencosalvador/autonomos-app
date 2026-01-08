import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { FlatList, ImageBackground, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { EmptyState } from '../components/EmptyState';
import { categories } from '../data/categories';
import { services as baseServices } from '../data/services';

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

const stars = [1, 1, 1, 1, 0];

export default function AllServicesScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<CategoryId>('casa');

  const services = useMemo(() => {
    return baseServices;
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return services;
    return services.filter((s) => s.name.toLowerCase().includes(q));
  }, [query, services]);

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      <View className="px-6 pt-16">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center"
            activeOpacity={0.7}
          >
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

        <View className="mt-5 flex-row items-center rounded-full bg-[#D9D9D966] px-2 py-2">
          <TextInput
            value={query}
            onChangeText={setQuery}
            className="flex-1 text-[15px] text-gray-700 pl-4"
            placeholder="Pesquisar"
            placeholderTextColor="#9CA3AF"
          />
          <View className="p-4 flex justify-center items-center rounded-full bg-white">
            <Ionicons name="search" size={22} color="#9CA3AF" />
          </View>
        </View>

        <View className="mt-5">
          <FlatList
            data={categories}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 14, paddingHorizontal: 2 }}
            renderItem={({ item }) => {
              const isActive = selectedId === item.id;
              return (
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => setSelectedId(item.id as CategoryId)}
                  className="items-center"
                >
                  <View
                    className="h-14 w-14 items-center justify-center rounded-full border-[2px]"
                    style={{
                      backgroundColor: '#F4F4F4',
                      borderColor: isActive ? '#00E7FF' : '#00E7FF',
                    }}
                  >
                    <item.Icon size={22} color={isActive ? '#00E7FF' : '#B8B8B8'} strokeWidth={item.stroke} />
                  </View>
                  <Text className="mt-2 text-[11px] text-[#99999999]">{item.name}</Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        <Text className="mt-6 text-[15px] font-bold text-gray-900">Todos Serviços</Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 64 }}
        columnWrapperStyle={{ gap: 12, marginBottom: 14 }}
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            title="Nenhum serviço encontrado"
            description={query ? `Não encontramos resultados para "${query}".` : 'Tente novamente mais tarde.'}
            actionLabel={query ? 'Limpar pesquisa' : undefined}
            onAction={query ? () => setQuery('') : undefined}
          />
        }
        renderItem={({ item }) => (
          <View style={{ flex: 1 }}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: '/service-providers',
                  params: { serviceName: item.name },
                })
              }
              className="overflow-hidden rounded-2xl"
            >
              <ImageBackground
                source={item.image as any}
                resizeMode="cover"
                style={{ width: '100%', aspectRatio: 0.85 }}
              >
                <View className="flex-1 justify-between px-4 pt-4 pb-5">
                  <View className="flex-row items-center gap-1">
                    {stars.map((v, idx) => (
                      <Ionicons
                        key={idx}
                        name={v ? 'star' : 'star-outline'}
                        size={12}
                        color={v ? '#FBBF24' : 'rgba(255,255,255,0.75)'}
                      />
                    ))}
                  </View>

                  <View>
                    <Text className="text-[14px] font-extrabold text-brand-cyan">{item.name}</Text>
                    <Text className="mt-1 text-[10px] text-white/80" numberOfLines={3}>
                      {item.description}
                    </Text>
                  </View>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}


