import { Ionicons } from '@expo/vector-icons';
import { Star } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Keyboard, Modal, Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ChoiceGroup } from './ChoiceGroup';
import { computeClientRating } from '../lib/reviews';

type Props = {
  visible: boolean;
  clientName: string;
  serviceName: string;
  processing?: boolean;
  onClose: () => void;
  onSubmit: (args: { polite: boolean; changedScope: boolean; comment?: string }) => void | Promise<void>;
};

export function ClientReviewModal({ visible, clientName, serviceName, processing, onClose, onSubmit }: Props) {
  const [polite, setPolite] = useState<boolean | null>(null);
  const [changedScope, setChangedScope] = useState<boolean | null>(null);
  const [comment, setComment] = useState('');

  const answered = polite !== null && changedScope !== null;
  const previewRating = useMemo(
    () => (answered ? computeClientRating(polite as boolean, changedScope as boolean) : 0),
    [answered, polite, changedScope]
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50 justify-end" onPress={processing ? undefined : onClose}>
        <Pressable className="rounded-t-[28px] bg-white px-5 pt-3 pb-9" onPress={() => Keyboard.dismiss()}>
          <View className="items-center">
            <View className="h-1.5 w-10 rounded-full bg-gray-200" />
          </View>

          <View className="mt-4 flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50">
              <Star size={22} color="#00A9BA" strokeWidth={2.4} />
            </View>
            <View className="flex-1">
              <Text className="text-[17px] font-extrabold text-gray-900">Avaliar cliente</Text>
              <Text className="text-[12px] font-bold text-gray-400">{clientName} • {serviceName}</Text>
            </View>
          </View>

          <View className="mt-5">
            <ChoiceGroup
              label="O cliente foi educado durante a interação?"
              options={[{ label: 'Sim', value: true }, { label: 'Não', value: false }]}
              value={polite}
              onChange={setPolite}
            />
            <ChoiceGroup
              label="O cliente mudou o tipo do serviço depois do acordo feito?"
              options={[{ label: 'Sim', value: true }, { label: 'Não', value: false }]}
              value={changedScope}
              onChange={setChangedScope}
              tone="amber"
            />

            <View className="mb-4">
              <Text className="text-[13px] font-extrabold text-gray-900">Observação (opcional)</Text>
              <View className="mt-3 rounded-2xl bg-gray-50 px-4 py-3" style={{ borderWidth: 1, borderColor: '#EEF2F7' }}>
                <TextInput
                  value={comment}
                  onChangeText={setComment}
                  placeholder="Algo a registar sobre o cliente..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  textAlignVertical="top"
                  className="min-h-[64px] text-[12px] leading-5 text-gray-700"
                />
              </View>
            </View>

            {answered ? (
              <View className="mb-4 flex-row items-center justify-center gap-1.5 rounded-2xl bg-amber-50 py-2.5">
                <Text className="text-[12px] font-bold text-amber-800">Nota do cliente:</Text>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons key={s} name={s <= previewRating ? 'star' : 'star-outline'} size={15} color={s <= previewRating ? '#F59E0B' : '#D1D5DB'} />
                ))}
              </View>
            ) : null}
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onClose}
              disabled={processing}
              className="flex-1 items-center justify-center rounded-full bg-gray-100"
              style={{ height: 52, opacity: processing ? 0.5 : 1 }}
            >
              <Text className="text-[14px] font-extrabold text-gray-700">Agora não</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => onSubmit({ polite: polite as boolean, changedScope: changedScope as boolean, comment })}
              disabled={processing || !answered}
              className="flex-1 flex-row items-center justify-center gap-2 rounded-full bg-brand-cyan"
              style={{ height: 52, opacity: processing || !answered ? 0.5 : 1 }}
            >
              {processing ? <ActivityIndicator color="#fff" /> : null}
              <Text className="text-[14px] font-extrabold text-white">{processing ? 'Enviando...' : 'Enviar avaliação'}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
