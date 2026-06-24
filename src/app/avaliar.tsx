import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { toast } from '../lib/sonner';
import { useAuthStore } from '../stores/authStore';
import { useRequestsStore } from '../stores/requestsStore';
import { DismissKeyboardView } from '../components/DismissKeyboardView';
import { ChoiceGroup } from '../components/ChoiceGroup';

const AvatarFallback = { uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120' };

export default function AvaliarScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    requestId?: string;
    providerId?: string;
    providerName?: string;
    providerAvatarUrl?: string;
    serviceName?: string;
  }>();

  const { user } = useAuthStore();
  const submitReview = useRequestsStore((s) => s.submitReview);
  const fetchRequests = useRequestsStore((s) => s.fetchRequests);
  const request = useRequestsStore((s) => s.requests.find((r) => r.id === String(params.requestId || '')));

  const requestId = String(params.requestId || '');
  const providerId = String(params.providerId || '');
  const providerName = String(params.providerName || 'Prestador');
  const providerAvatarUrl = String(params.providerAvatarUrl || '');
  const serviceName = String(params.serviceName || 'Serviço');

  const [wellExecuted, setWellExecuted] = useState<boolean | null>(null);
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [rating, setRating] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);
  const [inappropriate, setInappropriate] = useState<boolean | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const allAnswered =
    wellExecuted !== null && wouldRecommend !== null && rating >= 1 && inappropriate !== null;
  const canSubmit = useMemo(
    () => !!user && user.role === 'client' && !!requestId && !!providerId && allAnswered && !submitting,
    [allAnswered, providerId, requestId, submitting, user]
  );

  const handleSubmit = async () => {
    if (!user || user.role !== 'client') return;
    if (!requestId || !providerId) return;
    if (!allAnswered) {
      toast.error('Responda todas as perguntas obrigatórias.');
      return;
    }
    if (request?.reviewedAt) {
      toast.success('Você já avaliou este serviço.');
      router.replace('/(tabs)/services');
      return;
    }
    try {
      setSubmitting(true);
      toast.loading('Enviando avaliação...');
      await submitReview({
        requestId,
        providerId,
        clientId: user.id,
        clientAvatarUrl: user.avatar || null,
        rating: rating as 1 | 2 | 3 | 4 | 5,
        comment,
        wellExecuted: wellExecuted as boolean,
        wouldRecommend: wouldRecommend as boolean,
        inappropriateBehavior: inappropriate as boolean,
      });
      toast.success('Avaliação enviada!');
      await fetchRequests(user.id);
      router.replace('/(tabs)/services');
    } catch (e: any) {
      toast.error(e?.message || 'Não foi possível enviar a avaliação.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DismissKeyboardView>
      <KeyboardAvoidingView className="flex-1 bg-white" behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}>
        <StatusBar style="dark" />

        <View className="px-6 pt-16">
          <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 items-center justify-center" activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <View className="px-6 pt-4">
            <View className="items-center">
              <View className="h-24 w-24 rounded-full bg-gray-100 overflow-hidden items-center justify-center" style={{ borderWidth: 3, borderColor: '#00E7FF' }}>
                <Image source={providerAvatarUrl ? { uri: providerAvatarUrl } : AvatarFallback} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              </View>
              <Text className="mt-4 text-[18px] font-extrabold text-gray-900">{providerName}</Text>
              <Text className="mt-1 text-[12px] font-bold text-gray-500">Avalie o serviço: {serviceName}</Text>
            </View>

            <View className="mt-7 rounded-3xl bg-gray-50 px-5 py-5" style={{ borderWidth: 1, borderColor: '#EEF2F7' }}>
              <ChoiceGroup
                label="O trabalho foi bem executado?"
                options={[{ label: 'Sim', value: true }, { label: 'Não', value: false }]}
                value={wellExecuted}
                onChange={setWellExecuted}
              />

              <ChoiceGroup
                label="Recomendaria?"
                options={[{ label: 'Com certeza', value: true }, { label: 'Não', value: false }]}
                value={wouldRecommend}
                onChange={setWouldRecommend}
              />

              <View className="mb-5">
                <Text className="text-[13px] font-extrabold text-gray-900">Que nota daria ao trabalho realizado?</Text>
                <View className="mt-3 flex-row items-center justify-between">
                  {[1, 2, 3, 4, 5].map((v) => {
                    const filled = v <= rating;
                    return (
                      <TouchableOpacity
                        key={v}
                        activeOpacity={0.85}
                        onPress={() => setRating(v as any)}
                        className="h-12 w-12 items-center justify-center rounded-full bg-white"
                        style={{ borderWidth: 1, borderColor: '#EEF2F7' }}
                      >
                        <Ionicons name={filled ? 'star' : 'star-outline'} size={24} color={filled ? '#FBBF24' : '#9CA3AF'} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <ChoiceGroup
                label="O prestador teve um comportamento inadequado?"
                options={[{ label: 'Sim', value: true }, { label: 'Não', value: false }]}
                value={inappropriate}
                onChange={setInappropriate}
                tone="amber"
              />

              <View>
                <Text className="text-[13px] font-extrabold text-gray-900">Observação sobre o trabalho (opcional)</Text>
                <View className="mt-3 rounded-2xl bg-white px-4 py-3" style={{ borderWidth: 1, borderColor: '#EEF2F7' }}>
                  <TextInput
                    value={comment}
                    onChangeText={setComment}
                    placeholder="Conte como foi o serviço..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    textAlignVertical="top"
                    className="min-h-[90px] text-[12px] leading-5 text-gray-700"
                  />
                </View>
              </View>
            </View>

            <View className="mt-6 flex-row gap-3">
              <TouchableOpacity activeOpacity={0.85} onPress={() => router.replace('/(tabs)/services')} className="flex-1 h-12 items-center justify-center rounded-full bg-gray-100">
                <Text className="text-[14px] font-extrabold text-gray-700">Agora não</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSubmit}
                disabled={!canSubmit}
                className="flex-1 h-12 items-center justify-center rounded-full bg-brand-cyan"
                style={{ opacity: canSubmit ? 1 : 0.55 }}
              >
                <Text className="text-[14px] font-extrabold text-white">{submitting ? 'Enviando...' : 'Enviar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </DismissKeyboardView>
  );
}
