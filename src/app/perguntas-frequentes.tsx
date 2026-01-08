import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronDown } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

type FaqItem = { id: string; q: string; a: string };

export default function PerguntasFrequentesScreen() {
  const router = useRouter();

  const items = useMemo<FaqItem[]>(
    () => [
      { id: '1', q: 'Lorem ipsum dolor sit amet, consectetur?', a: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Lectus id commodo egestas metus.' },
      { id: '2', q: 'Lorem ipsum dolor sit amet, consectetur?', a: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer at dolor in arcu.' },
      { id: '3', q: 'Lorem ipsum dolor sit amet, consectetur?', a: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Eget feugiat.' },
      { id: '4', q: 'Lorem ipsum dolor sit amet, consectetur?', a: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nibh orci.' },
      { id: '5', q: 'Lorem ipsum dolor sit amet, consectetur?', a: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quis porta.' },
      { id: '6', q: 'Lorem ipsum dolor sit amet, consectetur?', a: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sit.' },
    ],
    []
  );

  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      <View className="px-6 pt-16 pb-2">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>

        <View className="mt-3 flex-row items-center gap-2">
          <Text className="text-[22px] font-extrabold text-gray-900">
            Perguntas Frequentes
          </Text>
          <Text className="text-[18px] font-extrabold text-brand-cyan">?</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {items.map((item) => {
          const open = openId === item.id;
          return (
            <View key={item.id} className="mb-4">
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setOpenId(open ? null : item.id)}
                className="flex-row items-center justify-between rounded-2xl bg-gray-100 px-5 py-4"
              >
                <Text className="flex-1 pr-3 text-[13px] text-gray-500">
                  {item.q}
                </Text>
                <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
                  <ChevronDown size={18} color="#6B7280" />
                </View>
              </TouchableOpacity>

              {open && (
                <View className="mt-2 rounded-2xl bg-gray-50 px-5 py-4">
                  <Text className="text-[13px] leading-5 text-gray-600">
                    {item.a}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}


