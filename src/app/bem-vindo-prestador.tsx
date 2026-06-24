import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MotiView } from 'moti';
import { useState } from 'react';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';
import { useAuthStore } from '../stores/authStore';

const STEPS = [
  { icon: 'person-outline', label: 'Biografia', color: '#00A9BA' },
  { icon: 'briefcase-outline', label: 'Histórico de trabalho', color: '#2563EB' },
  { icon: 'time-outline', label: 'Horário de disponibilidade', color: '#7C3AED' },
  { icon: 'ribbon-outline', label: 'Certificados', color: '#D97706' },
  { icon: 'camera-outline', label: 'Foto de perfil', color: '#059669' },
];

export default function BemVindoPrestadorScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name?.split(' ')[0] || '';
  const [popped, setPopped] = useState(0);

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      <LinearGradient colors={['#A7E8F3', '#E4F8FB', '#FFFFFF']} locations={[0, 0.5, 1]} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 420 }} />

      <View className="flex-1 px-6 pt-20">
        {/* Figura interativa */}
        <View className="items-center mt-2">
          <Pressable onPress={() => setPopped((p) => p + 1)}>
            <MotiView
              from={{ translateY: -60, opacity: 0, scale: 0.7 }}
              animate={{ translateY: 0, opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 12, delay: 100 }}
            >
              <MotiView
                from={{ translateY: 0 }}
                animate={{ translateY: [-8, 8] }}
                transition={{ loop: true, type: 'timing', duration: 1800, repeatReverse: true }}
                style={{ alignItems: 'center', justifyContent: 'center' }}
              >
                <MotiView
                  key={popped}
                  from={{ scale: popped ? 1.18 : 1 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 8 }}
                  style={{ height: 132, width: 132, borderRadius: 40, backgroundColor: '#00E7FF', alignItems: 'center', justifyContent: 'center', shadowColor: '#00E7FF', shadowOpacity: 0.5, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 10 }}
                >
                  <Ionicons name="rocket" size={62} color="#FFFFFF" />
                </MotiView>
              </MotiView>
            </MotiView>
          </Pressable>
          <Text className="mt-3 text-[11px] font-bold text-cyan-700/70">toque no foguete 🚀</Text>
        </View>

        {/* Título */}
        <MotiView from={{ opacity: 0, translateY: 16 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 500, delay: 250 }}>
          <Text className="mt-8 text-center text-[26px] font-extrabold text-gray-900 leading-8">
            {firstName ? `${firstName}, vamos ` : 'Vamos '}terminar de{'\n'}configurar o seu perfil?
          </Text>
          <Text className="mt-3 text-center text-[14px] font-bold text-gray-500 px-2">
            Um perfil completo aparece mais e transmite confiança aos clientes. Leva menos de 2 minutos.
          </Text>
        </MotiView>

        {/* Cascata de passos */}
        <View className="mt-7">
          {STEPS.map((s, i) => (
            <MotiView
              key={s.label}
              from={{ opacity: 0, translateY: -28 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', damping: 14, delay: 450 + i * 110 }}
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10, borderWidth: 1, borderColor: '#EEF2F7', shadowColor: '#0B3A45', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 }}
            >
              <View style={{ height: 40, width: 40, borderRadius: 12, backgroundColor: `${s.color}1A`, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={s.icon as any} size={20} color={s.color} />
              </View>
              <Text className="ml-3 flex-1 text-[14px] font-extrabold text-gray-800">{s.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </MotiView>
          ))}
        </View>
      </View>

      {/* Ações */}
      <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1100, type: 'timing', duration: 400 }} style={{ paddingHorizontal: 24, paddingBottom: 34, paddingTop: 8 }}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.replace('/configurar-perfil')}
          className="h-14 flex-row items-center justify-center gap-2 rounded-full bg-brand-cyan"
        >
          <Text className="text-[15px] font-extrabold text-white">Sim, vamos configurar!</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8} onPress={() => router.replace('/(tabs)/home')} className="mt-3 h-12 items-center justify-center">
          <Text className="text-[14px] font-extrabold text-gray-400">Agora não</Text>
        </TouchableOpacity>
      </MotiView>
    </View>
  );
}
