import { Ionicons } from '@expo/vector-icons';
import { Zap } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { currencySymbol, formatMoney } from '../lib/pricing';

type Props = {
  visible: boolean;
  /** Saldo disponível (sacável) em minor units. */
  available: number;
  currency?: string | null;
  processing?: boolean;
  onClose: () => void;
  /** amount em minor units. */
  onConfirm: (args: { amount: number }) => void | Promise<void>;
};

export function WithdrawSheet({ visible, available, currency, processing, onClose, onConfirm }: Props) {
  const [majorText, setMajorText] = useState('');

  useEffect(() => {
    if (visible) setMajorText((available / 100).toFixed(2));
  }, [visible, available]);

  const amount = useMemo(() => {
    const major = parseFloat(majorText.replace(',', '.'));
    if (!Number.isFinite(major) || major <= 0) return 0;
    return Math.round(major * 100);
  }, [majorText]);

  const invalid = amount <= 0 || amount > available;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50 justify-end" onPress={processing ? undefined : onClose}>
        <Pressable className="rounded-t-[28px] bg-white px-5 pt-3 pb-9" onPress={() => {}}>
          <View className="items-center">
            <View className="h-1.5 w-10 rounded-full bg-gray-200" />
          </View>

          <View className="mt-4 flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50">
              <Zap size={22} color="#00A9BA" strokeWidth={2.4} fill="#7AE6FF" />
            </View>
            <View className="flex-1">
              <Text className="text-[17px] font-extrabold text-gray-900">Saque FlexPay</Text>
              <Text className="text-[12px] font-bold text-gray-400">Disponível: {formatMoney(available, currency)}</Text>
            </View>
          </View>

          <Text className="mt-5 text-[12px] font-bold text-gray-500">Quanto deseja sacar?</Text>
          <View className="mt-2 flex-row items-center rounded-2xl bg-gray-50 px-4" style={{ borderWidth: 1, borderColor: invalid && amount > 0 ? '#FCA5A5' : '#EEF2F7', height: 56 }}>
            <Text className="text-[15px] font-extrabold text-gray-400 mr-2">{currencySymbol(currency)}</Text>
            <TextInput
              value={majorText}
              onChangeText={setMajorText}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#9CA3AF"
              editable={!processing}
              className="flex-1 text-[18px] font-extrabold text-gray-900"
            />
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setMajorText((available / 100).toFixed(2))}
              className="rounded-full bg-cyan-50 px-3 py-1.5"
            >
              <Text className="text-[12px] font-extrabold text-cyan-700">Máx</Text>
            </TouchableOpacity>
          </View>
          {amount > available ? (
            <Text className="mt-1.5 text-[11px] font-bold text-red-500">Valor acima do disponível.</Text>
          ) : null}

          <View className="mt-4 flex-row gap-2 rounded-2xl bg-amber-50 px-4 py-3" style={{ borderWidth: 1, borderColor: '#FDE68A' }}>
            <Ionicons name="time-outline" size={16} color="#D97706" style={{ marginTop: 1 }} />
            <Text className="flex-1 text-[11.5px] leading-4 font-bold text-amber-800">
              O valor será refletido na sua conta num período de 24h a 48h após a solicitação.
            </Text>
          </View>

          <View className="mt-5 flex-row gap-3">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onClose}
              disabled={processing}
              className="flex-1 items-center justify-center rounded-full bg-gray-100"
              style={{ height: 52, opacity: processing ? 0.5 : 1 }}
            >
              <Text className="text-[14px] font-extrabold text-gray-700">Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => onConfirm({ amount })}
              disabled={processing || invalid}
              className="flex-1 flex-row items-center justify-center gap-2 rounded-full bg-brand-cyan"
              style={{ height: 52, opacity: processing || invalid ? 0.5 : 1 }}
            >
              {processing ? <ActivityIndicator color="#fff" /> : null}
              <Text className="text-[14px] font-extrabold text-white">{processing ? 'Solicitando...' : 'Solicitar saque'}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
