import { useEffect, useMemo, useRef, useState } from 'react';
import { StreamChat } from 'stream-chat';
import { Chat, OverlayProvider } from 'stream-chat-expo';
import { STREAM_CONFIG } from '../config/stream.config';
import { useAuthStore } from '../stores/authStore';
import { toStreamSafeUserId } from '../utils/stream';
import { useStreamStore } from '../stores/streamStore';
import { getApiBaseUrl } from '../lib/apiBaseUrl';

type Props = { children: React.ReactNode };

function isLikelyNetworkError(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  return /Network request failed|Failed to fetch|ECONNREFUSED|ENOTFOUND|ETIMEOUT|timed out/i.test(msg);
}

async function fetchStreamToken(payload: { userId: string; name: string; image?: string }) {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) throw new Error('BACKEND_URL_NOT_SET');

  try {
    const res = await fetch(`${baseUrl}/api/stream/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(`BACKEND_HTTP_${res.status}`);
    if (!json?.success || !json?.token) throw new Error('BACKEND_BAD_RESPONSE');
    return String(json.token);
  } catch (e) {
    if (isLikelyNetworkError(e)) throw new Error(`BACKEND_UNREACHABLE:${baseUrl}`);
    throw e;
  }
}

export function StreamChatProvider({ children }: Props) {
  const { user, isAuthenticated } = useAuthStore();
  const apiKey = STREAM_CONFIG.apiKey;
  const setStreamReady = useStreamStore((s) => s.setReady);
  const setStreamError = useStreamStore((s) => s.setError);
  const retryKey = useStreamStore((s) => s.retryKey);

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
        setStreamReady(false);
        setStreamError(null);
        try {
          await client.disconnectUser();
        } catch {}
        return;
      }

      try {
        setReady(false);
        setError(null);
        setStreamReady(false);
        setStreamError(null);

        const streamUserId = toStreamSafeUserId(user.id || user.email);
        if (client.userID === streamUserId) {
          if (!cancelled) {
            setReady(true);
            setStreamReady(true);
          }
          return;
        }
        if (isConnectingRef.current) return;
        isConnectingRef.current = true;
        try {
          await client.disconnectUser();
        } catch {}
        const token = await fetchStreamToken({ userId: streamUserId, name: user.name, image: user.avatar });
        if (!token) {
          // Sem backend token: desliga o Stream e deixa o app seguir (Mensagens cai no modo legacy).
          throw new Error('Token do chat indisponível');
        }

        await client.connectUser(
          {
            id: streamUserId,
            name: user.name,
            image: user.avatar,
          },
          token
        );
        if (!cancelled) {
          setReady(true);
          setStreamReady(true);
        }
      } catch (e) {
        if (!cancelled) {
          setReady(false);
          const msg = (() => {
            const m = e instanceof Error ? e.message : '';
            if (m.startsWith('BACKEND_UNREACHABLE:')) {
              const url = m.split(':').slice(1).join(':');
              return `Não consegui acessar o backend em ${url}. No telemóvel, use o IP do teu PC em EXPO_PUBLIC_API_URL.`;
            }
            if (m === 'BACKEND_URL_NOT_SET') {
              return 'Backend não configurado (EXPO_PUBLIC_API_URL).';
            }
            if (m.startsWith('BACKEND_HTTP_') || m === 'BACKEND_BAD_RESPONSE') {
              return 'Backend respondeu inválido ao pedir token do chat.';
            }
            if (m === 'Token do chat indisponível') return 'Chat temporariamente indisponível.';
            return 'Falha ao conectar no chat.';
          })();
          setError(msg);
          setStreamReady(false);
          setStreamError(msg);
        }
      } finally {
        isConnectingRef.current = false;
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [client, isAuthenticated, user?.id, user?.name, user?.avatar, retryKey]);

  if (!client) return <>{children}</>;

  // Não bloqueia o app inteiro se o chat falhar; apenas não fornece contexto do Stream.
  if (isAuthenticated && user && !ready) return <>{children}</>;

  return (
    <OverlayProvider>
      <Chat client={client}>{children}</Chat>
    </OverlayProvider>
  );
}


