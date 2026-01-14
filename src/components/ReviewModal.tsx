import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Keyboard, Modal, Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native';

export function ReviewModal({
  visible,
  providerName,
  serviceName,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  providerName: string;
  serviceName: string;
  onClose: () => void;
  onSubmit: (args: { rating: 1 | 2 | 3 | 4 | 5; comment: string }) => Promise<void> | void;
}) {
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => rating >= 1 && rating <= 5 && !submitting, [rating, submitting]);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onSubmit({ rating, comment });
      setComment('');
      setRating(5);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50 items-center justify-center px-6" onPress={Keyboard.dismiss}>
        <Pressable className="w-full rounded-3xl bg-white px-5 py-5" onPress={() => {}}>
          <View className="flex-row items-center justify-between">
            <Text className="text-[16px] font-extrabold text-gray-900">Avaliar prestador</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.8} className="h-10 w-10 items-center justify-center">
              <Ionicons name="close" size={22} color="#111827" />
            </TouchableOpacity>
          </View>

          <Text className="mt-2 text-[12px] font-bold text-gray-500">
            {providerName} • {serviceName}
          </Text>

          <Text className="mt-5 text-[12px] font-bold text-gray-700">Quantas estrelas?</Text>
          <View className="mt-3 flex-row items-center gap-2">
            {[1, 2, 3, 4, 5].map((v) => {
              const filled = v <= rating;
              return (
                <TouchableOpacity
                  key={v}
                  activeOpacity={0.85}
                  onPress={() => setRating(v as any)}
                  className="h-10 w-10 items-center justify-center rounded-full bg-gray-100"
                >
                  <Ionicons name={filled ? 'star' : 'star-outline'} size={22} color={filled ? '#FBBF24' : '#9CA3AF'} />
                </TouchableOpacity>
              );
            })}
          </View>

          <Text className="mt-5 text-[12px] font-bold text-gray-700">Comentário (opcional)</Text>
          <View className="mt-3 rounded-2xl bg-gray-100 px-4 py-3">
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Conte como foi o serviço..."
              placeholderTextColor="#9CA3AF"
              multiline
              textAlignVertical="top"
              className="min-h-[92px] text-[12px] leading-5 text-gray-700"
            />
          </View>

          <View className="mt-5 flex-row gap-3">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onClose}
              className="flex-1 h-12 items-center justify-center rounded-full bg-gray-100"
              disabled={submitting}
              style={{ opacity: submitting ? 0.6 : 1 }}
            >
              <Text className="text-[13px] font-extrabold text-gray-700">Agora não</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSubmit}
              className="flex-1 h-12 items-center justify-center rounded-full bg-brand-cyan"
              disabled={!canSubmit}
              style={{ opacity: canSubmit ? 1 : 0.6 }}
            >
              <Text className="text-[13px] font-extrabold text-white">
                {submitting ? 'Enviando...' : 'Enviar'}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}


