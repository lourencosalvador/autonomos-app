import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { KeyRound } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function AtualizarSenhaScreen() {
  const router = useRouter();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');

  return (
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
            <Text className="text-[22px] font-extrabold text-gray-900">
              Atualizar Senha
            </Text>
            <KeyRound size={22} color="#00E7FF" strokeWidth={2.5} />
          </View>
          <Text className="mt-1 text-[13px] text-gray-400">Vamos alterar a senha!</Text>
        </View>
      </View>

      <View className="px-6 pt-7">
        <View className="mb-4 rounded-2xl bg-gray-100 px-5 py-4">
          <TextInput
            value={current}
            onChangeText={setCurrent}
            placeholder="Inserir senha atual"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            className="text-[14px]"
            style={{ color: '#000000' }}
          />
        </View>

        <View className="mb-4 rounded-2xl bg-gray-100 px-5 py-4">
          <TextInput
            value={next}
            onChangeText={setNext}
            placeholder="Inserir nova senha"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            className="text-[14px]"
            style={{ color: '#000000' }}
          />
        </View>

        <View className="rounded-2xl bg-gray-100 px-5 py-4">
          <TextInput
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Confirmar Senha"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            className="text-[14px]"
            style={{ color: '#000000' }}
          />
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          className="mt-7 h-12 items-center justify-center rounded-full bg-brand-cyan"
        >
          <Text className="text-[14px] font-bold text-white">Salvar Nova Senha</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}


