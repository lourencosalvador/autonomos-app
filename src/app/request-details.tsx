import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Check, Loader2, X } from 'lucide-react-native';
import { useMemo } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { useRequestsStore } from '../stores/requestsStore';

function statusUi(status: 'pending' | 'accepted' | 'rejected') {
  switch (status) {
    case 'pending':
      return { label: 'Pendente', icon: <Loader2 size={18} color="#F59E0B" strokeWidth={2.5} />, color: '#F59E0B', bg: '#FFFBEB' };
    case 'accepted':
      return { label: 'Aceite', icon: <Check size={18} color="#00E7FF" strokeWidth={3} />, color: '#00A9BA', bg: '#ECFEFF' };
    case 'rejected':
      return { label: 'Rejeitado', icon: <X size={18} color="#EF4444" strokeWidth={3} />, color: '#EF4444', bg: '#FEF2F2' };
  }
}

export default function RequestDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ requestId?: string }>();
  const requestId = (params.requestId || '').toString();

  const request = useRequestsStore((s) => s.requests.find((r) => r.id === requestId));
  const setRequestStatus = useRequestsStore((s) => s.setRequestStatus);
  const deleteRequest = useRequestsStore((s) => s.deleteRequest);

  const status = (request as any)?.status || 'pending';
  const ui = useMemo(() => (request ? statusUi(status) : null), [request, status]);

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

  const canRespond = status === 'pending';

  const handleAccept = () => {
    setRequestStatus(request.id, 'accepted');
    Alert.alert('Sucesso', 'Pedido aceite.', [{ text: 'OK', onPress: () => router.back() }]);
  };

  const handleReject = () => {
    setRequestStatus(request.id, 'rejected');
    Alert.alert('Sucesso', 'Pedido rejeitado.', [{ text: 'OK', onPress: () => router.back() }]);
  };

  const handleDelete = () => {
    Alert.alert('Apagar pedido', 'Tem certeza que deseja apagar este pedido?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: () => {
          deleteRequest(request.id);
          router.back();
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
            <Text className="text-[12px] text-gray-500">Descrição</Text>
            <Text className="mt-2 text-[12px] leading-5 text-gray-700">
              {(request as any).description || 'Sem descrição.'}
            </Text>
          </View>
        </View>

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
      </View>
    </View>
  );
}


