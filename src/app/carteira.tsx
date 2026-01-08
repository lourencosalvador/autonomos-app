import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import UnionArt from '../../assets/images/Union.svg';
import { EmptyState } from '../components/EmptyState';

type MovementType = 'payment' | 'withdrawal';
type Filter = 'all' | MovementType;

type Movement = {
  id: string;
  name: string;
  subtitle: string;
  date: string;
  amount: number;
  type: MovementType;
  avatar: any;
};

const ProfileImage = require('../../assets/images/Profile.jpg');

function formatKz(amount: number) {
  const sign = amount >= 0 ? '+' : '-';
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${sign}AO ${formatted}kz`;
}

function maskIban(iban: string) {
  const clean = iban.replace(/\s+/g, '');
  if (clean.length <= 8) return '****';
  const start = clean.slice(0, 4);
  const end = clean.slice(-4);
  return `${start} **** **** ${end}`;
}

export default function CarteiraScreen() {
  const router = useRouter();
  const [showIban, setShowIban] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');

  const iban = 'AO06 0040 0000 1234 5678 9012 3';

  const movements = useMemo<Movement[]>(
    () => [
      {
        id: 'm1',
        name: 'Ana Carina',
        subtitle: 'Pagamento Recebido',
        date: '10/02/2025 | 12:30:25',
        amount: 30000,
        type: 'payment',
        avatar: { uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200' },
      },
      {
        id: 'm2',
        name: 'Carla Silva Santos',
        subtitle: 'Pagamento Recebido',
        date: '05/05/2025 | 12:30:25',
        amount: 30000,
        type: 'payment',
        avatar: { uri: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200' },
      },
      {
        id: 'm3',
        name: 'Eu',
        subtitle: 'Levantamento',
        date: '05/05/2025 | 12:30:25',
        amount: -80250,
        type: 'withdrawal',
        avatar: ProfileImage,
      },
      {
        id: 'm4',
        name: 'Carla Silva Santos',
        subtitle: 'Pagamento Recebido',
        date: '05/05/2025 | 12:30:25',
        amount: 30000,
        type: 'payment',
        avatar: { uri: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200' },
      },
    ],
    []
  );

  const filtered = useMemo(() => {
    if (filter === 'all') return movements;
    return movements.filter((m) => m.type === filter);
  }, [filter, movements]);

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      <View className="px-6 pt-16 pb-2">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 items-center justify-center" activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text className="flex-1 ml-2 text-[22px] font-bold text-gray-900">Carteira</Text>
          <View className="h-10 w-10" />
        </View>
      </View>

      <View className="px-6">
        <View className="rounded-3xl overflow-hidden">
          <LinearGradient
            colors={['#034660', '#00E7FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 18, borderRadius: 24 }}
          >
            <View className="flex-row items-start justify-between">
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-white/90 text-[13px] font-bold">Saldo Total</Text>
                  <MaterialCommunityIcons name="bank" size={16} color="rgba(255,255,255,0.9)" />
                </View>
                <Text className="mt-6 text-white text-[26px] font-extrabold">AO 50.000.00kz</Text>

                <View className="mt-3 flex-row items-center justify-between">
                  <Text className="text-white/85 text-[12px] tracking-widest">
                    {showIban ? iban : maskIban(iban)}
                  </Text>
                  <TouchableOpacity onPress={() => setShowIban((v) => !v)} activeOpacity={0.85} className="h-10 w-10 items-center justify-center rounded-full bg-white/15">
                    <Ionicons name={showIban ? 'eye-off-outline' : 'eye-outline'} size={18} color="white" />
                  </TouchableOpacity>
                </View>
              </View>

              <View className="items-end z-10">
                <Image
                  source={require('../../assets/images/logo-ligth.png')}
                  style={{ width: 90, height: 22, opacity: 0.9 }}
                  resizeMode="contain"
                />
              </View>
            </View>

            <View className="mt-6 flex-row items-center gap-3">
              <TouchableOpacity activeOpacity={0.85} className="flex-row items-center justify-center rounded-full bg-white/15 px-4 py-2">
                <Text className="text-white text-[12px] font-bold mr-2">Levantar</Text>
                <Ionicons name="wallet-outline" size={16} color="white" />
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.85} className="flex-row items-center justify-center rounded-full bg-white/15 px-4 py-2">
                <Text className="text-white text-[12px] font-bold mr-2">Histórico</Text>
                <Ionicons name="time-outline" size={16} color="white" />
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.85} className="h-10 w-10 items-center justify-center rounded-full bg-white/15">
                <Ionicons name="scan-outline" size={18} color="white" />
              </TouchableOpacity>
            </View>

            <View className="absolute top-0 right-0 -z-10 ">
              <UnionArt width={198} height={242} />
            </View>
          </LinearGradient>
        </View>

        <View className="mt-6">
          <Text className="text-[16px] font-extrabold text-gray-900">Movimentos Recentes</Text>

          <View className="mt-4 flex-row justify-between">
            <TouchableOpacity activeOpacity={0.85} onPress={() => setFilter('all')}>
              <Text className={`text-[13px] font-bold ${filter === 'all' ? 'text-gray-900' : 'text-gray-300'}`}>Todos</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} onPress={() => setFilter('payment')}>
              <Text className={`text-[13px] font-bold ${filter === 'payment' ? 'text-gray-900' : 'text-gray-300'}`}>Pagamentos</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} onPress={() => setFilter('withdrawal')}>
              <Text className={`text-[13px] font-bold ${filter === 'withdrawal' ? 'text-gray-900' : 'text-gray-300'}`}>Levantamentos</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 14, paddingBottom: 32 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <EmptyState
            icon="card-outline"
            title="Sem movimentos"
            description={
              filter === 'all'
                ? 'Quando houver movimentações, elas aparecem aqui.'
                : 'Não há movimentos para este filtro.'
            }
            actionLabel={filter !== 'all' ? 'Ver todos' : undefined}
            onAction={filter !== 'all' ? () => setFilter('all') : undefined}
          />
        }
        renderItem={({ item }) => {
          const isPositive = item.amount >= 0;
          return (
            <View className="flex-row items-center rounded-3xl bg-white px-4 py-4" style={{ borderWidth: 1, borderColor: '#EEF2F7' }}>
              <Image source={item.avatar} className="h-12 w-12 rounded-full" resizeMode="cover" />
              <View className="ml-3 flex-1">
                <Text className="text-[13px] font-extrabold text-gray-900">{item.name}</Text>
                <Text className="mt-1 text-[11px] text-gray-400">
                  {item.subtitle}{' '}
                  <Text className="text-gray-300">• {item.date}</Text>
                </Text>
              </View>
              <Text className={`text-[12px] font-extrabold ${isPositive ? 'text-brand-cyan' : 'text-red-500'}`}>
                {formatKz(item.amount)}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}


