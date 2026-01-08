import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { StreamChat } from 'stream-chat';
import { Chat, OverlayProvider } from 'stream-chat-expo';
import { STREAM_CONFIG } from '../config/stream.config';
import { useAuthStore } from '../stores/authStore';
import { toStreamSafeUserId } from '../utils/stream';

type Props = { children: React.ReactNode };

async function fetchStreamToken(payload: { userId: string; name: string; image?: string }) {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!baseUrl) return null;

  const res = await fetch(`${baseUrl}/api/stream/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) return null;
  if (!json?.success || !json?.token) return null;
  return String(json.token);
}

export function StreamChatProvider({ children }: Props) {
  const { user, isAuthenticated } = useAuthStore();
  const apiKey = STREAM_CONFIG.apiKey;

  const client = useMemo(() => {
    if (!apiKey) return null;
    return StreamChat.getInstance(apiKey);
  }, [apiKey]);

  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isConnectingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!client) return;

      if (!isAuthenticated || !user) {
        setReady(false);
        setError(null);
        try {
          await client.disconnectUser();
        } catch {}
        return;
      }

      try {
        setReady(false);
        setError(null);

        const streamUserId = toStreamSafeUserId(user.id || user.email);
        if (client.userID === streamUserId) {
          if (!cancelled) setReady(true);
          return;
        }
        if (isConnectingRef.current) return;
        isConnectingRef.current = true;
        try {
          await client.disconnectUser();
        } catch {}
        const token =
          (await fetchStreamToken({ userId: streamUserId, name: user.name, image: user.avatar })) ||
          client.devToken(streamUserId);

        await client.connectUser(
          {
            id: streamUserId,
            name: user.name,
            image: user.avatar,
          },
          token
        );
        if (!cancelled) setReady(true);
      } catch (e) {
        if (!cancelled) {
          setReady(false);
          setError('Falha ao conectar no chat. Verifique a internet e o API_URL.');
        }
      } finally {
        isConnectingRef.current = false;
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [client, isAuthenticated, user?.id, user?.name, user?.avatar]);

  if (!client) return <>{children}</>;

  if (isAuthenticated && user && !ready) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#00E7FF" />
        <Text className="mt-3 text-[13px] font-bold text-gray-500">Conectando chat...</Text>
        {error ? (
          <Text className="mt-2 text-[12px] font-bold text-red-500">{error}</Text>
        ) : null}
      </View>
    );
  }

  return (
    <OverlayProvider>
      <Chat client={client}>{children}</Chat>
    </OverlayProvider>
  );
}


