import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Check, Clock, Loader2, Lock, X, Zap } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRequestsStore } from '../stores/requestsStore';
import { toast } from '../lib/sonner';
import { useAuthStore } from '../stores/authStore';
import { SetPriceModal } from '../components/SetPriceModal';
import { confirmStripePayment, createGpayPayment, createStripePaymentIntent, getBackendHealth } from '../services/apiService';
import type { PaymentMethod } from '../components/PaymentBreakdownSheet';
import { useStripe } from '@stripe/stripe-react-native';
import { PaymentBreakdownSheet } from '../components/PaymentBreakdownSheet';
import { ClientReviewModal } from '../components/ClientReviewModal';
import { CancelReasonModal } from '../components/CancelReasonModal';
import { computeFees, computeInstallments, formatMoney } from '../lib/pricing';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import * as Linking from 'expo-linking';

function statusUi(status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed') {
  switch (status) {
    case 'pending':
      return { label: 'Pendente', icon: <Loader2 size={18} color="#F59E0B" strokeWidth={2.5} />, color: '#F59E0B', bg: '#FFFBEB' };
    case 'accepted':
      return { label: 'Aceite', icon: <Check size={18} color="#00E7FF" strokeWidth={3} />, color: '#00A9BA', bg: '#ECFEFF' };
    case 'rejected':
      return { label: 'Rejeitado', icon: <X size={18} color="#EF4444" strokeWidth={3} />, color: '#EF4444', bg: '#FEF2F2' };
    case 'cancelled':
      return { label: 'Cancelado', icon: <X size={18} color="#9CA3AF" strokeWidth={3} />, color: '#6B7280', bg: '#F3F4F6' };
    case 'completed':
      return { label: 'Concluído', icon: <Check size={18} color="#10B981" strokeWidth={3} />, color: '#059669', bg: '#ECFDF5' };
  }
}

/** Estado do dinheiro (escrow) para exibição. */
function escrowUi(state: 'none' | 'held' | 'released') {
  switch (state) {
    case 'held':
      return { label: 'Em processamento', color: '#2563EB', bg: '#EFF6FF', icon: <Clock size={14} color="#2563EB" strokeWidth={2.6} /> };
    case 'released':
      return { label: 'Realizado', color: '#059669', bg: '#ECFDF5', icon: <Check size={14} color="#059669" strokeWidth={3} /> };
    default:
      return { label: 'Pendente', color: '#F59E0B', bg: '#FFFBEB', icon: <Clock size={14} color="#F59E0B" strokeWidth={2.6} /> };
  }
}

export default function RequestDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ requestId?: string }>();
  const requestId = (params.requestId || '').toString();

  const { user } = useAuthStore();
  const request = useRequestsStore((s) => s.requests.find((r) => r.id === requestId));
  const setRequestStatus = useRequestsStore((s) => s.setRequestStatus);
  const setRequestPrice = useRequestsStore((s) => s.setRequestPrice);
  const markRequestPaid = useRequestsStore((s) => s.markRequestPaid);
  const releaseEscrow = useRequestsStore((s) => s.releaseEscrow);
  const submitClientReview = useRequestsStore((s) => s.submitClientReview);
  const cancelRequest = useRequestsStore((s) => s.cancelRequest);
  const deleteRequest = useRequestsStore((s) => s.deleteRequest);
  const fetchRequests = useRequestsStore((s) => s.fetchRequests);
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [clientReviewOpen, setClientReviewOpen] = useState(false);
  const [submittingClientReview, setSubmittingClientReview] = useState(false);
  const [clientRating, setClientRating] = useState<{ avg: number; count: number }>({ avg: 0, count: 0 });
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const stripe = useStripe();

  // O backend no Render (free) hiberna após inatividade. Acordamos assim que o pedido abre,
  // pra que o pagamento/liberação não estoure por cold start quando o usuário tocar no botão.
  useEffect(() => {
    getBackendHealth().catch(() => {});
  }, []);

  // Nota do cliente (estrelas dadas pelos prestadores) — mostrada para o prestador.
  useEffect(() => {
    const clientId = (request as any)?.clientId;
    if (!clientId || !isSupabaseConfigured) return;
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase.from('client_reviews').select('rating').eq('client_id', clientId);
        if (error) throw error;
        const list = Array.isArray(data) ? data : [];
        const count = list.length;
        const sum = list.reduce((acc: number, r: any) => acc + Number(r?.rating || 0), 0);
        if (mounted) setClientRating({ avg: count ? sum / count : 0, count });
      } catch {
        if (mounted) setClientRating({ avg: 0, count: 0 });
      }
    })();
    return () => {
      mounted = false;
    };
  }, [(request as any)?.clientId, (request as any)?.clientReviewedAt]);

  // Prestador: depois do serviço ser realizado (escrow liberado), abre a janela de avaliação
  // do cliente automaticamente (uma vez), se ainda não avaliou.
  useEffect(() => {
    if (!request || !user) return;
    const isProvider = user.role === 'professional' && request.providerId === user.id;
    const released = String((request as any).escrowStatus || '') === 'released' || request.status === 'completed';
    if (isProvider && released && !(request as any).clientReviewedAt) {
      setClientReviewOpen(true);
    }
  }, [request?.id, (request as any)?.escrowStatus, request?.status, (request as any)?.clientReviewedAt, user?.id]);

  const status = (request as any)?.status || 'pending';
  const isPaid = String((request as any)?.paymentStatus || '') === 'succeeded' || !!(request as any)?.paidAt;
  const isReleased = String((request as any)?.escrowStatus || '') === 'released' || status === 'completed';
  const isHeld = isPaid && !isReleased;
  const escrowState: 'none' | 'held' | 'released' = isReleased ? 'released' : isHeld ? 'held' : 'none';

  // Serviço de vários dias (FlexPay 30/70)
  const isMultiDay = !!(request as any)?.isMultiDay;
  const installmentsPaid = Number((request as any)?.installmentsPaid ?? 0);
  const installmentsTotal = isMultiDay ? 2 : 1;
  // Falta pagar a parcela final (70%)? Só faz sentido depois da 1ª parcela e antes de concluir.
  const needsFinalInstallment = isMultiDay && isHeld && installmentsPaid < installmentsTotal;
  // "Serviço concluído" só liberta quando todas as parcelas estiverem pagas.
  const canComplete = isHeld && (!isMultiDay || installmentsPaid >= installmentsTotal);

  const ui = useMemo(() => (request ? statusUi(status) : null), [request, status]);
  const esc = useMemo(() => escrowUi(escrowState), [escrowState]);

  // Com quem conversar: o cliente fala com o prestador e o prestador com o cliente.
  const chatPeer = useMemo(() => {
    if (!request || !user) return null;
    const isProvider = user.role === 'professional' && request.providerId === user.id;
    return isProvider
      ? { id: request.clientId, name: request.clientName }
      : { id: request.providerId, name: request.providerName };
  }, [request, user]);

  const openChat = () => {
    if (!chatPeer?.id) return toast.error('Conversa indisponível para este pedido.');
    router.push({ pathname: '/chat', params: { otherUserId: chatPeer.id, otherUserName: chatPeer.name } });
  };

  if (!request) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <StatusBar style="dark" />
        <Text className="text-[16px] font-bold text-gray-900">Pedido não encontrado</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 px-5 py-3 rounded-full bg-brand-cyan" activeOpacity={0.85}>
          <Text className="text-white font-bold">Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const canRespond = status === 'pending' && !!user && user.role === 'professional' && request.providerId === user.id;
  const isClientOwner = !!user && user.role === 'client' && request.clientId === user.id;
  const isProviderOwner = !!user && user.role === 'professional' && request.providerId === user.id;
  const canCancel =
    (status === 'pending' && isClientOwner) ||
    (status === 'accepted' && !isPaid && (isClientOwner || isProviderOwner));

  const agreed = Number((request as any).priceAmount || 0);
  const hasPrice = agreed > 0;
  const isUrgent = !!(request as any).isUrgent;
  const currency = (request as any).currency;

  // Snapshot de taxas: usa o que veio do pagamento; senão calcula a partir do acordado.
  const fees = useMemo(() => computeFees(agreed, isUrgent), [agreed, isUrgent]);
  const clientTotal = Number((request as any).clientTotal || 0) || fees.clientTotal;
  const providerNet = Number((request as any).providerNet || 0) || fees.providerNet;
  // Plano de parcelas (vários dias = 30/70). Para serviço normal é uma parcela só.
  const plan = useMemo(() => computeInstallments(fees, isMultiDay), [fees, isMultiDay]);

  // Aguarda a confirmação do pagamento via Realtime (webhook → Supabase → push imediato).
  // `isDone` decide quando a parcela em causa está confirmada (parcela 1 vs. parcela final).
  const waitForPayment = (id: string, timeoutMs: number, isDone: (row: any) => boolean): Promise<boolean> => {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        supabase.removeChannel(channel);
        resolve(false);
      }, timeoutMs);

      const channel = supabase
        .channel(`payment-${id}-${Date.now()}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'requests', filter: `id=eq.${id}` },
          (payload) => {
            if (isDone(payload.new as any)) {
              clearTimeout(timer);
              supabase.removeChannel(channel);
              resolve(true);
            }
          }
        )
        .subscribe();
    });
  };

  // Pagamento via GPay: 'multicaixa' (push ao telemóvel) ou 'reference' (número de referência).
  const payWithGpay = async (opts: { isUrgent: boolean; method: 'multicaixa' | 'reference'; phone?: string }) => {
    if (!user) return;
    const phone = String(opts.phone || '').replace(/[^\d]/g, '');
    if (phone.length < 9) {
      toast.error('Número de telemóvel inválido.');
      return;
    }
    setPaying(true);
    try {
      toast.loading(opts.method === 'reference' ? 'A gerar referência...' : 'A enviar pedido para o Multicaixa Express...');
      const r = await createGpayPayment({
        requestId: request.id,
        clientId: user.id,
        method: opts.method,
        phone,
        name: user.name,
        email: (user as any).email || '',
        isUrgent: opts.isUrgent,
      });

      if (opts.method === 'reference') {
        // Pago externamente (ATM/banco). Mostra a referência; o webhook confirma depois.
        setPayOpen(false);
        const lines = [
          r.entity ? `Entidade: ${r.entity}` : null,
          r.referenceNumber ? `Referência: ${r.referenceNumber}` : 'Referência gerada.',
          `Valor: ${r.amount} Kz`,
        ]
          .filter(Boolean)
          .join('\n');
        Alert.alert(
          'Referência de pagamento',
          `${lines}\n\nPague num ATM, Multicaixa ou app do banco. O pedido confirma automaticamente após o pagamento.`
        );
        fetchRequests(user.id).catch(() => {});
        return;
      }

      // Multicaixa Express: o cliente confirma no telemóvel → webhook → Realtime.
      toast.success('Confirme o pagamento na app Multicaixa Express 📲');
      // Para vários dias, esperamos a parcela em causa (a 1ª já deixa payment_status=succeeded).
      const targetInstallment = isMultiDay ? installmentsPaid + 1 : 1;
      const isDone = (row: any) =>
        isMultiDay
          ? Number(row?.installments_paid ?? 0) >= targetInstallment
          : row?.payment_status === 'succeeded' || row?.escrow_status === 'held';
      const ok = await waitForPayment(request.id, 60000, isDone);
      if (ok) {
        setPayOpen(false);
        const finalPaid = isMultiDay && targetInstallment >= installmentsTotal;
        toast.success(
          isMultiDay
            ? finalPaid
              ? 'Parcela final paga e retida 🔒'
              : 'Entrada de 30% paga e enviada ao prestador ✅'
            : 'Pagamento confirmado e retido 🔒'
        );
      } else {
        toast('Aguardando a confirmação no Multicaixa Express. O pedido atualiza assim que confirmares.');
      }
      fetchRequests(user.id).catch(() => {});
    } catch (e: any) {
      toast.error(e?.message || 'Não foi possível iniciar o pagamento.');
    } finally {
      setPaying(false);
    }
  };

  const handlePay = async (opts: { isUrgent: boolean; method?: PaymentMethod; phone?: string }) => {
    if (!user) return;
    if (opts.method === 'multicaixa' || opts.method === 'reference') {
      await payWithGpay({ isUrgent: opts.isUrgent, method: opts.method, phone: opts.phone });
      return;
    }
    if (!stripe) {
      toast.error('Stripe não está disponível.');
      return;
    }
    setPaying(true);
    try {
      const publishableKey = String(process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '').trim();
      const pkMode: 'test' | 'live' | 'unknown' = publishableKey.startsWith('pk_test_')
        ? 'test'
        : publishableKey.startsWith('pk_live_')
          ? 'live'
          : 'unknown';
      if (!publishableKey || pkMode === 'unknown') {
        setPaying(false);
        toast.error('Chave pública do Stripe inválida no app (EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY).');
        return;
      }

      try {
        const health = await getBackendHealth();
        const serverMode = health?.stripeMode || 'unknown';
        if (serverMode !== 'unknown' && serverMode !== pkMode) {
          setPaying(false);
          toast.error(`Chaves Stripe misturadas: app=${pkMode} e servidor=${serverMode}.`);
          return;
        }
      } catch {
        // não bloqueia
      }

      // Vários dias: o cartão também paga por parcela (30% ou 70%).
      const targetInstallment = isMultiDay ? installmentsPaid + 1 : 1;
      const payPlan = computeInstallments(computeFees(agreed, opts.isUrgent), isMultiDay);

      toast.loading('Preparando pagamento seguro...');
      const resp = await createStripePaymentIntent({
        requestId: request.id,
        clientId: user.id,
        isUrgent: opts.isUrgent,
        installment: targetInstallment,
      });
      const serverModeFromPI = resp?.stripeMode || 'unknown';
      if (serverModeFromPI !== 'unknown' && serverModeFromPI !== pkMode) {
        setPaying(false);
        toast.error(`Chaves Stripe misturadas: app=${pkMode} e servidor=${serverModeFromPI}.`);
        return;
      }
      if (typeof resp?.livemode === 'boolean') {
        const piMode = resp.livemode ? 'live' : 'test';
        if (piMode !== pkMode) {
          setPaying(false);
          toast.error(`Chaves Stripe misturadas: app=${pkMode} e PI=${piMode}.`);
          return;
        }
      }

      const returnURL = Linking.createURL('stripe-redirect');
      const init = await stripe.initPaymentSheet({
        merchantDisplayName: 'Autonomos',
        paymentIntentClientSecret: resp.paymentIntentClientSecret,
        allowsDelayedPaymentMethods: true,
        returnURL,
      });
      if (init.error) {
        const code = (init.error as any)?.code ? ` (${String((init.error as any).code)})` : '';
        throw new Error(`${init.error.message}${code}`);
      }
      const presented = await stripe.presentPaymentSheet();
      if (presented.error) {
        const code = (presented.error as any)?.code ? ` (${String((presented.error as any).code)})` : '';
        throw new Error(`${presented.error.message}${code}${resp?.paymentIntentId ? ` • PI: ${resp.paymentIntentId}` : ''}`);
      }

      if (resp?.paymentIntentId) {
        try {
          await confirmStripePayment({ requestId: request.id, paymentIntentId: resp.paymentIntentId });
        } catch {
          // não bloqueia a UX
        }
      }

      // Marca como pago + RETIDO (escrow) — NÃO conclui ainda.
      await markRequestPaid({
        id: request.id,
        paymentIntentId: resp?.paymentIntentId || null,
        isUrgent: opts.isUrgent,
        fees: resp?.fees
          ? {
              clientTotal: resp.fees.clientTotal,
              requestFee: resp.fees.requestFee,
              serviceFee: resp.fees.serviceFee,
              urgentBonus: resp.fees.urgentBonus,
              providerNet: resp.fees.providerNet,
              platformNet: resp.fees.platformNet,
            }
          : null,
        // Vários dias: grava a parcela paga + split (30% liberado / 70% retido).
        multiDay: isMultiDay
          ? {
              installmentsPaid: targetInstallment,
              providerReleasedAmount: payPlan.firstProviderNet,
              providerHeldAmount: targetInstallment >= installmentsTotal ? payPlan.finalProviderNet : null,
            }
          : null,
      });

      setPayOpen(false);
      const finalPaidCard = isMultiDay && targetInstallment >= installmentsTotal;
      toast.success(
        isMultiDay
          ? finalPaidCard
            ? 'Parcela final paga e retida 🔒'
            : 'Entrada de 30% paga e enviada ao prestador ✅'
          : 'Pagamento retido com segurança 🔒'
      );
      fetchRequests(user.id).catch(() => {});
    } catch (e: any) {
      toast.error(e?.message || 'Não foi possível concluir o pagamento.');
    } finally {
      setPaying(false);
    }
  };

  const handleRelease = () => {
    // Vários dias: não deixa concluir antes de a parcela final (70%) estar paga.
    if (!canComplete) {
      toast.error('Pague a parcela final (70%) antes de concluir o serviço.');
      return;
    }
    Alert.alert(
      'Confirmar conclusão',
      'Confirma que o serviço foi concluído? O valor retido será liberado para o prestador e não poderá ser revertido pelo app.',
      [
        { text: 'Ainda não', style: 'cancel' },
        {
          text: 'Sim, concluir',
          onPress: async () => {
            if (!user) return;
            setReleasing(true);
            try {
              toast.loading('Liberando pagamento...');
              await releaseEscrow({ id: request.id, clientId: user.id });
              toast.success('Serviço concluído! Pagamento liberado.');
              router.push({
                pathname: '/avaliar',
                params: {
                  requestId: request.id,
                  providerId: request.providerId,
                  providerName: request.providerName,
                  providerAvatarUrl: (request as any)?.providerAvatarUrl || '',
                  serviceName: request.serviceName,
                },
              });
              fetchRequests(user.id).catch(() => {});
            } catch (e: any) {
              toast.error(e?.message || 'Não foi possível liberar o pagamento.');
            } finally {
              setReleasing(false);
            }
          },
        },
      ]
    );
  };

  const handleSubmitClientReview = async (args: { polite: boolean; changedScope: boolean; comment?: string }) => {
    if (!user) return;
    setSubmittingClientReview(true);
    try {
      toast.loading('Enviando avaliação...');
      await submitClientReview({
        requestId: request.id,
        providerId: request.providerId,
        clientId: request.clientId,
        providerAvatarUrl: (user as any)?.avatar || null,
        polite: args.polite,
        changedScope: args.changedScope,
        comment: args.comment,
      });
      toast.success('Cliente avaliado!');
      setClientReviewOpen(false);
      fetchRequests(user.id).catch(() => {});
    } catch (e: any) {
      toast.error(e?.message || 'Não foi possível enviar a avaliação.');
    } finally {
      setSubmittingClientReview(false);
    }
  };

  // Cancelamento com motivo (modal). Lista de motivos muda conforme cliente/prestador.
  const confirmCancel = async (reason: string) => {
    setCancelling(true);
    try {
      toast.loading('A cancelar...');
      await cancelRequest(request.id, { reason, by: isProviderOwner ? 'provider' : 'client' });
      toast.success('Pedido cancelado.');
      setCancelOpen(false);
      router.back();
    } catch (e: any) {
      toast.error(e?.message || 'Não foi possível cancelar o pedido.');
    } finally {
      setCancelling(false);
    }
  };

  // Catálogo (já tem preço): aceita direto, sem modal. Fica no detalhe.
  const handleAcceptDirect = async () => {
    try {
      toast.loading('Aceitando...');
      await setRequestStatus(request.id, 'accepted');
      toast.success('Pedido aceite.');
      if (user?.id) fetchRequests(user.id).catch(() => {});
    } catch {
      toast.error('Não foi possível aceitar o pedido.');
    }
  };

  // Personalizado (sem preço): abre o modal de preço; ao guardar, define o preço e aceita.
  const handleAcceptWithPrice = async ({ priceAmount, currency }: { priceAmount: number; currency: string }) => {
    await setRequestPrice({ id: request.id, priceAmount, currency });
    if (status === 'pending') {
      await setRequestStatus(request.id, 'accepted');
    }
    if (user?.id) fetchRequests(user.id).catch(() => {});
  };

  // Ao tocar em "Aceitar": catálogo → direto; personalizado → modal de preço.
  const onAcceptPress = () => {
    if (hasPrice) handleAcceptDirect();
    else setPriceModalOpen(true);
  };

  const handleReject = async () => {
    try {
      toast.loading('Atualizando...');
      await setRequestStatus(request.id, 'rejected');
      toast.success('Pedido rejeitado.');
      router.back();
    } catch {
      toast.error('Não foi possível rejeitar o pedido.');
    }
  };

  const handleDelete = () => {
    Alert.alert('Apagar pedido', 'Tem certeza que deseja apagar este pedido?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: () => {
          toast.loading('Apagando...');
          deleteRequest(request.id)
            .then(() => {
              toast.success('Pedido apagado.');
              router.back();
            })
            .catch(() => toast.error('Não foi possível apagar o pedido.'));
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      <View className="px-6 pt-16 pb-4">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 items-center justify-center" activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text className="flex-1 ml-2 text-[22px] font-bold text-gray-900">Detalhe do Pedido</Text>
          <TouchableOpacity onPress={openChat} className="h-10 w-10 items-center justify-center" activeOpacity={0.7}>
            <Ionicons name="chatbubble-ellipses-outline" size={22} color="#00A9BA" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} className="h-10 w-10 items-center justify-center" activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={22} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="px-6">
          {isMultiDay ? (
            <View className="mb-4 rounded-2xl bg-amber-50 px-4 py-3.5" style={{ borderWidth: 1, borderColor: '#FDE68A' }}>
              <View className="flex-row items-center gap-2">
                <Ionicons name="calendar" size={16} color="#D97706" />
                <Text className="text-[13px] font-extrabold text-amber-800">Serviço de vários dias</Text>
                <View className="ml-auto rounded-full bg-amber-100 px-2.5 py-0.5">
                  <Text className="text-[10.5px] font-extrabold text-amber-700">
                    {Math.min(installmentsPaid, installmentsTotal)}/{installmentsTotal} parcelas
                  </Text>
                </View>
              </View>
              <Text className="mt-2 text-[11.5px] leading-4 font-bold text-amber-800/90">
                {isProviderOwner
                  ? 'Pagamento em 2 partes: recebes 30% assim que o cliente pagar a 1ª parte (já sacável) e os 70% finais quando ele confirmar a conclusão.'
                  : 'Pagamento em 2 partes: 30% entregues ao prestador no arranque e 70% libertados quando confirmares que o serviço foi concluído.'}
              </Text>
            </View>
          ) : null}
          <View className="rounded-3xl bg-gray-100 px-5 py-5">
            <View className="flex-row items-center justify-between">
              <Text className="text-[12px] text-gray-500">Serviço</Text>
              {isUrgent ? (
                <View className="flex-row items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1">
                  <Zap size={12} color="#D97706" strokeWidth={2.8} fill="#F59E0B" />
                  <Text className="text-[11px] font-extrabold text-amber-700">Urgente</Text>
                </View>
              ) : null}
            </View>
            <Text className="mt-1 text-[18px] font-extrabold text-gray-900">{request.serviceName}</Text>

            <View className="mt-4 flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-[12px] text-gray-500">Cliente</Text>
                <Text className="mt-1 text-[14px] font-bold text-gray-900">{request.clientName}</Text>
                {isProviderOwner ? (
                  <View className="mt-1 flex-row items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Ionicons
                        key={s}
                        name={s <= Math.round(clientRating.avg) ? 'star' : 'star-outline'}
                        size={12}
                        color={s <= Math.round(clientRating.avg) ? '#FBBF24' : '#D1D5DB'}
                      />
                    ))}
                    <Text className="ml-1 text-[10px] font-bold text-gray-400">
                      {clientRating.count ? `${clientRating.avg.toFixed(1)} (${clientRating.count})` : 'novo'}
                    </Text>
                  </View>
                ) : null}
              </View>
              <View className="items-end">
                <Text className="text-[12px] text-gray-500">Estado</Text>
                <View className="mt-2 flex-row items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: ui?.bg }}>
                  {ui?.icon}
                  <Text className="text-[13px] font-bold" style={{ color: ui?.color }}>
                    {ui?.label}
                  </Text>
                </View>
              </View>
            </View>

            <View className="mt-5">
              <Text className="text-[12px] text-gray-500">Prestador</Text>
              <Text className="mt-1 text-[14px] font-bold text-gray-900">{request.providerName}</Text>
            </View>

            <View className="mt-5 flex-row gap-4">
              <View className="flex-1">
                <Text className="text-[12px] text-gray-500">Data</Text>
                <Text className="mt-1 text-[14px] font-bold text-gray-900">{(request as any).date || '-'}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-[12px] text-gray-500">Hora</Text>
                <Text className="mt-1 text-[14px] font-bold text-gray-900">{(request as any).time || '-'}</Text>
              </View>
            </View>

            <View className="mt-5">
              <Text className="text-[12px] text-gray-500">Localização</Text>
              <Text className="mt-1 text-[14px] font-bold text-gray-900">{(request as any).location || '-'}</Text>
            </View>

            <View className="mt-5">
              <Text className="text-[12px] text-gray-500">Descrição</Text>
              <Text className="mt-2 text-[12px] leading-5 text-gray-700">{(request as any).description || 'Sem descrição.'}</Text>
            </View>
          </View>

          {/* Conversar com a outra parte */}
          {chatPeer?.id ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={openChat}
              className="mt-4 h-13 flex-row items-center justify-center gap-2 rounded-full"
              style={{ height: 52, borderWidth: 1.5, borderColor: '#00E7FF' }}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={18} color="#00A9BA" />
              <Text className="text-[14px] font-extrabold text-cyan-700">
                {isProviderOwner ? 'Conversar com o cliente' : 'Conversar com o prestador'}
              </Text>
            </TouchableOpacity>
          ) : null}

          {/* Bloco de pagamento — mostra a quebra de preço sempre que há valor definido. */}
          {hasPrice && status !== 'rejected' && status !== 'cancelled' ? (
          <View className="mt-4 rounded-3xl bg-white px-5 py-5" style={{ borderWidth: 1, borderColor: '#EEF2F7' }}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Lock size={15} color="#00A9BA" strokeWidth={2.6} />
                <Text className="text-[13px] font-extrabold text-gray-900">Pagamento</Text>
              </View>
              <View className="flex-row items-center gap-1.5 px-3 py-1 rounded-full" style={{ backgroundColor: esc.bg }}>
                {esc.icon}
                <Text className="text-[12px] font-extrabold" style={{ color: esc.color }}>
                  {esc.label}
                </Text>
              </View>
            </View>

            <View className="mt-3">
              <View className="flex-row items-center justify-between py-1">
                <Text className="text-[12.5px] font-bold text-gray-500">Valor do serviço</Text>
                <Text className="text-[12.5px] font-bold text-gray-700">{formatMoney(agreed, currency)}</Text>
              </View>

              {/* Cliente vê o total que paga; prestador vê o líquido que recebe */}
              {isClientOwner ? (
                <>
                  <View className="flex-row items-center justify-between py-1">
                    <Text className="text-[12.5px] font-bold text-gray-500">
                      Taxa de solicitação ({isUrgent ? '20' : '10'}%)
                    </Text>
                    <Text className="text-[12.5px] font-bold text-gray-700">+ {formatMoney(fees.requestFee, currency)}</Text>
                  </View>
                  <View className="my-2 h-px bg-gray-100" />
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[13px] font-extrabold text-gray-900">{isPaid ? 'Total pago' : 'Total a pagar'}</Text>
                    <Text className="text-[16px] font-extrabold text-gray-900">{formatMoney(clientTotal, currency)}</Text>
                  </View>
                </>
              ) : (
                <>
                  <View className="flex-row items-center justify-between py-1">
                    <Text className="text-[12.5px] font-bold text-gray-500">Taxa de serviço (10%)</Text>
                    <Text className="text-[12.5px] font-bold text-gray-700">- {formatMoney(fees.serviceFee, currency)}</Text>
                  </View>
                  {isUrgent ? (
                    <View className="flex-row items-center justify-between py-1">
                      <Text className="text-[12.5px] font-bold text-gray-500">Bônus de urgência (5%)</Text>
                      <Text className="text-[12.5px] font-bold text-emerald-600">+ {formatMoney(fees.urgentBonus, currency)}</Text>
                    </View>
                  ) : null}
                  <View className="my-2 h-px bg-gray-100" />
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[13px] font-extrabold text-gray-900">Você recebe</Text>
                    <Text className="text-[16px] font-extrabold text-gray-900">{formatMoney(providerNet, currency)}</Text>
                  </View>
                </>
              )}
            </View>

            {/* Mensagem de escrow contextual */}
            {isHeld ? (
              <View className="mt-3 flex-row gap-2 rounded-2xl bg-blue-50 px-3.5 py-2.5">
                <Ionicons name="information-circle" size={15} color="#2563EB" style={{ marginTop: 1 }} />
                <Text className="flex-1 text-[11.5px] leading-4 font-bold text-blue-900/80">
                  {isClientOwner
                    ? 'O valor está retido. Quando o serviço terminar, toque em "Serviço concluído" para liberar o pagamento.'
                    : 'Pagamento retido pela Autonomos. Será liberado para saque assim que o cliente confirmar a conclusão.'}
                </Text>
              </View>
            ) : null}
            {isReleased && isProviderOwner ? (
              <View className="mt-3 flex-row gap-2 rounded-2xl bg-emerald-50 px-3.5 py-2.5">
                <Ionicons name="checkmark-circle" size={15} color="#059669" style={{ marginTop: 1 }} />
                <Text className="flex-1 text-[11.5px] leading-4 font-bold text-emerald-900/80">
                  Pagamento liberado e disponível para saque na sua Carteira.
                </Text>
              </View>
            ) : null}
          </View>
          ) : null}

          {/* Fallback: pedido aceite sem preço (legado). No fluxo novo o preço é definido ao aceitar. */}
          {isProviderOwner && status === 'accepted' && !isPaid && !hasPrice ? (
            <View className="mt-5">
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setPriceModalOpen(true)}
                className="h-13 items-center justify-center rounded-full bg-gray-200"
                style={{ height: 52 }}
              >
                <Text className="text-[14px] font-extrabold text-gray-800">Definir preço</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Ações do cliente: pagar (só quando há preço definido) */}
          {isClientOwner && status === 'accepted' && !isPaid && hasPrice ? (
            <View className="mt-5">
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setPayOpen(true)}
                className="h-13 flex-row items-center justify-center gap-2 rounded-full bg-brand-cyan"
                style={{ height: 52 }}
              >
                <Ionicons name="lock-closed" size={16} color="#fff" />
                <Text className="text-[14px] font-extrabold text-white">
                  {isMultiDay ? `Pagar entrada (30%) • ${formatMoney(plan.firstClientAmount, currency)}` : 'Pagar agora'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Vários dias: parcela final (70%) em falta — botão ativo a pagar a 2ª parte */}
          {isClientOwner && needsFinalInstallment ? (
            <View className="mt-5">
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setPayOpen(true)}
                className="h-13 flex-row items-center justify-center gap-2 rounded-full bg-brand-cyan"
                style={{ height: 52 }}
              >
                <Ionicons name="lock-closed" size={16} color="#fff" />
                <Text className="text-[14px] font-extrabold text-white">
                  Pagar parcela final (70%) • {formatMoney(plan.finalClientAmount, currency)}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Ações do cliente: liberar escrow (serviço concluído) */}
          {isClientOwner && isHeld ? (
            <View className="mt-5">
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleRelease}
                disabled={releasing || !canComplete}
                className="h-13 flex-row items-center justify-center gap-2 rounded-full bg-emerald-500"
                style={{ height: 52, opacity: releasing || !canComplete ? 0.45 : 1 }}
              >
                <Check size={18} color="#fff" strokeWidth={3} />
                <Text className="text-[14px] font-extrabold text-white">{releasing ? 'Liberando...' : 'Serviço concluído'}</Text>
              </TouchableOpacity>
              {!canComplete ? (
                <Text className="mt-2 text-center text-[11px] font-bold text-gray-400">
                  Pague a parcela final (70%) para poder concluir o serviço.
                </Text>
              ) : null}
            </View>
          ) : null}

          {/* Ações do cliente: avaliar (após liberar) */}
          {isClientOwner && isReleased && !(request as any).reviewedAt ? (
            <View className="mt-4">
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: '/avaliar',
                    params: {
                      requestId: request.id,
                      providerId: request.providerId,
                      providerName: request.providerName,
                      providerAvatarUrl: (request as any)?.providerAvatarUrl || '',
                      serviceName: request.serviceName,
                    },
                  })
                }
                className="h-13 items-center justify-center rounded-full bg-gray-200"
                style={{ height: 52 }}
              >
                <Text className="text-[14px] font-extrabold text-gray-800">Avaliar prestador</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Prestador: avaliar o cliente (após o serviço ser concluído) */}
          {isProviderOwner && isReleased && !(request as any).clientReviewedAt ? (
            <View className="mt-4">
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setClientReviewOpen(true)}
                className="h-13 flex-row items-center justify-center gap-2 rounded-full bg-brand-cyan"
                style={{ height: 52 }}
              >
                <Ionicons name="star" size={16} color="#fff" />
                <Text className="text-[14px] font-extrabold text-white">Avaliar cliente</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {isProviderOwner && isReleased && !!(request as any).clientReviewedAt ? (
            <View className="mt-4 flex-row items-center justify-center gap-1.5 rounded-2xl bg-emerald-50 py-3">
              <Ionicons name="checkmark-circle" size={15} color="#059669" />
              <Text className="text-[12px] font-bold text-emerald-700">Você já avaliou este cliente.</Text>
            </View>
          ) : null}

          {/* Ações do prestador: aceitar/rejeitar */}
          {user?.role === 'professional' && status === 'pending' ? (
            <View className="mt-5 flex-row gap-3">
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleReject}
                disabled={!canRespond}
                className="flex-1 h-13 items-center justify-center rounded-full"
                style={{ height: 52, backgroundColor: '#EF4444', opacity: canRespond ? 1 : 0.45 }}
              >
                <Text className="text-[14px] font-extrabold text-white">Rejeitar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={onAcceptPress}
                disabled={!canRespond}
                className="flex-1 h-13 items-center justify-center rounded-full"
                style={{ height: 52, backgroundColor: '#00E7FF', opacity: canRespond ? 1 : 0.45 }}
              >
                <Text className="text-[14px] font-extrabold text-white">Aceitar</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {canCancel ? (
            <View className="mt-5">
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setCancelOpen(true)}
                className="h-13 items-center justify-center rounded-full bg-gray-200"
                style={{ height: 52 }}
              >
                <Text className="text-[14px] font-extrabold text-gray-700">Cancelar pedido</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <SetPriceModal
        visible={priceModalOpen}
        onClose={() => setPriceModalOpen(false)}
        initialMajor={agreed ? agreed / 100 : null}
        initialCurrency={currency || 'usd'}
        onSave={handleAcceptWithPrice}
      />

      <PaymentBreakdownSheet
        visible={payOpen}
        serviceName={request.serviceName}
        providerName={request.providerName}
        agreedAmount={agreed}
        currency={currency}
        processing={paying}
        isMultiDay={isMultiDay}
        installment={installmentsPaid + 1}
        initialUrgent={isUrgent}
        lockUrgent={isMultiDay && installmentsPaid >= 1}
        onClose={() => (paying ? null : setPayOpen(false))}
        onConfirm={handlePay}
      />

      <ClientReviewModal
        visible={clientReviewOpen}
        clientName={request.clientName}
        serviceName={request.serviceName}
        processing={submittingClientReview}
        onClose={() => (submittingClientReview ? null : setClientReviewOpen(false))}
        onSubmit={handleSubmitClientReview}
      />

      <CancelReasonModal
        visible={cancelOpen}
        role={isProviderOwner ? 'provider' : 'client'}
        processing={cancelling}
        onClose={() => setCancelOpen(false)}
        onConfirm={confirmCancel}
      />
    </View>
    </KeyboardAvoidingView>
  );
}
