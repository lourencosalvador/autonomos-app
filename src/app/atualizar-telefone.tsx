import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Smartphone } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Text, TouchableOpacity, View } from 'react-native';
import PhoneInput from 'react-native-phone-number-input';
import { Flag } from 'react-native-country-picker-modal';
import { useAuthStore } from '../stores/authStore';

export default function AtualizarTelefoneScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const [phone, setPhone] = useState('');
  const [phoneFormatted, setPhoneFormatted] = useState('');

  useEffect(() => {
    if (!user?.phone) return;
    setPhone(user.phone);
    setPhoneFormatted(user.phone);
  }, [user?.id]);

  const handleSave = async () => {
    if (!phoneFormatted && !phone) {
      Alert.alert('Erro', 'Insira um número válido.');
      return;
    }
    try {
      await updateProfile({ phone: phoneFormatted || phone });
      Alert.alert('Sucesso', 'Número atualizado.');
      router.back();
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Não foi possível salvar.');
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
            defaultCode="AO"
            layout="first"
            value={phone}
            onChangeText={setPhone}
            onChangeFormattedText={setPhoneFormatted}
            placeholder="Inserir novo número"
            countryPickerProps={{
              withEmoji: false,
              renderFlagButton: (props: any) => (
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                  <Flag countryCode={props.countryCode} withEmoji={false} />
                </View>
              ),
            }}
            containerStyle={{
              width: '100%',
              backgroundColor: 'transparent',
              borderRadius: 16,
              height: 56,
            }}
            textContainerStyle={{
              backgroundColor: 'transparent',
              borderRadius: 16,
              paddingVertical: 0,
              paddingHorizontal: 0,
            }}
            textInputStyle={{
              color: '#000000',
              fontSize: 14,
              paddingVertical: 0,
            }}
            codeTextStyle={{ color: '#111827', fontSize: 14, fontWeight: '600' }}
            flagButtonStyle={{ width: 56 }}
            withDarkTheme={false}
            withShadow={false}
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

        {phoneFormatted ? (
          <Text className="mt-3 text-[12px] text-gray-400">
            Formato internacional: {phoneFormatted}
          </Text>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}


