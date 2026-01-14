import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import UnionArt from '../../assets/images/Union.svg';
import { EmptyState } from '../components/EmptyState';
import { useAuthStore } from '../stores/authStore';
import { isSupabaseConfigured, supabase, type PaymentRow } from '../lib/supabase';
import { createStripeConnectOnboarding } from '../services/apiService';
import { toast } from '../lib/sonner';

type MovementType = 'payment' | 'withdrawal';
type Filter = 'all' | MovementType;

type Movement = {
  id: string;
  name: string;
  subtitle: string;
  date: string;
  amount: number;
  type: MovementType;
  avatar?: any;
};

const ProfileImage = require('../../assets/images/Profile.jpg');

function formatKz(amount: number) {
  const sign = amount >= 0 ? '+' : '-';
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${sign}${formatted}`;
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
  const user = useAuthStore((s) => s.user);
  const [showIban, setShowIban] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [paymentsTableMissing, setPaymentsTableMissing] = useState(false);
  const [fallbackMovements, setFallbackMovements] = useState<Movement[]>([]);

  const iban = 'AO06 0040 0000 1234 5678 9012 3';

  const movements = useMemo<Movement[]>(() => {
    const mapped = (payments || [])
      .filter((p) => p.status === 'succeeded')
      .map((p) => {
        const date = new Date(p.paid_at || p.created_at);
        const dateStr = date.toLocaleString('pt-PT');
        return {
          id: p.id,
          name: 'Pagamento',
          subtitle: 'Pagamento Recebido',
          date: dateStr,
          amount: p.amount,
          type: 'payment' as const,
        };
      });
    return mapped.length ? mapped : fallbackMovements;
  }, [fallbackMovements, payments]);

  const balance = useMemo(() => {
    return movements.reduce((sum, m) => sum + m.amount, 0);
  }, [movements]);

  const currency = useMemo(() => {
    const c = payments?.find((p) => p.currency)?.currency || 'USD';
    return c.toUpperCase();
  }, [payments]);

  const loadPayments = async () => {
    if (!user) return;
    if (!isSupabaseConfigured) return;
    if (user.role !== 'professional') return;
    try {
      setLoading(true);
      setPaymentsTableMissing(false);
      setFallbackMovements([]);
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPayments(((data || []) as any) as PaymentRow[]);

      // Fallback: se não houver pagamentos ainda, tenta derivar do requests.payment_status (serve para debug)
      if (!data || (Array.isArray(data) && data.length === 0)) {
        const { data: reqs, error: reqErr } = await supabase
          .from('requests')
          .select('id, client_name, price_amount, currency, paid_at, payment_status, created_at')
          .eq('provider_id', user.id)
          .eq('payment_status', 'succeeded')
          .order('paid_at', { ascending: false });
        if (!reqErr && reqs && Array.isArray(reqs)) {
          const mapped: Movement[] = reqs.map((r: any) => {
            const date = new Date(r.paid_at || r.created_at);
            return {
              id: String(r.id),
              name: String(r.client_name || 'Cliente'),
              subtitle: 'Pagamento Recebido',
              date: date.toLocaleString('pt-PT'),
              amount: Number(r.price_amount || 0),
              type: 'payment',
              avatar: ProfileImage,
            };
          });
          setFallbackMovements(mapped);
        }
      }
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (msg.includes("Could not find the table 'public.payments'")) {
        setPaymentsTableMissing(true);
        // Evita spam de toast em cada refresh
        toast.error('Falta criar a tabela payments no Supabase (veja o SQL no SUPABASE_SETUP.md).');
        // Mesmo sem a tabela payments, tentamos mostrar algo via requests.payment_status
        try {
          const { data: reqs, error: reqErr } = await supabase
            .from('requests')
            .select('id, client_name, price_amount, currency, paid_at, payment_status, created_at')
            .eq('provider_id', user.id)
            .eq('payment_status', 'succeeded')
            .order('paid_at', { ascending: false });
          if (!reqErr && reqs && Array.isArray(reqs)) {
            const mapped: Movement[] = reqs.map((r: any) => {
              const date = new Date(r.paid_at || r.created_at);
              return {
                id: String(r.id),
                name: String(r.client_name || 'Cliente'),
                subtitle: 'Pagamento Recebido',
                date: date.toLocaleString('pt-PT'),
                amount: Number(r.price_amount || 0),
                type: 'payment',
                avatar: ProfileImage,
              };
            });
            setFallbackMovements(mapped);
          }
        } catch {}
        return;
      }
      toast.error(msg || 'Não foi possível carregar a carteira.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [user?.id]);

  const filtered = useMemo(() => {
    if (filter === 'all') return movements;
    return movements.filter((m) => m.type === filter);
  }, [filter, movements]);

  const handleOnboardStripe = async () => {
    if (!user) return;
    try {
      toast.loading('Abrindo ativação de recebimentos...');
      const returnUrl = 'https://example.com/stripe/return';
      const resp = await createStripeConnectOnboarding({ providerId: user.id, returnUrl });
      await WebBrowser.openBrowserAsync(resp.url);
      toast.success('Finalize no Stripe e volte para o app.');
    } catch (e: any) {
      toast.error(e?.message || 'Não foi possível abrir a ativação.');
    }
  };

  if (!user || user.role !== 'professional') {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <StatusBar style="dark" />
        <EmptyState
          icon="wallet-outline"
          title="Carteira disponível para prestadores"
          description="Entre como prestador para ver seus recebimentos e histórico."
          actionLabel="Voltar"
          onAction={() => router.back()}
        />
      </View>
    );
  }

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
                <Text className="mt-6 text-white text-[26px] font-extrabold">
                  {currency} {(balance / 100).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>

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
              <TouchableOpacity activeOpacity={0.85} onPress={handleOnboardStripe} className="flex-row items-center justify-center rounded-full bg-white/15 px-4 py-2">
                <Text className="text-white text-[12px] font-bold mr-2">Ativar recebimentos</Text>
                <Ionicons name="link-outline" size={16} color="white" />
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.85} onPress={loadPayments} className="flex-row items-center justify-center rounded-full bg-white/15 px-4 py-2">
                <Text className="text-white text-[12px] font-bold mr-2">{loading ? 'Atualizando...' : 'Atualizar'}</Text>
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
              paymentsTableMissing
                ? 'Para o histórico funcionar, crie a tabela "public.payments" no Supabase (SQL em SUPABASE_SETUP.md).'
                : filter === 'all'
                  ? 'Quando houver movimentações, elas aparecem aqui.'
                  : 'Não há movimentos para este filtro.'
            }
            actionLabel={paymentsTableMissing ? 'Tentar novamente' : filter !== 'all' ? 'Ver todos' : undefined}
            onAction={
              paymentsTableMissing
                ? loadPayments
                : filter !== 'all'
                  ? () => setFilter('all')
                  : undefined
            }
          />
        }
        renderItem={({ item }) => {
          const isPositive = item.amount >= 0;
          return (
            <View className="flex-row items-center rounded-3xl bg-white px-4 py-4" style={{ borderWidth: 1, borderColor: '#EEF2F7' }}>
              <Image source={item.avatar || ProfileImage} className="h-12 w-12 rounded-full" resizeMode="cover" />
              <View className="ml-3 flex-1">
                <Text className="text-[13px] font-extrabold text-gray-900">{item.name}</Text>
                <Text className="mt-1 text-[11px] text-gray-400">
                  {item.subtitle}{' '}
                  <Text className="text-gray-300">• {item.date}</Text>
                </Text>
              </View>
              <Text className={`text-[12px] font-extrabold ${isPositive ? 'text-brand-cyan' : 'text-red-500'}`}>
                {formatKz(item.amount / 100)} {currency}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}


