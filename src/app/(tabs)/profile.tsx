import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { getRandomPhotos } from '../../services/unsplashService';
import { useAuthStore } from '../../stores/authStore';

const ProfileImage = require('../../../assets/images/Profile.jpg');

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();

  if (user?.role === 'professional') {
    return <ProfessionalProfile />;
  }

  return <ClientProfile />;
}

function ClientProfile() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();

  const handleSignOut = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair', 
          style: 'destructive',
          onPress: signOut 
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />
      
      <View className="bg-brand-cyan px-6 pt-16 pb-8">
        <View className="flex-row items-start justify-between mb-6">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          <View className="relative h-10 w-10 items-center justify-center">
            <TouchableOpacity
              onPress={() => router.push('/notificacoes')}
              className="relative h-10 w-10 items-center justify-center"
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={26} color="white" />
              <View className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-red-500" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="items-center">
          <View className="h-28 w-28 rounded-full border-4 border-orange-500 overflow-hidden mb-4">
            <Image
              source={ProfileImage}
              className="h-full w-full"
              resizeMode="cover"
            />
          </View>

          <Text className="text-[30px] font-bold text-white">
            {user?.name || 'Marcelo Vica'}
          </Text>
          <Text className="mt-1 text-[15px] text-black/80">
            {user?.email || 'marcelopedrovica@gmail.com'}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          className="mb-4 flex-row items-center justify-between rounded-2xl bg-white p-5 shadow-sm"
          style={{ 
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
          activeOpacity={0.7}
          onPress={() => router.push('/atualizar-informacoes')}
        >
          <View className="flex-row items-center gap-4 flex-1">
            <Ionicons name="person-outline" size={24} color="#9CA3AF" />
            <Text className="text-[16px] text-gray-600">
              Informações Pessoais
            </Text>
          </View>
          <Ionicons name="create-outline" size={20} color="#00E7FF" />
        </TouchableOpacity>

        <TouchableOpacity
          className="mb-4 flex-row items-center justify-between rounded-2xl bg-white p-5 shadow-sm"
          style={{ 
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
          activeOpacity={0.7}
          onPress={() => router.push('/atualizar-senha')}
        >
          <View className="flex-row items-center gap-4 flex-1">
            <Ionicons name="key-outline" size={24} color="#9CA3AF" />
            <Text className="text-[16px] text-gray-600">
              Palavra-Passe
            </Text>
          </View>
          <Ionicons name="create-outline" size={20} color="#00E7FF" />
        </TouchableOpacity>

        <TouchableOpacity
          className="mb-4 flex-row items-center justify-between rounded-2xl bg-white p-5 shadow-sm"
          style={{ 
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
          activeOpacity={0.7}
        >
          <View className="flex-row items-center gap-4 flex-1">
            <Ionicons name="shield-checkmark-outline" size={24} color="#9CA3AF" />
            <Text className="text-[16px] text-gray-600">
              Privacidade
            </Text>
          </View>
          <Ionicons name="create-outline" size={20} color="#00E7FF" />
        </TouchableOpacity>

        <TouchableOpacity
          className="mb-4 flex-row items-center justify-between rounded-2xl bg-white p-5 shadow-sm"
          style={{ 
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
          activeOpacity={0.7}
          onPress={() => router.push('/atualizar-telefone')}
        >
          <View className="flex-row items-center gap-4 flex-1">
            <Ionicons name="phone-portrait-outline" size={24} color="#9CA3AF" />
            <Text className="text-[16px] text-gray-600">
              Número de Telefone
            </Text>
          </View>
          <Ionicons name="create-outline" size={20} color="#00E7FF" />
        </TouchableOpacity>

        <TouchableOpacity
          className="mb-4 flex-row items-center justify-between rounded-2xl bg-white p-5 shadow-sm"
          style={{ 
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
          activeOpacity={0.7}
          onPress={() => router.push('/perguntas-frequentes')}
        >
          <View className="flex-row items-center gap-4 flex-1">
            <Ionicons name="help-circle-outline" size={24} color="#9CA3AF" />
            <Text className="text-[16px] text-gray-600">
              Perguntas Frequentes
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className="mb-8 flex-row items-center justify-between rounded-2xl bg-white p-5 shadow-sm"
          style={{ 
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
          activeOpacity={0.7}
          onPress={handleSignOut}
        >
          <View className="flex-row items-center gap-4 flex-1">
            <Ionicons name="exit-outline" size={24} color="#9CA3AF" />
            <Text className="text-[16px] text-gray-600">
              Sair
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function ProfessionalProfile() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const [tab, setTab] = useState<'info' | 'portfolio'>('info');
  const [photos, setPhotos] = useState<string[]>([]);
  const [headerAvatar, setHeaderAvatar] = useState<string | null>(null);

  useEffect(() => {
    load();
    refreshProfile().catch(() => {});
  }, []);

  const load = async () => {
    const data = await getRandomPhotos(24);
    const urls = data.map((p) => p.url).filter(Boolean);
    setPhotos(urls);
    setHeaderAvatar(urls[0] || null);
  };

  const handleAddPhotos = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão necessária', 'Permita o acesso à galeria para adicionar fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 10,
      quality: 0.9,
    });

    if (result.canceled) return;

    const uris = result.assets.map((a) => a.uri).filter(Boolean);
    if (!uris.length) return;

    setPhotos((prev) => {
      // Coloca as novas fotos no topo para aparecerem imediatamente no grid
      const merged = [...uris, ...prev];
      return Array.from(new Set(merged));
    });
  };

  const avatarUri = user?.avatar || null;

  const handleChangeAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão necessária', 'Permita o acesso à galeria para trocar a foto.');
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
      // Por enquanto salvamos o URI no perfil (persistente no app e sincronizável via Supabase).
      await updateProfile({ avatarUrl: uri });
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Não foi possível atualizar a foto.');
    }
  };

  const categories = useMemo(
    () => [
      { key: 'street', label: 'Street', uri: photos[2] },
      { key: 'works', label: 'Works', uri: photos[3] },
      { key: 'nature', label: 'Nature', uri: photos[4] },
      { key: 'art', label: 'Art', uri: photos[5] },
      { key: 'landscape', label: 'Landscape', uri: photos[6] },
    ],
    [photos]
  );

  const handleSignOut = () => {
    Alert.alert('Sair', 'Tem certeza que deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />

      <View className="bg-brand-cyan px-6 pt-16 pb-8 rounded-b-[28px]">
        <View className="flex-row items-start justify-between">
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} className="h-10 w-10 items-center justify-center">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={() => router.push('/atualizar-informacoes')}
              activeOpacity={0.7}
              className="h-10 w-10 items-center justify-center"
            >
              <Ionicons name="create-outline" size={24} color="#0B1220" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/notificacoes')}
              activeOpacity={0.7}
              className="relative h-10 w-10 items-center justify-center"
            >
              <Ionicons name="notifications-outline" size={26} color="#0B1220" />
              <View className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="mt-4 flex-row items-center">
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleChangeAvatar}
            className="h-20 w-20 rounded-full border-4 border-white overflow-hidden"
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} className="h-full w-full" resizeMode="cover" />
            ) : (
              <Image source={ProfileImage} className="h-full w-full" resizeMode="cover" />
            )}
          </TouchableOpacity>

          <View className="ml-4 flex-1">
            <Text className="text-[26px] font-extrabold text-white">
              {user?.name || 'Edson Santos'}
            </Text>
            <Text className="text-[14px] text-black/70">
              {user?.email || 'edsonsantos@gmail.com'}
            </Text>
            <Text className="text-[14px] text-black/70">
              {user?.role === 'professional' ? 'Fotógrafo' : 'Prestador'}
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-1 px-6 pt-5">
        <View className="self-center flex-row rounded-full bg-gray-200 p-1">
          <TouchableOpacity
            onPress={() => setTab('info')}
            activeOpacity={0.85}
            className={`px-6 py-3 rounded-full ${tab === 'info' ? 'bg-brand-cyan' : 'bg-transparent'}`}
          >
            <Text className={`text-[14px] font-bold ${tab === 'info' ? 'text-white' : 'text-gray-500'}`}>
              Informações
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTab('portfolio')}
            activeOpacity={0.85}
            className={`px-6 py-3 rounded-full ${tab === 'portfolio' ? 'bg-brand-cyan' : 'bg-transparent'}`}
          >
            <Text className={`text-[14px] font-bold ${tab === 'portfolio' ? 'text-white' : 'text-gray-500'}`}>
              Portfolio
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mt-4 items-center flex-row justify-center gap-1">
          {[1, 1, 1, 1, 0].map((v, idx) => (
            <Ionicons
              key={idx}
              name={v ? 'star' : 'star-outline'}
              size={18}
              color={v ? '#FBBF24' : '#D1D5DB'}
            />
          ))}
        </View>

        {tab === 'info' ? (
          <ScrollView
            className="mt-6 flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            <InfoRow
              icon="person-outline"
              label="Informações Pessoais"
              onPress={() => router.push('/atualizar-informacoes')}
              showEdit
            />
            <InfoRow icon="key-outline" label="Palavra-Passe" onPress={() => router.push('/atualizar-senha')} showEdit />
            <InfoRow icon="shield-checkmark-outline" label="Privacidade" onPress={() => {}} showEdit />
            <InfoRow icon="phone-portrait-outline" label="Número de Telefone" onPress={() => router.push('/atualizar-telefone')} showEdit />
            <InfoRow icon="help-circle-outline" label="Perguntas Frequentes" onPress={() => router.push('/perguntas-frequentes')} />
            <TouchableOpacity
              onPress={handleSignOut}
              activeOpacity={0.8}
              className="mt-3 flex-row items-center rounded-2xl bg-white px-5 py-5"
            >
              <Ionicons name="exit-outline" size={26} color="#9CA3AF" />
              <Text className="ml-4 text-[16px] text-gray-500">Sair</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <View className="mt-6 flex-1">
            <FlatList
              data={photos}
              keyExtractor={(uri, idx) => `${uri}-${idx}`}
              numColumns={3}
              removeClippedSubviews={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 140 }}
              columnWrapperStyle={{ gap: 2 }}
              ListHeaderComponent={() => (
                <View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 4, gap: 18 }}
                  >
                    {categories.map((c) => (
                      <View key={c.key} className="items-center">
                        <View className="h-16 w-16 rounded-full overflow-hidden bg-gray-200">
                          <Image
                            source={{ uri: c.uri || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=200' }}
                            className="h-full w-full"
                            resizeMode="cover"
                          />
                        </View>
                        <Text className="mt-3 text-[13px] text-gray-300">{c.label}</Text>
                      </View>
                    ))}
                  </ScrollView>

                  <View className="mt-4 h-px bg-gray-200" />
                  <View style={{ height: 8 }} />
                </View>
              )}
              renderItem={({ item }) => (
                <View style={{ flex: 1, aspectRatio: 1, marginBottom: 2 }}>
                  <Image source={{ uri: item }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                </View>
              )}
            />

            <View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 26,
                alignItems: 'center',
              }}
              pointerEvents="box-none"
            >
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleAddPhotos}
                className="h-20 w-20 items-center justify-center rounded-full bg-white"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.15,
                  shadowRadius: 16,
                  elevation: 6,
                }}
              >
                <Ionicons name="add" size={34} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  onPress,
  showEdit,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  showEdit?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="mb-4 flex-row items-center justify-between rounded-2xl bg-white px-5 py-5"
      style={{
        borderWidth: 1,
        borderColor: '#E5E7EB',
      }}
    >
      <View className="flex-row items-center">
        <Ionicons name={icon} size={26} color="#B8B8B8" />
        <Text className="ml-4 text-[16px] text-gray-500">{label}</Text>
      </View>
      {showEdit ? (
        <Ionicons name="create-outline" size={22} color="#00E7FF" />
      ) : (
        <View />
      )}
    </TouchableOpacity>
  );
}
