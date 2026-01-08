export function toStreamSafeUserId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9@_-]/g, '_');
}

export function toStreamSafeChannelId(value: string) {
  // Channel ID: letras/números e "!-_"
  // (evita "@" e outros caracteres inválidos)
  return value.toLowerCase().replace(/[^a-z0-9!_-]/g, '_');
}


