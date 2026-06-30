import * as WebBrowser from 'expo-web-browser';

// Servidor de reuniões (sem rebuild). Para produção, trocar por Jitsi self-host
// ou migrar para Stream Video (nativo) — a interface deste módulo mantém-se igual.
const JITSI_BASE = 'https://meet.jit.si';

function sanitizeRoom(s: string) {
  return s.replace(/[^a-zA-Z0-9]/g, '').slice(0, 40) || 'sala';
}

function randomToken() {
  return Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 6);
}

/** Sala única e difícil de adivinhar por conversa/chamada. */
export function buildCallRoom(base: string) {
  return `autonomos-${sanitizeRoom(base)}-${randomToken()}`;
}

/** Monta a URL do Jitsi com modo áudio e nome do utilizador. */
export function buildJitsiUrl(room: string, opts?: { audioOnly?: boolean; displayName?: string }) {
  const params: string[] = ['config.prejoinPageEnabled=false'];
  if (opts?.audioOnly) {
    params.push('config.startAudioOnly=true');
    params.push('config.startWithVideoMuted=true');
  }
  if (opts?.displayName) params.push(`userInfo.displayName=${encodeURIComponent(opts.displayName)}`);
  return `${JITSI_BASE}/${encodeURIComponent(room)}#${params.join('&')}`;
}

/** Abre a chamada numa janela de browser in-app. */
export async function openCall(url: string) {
  try {
    await WebBrowser.openBrowserAsync(url);
  } catch {
    // Fallback: tenta abrir no browser externo.
    await WebBrowser.openBrowserAsync(url).catch(() => {});
  }
}
