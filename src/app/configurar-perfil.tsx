import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { toast } from '../lib/sonner';
import { useAuthStore } from '../stores/authStore';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { uploadAvatarToSupabase } from '../services/avatarUpload';
import { uploadCertificateToSupabase } from '../services/certificateUpload';
import { WEEK_DAYS, formatAvailability } from '../lib/availability';

const EXP = [
  { v: 'lt1', label: 'Menos de 1 ano' },
  { v: '2', label: '2 anos' },
  { v: '3plus', label: '3 anos ou mais' },
];

const STEP_META = [
  { title: 'Biografia', subtitle: 'Compartilhe a sua história profissional para que os clientes o conheçam melhor.' },
  { title: 'Histórico de trabalho', subtitle: 'Fale do seu trabalho e da sua experiência para os clientes entenderem as suas habilidades.' },
  { title: 'Horário de disponibilidade', subtitle: 'Defina os dias e as horas em que os clientes podem contar consigo.' },
  { title: 'Certificados', subtitle: 'Adicione certificados (imagem ou PDF) para reforçar a sua credibilidade. Opcional.' },
  { title: 'Foto de perfil', subtitle: 'Uma foto ajuda os clientes a reconhecê-lo e cria uma ligação mais pessoal.' },
];

function pad(n: number) {
  return String(n).padStart(2, '0');
}
function toDate(hhmm: string) {
  const [h, m] = (hhmm || '08:00').split(':').map(Number);
  const d = new Date();
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}
function fmtTime(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ConfigurarPerfilScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const [step, setStep] = useState(0);
  const [bio, setBio] = useState(user?.bio || '');
  const [workDescription, setWorkDescription] = useState(user?.workDescription || '');
  const [experienceTime, setExperienceTime] = useState<string | null>(user?.experienceTime || null);
  const [days, setDays] = useState<number[]>(user?.availability?.days?.length ? user!.availability!.days : [1, 2, 3, 4, 5]);
  const [start, setStart] = useState(user?.availability?.start || '08:00');
  const [end, setEnd] = useState(user?.availability?.end || '18:00');
  const [picking, setPicking] = useState<null | 'start' | 'end'>(null);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [certs, setCerts] = useState<{ name: string; url: string }[]>([]);
  const [uploadingCert, setUploadingCert] = useState(false);
  const [saving, setSaving] = useState(false);

  const meta = STEP_META[step];
  const isLast = step === STEP_META.length - 1;

  const toggleDay = (n: number) => setDays((prev) => (prev.includes(n) ? prev.filter((d) => d !== n) : [...prev, n].sort((a, b) => a - b)));

  const summary = useMemo(() => formatAvailability({ days, start, end }), [days, start, end]);

  const canNext = useMemo(() => {
    if (step === 0) return bio.trim().length >= 3;
    if (step === 1) return workDescription.trim().length >= 3 && !!experienceTime;
    if (step === 2) return days.length > 0 && !!start && !!end;
    return true; // certificados e foto são opcionais
  }, [step, bio, workDescription, experienceTime, days, start, end]);

  const pickCertificates = async () => {
    if (!user) return;
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], multiple: true, copyToCacheDirectory: true });
      if (res.canceled) return;
      const assets = res.assets ?? [];
      if (!assets.length) return;
      setUploadingCert(true);
      for (const a of assets) {
        const { publicUrl } = await uploadCertificateToSupabase({ userId: user.id, uri: a.uri, name: a.name, mimeType: a.mimeType });
        if (isSupabaseConfigured) {
          await supabase.from('provider_certificates').insert({ provider_id: user.id, name: a.name || 'Certificado', file_url: publicUrl } as any);
        }
        setCerts((prev) => [...prev, { name: a.name || 'Certificado', url: publicUrl }]);
      }
      toast.success('Certificado(s) adicionado(s).');
    } catch (e: any) {
      toast.error(e?.message || 'Não foi possível adicionar o certificado.');
    } finally {
      setUploadingCert(false);
    }
  };

  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return toast.error('Permissão de galeria negada.');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled && result.assets?.[0]?.uri) setAvatarUri(result.assets[0].uri);
  };

  const goBack = () => {
    if (step === 0) return router.back();
    setStep((s) => s - 1);
  };

  const handleNext = async () => {
    if (!canNext) {
      toast.error('Preencha os campos para continuar.');
      return;
    }
    if (!isLast) {
      setStep((s) => s + 1);
      return;
    }
    // Concluir
    if (!user) return;
    setSaving(true);
    try {
      let avatarUrl: string | undefined;
      if (avatarUri) {
        toast.loading('Enviando foto...');
        const up = await uploadAvatarToSupabase({ userId: user.id, uri: avatarUri });
        avatarUrl = up.publicUrl;
      }
      toast.loading('Guardando o seu perfil...');
      await updateProfile({
        bio: bio.trim(),
        workDescription: workDescription.trim(),
        experienceTime,
        availability: { days, start, end },
        onboardingCompleted: true,
        approvalStatus: 'pending', // gera o pedido de aprovação que cai na dashboard
        ...(avatarUrl ? { avatarUrl } : {}),
      });
      toast.success('Perfil enviado para análise! 🎉');
      router.replace('/(tabs)/home');
    } catch (e: any) {
      toast.error(e?.message || 'Não foi possível guardar o perfil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-white" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="light" />

      {/* Header cyan */}
      <LinearGradient colors={['#00C2DE', '#00E7FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingTop: 56, paddingHorizontal: 22, paddingBottom: 22, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <View className="flex-row items-center">
          <TouchableOpacity onPress={goBack} activeOpacity={0.8} className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text className="ml-3 text-[12px] font-bold text-white/90">Passo {step + 1} de {STEP_META.length}</Text>
        </View>

        {/* Progresso */}
        <View className="mt-4 flex-row gap-1.5">
          {STEP_META.map((_, i) => (
            <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= step ? '#FFFFFF' : 'rgba(255,255,255,0.35)' }} />
          ))}
        </View>

        <Text className="mt-4 text-[22px] font-extrabold text-white">{meta.title}</Text>
        <Text className="mt-1 text-[12.5px] font-bold text-white/85">{meta.subtitle}</Text>
      </LinearGradient>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 22, paddingBottom: 28 }} keyboardShouldPersistTaps="handled">
        {/* STEP 0 — Biografia */}
        {step === 0 ? (
          <View>
            <Text className="text-[13px] font-extrabold text-gray-900">Sobre si</Text>
            <View className="mt-3 rounded-2xl bg-gray-50 px-4 py-3" style={{ borderWidth: 1, borderColor: '#EEF2F7' }}>
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="Ex: Sou eletricista com foco em instalações residenciais. Trabalho com segurança, pontualidade e garantia no serviço..."
                placeholderTextColor="#9CA3AF"
                multiline
                textAlignVertical="top"
                maxLength={500}
                className="min-h-[150px] text-[13px] leading-5 text-gray-800"
              />
            </View>
            <Text className="mt-2 text-right text-[11px] font-bold text-gray-400">{bio.length}/500</Text>
          </View>
        ) : null}

        {/* STEP 1 — Histórico de trabalho */}
        {step === 1 ? (
          <View>
            <Text className="text-[13px] font-extrabold text-gray-900">Descrição do trabalho</Text>
            <View className="mt-3 rounded-2xl bg-gray-50 px-4 py-3" style={{ borderWidth: 1, borderColor: '#EEF2F7' }}>
              <TextInput
                value={workDescription}
                onChangeText={setWorkDescription}
                placeholder="O que faz, que tipo de serviços oferece, diferenciais..."
                placeholderTextColor="#9CA3AF"
                multiline
                textAlignVertical="top"
                maxLength={400}
                className="min-h-[120px] text-[13px] leading-5 text-gray-800"
              />
            </View>

            <Text className="mt-6 text-[13px] font-extrabold text-gray-900">Tempo de atuação</Text>
            <View className="mt-3 gap-2.5">
              {EXP.map((o) => {
                const active = experienceTime === o.v;
                return (
                  <TouchableOpacity
                    key={o.v}
                    activeOpacity={0.85}
                    onPress={() => setExperienceTime(o.v)}
                    className="flex-row items-center rounded-2xl px-4 py-3.5"
                    style={{ borderWidth: 1.5, borderColor: active ? '#00E7FF' : '#EEF2F7', backgroundColor: active ? '#ECFEFF' : '#FFFFFF' }}
                  >
                    <View className="h-5 w-5 items-center justify-center rounded-full" style={{ borderWidth: 2, borderColor: active ? '#00A9BA' : '#CBD5E1' }}>
                      {active ? <View style={{ height: 10, width: 10, borderRadius: 5, backgroundColor: '#00A9BA' }} /> : null}
                    </View>
                    <Text className="ml-3 text-[14px] font-extrabold" style={{ color: active ? '#0F172A' : '#6B7280' }}>{o.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* STEP 2 — Horário */}
        {step === 2 ? (
          <View>
            <Text className="text-[13px] font-extrabold text-gray-900">Dias da semana</Text>
            <View className="mt-3 flex-row flex-wrap gap-2">
              {WEEK_DAYS.map((d) => {
                const active = days.includes(d.n);
                return (
                  <TouchableOpacity
                    key={d.n}
                    activeOpacity={0.85}
                    onPress={() => toggleDay(d.n)}
                    className="h-12 w-12 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: active ? '#00E7FF' : '#F4F6F8', borderWidth: 1, borderColor: active ? '#00E7FF' : '#EEF2F7' }}
                  >
                    <Text className="text-[13px] font-extrabold" style={{ color: active ? '#fff' : '#9CA3AF' }}>{d.short}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View className="mt-3 flex-row gap-2">
              {[
                { label: 'Seg–Sex', set: [1, 2, 3, 4, 5] },
                { label: 'Seg–Sáb', set: [1, 2, 3, 4, 5, 6] },
                { label: 'Todos', set: [1, 2, 3, 4, 5, 6, 7] },
              ].map((p) => (
                <TouchableOpacity key={p.label} activeOpacity={0.85} onPress={() => setDays(p.set)} className="rounded-full bg-cyan-50 px-3.5 py-1.5">
                  <Text className="text-[11.5px] font-extrabold text-cyan-700">{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="mt-6 text-[13px] font-extrabold text-gray-900">Horário</Text>
            <View className="mt-3 flex-row gap-3">
              {([
                { key: 'start' as const, label: 'Início', value: start },
                { key: 'end' as const, label: 'Fim', value: end },
              ]).map((t) => (
                <TouchableOpacity
                  key={t.key}
                  activeOpacity={0.85}
                  onPress={() => setPicking(t.key)}
                  className="flex-1 rounded-2xl bg-gray-50 px-4 py-3"
                  style={{ borderWidth: 1, borderColor: '#EEF2F7' }}
                >
                  <Text className="text-[11px] font-bold text-gray-400">{t.label}</Text>
                  <View className="mt-1 flex-row items-center justify-between">
                    <Text className="text-[18px] font-extrabold text-gray-900">{t.value}</Text>
                    <Ionicons name="time-outline" size={18} color="#00A9BA" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Resumo */}
            <View className="mt-6 rounded-2xl bg-cyan-50 px-4 py-4" style={{ borderWidth: 1, borderColor: '#CFFAFE' }}>
              <Text className="text-[11px] font-bold text-cyan-700/70">A sua disponibilidade</Text>
              <Text className="mt-1 text-[15px] font-extrabold text-cyan-900">{summary}</Text>
            </View>

            {picking ? (
              <DateTimePicker
                value={toDate(picking === 'start' ? start : end)}
                mode="time"
                is24Hour
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(e, d) => {
                  const which = picking;
                  setPicking(null);
                  if (e.type !== 'dismissed' && d && which) {
                    const v = fmtTime(d);
                    which === 'start' ? setStart(v) : setEnd(v);
                  }
                }}
              />
            ) : null}
          </View>
        ) : null}

        {/* STEP 3 — Certificados */}
        {step === 3 ? (
          <View>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={pickCertificates}
              disabled={uploadingCert}
              className="items-center justify-center rounded-3xl py-9"
              style={{ borderWidth: 2, borderColor: '#CFFAFE', borderStyle: 'dashed', backgroundColor: '#F0FDFF' }}
            >
              {uploadingCert ? (
                <ActivityIndicator color="#00A9BA" />
              ) : (
                <>
                  <View className="h-14 w-14 items-center justify-center rounded-2xl bg-cyan-100">
                    <Ionicons name="cloud-upload-outline" size={26} color="#00A9BA" />
                  </View>
                  <Text className="mt-3 text-[14px] font-extrabold text-gray-900">Adicionar certificado</Text>
                  <Text className="mt-1 text-[11.5px] font-bold text-gray-400">Imagem ou PDF</Text>
                </>
              )}
            </TouchableOpacity>

            <View className="mt-4 gap-2.5">
              {certs.map((c, i) => (
                <View key={`${c.url}_${i}`} className="flex-row items-center rounded-2xl bg-gray-50 px-3.5 py-3" style={{ borderWidth: 1, borderColor: '#EEF2F7' }}>
                  <View className="h-9 w-9 items-center justify-center rounded-xl bg-emerald-100">
                    <Ionicons name="document-text-outline" size={18} color="#059669" />
                  </View>
                  <Text className="ml-3 flex-1 text-[13px] font-bold text-gray-800" numberOfLines={1}>{c.name}</Text>
                  <Ionicons name="checkmark-circle" size={18} color="#059669" />
                </View>
              ))}
            </View>

            {certs.length === 0 ? (
              <Text className="mt-4 text-center text-[12px] font-bold text-gray-400">Pode pular este passo e adicionar mais tarde.</Text>
            ) : null}
          </View>
        ) : null}

        {/* STEP 4 — Foto */}
        {step === 4 ? (
          <View className="items-center pt-4">
            <TouchableOpacity activeOpacity={0.85} onPress={pickAvatar} className="relative">
              <View className="h-36 w-36 rounded-full overflow-hidden items-center justify-center bg-gray-100" style={{ borderWidth: 3, borderColor: '#00E7FF' }}>
                {avatarUri || user?.avatar ? (
                  <Image source={{ uri: avatarUri || user?.avatar }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                  <Ionicons name="person" size={64} color="#CBD5E1" />
                )}
              </View>
              <View className="absolute bottom-1 right-1 h-10 w-10 items-center justify-center rounded-full bg-brand-cyan" style={{ borderWidth: 3, borderColor: '#fff' }}>
                <Ionicons name="add" size={22} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text className="mt-5 text-[18px] font-extrabold text-gray-900">{user?.name || 'O seu nome'}</Text>
            <Text className="mt-1 text-[12px] font-bold text-gray-400">Toque para escolher uma foto</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Footer */}
      <View style={{ paddingHorizontal: 22, paddingBottom: 30, paddingTop: 8 }}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleNext}
          disabled={saving || !canNext}
          className="h-14 flex-row items-center justify-center gap-2 rounded-full bg-brand-cyan"
          style={{ opacity: saving || !canNext ? 0.5 : 1 }}
        >
          {saving ? <ActivityIndicator color="#fff" /> : null}
          <Text className="text-[15px] font-extrabold text-white">{isLast ? (saving ? 'A guardar...' : 'Concluir') : 'Seguinte'}</Text>
          {!isLast && !saving ? <Ionicons name="arrow-forward" size={18} color="#fff" /> : null}
        </TouchableOpacity>
        {step === 3 && certs.length === 0 ? (
          <TouchableOpacity activeOpacity={0.8} onPress={() => setStep((s) => s + 1)} className="mt-2 h-11 items-center justify-center">
            <Text className="text-[13px] font-extrabold text-gray-400">Pular por agora</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}
