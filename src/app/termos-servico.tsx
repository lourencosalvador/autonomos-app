import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Calendar, Clock, MapPin, Star } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { useRequestsStore } from '../stores/requestsStore';

const AvatarFallback = { uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120' };

export default function TermosServicoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    serviceName?: string;
    providerId?: string;
    providerName?: string;
    providerJob?: string;
  }>();
  const { user } = useAuthStore();
  const addRequest = useRequestsStore((s) => s.addRequest);

  const serviceName = (params.serviceName || 'Serviço').toString();
  const providerId = (params.providerId || '').toString();
  const providerName = (params.providerName || 'Edson Santos').toString();
  const providerJob = (params.providerJob || 'Profissional').toString();
  const [description, setDescription] = useState('');

  const date = '13/11/2025';
  const time = '13:20:00';

  const handleSend = () => {
    if (!user) return;
    if (!providerId) {
      Alert.alert('Erro', 'Prestador inválido.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Erro', 'Escreva uma descrição do trabalho.');
      return;
    }
    addRequest({
      providerId,
      providerName,
      serviceName,
      clientId: user.id,
      clientName: user.name,
      description: description.trim(),
      date,
      time,
    });
    Alert.alert('Sucesso', 'Pedido enviado com sucesso!', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
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

      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        <Text className="mt-4 text-[13px] text-gray-700">Prestador</Text>

        <View className="mt-3 flex-row items-center gap-3 rounded-2xl bg-gray-100 px-4 py-3">
          <Image source={AvatarFallback} className="h-10 w-10 rounded-full" resizeMode="cover" />
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
          <Text className="flex-1 text-[12px] text-gray-500">Morro Bento Kikagil, rua da Universal</Text>
        </View>

        <View className="mt-5 flex-row gap-4">
          <View className="flex-1">
            <Text className="text-[13px] text-gray-700">Data</Text>
            <View className="mt-3 flex-row items-center gap-3 rounded-2xl bg-gray-100 px-4 py-4">
              <View className="h-9 w-9 items-center justify-center rounded-full bg-white">
                <Calendar size={18} color="#6B7280" />
              </View>
              <Text className="text-[12px] text-gray-500">{date}</Text>
            </View>
          </View>
          <View className="flex-1">
            <Text className="text-[13px] text-gray-700">Hora</Text>
            <View className="mt-3 flex-row items-center gap-3 rounded-2xl bg-gray-100 px-4 py-4">
              <View className="h-9 w-9 items-center justify-center rounded-full bg-white">
                <Clock size={18} color="#6B7280" />
              </View>
              <Text className="text-[12px] text-gray-500">{time}</Text>
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
    </View>
  );
}


