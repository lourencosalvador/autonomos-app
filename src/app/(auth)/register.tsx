import { AntDesign, Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronDown } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Keyboard, Modal, Platform, Pressable, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import PhoneInput, { ICountry, isValidPhoneNumber } from 'react-native-international-phone-number';
import { useAuthStore, UserRole } from '../../stores/authStore';
import { toast } from '../../lib/sonner';
import { DatePickerModal } from '../../components/DatePickerModal';

const fieldClass = 'rounded-2xl bg-gray-100 px-5 py-4';

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ accountType?: UserRole }>();
  const { signUp, signInWithOAuth, isLoading } = useAuthStore();

  const [role, setRole] = useState<UserRole>('client');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<ICountry | null>(null);
  const [gender, setGender] = useState<'Masculino' | 'Feminino' | 'Outro' | ''>('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [dateOpen, setDateOpen] = useState(false);
  const [genderOpen, setGenderOpen] = useState(false);
  const [workArea, setWorkArea] = useState('');
  const [workOpen, setWorkOpen] = useState(false);

  useEffect(() => {
    if (params.accountType) setRole(params.accountType);
  }, [params.accountType]);

  const birthLabel = useMemo(() => {
    if (!birthDate) return '';
    return birthDate.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }, [birthDate]);

  const birthIso = useMemo(() => {
    return birthDate ? birthDate.toISOString().slice(0, 10) : null;
  }, [birthDate]);

  const workOptions = useMemo(
    () => ['Fotografia', 'Design', 'Construção', 'Cabeleireiro', 'Mecânica', 'Limpeza', 'Marketing'],
    []
  );

  const handleGoogle = async () => {
    const id = toast.loading('Conectando com Google...');
    try {
      if (role === 'professional' && !workArea) {
        toast.dismiss(id);
        toast.error('Selecione a Área de Trabalho.');
        return;
      }
      // Fluxo de cadastro com Google: já salva o tipo de conta escolhido (role) no profile.
      await signInWithOAuth('google', { role, workArea: workArea || null });
      toast.dismiss(id);
      toast.success('Conta criada com Google.');
    } catch (e: any) {
      toast.dismiss(id);
      toast.error(e?.message || 'Falha ao conectar com Google');
    }
  };

  const handleApple = async () => {
    try {
      toast('Criar conta com Apple está em manutenção.');
      return;
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao conectar com Apple');
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password) {
      toast.error('Preencha os campos obrigatórios.');
      return;
    }
    if (role === 'professional' && !workArea) {
      toast.error('Selecione a Área de Trabalho.');
      return;
    }
    if (phoneNumber && selectedCountry && !isValidPhoneNumber(phoneNumber, selectedCountry)) {
      toast.error('Número de telefone inválido.');
      return;
    }
    const id = toast.loading('Criando conta...');
    try {
      const raw = String(phoneNumber || '').replace(/\D/g, '');
      const dial = selectedCountry?.callingCode ? String(selectedCountry.callingCode).replace(/\D/g, '') : '';
      const e164 = raw ? `+${dial}${raw}` : null;
      await signUp(name, email, password, role, {
        phone: e164,
        workArea: workArea || null,
        gender: gender || null,
        birthDate: birthIso,
      });
      // Se não foi autenticado automaticamente, manda para login (sem falar de confirmação por email).
      const authed = useAuthStore.getState().isAuthenticated;
      if (!authed) {
        toast.dismiss(id);
        toast.success('Conta criada. Agora faça login.');
        router.replace('/(auth)/login');
        return;
      }
      toast.dismiss(id);
      toast.success('Conta criada.');
    } catch (e: any) {
      toast.dismiss(id);
      toast.error(e?.message || 'Não foi possível criar a conta.');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View className="flex-1 bg-white">
        <StatusBar style="dark" />

        <FlatList
          data={[]}
          keyExtractor={() => 'empty'}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 28 }}
          ListHeaderComponent={
            <View className="px-6 pt-16">
              <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} className="h-10 w-10 items-start justify-center">
                <Ionicons name="arrow-back" size={24} color="#111827" />
              </TouchableOpacity>

              <Text className="mt-3 text-[28px] font-extrabold text-gray-900">Criar Conta</Text>

              <View className="mt-1 flex-row items-center gap-1">
                <Text className="text-[13px] text-gray-500">Já possui uma conta?</Text>
                <TouchableOpacity onPress={() => router.replace('/(auth)/login')} activeOpacity={0.7}>
                  <Text className="text-[13px] font-extrabold text-gray-900">Entrar!</Text>
                </TouchableOpacity>
              </View>

              <View className="mt-8 gap-4">
            <View className={fieldClass}>
              <TextInput
                placeholder="Nome Completo"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
                editable={!isLoading}
                className="text-[14px]"
                style={{ color: '#000000' }}
              />
            </View>

            <View className={fieldClass}>
              <TextInput
                placeholder="E-mail"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                className="text-[14px]"
                style={{ color: '#000000' }}
              />
            </View>

            <View className="flex-row gap-4">
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setGenderOpen(true)}
                className="flex-1 flex-row items-center justify-between rounded-2xl bg-gray-100 px-5 py-4"
              >
                <Text className="text-[14px]" style={{ color: gender ? '#000000' : '#9CA3AF' }}>
                  {gender || 'Gênero'}
                </Text>
                <ChevronDown size={18} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setDateOpen(true)}
                className="flex-1 flex-row items-center justify-between rounded-2xl bg-gray-100 px-5 py-4"
              >
                <Text className="text-[14px]" style={{ color: birthLabel ? '#000000' : '#9CA3AF' }}>
                  {birthLabel || 'dd/mm/aa'}
                </Text>
                <Ionicons name="calendar-outline" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <View className="rounded-2xl bg-gray-100 px-4 py-2">
              <PhoneInput
                value={phoneNumber}
                onChangePhoneNumber={setPhoneNumber}
                selectedCountry={selectedCountry}
                onChangeSelectedCountry={setSelectedCountry}
                defaultCountry="AO"
                language="por"
                theme="light"
                placeholder="Número de Telefone"
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

            {role === 'professional' ? (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setWorkOpen(true)}
                className="flex-row items-center justify-between rounded-2xl bg-gray-100 px-5 py-4"
              >
                <Text className="text-[14px]" style={{ color: workArea ? '#000000' : '#9CA3AF' }}>
                  {workArea || 'Área de Trabalho'}
                </Text>
                <ChevronDown size={18} color="#9CA3AF" />
              </TouchableOpacity>
            ) : null}

            <View className={fieldClass}>
              <TextInput
                placeholder="Senha"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isLoading}
                className="text-[14px]"
                style={{ color: '#000000' }}
              />
            </View>

            <TouchableOpacity
              className="mt-2 rounded-full bg-brand-cyan py-5 flex-row items-center justify-center"
              activeOpacity={0.85}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? <ActivityIndicator color="white" className="mr-2" /> : null}
              <Text className="text-[16px] font-bold text-white">{isLoading ? 'Entrando...' : 'Entrar'}</Text>
            </TouchableOpacity>

            <View className="my-4 flex-row items-center">
              <View className="h-[1px] flex-1 bg-gray-200" />
              <Text className="mx-10 text-[13px] font-bold text-gray-500">Ou</Text>
              <View className="h-[1px] flex-1 bg-gray-200" />
            </View>

            <View className="flex-row gap-4">
              <TouchableOpacity
                className="flex-1 flex-row items-center justify-center rounded-full bg-[#F4F4F4] py-4"
                activeOpacity={0.85}
                onPress={handleGoogle}
                disabled={isLoading}
              >
                <AntDesign name="google" size={22} color="#DB4437" style={{ marginRight: 10 }} />
                <Text className="text-[14px] font-bold text-gray-600">Google</Text>
              </TouchableOpacity>

              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  className="flex-1 flex-row items-center justify-center rounded-full bg-[#F4F4F4] py-4"
                  activeOpacity={0.85}
                  onPress={handleApple}
                  disabled={isLoading}
                >
                  <AntDesign name="apple" size={22} color="#000000" style={{ marginRight: 10 }} />
                  <Text className="text-[14px] font-bold text-gray-600">Apple</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
            </View>
          }
        />

        <Modal visible={genderOpen} transparent animationType="fade" onRequestClose={() => setGenderOpen(false)}>
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
                      {selected ? <View className="h-2.5 w-2.5 rounded-full bg-brand-cyan" /> : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </Pressable>
          </Pressable>
        </Modal>

        <Modal visible={workOpen} transparent animationType="fade" onRequestClose={() => setWorkOpen(false)}>
          <Pressable className="flex-1 bg-black/40 px-6" onPress={() => setWorkOpen(false)}>
            <Pressable
              className="mt-44 rounded-3xl bg-white p-5"
              onPress={() => {}}
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.12,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <Text className="text-[16px] font-extrabold text-gray-900">Área de Trabalho</Text>
              <Text className="mt-1 text-[12px] text-gray-400">Selecione uma opção</Text>

              {workOptions.map((opt) => {
                const selected = workArea === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    activeOpacity={0.85}
                    onPress={() => {
                      setWorkArea(opt);
                      setWorkOpen(false);
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
                      {selected ? <View className="h-2.5 w-2.5 rounded-full bg-brand-cyan" /> : null}
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
      </View>
    </TouchableWithoutFeedback>
  );
}
