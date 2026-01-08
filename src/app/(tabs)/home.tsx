import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, ImageBackground, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import IconHartCyan from '../../../assets/icons/hart-cyan.svg';
import IconNotification from '../../../assets/icons/ICON NOTIFICATION.svg';
import IconClock from '../../../assets/icons/icon-clock-new.svg';
import IconEdit from '../../../assets/icons/icon-edit.svg';
import IconRowView from '../../../assets/icons/row-view.svg';
import UnionArt from '../../../assets/images/Union.svg';
import { EmptyState } from '../../components/EmptyState';
import { categories } from '../../data/categories';
import { services } from '../../data/services';
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
  const router = useRouter();

  if (user?.role === 'professional') {
    return <ProfessionalDashboard firstName={firstName} />;
  }

  return <ClientHome firstName={firstName} onSeeAll={() => router.push('/all-services')} />;
}

function ClientHome({ firstName, onSeeAll }: { firstName: string; onSeeAll: () => void }) {
  const [selectedId, setSelectedId] = useState<CategoryId>('casa');

  const getContent = () => {
    switch (selectedId) {
      case 'casa':
        return <CasaSection onSeeAll={onSeeAll} />;
      case 'beleza':
        return <BelezaSection />;
      case 'decoracao':
        return <DecoracaoSection />;
      case 'cocktail':
        return <CocktailSection />;
      case 'cabeleireiro':
        return <CabeleireiroSection />;
      case 'fitness':
        return <FitnessSection />;
      case 'tecnologia':
        return <TecnologiaSection />;
      case 'educacao':
        return <EducacaoSection />;
      case 'saude':
        return <SaudeSection />;
      case 'outros':
        return <OutrosSection />;
      default:
        return <CasaSection onSeeAll={onSeeAll} />;
    }
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4 pt-20 mb-8">
          <View className="mb-6 flex-row items-start justify-between">
            <View className="flex-1">
              <Text className="text-[28px] font-bold text-gray-900">
                Olá, {firstName}
              </Text>
              <Text className="mt-1 text-[15px] text-gray-500 font-bold">
                Bem vindo de volta!
              </Text>
            </View>

            <TouchableOpacity
              className="relative w-12 h-12 items-center justify-center"
              activeOpacity={0.7}
            >
              <View className='absolute top-1 right-3 h-3 w-3 rounded-full bg-brand-cyan z-40' />
              <IconNotification width={94} height={94} />
            </TouchableOpacity>
          </View>

          <View className="mb-6 flex-row items-center rounded-full bg-[#D9D9D966] px-2 py-2">
            <TextInput
              className="flex-1 text-[15px] text-gray-700 pl-4"
              placeholder="Pesquisar"
              placeholderTextColor="#9CA3AF"
            />
            <View className='p-4 flex justify-center items-center rounded-full bg-white'>
              <Ionicons name="search" size={22} color="#9CA3AF" />
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 16 }}
          >
            {categories.map((category, index) => {
              const isActive = selectedId === category.id;
              return (
                <TouchableOpacity
                  key={category.id}
                  className="items-center"
                  activeOpacity={0.7}
                  onPress={() => setSelectedId(categories[index].id as CategoryId)}
                >
                  <View className="mb-2 h-20 w-20 items-center justify-center rounded-full border-[3px] border-brand-cyan/30 bg-[]" style={{ backgroundColor: isActive ? '#FFFF' : '#f3f4f6', borderColor: isActive ? '#00E7FF' : '#00E7FF' }}>
                    <category.Icon
                      size={32}
                      color={isActive ? '#00E7FF' : '#99999991'}
                      strokeWidth={category.stroke}
                    />
                  </View>
                  <Text className="text-[12px] text-[#99999999]">
                    {category.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
        <View className="flex-1 px-6">{getContent()}</View>
      </ScrollView>
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

  const rating = useMemo(() => [1, 1, 1, 0, 0], []);
  const providerRequests = useMemo(() => {
    if (!user) return [];
    return requests.filter((r) => r.providerId === user.id).slice(0, 3);
  }, [requests, user]);
  const statusLabel = useMemo(
    () => ({
      pending: 'Pendente',
      accepted: 'Aceite',
      rejected: 'Rejeitado',
    }),
    []
  );

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="px-6 pt-20">
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <Text className="text-[28px] font-bold text-gray-900">Olá, {firstName}</Text>
              <Text className="mt-1 text-[15px] text-gray-500 font-bold">Bem vindo de volta!</Text>
            </View>

            <TouchableOpacity
              className="relative w-12 h-12 items-center justify-center"
              activeOpacity={0.7}
              onPress={() => router.push('/notificacoes')}
            >
              <View className="absolute top-1 right-3 h-3 w-3 rounded-full bg-brand-cyan z-40" />
              <IconNotification width={94} height={94} />
            </TouchableOpacity>
          </View>

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
                    <Text className="text-white/90 text-[13px] font-bold">Saldo Total</Text>
                    <MaterialCommunityIcons name="bank" size={16} color="rgba(255,255,255,0.9)" />
                  </View>
                  <Text className="mt-6 text-white text-[26px] font-extrabold">AO 50.000.00kz</Text>
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
                >
                  <Text className="text-white text-[12px] font-bold mr-2">Levantar</Text>
                  <Ionicons name="wallet-outline" size={16} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  className="flex-row items-center justify-center rounded-full bg-white/15 px-4 py-2"
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

              <TouchableOpacity activeOpacity={0.8} className="flex-row items-center gap-2">
                <Text className="text-[13px] font-bold text-gray-900">Ver tudo</Text>
                <View className="h-9 w-9 items-center justify-center rounded-full bg-white">
                  <Ionicons name="arrow-forward" size={18} color="#00E7FF" />
                </View>
              </TouchableOpacity>
            </View>

            <View className="mt-4 flex-row items-center">
              <Image
                source={{ uri: avatars?.a || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120' }}
                className="h-11 w-11 rounded-full"
                resizeMode="cover"
              />
              <View className="ml-3 flex-1">
                <Text className="text-[14px] font-bold text-gray-900">Ana Clara André</Text>
                <Text className="mt-1 text-[10px] text-gray-500" numberOfLines={1}>
                  Figma ipsum component variant main layer. Scrolling pencil library draft align...
                </Text>
              </View>
              <View className="flex-row items-center gap-1">
                {rating.map((v, idx) => (
                  <Ionicons
                    key={idx}
                    name={v ? 'star' : 'star-outline'}
                    size={18}
                    color={v ? '#FBBF24' : '#D1D5DB'}
                  />
                ))}
              </View>
            </View>
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
                          avatar={idx === 0 ? avatars?.a : idx === 1 ? avatars?.b : avatars?.c}
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


const SectionTitle = ({ children }: { children: string }) => (
  <Text className="text-2xl font-bold text-white mb-4">{children}</Text>
);

const CasaSection = ({ onSeeAll }: { onSeeAll: () => void }) => (
  <View className='w-auto h-auto justify-between gap-8'>
    <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={{ gap: 8 }}
  >
    <View className="w-[22rem] h-[15rem] rounded-3xl bg-brand-cyan px-4 py-5 flex-row justify-between">

      <View className="flex-1 justify-between flex gap-4">
        <View className="gap-3 mb-2">
          <Text className="text-[#034660] text-[12px] font-bold leading-[20px]">
            Encontre o profissional{"\n"}certo em minutos.
          </Text>
          <Text className="text-[#034660] text-[11px] font-medium leading-6">
            Serviços de confiança,  perto  {"\n"} de você
            Rápido, seguro e sem  {"\n"} complicação.
          </Text>
        </View>

        <View className="items-start">
          <Image
            source={require('../../../assets/images/splash-icon.png')}
            style={{ width: 100, height: 36 }}
            resizeMode="contain"

          />
        </View>
      </View>


      <View className="items-start mt-4">
        <IconClock width={105} height={105} />
      </View>
    </View>
    <View className="w-[22rem] h-[15rem] rounded-3xl bg-[#034660] px-4 py-5 flex-row justify-between">

      <View className="flex-1 justify-between flex gap-4">
        <View className="gap-3 mb-2">
          <Text className="text-brand-cyan text-[12px] font-bold leading-[20px]">
            Encontre o profissional{"\n"}certo em minutos.
          </Text>
          <Text className="text-white text-[11px] font-medium leading-6">
            Serviços de confiança,  perto  {"\n"} de você
            Rápido, seguro e sem  {"\n"} complicação.
          </Text>
        </View>

        <View className="items-start">
          <Image
            source={require('../../../assets/images/logo-cyan.png')}
            style={{ width: 100, height: 36 }}
            resizeMode="contain"
          />
        </View>
      </View>


      <View className="items-start mt-4">
        <IconEdit width={100} height={105} />
      </View>
    </View>
    <View className="w-[22rem] h-[15rem] rounded-3xl bg-brand-cyan px-4 py-5 flex-row justify-between">

      <View className="flex-1 justify-between flex gap-4">
        <View className="gap-3 mb-2">
          <Text className="text-[#034660] text-[12px] font-bold leading-[20px]">
            Encontre o profissional{"\n"}certo em minutos.
          </Text>
          <Text className="text-[#034660] text-[11px] font-medium leading-6">
            Serviços de confiança,  perto  {"\n"} de você
            Rápido, seguro e sem  {"\n"} complicação.
          </Text>
        </View>

        <View className="items-start">
          <Image
            source={require('../../../assets/images/splash-icon.png')}
            style={{ width: 100, height: 36 }}
            resizeMode="contain"

          />
        </View>
      </View>


      <View className="items-start mt-4">
        <IconClock width={105} height={105} />
      </View>
    </View>
  </ScrollView>

  <View className='w-auto h-auto justify-between gap-8'>
    <View className='w-full justify-between items-center flex-row'>
      <Text className="text-[15px] font-bold text-zinc-900">Mais Solicitados</Text>
      <TouchableOpacity activeOpacity={0.8} onPress={onSeeAll}>
        <Text className="text-[15px] font-bold text-brand-cyan">Ver tudo</Text>
      </TouchableOpacity>
    </View>
    <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={{ gap: 8 }}
  >
    {services.map((service) => (
     <View
      key={service.id}
      className="w-[21rem] h-[16rem] rounded-3xl overflow-hidden"
      >
     <ImageBackground 
    source={service.image}
     resizeMode="cover"
     className="w-full h-full rounded-3xl px-4 py-5 flex justify-between"
     >
       <View className='w-full flex flex-row justify-end items-end'>
         <IconHartCyan width={24} height={24} />
       </View>
       <View className='w-full flex flex-row justify-between items-center'>
         <View className='w-full flex flex-col gap-1'>
           <Text className="text-[19px] font-bold text-brand-cyan">{service.name}</Text>
           <Text className="text-[13px] font-normal text-slate-100/70 w-[13rem]">{service.description}</Text>
         </View>
        <View className='w-auto h-auto -ml-12'>
        <IconRowView width={30} height={30}/>
        </View>
       </View>
     </ImageBackground>
   </View>
    ))}
    </ScrollView>
  </View>
  </View>
);

const BelezaSection = () => (
  <View>
    <SectionTitle>Decoração & Design</SectionTitle>
    <Text className="text-gray-300 text-base leading-6">
      Designers de interiores, montagem de móveis, organização de ambientes.
    </Text>
  </View>
);

const DecoracaoSection = () => (
  <View>
    <SectionTitle>Decoração & Design</SectionTitle>
    <Text className="text-gray-300 text-base leading-6">
      Designers de interiores, montagem de móveis, organização de ambientes.
    </Text>
  </View>
);

const CocktailSection = () => (
  <View>
    <SectionTitle>Cocktail & Bar</SectionTitle>
    <Text className="text-gray-300 text-base leading-6">
      Bartenders profissionais para festas, eventos e drinks personalizados.
    </Text>
  </View>
);

const CabeleireiroSection = () => (
  <View>
    <SectionTitle>Cabeleireiro & Barba</SectionTitle>
    <Text className="text-gray-300 text-base leading-6">
      Corte, coloração, barba, tratamento capilar... em casa ou no salão.
    </Text>
  </View>
);

const FitnessSection = () => (
  <View>
    <SectionTitle>Fitness & Treino</SectionTitle>
    <Text className="text-gray-300 text-base leading-6">
      Personal trainers, yoga, pilates, funcional... treine onde quiser.
    </Text>
  </View>
);

const TecnologiaSection = () => (
  <View>
    <SectionTitle>Tecnologia & Suporte</SectionTitle>
    <Text className="text-gray-300 text-base leading-6">
      Formatação, instalação de redes, conserto de celular, aulas de informática.
    </Text>
  </View>
);

const EducacaoSection = () => (
  <View>
    <SectionTitle>Educação & Aulas</SectionTitle>
    <Text className="text-gray-300 text-base leading-6">
      Reforço escolar, idiomas, música, culinária... aprenda no seu ritmo.
    </Text>
  </View>
);

const SaudeSection = () => (
  <View>
    <SectionTitle>Saúde & Bem-estar</SectionTitle>
    <Text className="text-gray-300 text-base leading-6">
      Fisioterapia, enfermagem, nutricionista, psicologia... cuidando de você.
    </Text>
  </View>
);

const OutrosSection = () => (
  <View>
    <SectionTitle>Outros Serviços</SectionTitle>
    <Text className="text-gray-300 text-base leading-6">
      Pet care, costura, fotografia, eventos... tem de tudo!
    </Text>
  </View>
);