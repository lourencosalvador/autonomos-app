import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { ShieldCheck, Zap } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Keyboard, Modal, Pressable, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { computeFees, computeInstallments, formatMoney, REQUEST_FEE_RATE, URGENT_REQUEST_FEE_RATE } from '../lib/pricing';

type Props = {
  visible: boolean;
  serviceName: string;
  providerName: string;
  /** Valor acordado (minor units). */
  agreedAmount: number;
  currency?: string | null;
  processing?: boolean;
  /** Serviço de vários dias (FlexPay 30/70). */
  isMultiDay?: boolean;
  /** Qual parcela está a pagar: 1 (30%) ou 2 (70%). Só relevante em vários dias. */
  installment?: number;
  /** Estado inicial da urgência (em vários dias, fixado na 1ª parcela). */
  initialUrgent?: boolean;
  /** Bloqueia o toggle de urgência (parcela final já herda a escolha da 1ª). */
  lockUrgent?: boolean;
  onClose: () => void;
  onConfirm: (args: { isUrgent: boolean; method: PaymentMethod; phone?: string }) => void | Promise<void>;
};

export type PaymentMethod = 'card' | 'multicaixa' | 'reference';

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
  isMultiDay,
  installment = 1,
  initialUrgent,
  lockUrgent,
  onClose,
  onConfirm,
}: Props) {
  const [isUrgent, setIsUrgent] = useState(!!initialUrgent);
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [phone, setPhone] = useState('');
  // Ao (re)abrir, herda a urgência real do pedido (importante na parcela final, que a fixa).
  useEffect(() => {
    if (visible) setIsUrgent(!!initialUrgent);
  }, [visible, initialUrgent]);
  const fees = useMemo(() => computeFees(agreedAmount, isUrgent), [agreedAmount, isUrgent]);
  const phoneValid = phone.replace(/[^\d]/g, '').length >= 9;

  const requestFeePct = Math.round((isUrgent ? URGENT_REQUEST_FEE_RATE : REQUEST_FEE_RATE) * 100);

  // Vários dias divide-se em 30/70 em todos os métodos (cartão, Multicaixa e Referência).
  const plan = useMemo(() => computeInstallments(fees, !!isMultiDay), [fees, isMultiDay]);
  const isFinalInstallment = installment >= 2;
  const splitByInstallment = !!isMultiDay;
  const chargeAmount = !splitByInstallment
    ? fees.clientTotal
    : isFinalInstallment
      ? plan.finalClientAmount
      : plan.firstClientAmount;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50 justify-end" onPress={processing ? undefined : onClose}>
        <Pressable className="rounded-t-[28px] bg-white px-5 pt-3 pb-9" onPress={() => Keyboard.dismiss()}>
          {/* grabber */}
          <View className="items-center">
            <View className="h-1.5 w-10 rounded-full bg-gray-200" />
          </View>

          <View className="mt-4 flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50">
              <ShieldCheck size={22} color="#00A9BA" strokeWidth={2.4} />
            </View>
            <View className="flex-1">
              <Text className="text-[17px] font-extrabold text-gray-900">
                {splitByInstallment ? (isFinalInstallment ? 'Parcela final (70%)' : 'Entrada (30%)') : 'Pagamento seguro'}
              </Text>
              <Text className="text-[12px] font-bold text-gray-400">{serviceName} • {providerName}</Text>
            </View>
            {splitByInstallment ? (
              <View className="rounded-full bg-amber-100 px-2.5 py-1">
                <Text className="text-[10.5px] font-extrabold text-amber-700">{isFinalInstallment ? '2/2' : '1/2'}</Text>
              </View>
            ) : null}
          </View>

          {/* Escrow explainer — muda conforme a parcela em vários dias */}
          <View className="mt-4 flex-row gap-2 rounded-2xl bg-cyan-50/70 px-4 py-3" style={{ borderWidth: 1, borderColor: '#CFFAFE' }}>
            <Ionicons name="lock-closed" size={15} color="#00A9BA" style={{ marginTop: 1 }} />
            <Text className="flex-1 text-[11.5px] leading-4 font-bold text-cyan-900/80">
              {!splitByInstallment
                ? 'O valor fica retido na Autonomos e só é liberado ao prestador depois que você confirmar que o serviço foi concluído.'
                : isFinalInstallment
                  ? 'Esta parcela (70%) fica retida na Autonomos e é liberada ao prestador assim que confirmar que o serviço foi concluído.'
                  : 'Esta entrada (30%) é enviada já ao prestador para arrancar o trabalho. Os 70% finais ficam retidos até você concluir.'}
            </Text>
          </View>

          {/* Urgência — na parcela final já está fixada pela 1ª, por isso esconde */}
          {lockUrgent ? null : (
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
          )}

          {/* Método de pagamento */}
          <Text className="mt-4 text-[12px] font-extrabold text-gray-900">Método de pagamento</Text>
          <View className="mt-2 gap-2.5">
            {([
              { key: 'card' as const, label: 'Cartão', sub: 'Visa • Mastercard', icon: 'card-outline' as const },
              { key: 'multicaixa' as const, label: 'Multicaixa Express', sub: 'Confirma no teu telemóvel', icon: 'phone-portrait-outline' as const },
              { key: 'reference' as const, label: 'Pagamento por Referência', sub: 'Paga num ATM, Multicaixa ou app do banco', icon: 'barcode-outline' as const },
            ]).map((m) => {
              const active = method === m.key;
              return (
                <TouchableOpacity
                  key={m.key}
                  activeOpacity={0.85}
                  onPress={() => setMethod(m.key)}
                  disabled={processing}
                  className="flex-row items-center rounded-2xl px-3.5 py-3"
                  style={{ borderWidth: 1.5, borderColor: active ? '#00E7FF' : '#EEF2F7', backgroundColor: active ? '#ECFEFF' : '#FFFFFF' }}
                >
                  <View className="h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: active ? '#CFFAFE' : '#F1F5F9' }}>
                    <Ionicons name={m.icon} size={18} color={active ? '#00A9BA' : '#9CA3AF'} />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-[13.5px] font-extrabold" style={{ color: active ? '#0F172A' : '#374151' }}>{m.label}</Text>
                    <Text className="text-[11px] font-bold text-gray-400">{m.sub}</Text>
                  </View>
                  <View className="h-5 w-5 items-center justify-center rounded-full" style={{ borderWidth: 2, borderColor: active ? '#00A9BA' : '#CBD5E1' }}>
                    {active ? <View style={{ height: 10, width: 10, borderRadius: 5, backgroundColor: '#00A9BA' }} /> : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {method !== 'card' ? (
            <View className="mt-3">
              <Text className="text-[12px] font-bold text-gray-500">Número de telemóvel</Text>
              <TextInput
                value={phone}
                onChangeText={(t) => setPhone(t.replace(/[^\d]/g, ''))}
                placeholder="9XX XXX XXX"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                returnKeyType="done"
                blurOnSubmit
                onSubmitEditing={Keyboard.dismiss}
                maxLength={9}
                editable={!processing}
                className="mt-2 h-12 rounded-2xl px-4 text-[14px] font-bold text-gray-900"
                style={{ borderWidth: 1, borderColor: phoneValid ? '#00E7FF' : '#EEF2F7' }}
              />
              {!phoneValid ? (
                <Text className="mt-1.5 text-[11px] font-bold text-gray-400">Introduz o número (9 dígitos) para continuar.</Text>
              ) : null}
            </View>
          ) : null}

          {/* Breakdown */}
          <View className="mt-4 rounded-2xl bg-gray-50 px-4 py-3" style={{ borderWidth: 1, borderColor: '#EEF2F7' }}>
            <Row label="Valor do serviço" value={formatMoney(fees.agreed, currency)} />
            <Row label={`Taxa de solicitação (${requestFeePct}%)`} value={`+ ${formatMoney(fees.requestFee, currency)}`} />
            <View className="my-2 h-px bg-gray-200" />
            <Row label="Total do serviço" value={formatMoney(fees.clientTotal, currency)} strong />
            {splitByInstallment ? (
              <>
                <View className="my-2 h-px bg-gray-200" />
                <Row
                  label="Entrada (30%)"
                  value={formatMoney(plan.firstClientAmount, currency)}
                  muted={isFinalInstallment}
                />
                <Row
                  label="Parcela final (70%)"
                  value={formatMoney(plan.finalClientAmount, currency)}
                  muted={!isFinalInstallment}
                />
              </>
            ) : null}
          </View>

          {/* Total destaque + ação */}
          <View className="mt-5 flex-row items-end justify-between">
            <View>
              <Text className="text-[11px] font-bold text-gray-400">
                {splitByInstallment ? (isFinalInstallment ? 'A pagar agora (70%)' : 'A pagar agora (30%)') : 'Total'}
              </Text>
              <MotiView key={chargeAmount} from={{ opacity: 0.4, translateY: 4 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 200 }}>
                <Text className="text-[26px] font-extrabold text-gray-900">{formatMoney(chargeAmount, currency)}</Text>
              </MotiView>
            </View>
          </View>

          <View className="mt-4 gap-3">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => onConfirm({ isUrgent, method, phone: phone.replace(/[^\d]/g, '') })}
              disabled={processing}
              className="w-full items-center justify-center rounded-full bg-brand-cyan flex-row gap-2"
              style={{ height: 54, opacity: processing ? 0.6 : 1 }}
            >
              {processing ? <ActivityIndicator color="#fff" /> : <Ionicons name="lock-closed" size={16} color="#fff" />}
              <Text className="text-[14px] font-extrabold text-white">
                {processing
                  ? 'Processando...'
                  : method === 'reference'
                    ? 'Gerar referência'
                    : method === 'multicaixa'
                      ? `Pagar ${formatMoney(chargeAmount, currency)} • Multicaixa`
                      : `Pagar ${formatMoney(chargeAmount, currency)}`}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onClose}
              disabled={processing}
              className="w-full items-center justify-center rounded-full bg-gray-100"
              style={{ height: 54, opacity: processing ? 0.5 : 1 }}
            >
              <Text className="text-[14px] font-extrabold text-gray-700">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
