import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Keyboard, Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

type Role = 'client' | 'provider';

const PROVIDER_REASONS = [
  'Estou indisponível',
  'O cliente não respondeu',
  'O serviço não corresponde ao anunciado',
  'O valor não compensa',
  'Problema pessoal / Emergência',
  'Distância muito grande',
  'Outro',
];

const CLIENT_REASONS = [
  'Mudei de ideia / Já não preciso do serviço',
  'Resolvi o problema por outro meio',
  'Encontrei um profissional mais barato',
  'O prestador demorou para responder',
  'O prestador não compareceu',
  'Outro',
];

type Props = {
  visible: boolean;
  role: Role;
  processing?: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void | Promise<void>;
};

export function CancelReasonModal({ visible, role, processing, onClose, onConfirm }: Props) {
  const reasons = role === 'provider' ? PROVIDER_REASONS : CLIENT_REASONS;
  const [selected, setSelected] = useState<string | null>(null);
  const [other, setOther] = useState('');

  const isOther = selected === 'Outro';
  const canConfirm = useMemo(() => {
    if (processing) return false;
    if (!selected) return false;
    if (isOther && other.trim().length < 3) return false;
    return true;
  }, [processing, selected, isOther, other]);

  const handleConfirm = () => {
    if (!canConfirm || !selected) return;
    const reason = isOther ? other.trim() : selected;
    onConfirm(reason);
  };

  const title = role === 'provider' ? 'Cancelamento pelo Prestador' : 'Cancelamento pelo Cliente';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50 justify-end" onPress={processing ? undefined : onClose}>
        <Pressable className="rounded-t-[28px] bg-white px-5 pt-3 pb-8" onPress={() => Keyboard.dismiss()}>
          {/* grabber */}
          <View className="items-center">
            <View className="h-1.5 w-10 rounded-full bg-gray-200" />
          </View>

          <View className="mt-4 flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-red-50">
              <Ionicons name="close-circle-outline" size={22} color="#EF4444" />
            </View>
            <View className="flex-1">
              <Text className="text-[17px] font-extrabold text-gray-900">{title}</Text>
              <Text className="text-[12px] font-bold text-gray-400">Qual o principal motivo? (Obrigatório)</Text>
            </View>
          </View>

          <ScrollView
            className="mt-4"
            style={{ maxHeight: 340 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View className="gap-2.5">
              {reasons.map((r) => {
                const active = selected === r;
                return (
                  <TouchableOpacity
                    key={r}
                    activeOpacity={0.85}
                    onPress={() => setSelected(r)}
                    disabled={processing}
                    className="flex-row items-center rounded-2xl px-4 py-3.5"
                    style={{ borderWidth: 1.5, borderColor: active ? '#00E7FF' : '#EEF2F7', backgroundColor: active ? '#ECFEFF' : '#FFFFFF' }}
                  >
                    <View
                      className="h-5 w-5 items-center justify-center rounded-full"
                      style={{ borderWidth: 2, borderColor: active ? '#00A9BA' : '#CBD5E1' }}
                    >
                      {active ? <View style={{ height: 10, width: 10, borderRadius: 5, backgroundColor: '#00A9BA' }} /> : null}
                    </View>
                    <Text className="ml-3 flex-1 text-[14px] font-bold" style={{ color: active ? '#0F172A' : '#374151' }}>
                      {r}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {isOther ? (
              <View className="mt-3">
                <Text className="text-[12px] font-bold text-gray-500">Diz-nos o motivo</Text>
                <TextInput
                  value={other}
                  onChangeText={setOther}
                  placeholder="Escreve o motivo..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  textAlignVertical="top"
                  editable={!processing}
                  maxLength={300}
                  className="mt-2 min-h-[80px] rounded-2xl px-4 py-3 text-[13px] leading-5 text-gray-800"
                  style={{ borderWidth: 1, borderColor: '#EEF2F7' }}
                />
              </View>
            ) : null}
          </ScrollView>

          <View className="mt-5 gap-3">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleConfirm}
              disabled={!canConfirm}
              className="w-full flex-row items-center justify-center gap-2 rounded-2xl"
              style={{ height: 54, backgroundColor: '#EF4444', opacity: canConfirm ? 1 : 0.5 }}
            >
              {processing ? <ActivityIndicator color="#fff" /> : <Ionicons name="close" size={18} color="#fff" />}
              <Text className="text-[14px] font-extrabold text-white">{processing ? 'A cancelar...' : 'Confirmar cancelamento'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => (processing ? null : onClose())}
              className="w-full items-center justify-center rounded-2xl bg-gray-100"
              style={{ height: 52 }}
            >
              <Text className="text-[14px] font-extrabold text-gray-700">Voltar</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
