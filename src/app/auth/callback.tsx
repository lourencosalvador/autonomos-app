import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../../lib/supabase';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string; error?: string; error_description?: string }>();
  const [message, setMessage] = useState('A confirmar a sua conta...');

  useEffect(() => {
    const run = async () => {
      try {
        const code = params.code ? String(params.code) : '';
        const error = params.error ? String(params.error) : '';
        const errorDescription = params.error_description ? String(params.error_description) : '';

        if (error) {
          setMessage(errorDescription || 'Não foi possível concluir a autenticação.');
          return;
        }

        if (!code) {
          setMessage('Link inválido ou expirado.');
          return;
        }

        const { error: exError } = await supabase.auth.exchangeCodeForSession(code);
        if (exError) {
          setMessage(exError.message || 'Falha ao concluir a autenticação.');
          return;
        }

        router.replace('/(tabs)/home');
      } catch (e: any) {
        setMessage(e?.message || 'Falha ao concluir a autenticação.');
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View className="flex-1 bg-white items-center justify-center px-6">
      <StatusBar style="dark" />
      <Text className="text-[16px] font-extrabold text-gray-900">Autonomos</Text>
      <Text className="mt-2 text-center text-[13px] font-bold text-gray-400">{message}</Text>
    </View>
  );
}


