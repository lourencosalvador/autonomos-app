import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Check, Loader2, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getRandomPhotos } from '../../services/unsplashService';
import { mockServices, ServiceRequest, ServiceStatus } from '../../types/services';
import { useAuthStore } from '../../stores/authStore';
import { useRequestsStore } from '../../stores/requestsStore';
import { Swipeable } from 'react-native-gesture-handler';
import { EmptyState } from '../../components/EmptyState';

type FilterTab = 'services' | 'counterparty' | 'status';

export default function ServicesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isProfessional = user?.role === 'professional';
  const requests = useRequestsStore((s) => s.requests);
  const deleteRequest = useRequestsStore((s) => s.deleteRequest);
  const [services, setServices] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('services');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    if (isProfessional) {
      setLoading(false);
      return;
    }
    loadServices();
  }, [isProfessional]);

  useEffect(() => {
    if (searchQuery === '') {
      setDebouncedQuery('');
      setSearching(false);
      return;
    }

    setSearching(true);
    const timeout = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setSearching(false);
    }, 800);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const loadServices = async () => {
    setLoading(true);
    const photos = await getRandomPhotos(mockServices.length);
    
    const servicesWithPhotos = mockServices.map((service, index) => ({
      ...service,
      id: `service-${index}`,
      providerAvatar: photos[index]?.url || 'https://via.placeholder.com/150',
    }));
    
    setServices(servicesWithPhotos);
    setLoading(false);
  };

  const getStatusConfig = (status: ServiceStatus) => {
    switch (status) {
      case 'pending':
        return {
          bgColor: 'bg-amber-50/80',
          borderColor: 'border-amber-100/50',
          icon: <Loader2 size={18} color="#F59E0B" strokeWidth={2.5} />,
          text: 'Pendente',
          textColor: 'text-amber-600',
        };
      case 'accepted':
        return {
          bgColor: 'bg-cyan-50/60',
          borderColor: 'border-cyan-100/40',
          icon: <Check size={18} color="#00E7FF" strokeWidth={3} />,
          text: 'Aceite',
          textColor: 'text-gray-400',
        };
      case 'rejected':
        return {
          bgColor: 'bg-red-50/60',
          borderColor: 'border-red-100/40',
          icon: <X size={18} color="#EF4444" strokeWidth={3} />,
          text: 'Rejeitado',
          textColor: 'text-gray-400',
        };
    }
  };

  const filteredClientServices = useMemo(() => {
    return services.filter((service) => {
      if (!debouncedQuery) return true;
      const query = debouncedQuery.toLowerCase();
      return (
        service.serviceName.toLowerCase().includes(query) ||
        service.providerName.toLowerCase().includes(query) ||
        service.providerRole.toLowerCase().includes(query)
      );
    });
  }, [debouncedQuery, services]);

  const providerRequests = useMemo(() => {
    if (!isProfessional || !user) return [];
    return requests.filter((r) => r.providerId === user.id);
  }, [isProfessional, requests, user]);

  const filteredProviderRequests = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return providerRequests.filter((r) => {
      if (!q) return true;
      return r.serviceName.toLowerCase().includes(q) || r.clientName.toLowerCase().includes(q);
    });
  }, [debouncedQuery, providerRequests]);

  const statusFromRequest = (s: any): ServiceStatus => {
    if (s === 'accepted') return 'accepted';
    if (s === 'rejected') return 'rejected';
    return 'pending';
  };

  const avatarFromIndex = (i: number) => {
    const urls = [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
      'https://images.unsplash.com/photo-1525134479668-1bee5c7c6845?w=200',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200',
    ];
    return urls[i % urls.length];
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#00E7FF" />
      </View>
    );
  }

  const listData: any[] = isProfessional ? (filteredProviderRequests as any) : (filteredClientServices as any);

  return (
    <View className="flex-1 bg-white pt-3">
      <StatusBar style="dark" />
      
      <View className="px-6 pt-16 pb-4">
        <View className="mb-5 flex-row items-center justify-between">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>

          <Text className="flex-1 ml-2 text-[22.5px] font-bold text-gray-900">
            Serviços Solicitados
          </Text>

          <TouchableOpacity
            onPress={() => router.push('/notificacoes')}
            activeOpacity={0.7}
            className="relative h-10 w-10 items-center justify-center"
          >
            <Ionicons name="notifications-outline" size={26} color="#1F2937" />
            <View className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-brand-cyan" />
          </TouchableOpacity>
        </View>

        <View className="mb-3 flex-row items-center rounded-full bg-[#D9D9D966] px-2 py-1">
            <TextInput
              className="flex-1 text-[15px] text-gray-700 pl-4"
              placeholder="Pesquisar"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <View className='p-4 flex justify-center items-center rounded-full bg-white'>
              {searching ? (
                <ActivityIndicator size="small" color="#9CA3AF" />
              ) : (
                <Ionicons name="search" size={22} color="#9CA3AF" />
              )}
            </View>
          </View>
      </View>

      <View className="flex-row justify-between px-6 mb-8">
        <TouchableOpacity 
          onPress={() => setActiveFilter('services')}
        >
          <Text 
            className="text-[17px]  font-medium text-gray-900"
          >
            Serviços
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => setActiveFilter('counterparty')}
        >
          <Text 
           className="text-[17px]  font-medium text-gray-900"
          >
            {isProfessional ? 'Cliente' : 'Prestador'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => setActiveFilter('status')}
        >
          <Text 
            className="text-[17px] font-medium text-gray-900"
          >
            Estado
          </Text>
        </TouchableOpacity>
      </View>

      {searching ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#00E7FF" />
          <Text className="mt-4 text-base text-gray-500">Pesquisando...</Text>
        </View>
      ) : listData.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="Nada por aqui"
          description={
            debouncedQuery
              ? `Nenhum resultado para "${debouncedQuery}".`
              : isProfessional
                ? 'Você ainda não recebeu pedidos.'
                : 'Você ainda não solicitou serviços.'
          }
          actionLabel={debouncedQuery ? 'Limpar pesquisa' : undefined}
          onAction={debouncedQuery ? () => setSearchQuery('') : undefined}
        />
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          ItemSeparatorComponent={() => <View className="h-3" />}
          renderItem={({ item, index }: any) => {
          const isReq = isProfessional;
          const statusConfig = getStatusConfig(isReq ? statusFromRequest(item.status) : item.status);
          
          const Card = (
            <TouchableOpacity
              className={`rounded-3xl border ${statusConfig.borderColor} ${statusConfig.bgColor} px-5 py-5`}
              activeOpacity={0.7}
              onPress={() => {
                if (isReq) {
                  router.push({ pathname: '/request-details', params: { requestId: item.id } });
                }
              }}
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-[14px] font-bold text-gray-900 w-[6rem]" numberOfLines={1} ellipsizeMode="tail">
                  {item.serviceName}
                </Text>

                <View className="flex-row items-center gap-3 flex-1">
                  <Image
                    source={{ uri: isReq ? avatarFromIndex(index) : item.providerAvatar }}
                    className="h-12 w-12 rounded-full"
                    resizeMode="cover"
                  />
                  
                  <View className="flex-1">
                    <Text className="text-[13px] font-bold text-gray-900" numberOfLines={1} ellipsizeMode="tail">
                      {isReq ? item.clientName : item.providerName}
                    </Text>
                    <Text className="mt-0.5 text-[13px] text-gray-500" numberOfLines={1} ellipsizeMode="tail">
                      {isReq ? 'Cliente' : item.providerRole}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center gap-1.5 ml-2">
                  {statusConfig.icon}
                  <Text className={`text-[13px] font-medium ${statusConfig.textColor}`}>
                    {statusConfig.text}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );

          if (!isReq) return Card;

          return (
            <Swipeable
              overshootLeft={false}
              overshootRight={false}
              renderRightActions={() => (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    Alert.alert('Apagar pedido', 'Deseja apagar este pedido?', [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Apagar', style: 'destructive', onPress: () => deleteRequest(item.id) },
                    ]);
                  }}
                  className="w-24 items-center justify-center bg-red-500 rounded-3xl"
                >
                  <Ionicons name="trash-outline" size={22} color="white" />
                  <Text className="mt-1 text-[11px] font-bold text-white">Apagar</Text>
                </TouchableOpacity>
              )}
            >
              {Card}
            </Swipeable>
          );
        }}
      />
      )}
    </View>
  );
}
