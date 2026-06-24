import { Ionicons } from '@expo/vector-icons';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { useAuthStore } from '../stores/authStore';

const ProfileImage = require('../../assets/images/Profile.jpg');

const circleShadow = {
  shadowColor: '#0B3A45',
  shadowOpacity: 0.1,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 3 },
  elevation: 3,
};

export function HomeHeader({
  firstName,
  subtitle = 'Bem vindo de volta!',
  onNotificationPress,
  onAvatarPress,
}: {
  firstName: string;
  subtitle?: string;
  onNotificationPress?: () => void;
  onAvatarPress?: () => void;
}) {
  const user = useAuthStore((s) => s.user);
  const avatar = user?.avatar;

  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-1 pr-3">
        <View className="flex-row items-center">
          <Text className="text-[28px] font-extrabold text-gray-900" numberOfLines={1}>
            Olá, {firstName}
          </Text>
          <Text style={{ fontSize: 24, marginLeft: 6 }}>👋</Text>
        </View>
        <Text className="mt-1 text-[14px] font-bold text-gray-500">{subtitle}</Text>
      </View>

      <View className="flex-row items-center gap-3">
        <TouchableOpacity
          onPress={onNotificationPress}
          activeOpacity={0.85}
          className="relative h-12 w-12 items-center justify-center rounded-full bg-white"
          style={circleShadow}
        >
          <Ionicons name="notifications-outline" size={22} color="#0F172A" />
          <View className="absolute h-2.5 w-2.5 rounded-full bg-brand-cyan" style={{ top: 9, right: 11, borderWidth: 1.5, borderColor: '#fff' }} />
        </TouchableOpacity>

        <TouchableOpacity onPress={onAvatarPress} activeOpacity={0.85} className="h-12 w-12 rounded-full overflow-hidden bg-white" style={circleShadow}>
          <Image source={avatar ? { uri: avatar } : ProfileImage} className="h-full w-full" resizeMode="cover" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
