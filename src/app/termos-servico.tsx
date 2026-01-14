import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Calendar, Clock, MapPin, Star } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { useRequestsStore } from '../stores/requestsStore';
import { toast } from '../lib/sonner';
import { DatePickerModal } from '../components/DatePickerModal';
import { DismissKeyboardView } from '../components/DismissKeyboardView';

const AvatarFallback = { uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120' };

export default function TermosServicoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    serviceName?: string;
    providerId?: string;
    providerName?: string;
    providerJob?: string;
    providerAvatarUrl?: string;
  }>();
  const { user } = useAuthStore();
  const addRequest = useRequestsStore((s) => s.addRequest);

  const serviceName = (params.serviceName || 'Serviço').toString();
  const providerId = (params.providerId || '').toString();
  const providerName = (params.providerName || 'Edson Santos').toString();
  const providerJob = (params.providerJob || 'Profissional').toString();
  const providerAvatarUrl = (params.providerAvatarUrl || '').toString();
  const [description, setDescription] = useState('');

  const [location, setLocation] = useState('Morro Bento Kikagil, rua da Universal');
  const [dateOpen, setDateOpen] = useState(false);
  const [serviceDate, setServiceDate] = useState<Date | null>(new Date());
  const [time, setTime] = useState('13:20');

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
                className="flex-1 text-[12px] text-gray-700"
                maxLength={5}
              />
            </View>
          </View>
        </View>

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

        <View className="mt-10 items-center">
          <TouchableOpacity
            activeOpacity={0.85}
            className="h-12 w-44 items-center justify-center rounded-full bg-brand-cyan"
            onPress={handleSend}
          >
            <Text className="text-[14px] font-bold text-white">Enviar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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


