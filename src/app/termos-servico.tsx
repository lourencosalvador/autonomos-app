import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Calendar, Clock, MapPin, Star } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, Image, Keyboard, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { useRequestsStore } from '../stores/requestsStore';
import { toast } from '../lib/sonner';
import { DatePickerModal } from '../components/DatePickerModal';
import { DismissKeyboardView } from '../components/DismissKeyboardView';
import { formatKz } from '../data/services';
import { computeTravelFee } from '../lib/pricing';

const AvatarFallback = { uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120' };

export default function TermosServicoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    serviceName?: string;
    providerId?: string;
    providerName?: string;
    providerJob?: string;
    providerAvatarUrl?: string;
    initialDescription?: string;
    estimatedAmount?: string;
  }>();
  const { user } = useAuthStore();
  const addRequest = useRequestsStore((s) => s.addRequest);

  // Valor estimado do serviço (Kz inteiros) vindo do catálogo; 0 = a definir.
  const estimatedService = Math.max(0, parseInt(String(params.estimatedAmount || '0').replace(/[^\d]/g, ''), 10) || 0);

  const serviceName = (params.serviceName || 'Serviço').toString();
  const providerId = (params.providerId || '').toString();
  const providerName = (params.providerName || 'Edson Santos').toString();
  const providerJob = (params.providerJob || 'Profissional').toString();
  const providerAvatarUrl = (params.providerAvatarUrl || '').toString();
  const [description, setDescription] = useState((params.initialDescription || '').toString());

  const [location, setLocation] = useState('Morro Bento Kikagil, rua da Universal');
  // Distância (km): será calculada automaticamente via Google Maps (Distance Matrix)
  // a partir da localização do prestador e do cliente. Por agora 0 → só a taxa base.
  // A lógica do valor está pronta em computeTravelFee (500 + km × 200).
  const km = 0;
  const travelFee = computeTravelFee(km);
  const [dateOpen, setDateOpen] = useState(false);
  const [serviceDate, setServiceDate] = useState<Date | null>(new Date());
  const [time, setTime] = useState('13:20');
  // Duração: 'single' = menos de 1 dia (fluxo normal) | 'multi' = mais de 1 dia (pagamento 30/70)
  const [duration, setDuration] = useState<'single' | 'multi'>('single');

  const dateLabel = useMemo(() => {
    if (!serviceDate) return '';
    return serviceDate.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }, [serviceDate]);

  const dateIso = useMemo(() => {
    return serviceDate ? serviceDate.toISOString().slice(0, 10) : null;
  }, [serviceDate]);

  const isValidTime = (v: string) => /^\d{2}:\d{2}$/.test(v) && Number(v.slice(0, 2)) <= 23 && Number(v.slice(3, 5)) <= 59;

  const handleSend = async () => {
    if (!user) return;
    if (!providerId) {
      Alert.alert('Erro', 'Prestador inválido.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Erro', 'Escreva uma descrição do trabalho.');
      return;
    }
    if (!location.trim()) {
      Alert.alert('Erro', 'Informe a localização.');
      return;
    }
    if (!dateIso) {
      Alert.alert('Erro', 'Selecione a data.');
      return;
    }
    if (!isValidTime(time)) {
      Alert.alert('Erro', 'Informe a hora no formato HH:MM.');
      return;
    }
    try {
      toast.loading('Enviando pedido...');
      await addRequest({
        providerId,
        providerName,
        serviceName,
        clientId: user.id,
        clientName: user.name,
        clientAvatarUrl: user.avatar || null,
        providerAvatarUrl: providerAvatarUrl || null,
        description: description.trim(),
        location: location.trim(),
        date: dateIso,
        time,
        isMultiDay: duration === 'multi',
        // Pedido do catálogo já leva o preço (Kz → minor units). Personalizado vai sem preço.
        ...(estimatedService > 0 ? { priceAmount: estimatedService * 100, currency: 'aoa' } : {}),
      });
      toast.success('Pedido enviado com sucesso!');
      router.back();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Não foi possível enviar o pedido.');
    }
  };

  return (
    <DismissKeyboardView>
      <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      <View className="px-6 pt-16 pb-2">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>

        <Text className="mt-3 text-[26px] font-extrabold text-gray-900">Termos do Serviço</Text>
        <Text className="mt-1 text-[13px] font-bold text-gray-500">{serviceName}</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Text className="mt-4 text-[13px] text-gray-700">Prestador</Text>

        <View className="mt-3 flex-row items-center gap-3 rounded-2xl bg-gray-100 px-4 py-3">
          <Image
            source={providerAvatarUrl ? { uri: providerAvatarUrl } : AvatarFallback}
            className="h-10 w-10 rounded-full"
            resizeMode="cover"
          />
          <View className="flex-1">
            <Text className="text-[14px] font-semibold text-gray-900">{providerName}</Text>
            <View className="mt-1 flex-row items-center gap-2">
              <Text className="text-[12px] text-gray-500">{providerJob}</Text>
              <View className="flex-row items-center">
                <Star size={12} color="#F59E0B" fill="#F59E0B" />
                <Star size={12} color="#F59E0B" fill="#F59E0B" />
                <Star size={12} color="#F59E0B" fill="#F59E0B" />
                <Star size={12} color="#F59E0B" fill="#F59E0B" />
                <Star size={12} color="#F59E0B" fill="#F59E0B" />
              </View>
            </View>
          </View>
        </View>

        <Text className="mt-5 text-[13px] text-gray-700">Localização</Text>
        <View className="mt-3 flex-row items-center gap-3 rounded-2xl bg-gray-100 px-4 py-4">
          <View className="h-9 w-9 items-center justify-center rounded-full bg-white">
            <MapPin size={18} color="#6B7280" />
          </View>
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="Digite a localização..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 text-[12px] text-gray-700"
          />
        </View>

        {/* Resumo do valor — aparece quando a localização está preenchida */}
        {location.trim().length > 0 ? (
          <View className="mt-4 rounded-2xl bg-cyan-50 px-4 py-4" style={{ borderWidth: 1, borderColor: '#CFFAFE' }}>
            <Text className="text-[12px] font-extrabold text-cyan-900">Resumo do valor</Text>

            <View className="mt-3 flex-row items-center justify-between">
              <Text className="text-[12.5px] font-bold text-gray-600">Serviço (estimado)</Text>
              <Text className="text-[12.5px] font-extrabold text-gray-900">
                {estimatedService > 0 ? formatKz(estimatedService) : 'A definir'}
              </Text>
            </View>

            <View className="mt-2 flex-row items-center justify-between">
              <Text className="text-[12.5px] font-bold text-gray-600">Taxa de deslocação</Text>
              <Text className="text-[12.5px] font-extrabold text-gray-900">{formatKz(travelFee)}</Text>
            </View>

            <View className="my-3 h-px bg-cyan-200/60" />

            <View className="flex-row items-center justify-between">
              <Text className="text-[13px] font-extrabold text-cyan-900">Total estimado</Text>
              <Text className="text-[17px] font-extrabold text-cyan-900">
                {estimatedService > 0 ? formatKz(estimatedService + travelFee) : `${formatKz(travelFee)} + serviço`}
              </Text>
            </View>

            <Text className="mt-2 text-[10.5px] font-bold text-cyan-700/70">
              Estimativa. O prestador confirma o valor final antes do pagamento.
            </Text>
          </View>
        ) : null}

        <View className="mt-5 flex-row gap-4">
          <View className="flex-1">
            <Text className="text-[13px] text-gray-700">Data</Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setDateOpen(true)}
              className="mt-3 flex-row items-center gap-3 rounded-2xl bg-gray-100 px-4 py-4"
            >
              <View className="h-9 w-9 items-center justify-center rounded-full bg-white">
                <Calendar size={18} color="#6B7280" />
              </View>
              <Text className="text-[12px]" style={{ color: dateLabel ? '#6B7280' : '#9CA3AF' }}>
                {dateLabel || 'Selecionar'}
              </Text>
            </TouchableOpacity>
          </View>
          <View className="flex-1">
            <Text className="text-[13px] text-gray-700">Hora</Text>
            <View className="mt-3 flex-row items-center gap-3 rounded-2xl bg-gray-100 px-4 py-4">
              <View className="h-9 w-9 items-center justify-center rounded-full bg-white">
                <Clock size={18} color="#6B7280" />
              </View>
              <TextInput
                value={time}
                onChangeText={setTime}
                placeholder="HH:MM"
                placeholderTextColor="#9CA3AF"
                keyboardType="numbers-and-punctuation"
                returnKeyType="done"
                blurOnSubmit
                onSubmitEditing={Keyboard.dismiss}
                className="flex-1 text-[12px] text-gray-700"
                maxLength={5}
              />
            </View>
          </View>
        </View>

        <Text className="mt-5 text-[13px] text-gray-700">Duração do serviço</Text>
        <View className="mt-3 flex-row gap-3">
          {([
            { key: 'single' as const, title: 'Menos de 1 dia', sub: 'Pagamento único' },
            { key: 'multi' as const, title: 'Mais de 1 dia', sub: 'Pagamento em 2 partes' },
          ]).map((opt) => {
            const active = duration === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                activeOpacity={0.85}
                onPress={() => setDuration(opt.key)}
                className="flex-1 rounded-2xl px-4 py-3.5"
                style={{ borderWidth: 1.5, borderColor: active ? '#00E7FF' : '#EEF2F7', backgroundColor: active ? '#ECFEFF' : '#FFFFFF' }}
              >
                <View className="flex-row items-center justify-between">
                  <Ionicons
                    name={opt.key === 'multi' ? 'calendar-outline' : 'time-outline'}
                    size={18}
                    color={active ? '#00A9BA' : '#9CA3AF'}
                  />
                  <View className="h-5 w-5 items-center justify-center rounded-full" style={{ borderWidth: 2, borderColor: active ? '#00A9BA' : '#CBD5E1' }}>
                    {active ? <View style={{ height: 10, width: 10, borderRadius: 5, backgroundColor: '#00A9BA' }} /> : null}
                  </View>
                </View>
                <Text className="mt-2 text-[13px] font-extrabold" style={{ color: active ? '#0F172A' : '#374151' }}>{opt.title}</Text>
                <Text className="mt-0.5 text-[11px] font-bold text-gray-400">{opt.sub}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {duration === 'multi' ? (
          <View className="mt-3 flex-row gap-2 rounded-2xl bg-amber-50 px-4 py-3" style={{ borderWidth: 1, borderColor: '#FDE68A' }}>
            <Ionicons name="information-circle" size={16} color="#D97706" style={{ marginTop: 1 }} />
            <Text className="flex-1 text-[11.5px] leading-4 font-bold text-amber-800/90">
              Serviço de vários dias: pagas <Text className="font-extrabold">30% no início</Text> (entregue já ao prestador para
              arrancar) e os <Text className="font-extrabold">70% no fim</Text>, libertados quando confirmares que o serviço foi
              concluído.
            </Text>
          </View>
        ) : null}

        <Text className="mt-5 text-[13px] text-gray-700">Descrição do trabalho</Text>
        <View className="mt-3 rounded-2xl bg-gray-100 px-4 py-4">
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Descreva o trabalho que você precisa..."
            placeholderTextColor="#9CA3AF"
            multiline
            textAlignVertical="top"
            className="min-h-[110px] text-[12px] leading-5 text-gray-700"
          />
        </View>

      </ScrollView>

      <View
        style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#F1F5F9' }}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleSend}
          className="h-14 w-full flex-row items-center justify-center rounded-2xl bg-brand-cyan"
        >
          <Text className="text-[15px] font-extrabold text-white">
            {estimatedService > 0 ? 'Enviar' : 'Solicitar orçamento'}
          </Text>
        </TouchableOpacity>
      </View>

      <DatePickerModal
        open={dateOpen}
        title="Selecionar data"
        value={dateIso}
        onClose={() => setDateOpen(false)}
        onConfirm={(iso) => {
          setServiceDate(new Date(iso));
          setDateOpen(false);
        }}
      />
      </View>
    </DismissKeyboardView>
  );
}


