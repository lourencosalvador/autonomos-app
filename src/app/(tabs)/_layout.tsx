import { Feather, } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { BriefcaseBusiness } from 'lucide-react-native';
import { Image, View } from 'react-native';
import ProfileImage from '../../../assets/images/Profile.jpg';
import { useAuthStore } from '../../stores/authStore';

export default function TabsLayout() {
  const { user } = useAuthStore();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#00E7FF',
        tabBarInactiveTintColor: '#99999991',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          height: 100,
          paddingBottom: 10,
          paddingTop: 20,
          elevation: 0,
          shadowOpacity: 0,
          borderTopColor: '#00E7FF38',
          borderTopWidth: 1.5,
        },
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '700',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Feather name="home" size={24} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Mensagens',
          tabBarIcon: ({ color, focused }) => (
            <Feather name="message-square" size={24} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Serviços',
          tabBarIcon: ({ color, focused }) => (
            <BriefcaseBusiness size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <View className="h-8 w-8 rounded-full overflow-hidden " style={{ borderColor: focused ? '#00E7FF' : '#B8B8B8' }}>
              {user?.avatar ? (
                <Image 
                  source={{ uri: user.avatar }} 
                  className="h-full w-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="h-full w-full items-center justify-center" style={{ backgroundColor: focused ? '#00E7FF' : '#B8B8B8' }}>
                  <Image source={ProfileImage} className="h-full w-full" resizeMode="cover" />
                </View>
              )}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
