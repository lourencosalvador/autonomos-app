import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronDown, User } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../stores/authStore';
import { toast } from '../lib/sonner';
import { DatePickerModal } from '../components/DatePickerModal';
import { uploadAvatarToSupabase } from '../services/avatarUpload';
import { DismissKeyboardView } from '../components/DismissKeyboardView';

export default function AtualizarInformacoesScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'Masculino' | 'Feminino' | 'Outro' | ''>('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [genderOpen, setGenderOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [workOpen, setWorkOpen] = useState(false);
  const [workArea, setWorkArea] = useState('');

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setGender((user.gender as any) || '');
    setWorkArea(user.workArea || '');
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

  const workOptions = useMemo(
    () => ['Fotografia', 'Fotógrafo', 'Design Gráfico', 'Barbeiro', 'Pastelaria', 'Cocktail', 'Cabeleireiro'],
    []
  );

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Informe o seu nome.');
      return;
    }
    if (user?.role === 'professional' && !workArea.trim()) {
      toast.error('Informe sua Área de Trabalho.');
      return;
    }
    try {
      const birthDateIso = birthDate ? birthDate.toISOString().slice(0, 10) : null;
      await updateProfile({
        name: name.trim(),
        gender: gender || null,
        birthDate: birthDateIso,
        workArea: user?.role === 'professional' ? workArea.trim() : undefined,
      });
      toast.success('Informações atualizadas.');
      router.back();
    } catch (e: any) {
      toast.error(e?.message || 'Não foi possível salvar.');
    }
  };

  const handleChangeAvatar = async () => {
    if (!user) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      toast.error('Permita o acesso à galeria para trocar a foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (result.canceled) return;

    const uri = result.assets?.[0]?.uri;
    if (!uri) return;

    try {
      setAvatarUploading(true);
      const toastId = toast.loading('Atualizando foto...');
      const { publicUrl } = await uploadAvatarToSupabase({ userId: user.id, uri });
      await updateProfile({ avatarUrl: publicUrl });
      toast.dismiss(toastId);
      toast.success('Foto atualizada.');
    } catch (e: any) {
      toast.error(e?.message || 'Não foi possível atualizar a foto.');
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <DismissKeyboardView>
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

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 28 }}
      >
        <View className="mb-5 flex-row items-center">
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleChangeAvatar}
            disabled={avatarUploading || isLoading}
            className="h-16 w-16 rounded-full overflow-hidden bg-gray-100 items-center justify-center"
            style={{ borderWidth: 2, borderColor: '#E5E7EB' }}
          >
            {avatarUploading ? (
              <ActivityIndicator color="#00E7FF" />
            ) : user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            ) : (
              <Ionicons name="person-outline" size={26} color="#9CA3AF" />
            )}
          </TouchableOpacity>

          <View className="ml-4 flex-1">
            <Text className="text-[14px] font-extrabold text-gray-900">Foto de perfil</Text>
            <Text className="mt-1 text-[12px] font-bold text-gray-400">
              Toque para escolher uma nova foto.
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleChangeAvatar}
            disabled={avatarUploading || isLoading}
            className="h-11 px-4 items-center justify-center rounded-full bg-brand-cyan"
          >
            <Text className="text-[12px] font-extrabold text-white">{avatarUploading ? '...' : 'Alterar'}</Text>
          </TouchableOpacity>
        </View>

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

        {user?.role === 'professional' ? (
          <View className="mt-4">
            <Text className="mb-2 text-[12px] font-bold text-gray-500">Área de Trabalho</Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setWorkOpen(true)}
              className="flex-row items-center justify-between rounded-2xl bg-gray-100 px-5 py-4"
            >
              <Text className="text-[14px]" style={{ color: workArea ? '#000000' : '#9CA3AF' }}>
                {workArea || 'Selecione'}
              </Text>
              <ChevronDown size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        ) : null}

        <TouchableOpacity
          activeOpacity={0.85}
          className="mt-10 h-12 items-center justify-center rounded-full bg-brand-cyan"
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text className="text-[14px] font-bold text-white">{isLoading ? 'Salvando...' : 'Salvar Informações'}</Text>
        </TouchableOpacity>
      </ScrollView>

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
      </KeyboardAvoidingView>
    </DismissKeyboardView>
  );
}


