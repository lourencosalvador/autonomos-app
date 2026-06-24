import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MotiView } from 'moti';
import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { toast } from '../lib/sonner';

export function PendingReview() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const [checking, setChecking] = useState(false);
  const rejected = user?.approvalStatus === 'rejected';

  const recheck = async () => {
    setChecking(true);
    try {
      await refreshProfile();
      const st = useAuthStore.getState().user?.approvalStatus;
      if (st === 'approved') toast.success('Conta aprovada! Bem-vindo. 🎉');
      else if (st === 'rejected') toast.error('A sua conta não foi aprovada.');
      else toast('Ainda em análise. Em breve teremos novidades.');
    } catch {
      toast.error('Não foi possível atualizar o estado.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      <LinearGradient colors={['#A7E8F3', '#E4F8FB', '#FFFFFF']} locations={[0, 0.5, 1]} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 380 }} />

      <View className="flex-1 px-7 pt-24 items-center">
        <MotiView
          from={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 12 }}
        >
          <MotiView
            from={{ rotate: '0deg' }}
            animate={{ rotate: rejected ? '0deg' : '360deg' }}
            transition={{ loop: !rejected, type: 'timing', duration: 2600 }}
            style={{ height: 120, width: 120, borderRadius: 36, backgroundColor: rejected ? '#FEE2E2' : '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: rejected ? '#EF4444' : '#00E7FF', shadowOpacity: 0.35, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 8 }}
          >
            <Ionicons name={rejected ? 'close-circle' : 'hourglass-outline'} size={58} color={rejected ? '#EF4444' : '#00A9BA'} />
          </MotiView>
        </MotiView>

        <Text className="mt-8 text-[24px] font-extrabold text-gray-900 text-center">
          {rejected ? 'Conta não aprovada' : 'Conta em análise'}
        </Text>
        <Text className="mt-3 text-[14px] font-bold text-gray-500 text-center leading-5">
          {rejected
            ? 'A sua candidatura não foi aprovada de momento. Reveja o seu perfil e fale com o suporte para mais detalhes.'
            : 'Recebemos o seu perfil! A nossa equipa está a analisar os seus dados. Assim que for aprovado, terá acesso a todas as funcionalidades.'}
        </Text>

        {rejected && user?.approvalNote ? (
          <View className="mt-5 w-full rounded-2xl bg-red-50 px-4 py-3">
            <Text className="text-[11px] font-extrabold text-red-700">Motivo</Text>
            <Text className="mt-1 text-[13px] font-bold text-red-900/80">{user.approvalNote}</Text>
          </View>
        ) : (
          <View className="mt-6 w-full rounded-2xl bg-white px-4 py-4" style={{ borderWidth: 1, borderColor: '#EEF2F7' }}>
            <View className="flex-row items-center gap-2">
              <Ionicons name="lock-closed" size={15} color="#00A9BA" />
              <Text className="text-[12.5px] font-extrabold text-gray-700">O que pode fazer agora</Text>
            </View>
            <Text className="mt-2 text-[12.5px] font-bold text-gray-500 leading-5">
              Enquanto espera, pode editar o seu perfil e o portfólio. As outras áreas abrem assim que a conta for aprovada.
            </Text>
          </View>
        )}

        <View className="mt-8 w-full gap-3">
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} activeOpacity={0.9} className="h-13 flex-row items-center justify-center gap-2 rounded-full bg-brand-cyan" style={{ height: 52 }}>
            <Ionicons name="person-outline" size={18} color="#fff" />
            <Text className="text-[14px] font-extrabold text-white">Ver o meu perfil</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={recheck} disabled={checking} activeOpacity={0.85} className="h-13 flex-row items-center justify-center gap-2 rounded-full bg-gray-100" style={{ height: 52, opacity: checking ? 0.6 : 1 }}>
            <Ionicons name={checking ? 'sync' : 'refresh'} size={17} color="#374151" />
            <Text className="text-[14px] font-extrabold text-gray-700">{checking ? 'A verificar...' : 'Atualizar estado'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
