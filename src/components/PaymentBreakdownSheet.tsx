import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { ShieldCheck, Zap } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Switch, Text, TouchableOpacity, View } from 'react-native';
import { computeFees, formatMoney, REQUEST_FEE_RATE, URGENT_REQUEST_FEE_RATE } from '../lib/pricing';

type Props = {
  visible: boolean;
  serviceName: string;
  providerName: string;
  /** Valor acordado (minor units). */
  agreedAmount: number;
  currency?: string | null;
  processing?: boolean;
  onClose: () => void;
  onConfirm: (args: { isUrgent: boolean }) => void | Promise<void>;
};

function Row({ label, value, muted, strong }: { label: string; value: string; muted?: boolean; strong?: boolean }) {
  return (
    <View className="flex-row items-center justify-between py-1.5">
      <Text className={`text-[13px] ${strong ? 'font-extrabold text-gray-900' : muted ? 'font-bold text-gray-400' : 'font-bold text-gray-600'}`}>
        {label}
      </Text>
      <Text className={`text-[13px] ${strong ? 'font-extrabold text-gray-900' : 'font-bold text-gray-700'}`}>{value}</Text>
    </View>
  );
}

export function PaymentBreakdownSheet({
  visible,
  serviceName,
  providerName,
  agreedAmount,
  currency,
  processing,
  onClose,
  onConfirm,
}: Props) {
  const [isUrgent, setIsUrgent] = useState(false);
  const fees = useMemo(() => computeFees(agreedAmount, isUrgent), [agreedAmount, isUrgent]);

  const requestFeePct = Math.round((isUrgent ? URGENT_REQUEST_FEE_RATE : REQUEST_FEE_RATE) * 100);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50 justify-end" onPress={processing ? undefined : onClose}>
        <Pressable className="rounded-t-[28px] bg-white px-5 pt-3 pb-9" onPress={() => {}}>
          {/* grabber */}
          <View className="items-center">
            <View className="h-1.5 w-10 rounded-full bg-gray-200" />
          </View>

          <View className="mt-4 flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50">
              <ShieldCheck size={22} color="#00A9BA" strokeWidth={2.4} />
            </View>
            <View className="flex-1">
              <Text className="text-[17px] font-extrabold text-gray-900">Pagamento seguro</Text>
              <Text className="text-[12px] font-bold text-gray-400">{serviceName} • {providerName}</Text>
            </View>
          </View>

          {/* Escrow explainer */}
          <View className="mt-4 flex-row gap-2 rounded-2xl bg-cyan-50/70 px-4 py-3" style={{ borderWidth: 1, borderColor: '#CFFAFE' }}>
            <Ionicons name="lock-closed" size={15} color="#00A9BA" style={{ marginTop: 1 }} />
            <Text className="flex-1 text-[11.5px] leading-4 font-bold text-cyan-900/80">
              O valor fica retido na Autonomos e só é liberado ao prestador depois que você confirmar que o serviço foi concluído.
            </Text>
          </View>

          {/* Urgência */}
          <MotiView
            animate={{ borderColor: isUrgent ? '#F59E0B' : '#EEF2F7', backgroundColor: isUrgent ? '#FFFBEB' : '#FFFFFF' }}
            transition={{ type: 'timing', duration: 200 }}
            style={{ borderWidth: 1, borderRadius: 18, marginTop: 16, paddingHorizontal: 16, paddingVertical: 12 }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1 flex-row items-center gap-2.5">
                <View className={`h-9 w-9 items-center justify-center rounded-xl ${isUrgent ? 'bg-amber-100' : 'bg-gray-100'}`}>
                  <Zap size={18} color={isUrgent ? '#F59E0B' : '#9CA3AF'} strokeWidth={2.6} fill={isUrgent ? '#F59E0B' : 'transparent'} />
                </View>
                <View className="flex-1 pr-2">
                  <Text className="text-[13.5px] font-extrabold text-gray-900">Serviço urgente</Text>
                  <Text className="text-[11px] font-bold text-gray-400">Prioriza o pedido • dobra a taxa de solicitação</Text>
                </View>
              </View>
              <Switch
                value={isUrgent}
                onValueChange={setIsUrgent}
                trackColor={{ false: '#E5E7EB', true: '#FCD34D' }}
                thumbColor={isUrgent ? '#F59E0B' : '#FFFFFF'}
                disabled={processing}
              />
            </View>
          </MotiView>

          {/* Breakdown */}
          <View className="mt-4 rounded-2xl bg-gray-50 px-4 py-3" style={{ borderWidth: 1, borderColor: '#EEF2F7' }}>
            <Row label="Valor do serviço" value={formatMoney(fees.agreed, currency)} />
            <Row label={`Taxa de solicitação (${requestFeePct}%)`} value={`+ ${formatMoney(fees.requestFee, currency)}`} />
            <View className="my-2 h-px bg-gray-200" />
            <Row label="Total a pagar" value={formatMoney(fees.clientTotal, currency)} strong />
          </View>

          {/* Total destaque + ação */}
          <View className="mt-5 flex-row items-end justify-between">
            <View>
              <Text className="text-[11px] font-bold text-gray-400">Total</Text>
              <MotiView key={fees.clientTotal} from={{ opacity: 0.4, translateY: 4 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 200 }}>
                <Text className="text-[26px] font-extrabold text-gray-900">{formatMoney(fees.clientTotal, currency)}</Text>
              </MotiView>
            </View>
          </View>

          <View className="mt-4 flex-row gap-3">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onClose}
              disabled={processing}
              className="flex-1 h-13 items-center justify-center rounded-full bg-gray-100"
              style={{ height: 52, opacity: processing ? 0.5 : 1 }}
            >
              <Text className="text-[14px] font-extrabold text-gray-700">Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => onConfirm({ isUrgent })}
              disabled={processing}
              className="flex-1 items-center justify-center rounded-full bg-brand-cyan flex-row gap-2"
              style={{ height: 52, opacity: processing ? 0.7 : 1 }}
            >
              {processing ? <ActivityIndicator color="#fff" /> : <Ionicons name="lock-closed" size={16} color="#fff" />}
              <Text className="text-[14px] font-extrabold text-white">
                {processing ? 'Processando...' : `Pagar ${formatMoney(fees.clientTotal, currency)}`}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
