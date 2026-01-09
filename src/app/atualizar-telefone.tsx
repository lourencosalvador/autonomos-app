import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Smartphone } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TouchableOpacity, View } from 'react-native';
import PhoneInput, { ICountry, isValidPhoneNumber } from 'react-native-international-phone-number';
import { useAuthStore } from '../stores/authStore';
import { toast } from '../lib/sonner';

export default function AtualizarTelefoneScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<ICountry | null>(null);

  useEffect(() => {
    if (!user?.phone) return;
    setPhoneNumber(user.phone);
  }, [user?.id]);

  const buildE164 = (country: ICountry | null, phone: string) => {
    const raw = (phone || '').trim();
    if (!raw) return '';
    if (raw.startsWith('+')) return raw;
    if (!country) return raw;
    const root = country.idd?.root || '+';
    const suffix = country.idd?.suffixes?.[0] || '';
    return `${root}${suffix}${raw}`.replace(/\s+/g, '');
  };

  const handleSave = async () => {
    if (!phoneNumber) {
      toast.error('Insira um número válido.');
      return;
    }
    if (selectedCountry && !isValidPhoneNumber(phoneNumber, selectedCountry)) {
      toast.error('Número de telefone inválido.');
      return;
    }
    try {
      const e164 = buildE164(selectedCountry, phoneNumber);
      await updateProfile({ phone: e164 || phoneNumber });
      toast.success('Número atualizado.');
      router.back();
    } catch (e: any) {
      toast.error(e?.message || 'Não foi possível salvar.');
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <StatusBar style="dark" />

      <View className="px-6 pt-16">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>

        <View className="mt-3">
          <View className="flex-row items-center gap-2">
            <Text className="text-[24px] font-extrabold text-gray-900">
              Atualizar Número de{'\n'}Telefone
            </Text>
            <Smartphone size={22} color="#00E7FF" strokeWidth={2.5} />
          </View>
          <Text className="mt-1 text-[13px] text-gray-400">
            Vamos alterar o seu Número!
          </Text>
        </View>
      </View>

      <View className="px-6 pt-8">
        <View className="rounded-2xl bg-gray-100 px-4 py-2">
          <PhoneInput
            value={phoneNumber}
            onChangePhoneNumber={setPhoneNumber}
            selectedCountry={selectedCountry}
            onChangeSelectedCountry={setSelectedCountry}
            defaultCountry="AO"
            language="por"
            theme="light"
            placeholder="Inserir novo número"
            phoneInputPlaceholderTextColor="#9CA3AF"
            phoneInputSelectionColor="#00E7FF"
            disabled={isLoading}
            modalType="bottomSheet"
            phoneInputStyles={{
              container: {
                backgroundColor: 'transparent',
                borderWidth: 0,
                minHeight: 56,
                alignItems: 'center',
                justifyContent: 'flex-start',
              },
              flagContainer: {
                backgroundColor: 'transparent',
                paddingHorizontal: 10,
                borderTopLeftRadius: 16,
                borderBottomLeftRadius: 16,
              },
              caret: { color: '#9CA3AF', fontSize: 14 },
              divider: { backgroundColor: '#E5E7EB', marginLeft: 10, marginRight: 10, height: '55%' },
              callingCode: { color: '#111827', fontWeight: '800', fontSize: 14, minWidth: 54, textAlign: 'center' },
              input: { color: '#111827', fontSize: 14, fontWeight: '700', paddingHorizontal: 12, paddingVertical: 0 },
            }}
          />
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          className="mt-7 h-12 items-center justify-center rounded-full bg-brand-cyan"
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text className="text-[14px] font-bold text-white">{isLoading ? 'Salvando...' : 'Salvar Novo Número'}</Text>
        </TouchableOpacity>

        {phoneNumber ? (
          <Text className="mt-3 text-[12px] text-gray-400">
            Número: {phoneNumber}
          </Text>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}


