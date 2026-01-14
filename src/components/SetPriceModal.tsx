import { useMemo, useState } from 'react';
import { Keyboard, Modal, Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { toast } from '../lib/sonner';

function toMinorUnits(value: number) {
  // Mantemos simples (2 casas). Se precisar suportar moedas sem casas, ajustamos depois.
  return Math.round(value * 100);
}

function normalizeCurrency(input: string) {
  const c = String(input || '').trim().toLowerCase();
  if (!c) return 'usd';
  // Para testes (PaymentSheet), use USD. AOA pode falhar dependendo da conta/métodos ativados.
  if (c === 'kz' || c === 'kwanza' || c === 'aoa') return 'usd';
  return c;
}

export function SetPriceModal(props: {
  visible: boolean;
  onClose: () => void;
  initialMajor?: number | null;
  initialCurrency?: string | null;
  onSave: (args: { priceAmount: number; currency: string }) => Promise<void> | void;
}) {
  const [majorText, setMajorText] = useState(() => (props.initialMajor ? String(props.initialMajor) : ''));
  const [currency, setCurrency] = useState(() => normalizeCurrency(props.initialCurrency || 'usd'));
  const major = useMemo(() => {
    const normalized = majorText.replace(',', '.').replace(/[^\d.]/g, '');
    const n = Number(normalized);
    return Number.isFinite(n) ? n : 0;
  }, [majorText]);

  const handleSave = async () => {
    if (!major || major <= 0) return toast.error('Digite um valor válido.');
    const amount = toMinorUnits(major);
    try {
      toast.loading('Salvando preço...');
      await props.onSave({ priceAmount: amount, currency: normalizeCurrency(currency) });
      toast.success('Preço definido.');
      props.onClose();
    } catch (e: any) {
      toast.error(e?.message || 'Não foi possível salvar o preço.');
    }
  };

  return (
    <Modal visible={props.visible} transparent animationType="fade" onRequestClose={props.onClose}>
      <Pressable className="flex-1 bg-black/50 items-center justify-end px-5 pb-10" onPress={Keyboard.dismiss}>
        <Pressable className="w-full rounded-3xl bg-white p-5" onPress={() => {}} style={{ borderWidth: 1, borderColor: '#EEF2F7' }}>
          <Text className="text-[16px] font-extrabold text-gray-900">Definir preço</Text>
          <Text className="mt-1 text-[12px] text-gray-500">
            O cliente só consegue pagar depois que você definir o valor.
          </Text>

          <View className="mt-4 flex-row gap-3">
            <View className="flex-1">
              <Text className="text-[12px] text-gray-500">Valor</Text>
              <TextInput
                value={majorText}
                onChangeText={setMajorText}
                placeholder="Ex: 25.00"
                keyboardType="decimal-pad"
                className="mt-2 h-12 rounded-2xl px-4 text-[14px] font-bold text-gray-900"
                style={{ borderWidth: 1, borderColor: '#EEF2F7' }}
              />
            </View>
            <View style={{ width: 92 }}>
              <Text className="text-[12px] text-gray-500">Moeda</Text>
              <TextInput
                value={currency}
                onChangeText={setCurrency}
                placeholder="usd"
                autoCapitalize="none"
                className="mt-2 h-12 rounded-2xl px-4 text-[14px] font-bold text-gray-900"
                style={{ borderWidth: 1, borderColor: '#EEF2F7' }}
              />
            </View>
          </View>

          <View className="mt-5 flex-row gap-3">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={props.onClose}
              className="flex-1 h-12 items-center justify-center rounded-full bg-gray-100"
            >
              <Text className="text-[14px] font-extrabold text-gray-700">Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSave}
              className="flex-1 h-12 items-center justify-center rounded-full bg-brand-cyan"
            >
              <Text className="text-[14px] font-extrabold text-white">Salvar</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}


