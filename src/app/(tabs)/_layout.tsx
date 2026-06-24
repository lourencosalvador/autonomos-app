import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';
import { GateModal } from '../../components/GateModal';

const ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  home: 'home',
  messages: 'message-square',
  services: 'briefcase',
  profile: 'user',
};

function FloatingTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const [gateOpen, setGateOpen] = useState(false);

  // Prestador ainda não aprovado: só o Perfil fica ativo.
  const locked =
    user?.role === 'professional' && (user?.approvalStatus === 'pending' || user?.approvalStatus === 'rejected');

  return (
    <>
      <View style={{ paddingHorizontal: 22, paddingTop: 10, paddingBottom: Math.max(insets.bottom, 14), backgroundColor: '#FFFFFF' }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-around',
            backgroundColor: '#FFFFFF',
            height: 66,
            borderRadius: 40,
            paddingHorizontal: 8,
            shadowColor: '#0B3A45',
            shadowOpacity: 0.12,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 8 },
            elevation: 12,
          }}
        >
          {state.routes.map((route: any, index: number) => {
            const focused = state.index === index;
            const iconName = ICONS[route.name] || 'circle';
            const isLockedTab = locked && route.name !== 'profile';

            const onPress = () => {
              if (isLockedTab) {
                setGateOpen(true);
                return;
              }
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            };

            return (
              <TouchableOpacity key={route.key} onPress={onPress} activeOpacity={0.85} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                {focused && !isLockedTab ? (
                  <View style={{ height: 48, width: 48, borderRadius: 24, backgroundColor: '#0B0B0B', alignItems: 'center', justifyContent: 'center' }}>
                    <Feather name={iconName} size={22} color="#FFFFFF" />
                  </View>
                ) : (
                  <View style={{ alignItems: 'center', justifyContent: 'center', opacity: isLockedTab ? 0.45 : 1 }}>
                    <Feather name={iconName} size={24} color={isLockedTab ? '#C7CED6' : '#A0AAB4'} />
                    {isLockedTab ? (
                      <View style={{ position: 'absolute', top: -2, right: -6, height: 14, width: 14, borderRadius: 7, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
                        <Feather name="lock" size={9} color="#94A3B8" />
                      </View>
                    ) : null}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <GateModal visible={gateOpen} status={user?.approvalStatus as any} note={user?.approvalNote} onClose={() => setGateOpen(false)} />
    </>
  );
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <FloatingTabBar {...props} />}>
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="messages" options={{ title: 'Mensagens' }} />
      <Tabs.Screen name="services" options={{ title: 'Serviços' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
