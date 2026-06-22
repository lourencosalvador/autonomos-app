import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { ArrowDownLeft, ArrowUpRight, Clock, Lock } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import UnionArt from '../../assets/images/Union.svg';
import { EmptyState } from '../components/EmptyState';
import { WithdrawSheet } from '../components/WithdrawSheet';
import { useAuthStore } from '../stores/authStore';
import { isSupabaseConfigured, supabase, type PaymentRow, type WithdrawalRow } from '../lib/supabase';
import { createStripeConnectOnboarding, getBackendHealth, requestWithdrawal } from '../services/apiService';
import { computeWalletBalance, paymentEscrow, paymentProviderNet } from '../lib/walletBalance';
import { formatMoney } from '../lib/pricing';
import { toast } from '../lib/sonner';

type Filter = 'all' | 'payment' | 'withdrawal';

type Movement = {
  id: string;
  name: string;
  subtitle: string;
  date: string;
  amount: number; // assinado: + entrada, - saída
  type: 'payment' | 'withdrawal';
  escrow?: 'held' | 'released' | 'refunded';
  status?: string;
  ts: number;
};

const ProfileImage = require('../../assets/images/Profile.jpg');

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
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [paymentsTableMissing, setPaymentsTableMissing] = useState(false);
  const [fallbackPayments, setFallbackPayments] = useState<PaymentRow[]>([]);

  const iban = 'AO06 0040 0000 1234 5678 9012 3';

  const effectivePayments = payments.length ? payments : fallbackPayments;
  const balance = useMemo(() => computeWalletBalance(effectivePayments, withdrawals), [effectivePayments, withdrawals]);
  const currency = balance.currency;

  const movements = useMemo<Movement[]>(() => {
    const pays: Movement[] = (effectivePayments || [])
      .filter((p) => p.status === 'succeeded')
      .map((p) => {
        const ts = new Date(p.paid_at || p.created_at).getTime();
        const esc = paymentEscrow(p);
        return {
          id: `p_${p.id}`,
          name: 'Pagamento recebido',
          subtitle: esc === 'held' ? 'Retido (em processamento)' : 'Liberado (realizado)',
          date: new Date(ts).toLocaleString('pt-PT'),
          amount: paymentProviderNet(p),
          type: 'payment' as const,
          escrow: esc,
          ts,
        };
      });

    const withs: Movement[] = (withdrawals || []).map((w) => {
      const ts = new Date(w.requested_at || w.created_at).getTime();
      const statusLabel =
        w.status === 'processing' ? 'Em processamento (24h–48h)' : w.status === 'paid' ? 'Concluído' : w.status === 'failed' ? 'Falhou' : 'Cancelado';
      return {
        id: `w_${w.id}`,
        name: 'Saque FlexPay',
        subtitle: statusLabel,
        date: new Date(ts).toLocaleString('pt-PT'),
        amount: -Number(w.amount || 0),
        type: 'withdrawal' as const,
        status: w.status,
        ts,
      };
    });

    return [...pays, ...withs].sort((a, b) => b.ts - a.ts);
  }, [effectivePayments, withdrawals]);

  const loadWallet = async () => {
    if (!user) return;
    if (!isSupabaseConfigured) return;
    if (user.role !== 'professional') return;
    try {
      setLoading(true);
      setPaymentsTableMissing(false);
      setFallbackPayments([]);

      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPayments(((data || []) as any) as PaymentRow[]);

      // Saques
      const { data: withs } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false });
      setWithdrawals(((withs || []) as any) as WithdrawalRow[]);

      // Fallback: deriva de requests se não houver linhas em payments
      if (!data || (Array.isArray(data) && data.length === 0)) {
        await loadFallbackFromRequests();
      }
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (msg.includes("Could not find the table 'public.payments'")) {
        setPaymentsTableMissing(true);
        toast.error('Falta criar a tabela payments no Supabase (veja SUPABASE_SETUP.md).');
        await loadFallbackFromRequests();
        return;
      }
      toast.error(msg || 'Não foi possível carregar a carteira.');
    } finally {
      setLoading(false);
    }
  };

  const loadFallbackFromRequests = async () => {
    if (!user) return;
    try {
      const { data: reqs, error } = await supabase
        .from('requests')
        .select('id, client_name, price_amount, currency, paid_at, payment_status, escrow_status, provider_net, status, created_at')
        .eq('provider_id', user.id)
        .eq('payment_status', 'succeeded')
        .order('paid_at', { ascending: false });
      if (error || !reqs) return;
      const mapped: PaymentRow[] = (reqs as any[]).map((r) => ({
        id: String(r.id),
        request_id: String(r.id),
        client_id: null,
        provider_id: user.id,
        amount: Number(r.price_amount || 0),
        currency: String(r.currency || 'usd'),
        status: 'succeeded',
        stripe_payment_intent_id: String(r.id),
        paid_at: r.paid_at || null,
        escrow_status: r.escrow_status || (r.status === 'completed' ? 'released' : 'held'),
        provider_net: r.provider_net ?? null,
        created_at: r.created_at,
        updated_at: r.created_at,
      }));
      setFallbackPayments(mapped);
    } catch {
      // silencioso
    }
  };

  useEffect(() => {
    loadWallet();
    // Acorda o backend (Render free dorme) pra que o saque não estoure por cold start.
    getBackendHealth().catch(() => {});
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

  const handleWithdraw = async ({ amount }: { amount: number }) => {
    if (!user) return;
    setWithdrawing(true);
    try {
      toast.loading('Solicitando saque...');
      const resp = await requestWithdrawal({ providerId: user.id, amount });
      setWithdrawOpen(false);
      toast.success('Saque solicitado! O valor chega em 24h a 48h.');
      await loadWallet();
    } catch (e: any) {
      toast.error(e?.message || 'Não foi possível solicitar o saque.');
    } finally {
      setWithdrawing(false);
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
          <LinearGradient colors={['#034660', '#00E7FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 18, borderRadius: 24 }}>
            <View className="flex-row items-start justify-between">
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-white/90 text-[13px] font-bold">Saldo disponível</Text>
                  <MaterialCommunityIcons name="flash" size={16} color="rgba(255,255,255,0.9)" />
                </View>
                <Text className="mt-3 text-white text-[28px] font-extrabold">
                  {currency} {(balance.available / 100).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>

                <View className="mt-3 flex-row items-center justify-between">
                  <Text className="text-white/85 text-[12px] tracking-widest">{showIban ? iban : maskIban(iban)}</Text>
                  <TouchableOpacity onPress={() => setShowIban((v) => !v)} activeOpacity={0.85} className="h-9 w-9 items-center justify-center rounded-full bg-white/15">
                    <Ionicons name={showIban ? 'eye-off-outline' : 'eye-outline'} size={18} color="white" />
                  </TouchableOpacity>
                </View>
              </View>

              <View className="items-end z-10">
                <Image source={require('../../assets/images/logo-ligth.png')} style={{ width: 90, height: 22, opacity: 0.9 }} resizeMode="contain" />
              </View>
            </View>

            {/* Sub-saldos: retido + em saque */}
            <View className="mt-4 flex-row gap-2">
              <View className="flex-1 flex-row items-center gap-2 rounded-2xl bg-white/15 px-3 py-2">
                <Lock size={14} color="#fff" strokeWidth={2.4} />
                <View>
                  <Text className="text-white/75 text-[10px] font-bold">Retido</Text>
                  <Text className="text-white text-[12px] font-extrabold">
                    {currency} {(balance.pending / 100).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>
              <View className="flex-1 flex-row items-center gap-2 rounded-2xl bg-white/15 px-3 py-2">
                <Clock size={14} color="#fff" strokeWidth={2.4} />
                <View>
                  <Text className="text-white/75 text-[10px] font-bold">Em saque</Text>
                  <Text className="text-white text-[12px] font-extrabold">
                    {currency} {(balance.inWithdrawal / 100).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>
            </View>

            <View className="mt-4 flex-row items-center gap-2">
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setWithdrawOpen(true)}
                disabled={balance.available <= 0}
                className="flex-1 flex-row items-center justify-center rounded-full bg-white px-4 py-2.5"
                style={{ opacity: balance.available <= 0 ? 0.5 : 1 }}
              >
                <Ionicons name="cash-outline" size={16} color="#034660" />
                <Text className="text-[#034660] text-[12.5px] font-extrabold ml-2">Sacar</Text>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.85} onPress={handleOnboardStripe} className="flex-row items-center justify-center rounded-full bg-white/15 px-3.5 py-2.5">
                <Ionicons name="link-outline" size={16} color="white" />
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.85} onPress={loadWallet} className="flex-row items-center justify-center rounded-full bg-white/15 px-3.5 py-2.5">
                <Ionicons name={loading ? 'sync' : 'refresh'} size={16} color="white" />
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
                ? 'Para o histórico funcionar, crie as tabelas no Supabase (SQL em SUPABASE_SETUP.md / supabase_escrow_migration.sql).'
                : filter === 'all'
                  ? 'Quando houver movimentações, elas aparecem aqui.'
                  : 'Não há movimentos para este filtro.'
            }
            actionLabel={paymentsTableMissing ? 'Tentar novamente' : filter !== 'all' ? 'Ver todos' : undefined}
            onAction={paymentsTableMissing ? loadWallet : filter !== 'all' ? () => setFilter('all') : undefined}
          />
        }
        renderItem={({ item }) => {
          const isIn = item.amount >= 0;
          const isHeld = item.type === 'payment' && item.escrow === 'held';
          return (
            <View className="flex-row items-center rounded-3xl bg-white px-4 py-4" style={{ borderWidth: 1, borderColor: '#EEF2F7' }}>
              <View
                className="h-11 w-11 items-center justify-center rounded-full"
                style={{ backgroundColor: item.type === 'withdrawal' ? '#FEF3C7' : isHeld ? '#EFF6FF' : '#ECFDF5' }}
              >
                {item.type === 'withdrawal' ? (
                  <ArrowUpRight size={20} color="#D97706" strokeWidth={2.6} />
                ) : isHeld ? (
                  <Lock size={18} color="#2563EB" strokeWidth={2.6} />
                ) : (
                  <ArrowDownLeft size={20} color="#059669" strokeWidth={2.6} />
                )}
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-[13px] font-extrabold text-gray-900">{item.name}</Text>
                <Text className="mt-1 text-[11px] text-gray-400">
                  {item.subtitle} <Text className="text-gray-300">• {item.date}</Text>
                </Text>
              </View>
              <Text
                className="text-[12.5px] font-extrabold"
                style={{ color: item.type === 'withdrawal' ? '#D97706' : isHeld ? '#2563EB' : '#059669' }}
              >
                {isIn ? '+' : '-'}
                {formatMoney(Math.abs(item.amount), currency)}
              </Text>
            </View>
          );
        }}
      />

      <WithdrawSheet
        visible={withdrawOpen}
        available={balance.available}
        currency={currency}
        processing={withdrawing}
        onClose={() => (withdrawing ? null : setWithdrawOpen(false))}
        onConfirm={handleWithdraw}
      />
    </View>
  );
}
