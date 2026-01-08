import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  // Não lançar erro aqui para não quebrar build em dev; o store vai mostrar erros amigáveis.
  console.warn('[supabase] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY não configurados');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // em mobile tratamos o callback manualmente
  },
});

export type ProfileRole = 'client' | 'professional';

export type ProfileRow = {
  id: string;
  role: ProfileRole | null;
  name: string | null;
  phone: string | null;
  avatar_url: string | null;
  // Campos pessoais opcionais (se existirem na tabela)
  work_area?: string | null;
  gender?: string | null;
  birth_date?: string | null; // YYYY-MM-DD
  created_at?: string;
  updated_at?: string;
};


