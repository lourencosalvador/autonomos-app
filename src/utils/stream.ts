export function toStreamSafeUserId(value: string) {
  const safe = value.toLowerCase().replace(/[^a-z0-9@_-]/g, '_');
  return safe.length <= 64 ? safe : `u_${fnv1a64(safe)}`;
}

export function toStreamSafeChannelId(value: string) {
  // Channel ID: letras/números e "!-_"
  // (evita "@" e outros caracteres inválidos)
  const safe = value.toLowerCase().replace(/[^a-z0-9!_-]/g, '_');
  // Stream limita id do channel a 64 chars
  return safe.length <= 64 ? safe : `c_${fnv1a64(safe)}`;
}

// Hash determinístico (64-bit FNV-1a) para encurtar ids sem colisões fáceis.
function fnv1a64(input: string) {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  for (let i = 0; i < input.length; i++) {
    hash ^= BigInt(input.charCodeAt(i));
    hash = (hash * prime) & 0xffffffffffffffffn;
  }
  // base36 (somente [0-9a-z]) e tamanho curto
  return hash.toString(36);
}


