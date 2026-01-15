import * as FileSystem from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';
import { supabase } from '../lib/supabase';

function extFromUri(uri: string) {
  const clean = uri.split('?')[0];
  const m = clean.match(/\.([a-zA-Z0-9]+)$/);
  return (m?.[1] || 'jpg').toLowerCase();
}

function mimeFromExt(ext: string) {
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'heic' || ext === 'heif') return 'image/heic';
  return 'image/jpeg';
}

function base64ToUint8Array(base64: string) {
  const binStr = (globalThis as any).atob ? (globalThis as any).atob(base64) : Buffer.from(base64, 'base64').toString('binary');
  const len = binStr.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binStr.charCodeAt(i);
  return bytes;
}

export async function uploadPortfolioImageToSupabase(params: { userId: string; uri: string }) {
  const { userId, uri } = params;

  const ext = extFromUri(uri);
  const contentType = mimeFromExt(ext);
  const random = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${userId}_${Date.now()}_${Math.random()}`);
  const path = `${userId}/${random.slice(0, 16)}.${ext}`;

  const base64Encoding = ((FileSystem as any).EncodingType?.Base64 as string | undefined) || ('base64' as const);
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: base64Encoding as any });
  const bytes = base64ToUint8Array(base64);

  const bucket = supabase.storage.from('portfolio');
  const { error: upErr } = await bucket.upload(path, bytes as any, {
    contentType,
    upsert: true,
    cacheControl: '3600',
  });
  if (upErr) {
    const msg = String((upErr as any)?.message || '');
    if (/bucket/i.test(msg) && /not found/i.test(msg)) {
      throw new Error('Bucket "portfolio" não existe no Supabase Storage. Crie um bucket chamado exatamente "portfolio" e marque como Public.');
    }
    throw upErr;
  }

  const { data } = bucket.getPublicUrl(path);
  const publicUrl = data.publicUrl;
  if (!publicUrl) throw new Error('Não foi possível obter URL pública da imagem.');

  return { path, publicUrl };
}

