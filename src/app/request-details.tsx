import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Check, Loader2, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { useRequestsStore } from '../stores/requestsStore';
import { toast } from '../lib/sonner';
import { useAuthStore } from '../stores/authStore';
import { useStreamStore } from '../stores/streamStore';
import { SetPriceModal } from '../components/SetPriceModal';
import { confirmStripePayment, createStripePaymentIntent, getBackendHealth } from '../services/apiService';
import { useStripe } from '@stripe/stripe-react-native';
import { ConfirmPaymentModal } from '../components/ConfirmPaymentModal';
import * as Linking from 'expo-linking';

function formatMoney(amount: number | null | undefined, currency?: string | null) {
  if (!amount || amount <= 0) return '-';
  const c = (currency || '').toUpperCase() || 'USD';
  const major = amount / 100;
  return `${c} ${major.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

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

export default function RequestDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ requestId?: string }>();
  const requestId = (params.requestId || '').toString();

  const { user } = useAuthStore();
  const streamReady = useStreamStore((s) => s.ready);
  const request = useRequestsStore((s) => s.requests.find((r) => r.id === requestId));
  const setRequestStatus = useRequestsStore((s) => s.setRequestStatus);
  const setRequestPrice = useRequestsStore((s) => s.setRequestPrice);
  const markRequestPaid = useRequestsStore((s) => s.markRequestPaid);
  const cancelRequest = useRequestsStore((s) => s.cancelRequest);
  const deleteRequest = useRequestsStore((s) => s.deleteRequest);
  const fetchRequests = useRequestsStore((s) => s.fetchRequests);
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [confirmPayOpen, setConfirmPayOpen] = useState(false);
  const stripe = useStripe();

  const status = (request as any)?.status || 'pending';
  const isPaid = String((request as any)?.paymentStatus || '') === 'succeeded' || !!(request as any)?.paidAt;
  const effectiveStatus = (isPaid ? 'completed' : status) as any;
  const ui = useMemo(() => (request ? statusUi(effectiveStatus) : null), [request, effectiveStatus]);

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

  const canRespond =
    effectiveStatus === 'pending' &&
    !!user &&
    user.role === 'professional' &&
    request.providerId === user.id;

  // Cancelamento:
  // - Se estiver PENDENTE: apenas o cliente pode cancelar
  // - Se estiver ACEITE: cliente e prestador podem cancelar
  const isClientOwner = !!user && user.role === 'client' && request.clientId === user.id;
  const isProviderOwner = !!user && user.role === 'professional' && request.providerId === user.id;
  const canCancel =
    (effectiveStatus === 'pending' && isClientOwner) ||
    (effectiveStatus === 'accepted' && (isClientOwner || isProviderOwner));

  const hasPrice = Number((request as any).priceAmount || 0) > 0;

  const handlePay = async () => {
    if (!user) return;
    if (!stripe) return toast.error('Stripe não está disponível.');
    try {
      const publishableKey = String(process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '').trim();
      const pkMode = publishableKey.startsWith('pk_test_') ? 'test' : publishableKey.startsWith('pk_live_') ? 'live' : 'unknown';
      if (!publishableKey || pkMode === 'unknown') {
        return toast.error('Chave pública do Stripe inválida no app (EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY).');
      }

      // Detecta mismatch TEST/LIVE (causa clássica desse erro genérico)
      try {
        const health = await getBackendHealth();
        const serverMode = health?.stripeMode || 'unknown';
        if (serverMode !== 'unknown' && pkMode !== 'unknown' && serverMode !== pkMode) {
          return toast.error(`Chaves Stripe misturadas: app=${pkMode} e servidor=${serverMode}.`);
        }
      } catch {
        // Se /health falhar, não bloqueia o pagamento (mas reduz diagnóstico)
      }

      toast.loading('Preparando pagamento...');
      const resp = await createStripePaymentIntent({ requestId: request.id, clientId: user.id });
      const serverModeFromPI = resp?.stripeMode || 'unknown';
      if (serverModeFromPI !== 'unknown' && pkMode !== 'unknown' && serverModeFromPI !== pkMode) {
        return toast.error(`Chaves Stripe misturadas: app=${pkMode} e servidor=${serverModeFromPI}.`);
      }
      // Confere também pelo livemode do próprio PI
      if (typeof resp?.livemode === 'boolean') {
        const piMode = resp.livemode ? 'live' : 'test';
        if (pkMode !== 'unknown' && piMode !== pkMode) {
          return toast.error(`Chaves Stripe misturadas: app=${pkMode} e PI=${piMode}.`);
        }
      }
      console.log('[stripe] PI', {
        paymentIntentId: resp?.paymentIntentId,
        livemode: resp?.livemode,
        stripeMode: resp?.stripeMode,
        pkMode,
      });
      const returnURL = Linking.createURL('stripe-redirect');
      const init = await stripe.initPaymentSheet({
        merchantDisplayName: 'Autonomos',
        paymentIntentClientSecret: resp.paymentIntentClientSecret,
        allowsDelayedPaymentMethods: true,
        returnURL,
      });
      if (init.error) {
        const code = (init.error as any)?.code ? ` (${String((init.error as any).code)})` : '';
        console.log('[stripe] initPaymentSheet error', init.error);
        throw new Error(`${init.error.message}${code}`);
      }
      const presented = await stripe.presentPaymentSheet();
      if (presented.error) {
        const code = (presented.error as any)?.code ? ` (${String((presented.error as any).code)})` : '';
        console.log('[stripe] presentPaymentSheet error', presented.error);
        throw new Error(`${presented.error.message}${code}${resp?.paymentIntentId ? ` • PI: ${resp.paymentIntentId}` : ''}`);
      }

      // Confirma no backend (garante que a tabela payments seja atualizada mesmo se o webhook falhar)
      if (resp?.paymentIntentId) {
        try {
          await confirmStripePayment({ requestId: request.id, paymentIntentId: resp.paymentIntentId });
        } catch {
          // Não bloqueia a UX; carteira usa fallback e o webhook pode atualizar depois.
        }
      }

      // Marca localmente como pago/concluído IMEDIATAMENTE (não depende do webhook)
      await markRequestPaid({ id: request.id, paymentIntentId: resp?.paymentIntentId || null });

      toast.success('Pagamento concluído.');

      // Após pagar, entendemos que o serviço foi concluído — então levamos para avaliação.
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

      // Sync em background (se falhar não bloqueia)
      fetchRequests(user.id).catch(() => {});
    } catch (e: any) {
      toast.error(e?.message || 'Não foi possível concluir o pagamento.');
    }
  };

  const handleCancel = async () => {
    Alert.alert('Cancelar pedido', 'Deseja cancelar este pedido? Ele vai sair da lista principal e ficar no histórico.', [
      { text: 'Voltar', style: 'cancel' },
      {
        text: 'Cancelar pedido',
        style: 'destructive',
        onPress: async () => {
          try {
            toast.loading('Cancelando...');
            await cancelRequest(request.id);
            toast.success('Pedido cancelado.');
            router.back();
          } catch (e: any) {
            toast.error(e?.message || 'Não foi possível cancelar o pedido.');
          }
        },
      },
    ]);
  };

  const handleAccept = async () => {
    try {
      toast.loading('Atualizando...');
      await setRequestStatus(request.id, 'accepted');
      toast.success('Pedido aceite.');
      // Ao aceitar: abre chat com o cliente e envia a primeira mensagem (template do prestador)
      if (streamReady && user?.role === 'professional') {
        const template =
          (user as any)?.autoAcceptMessage?.trim() ||
          'Olá {{cliente}}, aceitei o seu pedido de {{servico}}. Vamos combinar os detalhes por aqui?';
        const msg = template
          .replace(/\{\{\s*cliente\s*\}\}/gi, request.clientName)
          .replace(/\{\{\s*servico\s*\}\}/gi, request.serviceName);
        router.push({
          pathname: '/chat',
          params: {
            otherUserId: request.clientId,
            otherUserName: request.clientName,
            initialMessage: msg,
            sendKey: request.id,
          },
        });
        return;
      }
      router.back();
    } catch {
      toast.error('Não foi possível aceitar o pedido.');
    }
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
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      <View className="px-6 pt-16 pb-4">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 items-center justify-center" activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text className="flex-1 ml-2 text-[22px] font-bold text-gray-900">Detalhe do Pedido</Text>
          <TouchableOpacity onPress={handleDelete} className="h-10 w-10 items-center justify-center" activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={22} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="px-6">
        <View className="rounded-3xl bg-gray-100 px-5 py-5">
          <Text className="text-[12px] text-gray-500">Serviço</Text>
          <Text className="mt-1 text-[18px] font-extrabold text-gray-900">{request.serviceName}</Text>

          <View className="mt-4 flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-[12px] text-gray-500">Cliente</Text>
              <Text className="mt-1 text-[14px] font-bold text-gray-900">{request.clientName}</Text>
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
            <Text className="mt-2 text-[12px] leading-5 text-gray-700">
              {(request as any).description || 'Sem descrição.'}
            </Text>
          </View>

          <View className="mt-5">
            <Text className="text-[12px] text-gray-500">Pagamento</Text>
            <View className="mt-2 flex-row items-center justify-between">
              <Text className="text-[14px] font-extrabold text-gray-900">
                {hasPrice ? formatMoney((request as any).priceAmount, (request as any).currency) : 'Preço não definido'}
              </Text>
              <View className="px-3 py-1 rounded-full" style={{ backgroundColor: isPaid ? '#ECFEFF' : '#FFFBEB' }}>
                <Text className="text-[12px] font-bold" style={{ color: isPaid ? '#00A9BA' : '#F59E0B' }}>
                  {isPaid ? 'Pago' : 'Pendente'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {isProviderOwner && status === 'accepted' ? (
          <View className="mt-6">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setPriceModalOpen(true)}
              className="h-12 items-center justify-center rounded-full bg-gray-200"
            >
              <Text className="text-[14px] font-extrabold text-gray-800">{hasPrice ? 'Editar preço' : 'Definir preço'}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {isClientOwner && effectiveStatus === 'accepted' ? (
          <View className="mt-6">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setConfirmPayOpen(true)}
              disabled={!hasPrice || isPaid}
              className="h-12 items-center justify-center rounded-full"
              style={{ backgroundColor: '#00E7FF', opacity: !hasPrice || isPaid ? 0.45 : 1 }}
            >
              <Text className="text-[14px] font-extrabold text-white">
                {isPaid ? 'Pagamento concluído' : hasPrice ? 'Pagar agora' : 'Aguardando preço'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {isClientOwner && effectiveStatus === 'completed' && !(request as any).reviewedAt ? (
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
              className="h-12 items-center justify-center rounded-full bg-gray-200"
            >
              <Text className="text-[14px] font-extrabold text-gray-800">Avaliar prestador</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {user?.role === 'professional' ? (
          <View className="mt-6 flex-row gap-3">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleReject}
              disabled={!canRespond}
              className="flex-1 h-12 items-center justify-center rounded-full"
              style={{
                backgroundColor: '#EF4444',
                opacity: canRespond ? 1 : 0.45,
              }}
            >
              <Text className="text-[14px] font-extrabold text-white">Rejeitar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleAccept}
              disabled={!canRespond}
              className="flex-1 h-12 items-center justify-center rounded-full"
              style={{
                backgroundColor: '#00E7FF',
                opacity: canRespond ? 1 : 0.45,
              }}
            >
              <Text className="text-[14px] font-extrabold text-white">Aceitar</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {canCancel ? (
          <View className="mt-6">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleCancel}
              className="h-12 items-center justify-center rounded-full bg-gray-200"
            >
              <Text className="text-[14px] font-extrabold text-gray-700">Cancelar pedido</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      <SetPriceModal
        visible={priceModalOpen}
        onClose={() => setPriceModalOpen(false)}
        initialMajor={(request as any).priceAmount ? (request as any).priceAmount / 100 : null}
        initialCurrency={(request as any).currency || 'usd'}
        onSave={async ({ priceAmount, currency }) => {
          await setRequestPrice({ id: request.id, priceAmount, currency });
        }}
      />

      <ConfirmPaymentModal
        visible={confirmPayOpen}
        providerName={request.providerName}
        serviceName={request.serviceName}
        amountLabel={hasPrice ? formatMoney((request as any).priceAmount, (request as any).currency) : ''}
        onClose={() => setConfirmPayOpen(false)}
        onConfirm={async () => {
          setConfirmPayOpen(false);
          await handlePay();
        }}
      />
    </View>
  );
}


