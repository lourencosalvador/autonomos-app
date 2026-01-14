import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from 'react-native';
import { EmptyState } from '../components/EmptyState';
import { useAuthStore } from '../stores/authStore';
import { useRequestsStore } from '../stores/requestsStore';

type Tab = 'completed' | 'cancelled';

const AvatarFallback = { uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120' };

function formatMoney(amount: number | null | undefined, currency?: string | null) {
  if (!amount || amount <= 0) return '';
  const c = (currency || 'USD').toUpperCase();
  return `${c} ${(amount / 100).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function HistoricoServicosScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const requests = useRequestsStore((s) => s.requests);
  const fetchRequests = useRequestsStore((s) => s.fetchRequests);
  const [tab, setTab] = useState<Tab>('completed');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function run() {
      if (!user?.id) {
        if (mounted) setLoading(false);
        return;
      }
      try {
        if (mounted) setLoading(true);
        await fetchRequests(user.id);
      } catch {
        // fallback no cache local
      } finally {
        if (mounted) setLoading(false);
      }
    }
    run();
    return () => {
      mounted = false;
    };
  }, [fetchRequests, user?.id]);

  const isProfessional = user?.role === 'professional';

  const data = useMemo(() => {
    if (!isProfessional || !user) return [];
    return requests
      .filter((r) => r.providerId === user.id)
      .filter((r) => (tab === 'completed' ? r.status === 'completed' : r.status === 'cancelled'))
      .sort((a, b) => (Date.parse(b.paidAt || b.createdAt) || 0) - (Date.parse(a.paidAt || a.createdAt) || 0));
  }, [isProfessional, requests, tab, user]);

  if (!isProfessional) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <StatusBar style="dark" />
        <EmptyState
          icon="time-outline"
          title="Histórico disponível para prestadores"
          description="Entre como prestador para ver o histórico de serviços."
          actionLabel="Voltar"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      <View className="px-6 pt-16 pb-4">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 items-center justify-center" activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text className="flex-1 ml-2 text-[22px] font-bold text-gray-900">Histórico</Text>
          <View className="h-10 w-10" />
        </View>

        <View className="mt-5 flex-row rounded-full bg-gray-100 p-1">
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setTab('completed')}
            className="flex-1 h-11 items-center justify-center rounded-full"
            style={{ backgroundColor: tab === 'completed' ? '#00E7FF' : 'transparent' }}
          >
            <Text className="text-[13px] font-extrabold" style={{ color: tab === 'completed' ? 'white' : '#6B7280' }}>
              Concluídos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setTab('cancelled')}
            className="flex-1 h-11 items-center justify-center rounded-full"
            style={{ backgroundColor: tab === 'cancelled' ? '#00E7FF' : 'transparent' }}
          >
            <Text className="text-[13px] font-extrabold" style={{ color: tab === 'cancelled' ? 'white' : '#6B7280' }}>
              Cancelados
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#00E7FF" />
        </View>
      ) : data.length ? (
        <View className="px-6 pb-10">
          {data.map((r, idx) => (
            <TouchableOpacity
              key={r.id}
              activeOpacity={0.85}
              onPress={() => router.push({ pathname: '/request-details', params: { requestId: r.id } })}
              className="rounded-3xl bg-white px-4 py-4"
              style={{ borderWidth: 1, borderColor: '#EEF2F7', marginBottom: idx === data.length - 1 ? 0 : 12 }}
            >
              <View className="flex-row items-center">
                <Image source={r.clientAvatarUrl ? { uri: r.clientAvatarUrl } : AvatarFallback} className="h-12 w-12 rounded-full" resizeMode="cover" />
                <View className="ml-3 flex-1">
                  <Text className="text-[13px] font-extrabold text-gray-900">{r.clientName}</Text>
                  <Text className="mt-1 text-[11px] text-gray-400" numberOfLines={1}>
                    {r.serviceName} • {tab === 'completed' ? 'Concluído' : 'Cancelado'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </View>

              <View className="mt-3 flex-row items-center justify-between">
                <Text className="text-[11px] text-gray-400">
                  {r.date ? r.date : ''} {r.time ? `• ${r.time}` : ''}
                </Text>
                <Text className="text-[12px] font-extrabold text-gray-900">
                  {tab === 'completed' ? formatMoney(r.priceAmount, r.currency) : ''}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View className="px-6">
          <EmptyState
            icon={tab === 'completed' ? 'checkmark-done-outline' : 'close-circle-outline'}
            title={tab === 'completed' ? 'Sem serviços concluídos' : 'Sem serviços cancelados'}
            description={tab === 'completed' ? 'Quando receber pagamentos, eles vão aparecer aqui.' : 'Cancelamentos vão aparecer aqui.'}
            actionLabel="Atualizar"
            onAction={() => user?.id && fetchRequests(user.id)}
          />
        </View>
      )}
    </View>
  );
}


