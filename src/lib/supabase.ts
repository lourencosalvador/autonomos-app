import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
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
    // Usamos SecureStore para a sessão (mais seguro que AsyncStorage).
    storage: {
      async getItem(key: string) {
        return await SecureStore.getItemAsync(key);
      },
      async setItem(key: string, value: string) {
        // Em alguns Androids, SecureStore pode falhar se não houver lockscreen configurada.
        // Se isso acontecer, pode-se cair para AsyncStorage. Por agora, mantemos estrito.
        await SecureStore.setItemAsync(key, value);
      },
      async removeItem(key: string) {
        await SecureStore.deleteItemAsync(key);
      },
    } as any,
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
  stripe_account_id?: string | null;
  // Campos pessoais opcionais (se existirem na tabela)
  work_area?: string | null;
  auto_accept_message?: string | null;
  gender?: string | null;
  birth_date?: string | null; // YYYY-MM-DD
  created_at?: string;
  updated_at?: string;
};

export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';

/** Estado do dinheiro retido (escrow). 'held' = em processamento, 'released' = realizado/sacável. */
export type EscrowStatus = 'none' | 'held' | 'released' | 'refunded';

export type RequestRow = {
  id: string;
  client_id: string;
  client_name: string;
  client_avatar_url?: string | null;
  provider_id: string;
  provider_name: string;
  provider_avatar_url?: string | null;
  service_name: string;
  description: string;
  location?: string | null;
  service_date: string | null;
  service_time: string | null;
  status: RequestStatus;
  // Pagamentos
  price_amount?: number | null;
  currency?: string | null;
  payment_status?: string | null;
  stripe_payment_intent_id?: string | null;
  paid_at?: string | null;
  accepted_at?: string | null;
  rejected_at?: string | null;
  reviewed_at?: string | null;
  // Escrow + FlexPay
  is_urgent?: boolean | null;
  escrow_status?: EscrowStatus | null;
  agreed_amount?: number | null;
  client_total?: number | null;
  request_fee?: number | null;
  service_fee?: number | null;
  urgent_bonus?: number | null;
  provider_net?: number | null;
  platform_net?: number | null;
  released_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type ReviewRow = {
  id: string;
  request_id: string;
  provider_id: string;
  client_id: string;
  client_avatar_url?: string | null;
  rating: number; // 1..5 — "Que nota daria ao trabalho?"
  comment: string | null; // observação opcional
  // Perguntas de múltipla escolha (cliente avalia prestador)
  well_executed?: boolean | null; // "O trabalho foi bem executado?"
  would_recommend?: boolean | null; // "Recomendaria?"
  inappropriate_behavior?: boolean | null; // "O prestador teve comportamento inadequado?"
  created_at: string;
};

// Prestador avalia o CLIENTE
export type ClientReviewRow = {
  id: string;
  request_id: string;
  provider_id: string; // quem avalia
  client_id: string; // avaliado
  provider_avatar_url?: string | null;
  polite?: boolean | null; // "O cliente foi educado durante a interação?"
  changed_scope?: boolean | null; // "O cliente mudou o tipo do serviço depois do acordo?"
  rating: number; // 1..5 derivado
  comment?: string | null;
  created_at: string;
};

export type PaymentRow = {
  id: string;
  request_id: string | null;
  client_id: string | null;
  provider_id: string | null;
  amount: number; // total cobrado do cliente (client_total)
  currency: string;
  status: string;
  stripe_payment_intent_id: string;
  paid_at: string | null;
  // Escrow + snapshot das taxas
  is_urgent?: boolean | null;
  escrow_status?: EscrowStatus | null;
  agreed_amount?: number | null;
  request_fee?: number | null;
  service_fee?: number | null;
  urgent_bonus?: number | null;
  provider_net?: number | null;
  platform_net?: number | null;
  released_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type WithdrawalStatus = 'processing' | 'paid' | 'failed' | 'cancelled';

export type WithdrawalRow = {
  id: string;
  provider_id: string;
  amount: number;
  currency: string;
  status: WithdrawalStatus;
  method?: string | null;
  requested_at: string;
  estimated_arrival?: string | null;
  paid_at?: string | null;
  created_at: string;
  updated_at: string;
};

// Portfólio / Publicações do prestador
export type ProviderPostRow = {
  id: string;
  provider_id: string;
  image_url: string;
  caption: string | null;
  highlight_title: string | null; // usado para "Estados" (stories/highlights)
  post_type?: 'post' | 'story' | null; // 'post' = publicação normal, 'story' = sequência/estado
  created_at: string;
};


