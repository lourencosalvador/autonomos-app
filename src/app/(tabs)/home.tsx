import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import IconNotification from '../../../assets/icons/ICON NOTIFICATION.svg';
import { categories } from '../../data/categories';
import { useAuthStore } from '../../stores/authStore';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const firstName = user?.name?.split(' ')[0] || 'Usuário';

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-16 pb-6">
          <View className="mb-6 flex-row items-start justify-between">
            <View className="flex-1">
              <Text className="text-[28px] font-bold text-gray-900">
                Olá, {firstName}
              </Text>
              <Text className="mt-1 text-[15px] text-gray-500 font-bold">
                Bem vindo de volta!
              </Text>
            </View>
            
            <TouchableOpacity 
              className="h-12 w-12 items-center justify-center"
              activeOpacity={0.7}
            >
              <IconNotification width={94} height={94}  />
            </TouchableOpacity>
          </View>

          <View className="mb-6 flex-row items-center rounded-full bg-[#D9D9D966] px-4 py-2">
            <TextInput
              className="flex-1 text-[15px] text-gray-700 "
              placeholder="Pesquisar"
              placeholderTextColor="#9CA3AF"
            />
            <View className='p-4 flex justify-center items-center rounded-full bg-white'>
            <Ionicons name="search" size={22} color="#9CA3AF" />
            </View>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 16 }}
            className="mb-6"
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                className="items-center"
                activeOpacity={0.7}
              >
                <View className="mb-2 h-20 w-20 items-center justify-center rounded-full border-[3px] border-brand-cyan/30 bg-[#84848438]">
                  <category.Icon width={32} height={32} fill="#99999991" />
                </View>
                <Text className="text-[12px] text-[#99999999]">
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}
