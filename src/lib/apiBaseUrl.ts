import Constants from 'expo-constants';
import { Platform } from 'react-native';

function extractHostFromHostUri(hostUri?: string | null) {
  if (!hostUri) return null;
  // hostUri pode vir como "192.168.0.10:8081" ou "exp://192.168.0.10:8081"
  const cleaned = hostUri.replace(/^exp:\/\//, '').replace(/^https?:\/\//, '');
  const host = cleaned.split('/')[0]; // "192.168.0.10:8081"
  const hostname = host.split(':')[0]; // "192.168.0.10"
  return hostname || null;
}

function getExpoDevHostname(): string | null {
  // Expo SDKs diferentes expõem hostUri em lugares diferentes
  const anyConst: any = Constants as any;
  return (
    extractHostFromHostUri(anyConst?.expoConfig?.hostUri) ||
    extractHostFromHostUri(anyConst?.manifest2?.extra?.expoClient?.hostUri) ||
    extractHostFromHostUri(anyConst?.manifest?.hostUri) ||
    null
  );
}

function withHostname(url: string, hostname: string) {
  try {
    const u = new URL(url);
    u.hostname = hostname;
    return u.toString().replace(/\/$/, '');
  } catch {
    return url;
  }
}

function isLikelyIpv4(hostname: string) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
}

/**
 * Retorna a base URL do backend (OTP + Stream token).
 * - Em device, evita "localhost" (que aponta pro próprio device).
 * - Em Expo Go, tenta usar o hostname do packager (IP do PC) com a mesma porta do backend.
 */
export function getApiBaseUrl() {
  const rawEnv = (process.env.EXPO_PUBLIC_API_URL || '').trim();
  const defaultPort = 8082;

  // Base padrão
  let base = rawEnv || `http://localhost:${defaultPort}`;

  // Web pode usar localhost normalmente
  if (Platform.OS === 'web') return base.replace(/\/$/, '');

  // Em native, se o env estiver apontando para localhost, substitui pelo IP do host do Expo
  if (/localhost|127\.0\.0\.1/.test(base)) {
    const host = getExpoDevHostname();
    // Só troca se for um IP local (em tunnel pode vir um domínio e isso não ajuda)
    if (host && isLikelyIpv4(host)) base = withHostname(base, host);
    else if (Platform.OS === 'android') {
      // fallback para emulador Android
      base = withHostname(base, '10.0.2.2');
    }
  }

  return base.replace(/\/$/, '');
}


