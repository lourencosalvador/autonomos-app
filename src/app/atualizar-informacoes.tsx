import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronDown, User } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { toast } from '../lib/sonner';
import { DatePickerModal } from '../components/DatePickerModal';

export default function AtualizarInformacoesScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const [name, setName] = useState('');
  const [gender, setGender] = useState<'Masculino' | 'Feminino' | 'Outro' | ''>('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [genderOpen, setGenderOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setGender((user.gender as any) || '');
    if (user.birthDate) {
      const d = new Date(user.birthDate);
      if (!Number.isNaN(d.getTime())) setBirthDate(d);
    }
  }, [user?.id]);

  const birthLabel = useMemo(() => {
    if (!birthDate) return '';
    return birthDate.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }, [birthDate]);

  const birthIso = useMemo(() => {
    return birthDate ? birthDate.toISOString().slice(0, 10) : null;
  }, [birthDate]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Informe o seu nome.');
      return;
    }
    try {
      const birthDateIso = birthDate ? birthDate.toISOString().slice(0, 10) : null;
      await updateProfile({
        name: name.trim(),
        gender: gender || null,
        birthDate: birthDateIso,
      });
      toast.success('Informações atualizadas.');
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
              Atualizar Informações{'\n'}Pessoal
            </Text>
            <User size={22} color="#00E7FF" strokeWidth={2.5} />
          </View>
          <Text className="mt-1 text-[13px] text-gray-400">
            Vamos alterar suas informações pessoais!
          </Text>
        </View>
      </View>

      <View className="px-6 pt-8">
        <View className="mb-4 rounded-2xl bg-gray-100 px-5 py-4">
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Nome Completo"
            placeholderTextColor="#9CA3AF"
            className="text-[14px]"
            style={{ color: '#000000' }}
          />
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setGenderOpen(true)}
          className="mb-4 flex-row items-center justify-between rounded-2xl bg-gray-100 px-5 py-4"
        >
          <Text className="text-[14px]" style={{ color: gender ? '#000000' : '#9CA3AF' }}>
            {gender || 'Gênero'}
          </Text>
          <ChevronDown size={18} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setDateOpen(true)}
          className="flex-row items-center justify-between rounded-2xl bg-gray-100 px-5 py-4"
        >
          <Text className="text-[14px]" style={{ color: birthLabel ? '#000000' : '#9CA3AF' }}>
            {birthLabel || 'Data de Nascimento'}
          </Text>
          <ChevronDown size={18} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          className="mt-10 h-12 items-center justify-center rounded-full bg-brand-cyan"
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text className="text-[14px] font-bold text-white">{isLoading ? 'Salvando...' : 'Salvar Informações'}</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={genderOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setGenderOpen(false)}
      >
        <Pressable className="flex-1 bg-black/40 px-6" onPress={() => setGenderOpen(false)}>
          <Pressable
            className="mt-40 rounded-3xl bg-white p-5"
            onPress={() => {}}
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.12,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            <Text className="text-[16px] font-extrabold text-gray-900">Selecionar Gênero</Text>
            <Text className="mt-1 text-[12px] text-gray-400">Escolha uma opção</Text>

            {(['Masculino', 'Feminino', 'Outro'] as const).map((opt) => {
              const selected = gender === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  activeOpacity={0.85}
                  onPress={() => {
                    setGender(opt);
                    setGenderOpen(false);
                  }}
                  className="mt-4 flex-row items-center justify-between rounded-2xl bg-gray-100 px-5 py-4"
                  style={selected ? { borderWidth: 1.5, borderColor: '#00E7FF' } : undefined}
                >
                  <Text className="text-[14px] text-gray-900">{opt}</Text>
                  <View
                    className="h-5 w-5 rounded-full"
                    style={{
                      borderWidth: 2,
                      borderColor: selected ? '#00E7FF' : '#D1D5DB',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {selected && <View className="h-2.5 w-2.5 rounded-full bg-brand-cyan" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      <DatePickerModal
        open={dateOpen}
        title="Data de nascimento"
        value={birthIso}
        onClose={() => setDateOpen(false)}
        onConfirm={(iso) => {
          setBirthDate(new Date(iso));
          setDateOpen(false);
        }}
      />
    </KeyboardAvoidingView>
  );
}


