import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { isSupabaseConfigured, supabase, type RequestRow, type RequestStatus } from '../lib/supabase';

export type ServiceRequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';

export type ServiceRequest = {
  id: string;
  providerId: string;
  providerName: string;
  serviceName: string;
  clientId: string;
  clientName: string;
  clientAvatarUrl?: string | null;
  providerAvatarUrl?: string | null;
  description: string;
  location?: string;
  date: string;
  time: string;
  status: ServiceRequestStatus;
  priceAmount?: number | null;
  currency?: string | null;
  paymentStatus?: string | null;
  stripePaymentIntentId?: string | null;
  paidAt?: string | null;
  acceptedAt?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
};

function rowToRequest(r: RequestRow): ServiceRequest {
  return {
    id: r.id,
    providerId: r.provider_id,
    providerName: r.provider_name,
    serviceName: r.service_name,
    clientId: r.client_id,
    clientName: r.client_name,
    clientAvatarUrl: (r as any).client_avatar_url ?? null,
    providerAvatarUrl: (r as any).provider_avatar_url ?? null,
    description: r.description,
    location: (r as any).location ?? '',
    date: r.service_date || '',
    time: r.service_time || '',
    status: r.status,
    priceAmount: (r as any).price_amount ?? null,
    currency: (r as any).currency ?? null,
    paymentStatus: (r as any).payment_status ?? null,
    stripePaymentIntentId: (r as any).stripe_payment_intent_id ?? null,
    paidAt: (r as any).paid_at ?? null,
    acceptedAt: (r as any).accepted_at ?? null,
    reviewedAt: (r as any).reviewed_at ?? null,
    createdAt: r.created_at,
  };
}

type RequestsState = {
  requests: ServiceRequest[];
  fetchRequests: (userId: string) => Promise<void>;
  addRequest: (req: Omit<ServiceRequest, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  setRequestStatus: (id: string, status: ServiceRequestStatus) => Promise<void>;
  setRequestPrice: (args: { id: string; priceAmount: number; currency: string }) => Promise<void>;
  markRequestPaid: (args: { id: string; paymentIntentId?: string | null }) => Promise<void>;
  cancelRequest: (id: string) => Promise<void>;
  deleteRequest: (id: string) => Promise<void>;
  submitReview: (args: { requestId: string; providerId: string; clientId: string; clientAvatarUrl?: string | null; rating: 1 | 2 | 3 | 4 | 5; comment?: string }) => Promise<void>;
  clear: () => void;
};

export const useRequestsStore = create<RequestsState>()(
  persist(
    (set, get) => ({
      requests: [],
      fetchRequests: async (userId: string) => {
        if (!isSupabaseConfigured) return;
        const { data, error } = await supabase
          .from('requests')
          .select('*')
          .or(`client_id.eq.${userId},provider_id.eq.${userId}`)
          .order('created_at', { ascending: false });
        if (error) throw error;
        const rows = (data || []) as RequestRow[];
        set({ requests: rows.map(rowToRequest) });
      },

      addRequest: async (req) => {
        // Bloqueia duplicado: mesmo cliente + mesmo prestador + mesmo serviço enquanto estiver pendente
        const existsOpen = (get().requests || []).some(
          (r) =>
            r.clientId === req.clientId &&
            r.providerId === req.providerId &&
            r.serviceName === req.serviceName &&
            (r.status === 'pending' || r.status === 'accepted')
        );
        if (existsOpen) {
          throw new Error('Você já tem um pedido em andamento para este prestador.');
        }

        // Otimista: já coloca no topo, depois tenta sincronizar no Supabase
        const optimistic: ServiceRequest = {
          ...req,
          status: 'pending',
          id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ requests: [optimistic, ...state.requests] }));

        if (!isSupabaseConfigured) return;
        const payload = {
          client_id: req.clientId,
          client_name: req.clientName,
          client_avatar_url: (req as any).clientAvatarUrl ?? null,
          provider_id: req.providerId,
          provider_name: req.providerName,
          provider_avatar_url: (req as any).providerAvatarUrl ?? null,
          service_name: req.serviceName,
          description: req.description,
          location: (req as any).location ?? null,
          service_date: req.date || null,
          service_time: req.time || null,
          status: 'pending' as RequestStatus,
        };
        const { data, error } = await supabase.from('requests').insert(payload).select('*').maybeSingle();
        if (error) {
          // Força uma mensagem legível no app (RLS/coluna inexistente/FK/etc)
          const msg = (error as any)?.message || 'Falha ao inserir pedido.';
          const code = (error as any)?.code ? ` (${String((error as any).code)})` : '';
          throw new Error(`${msg}${code}`);
        }
        if (data) {
          const created = rowToRequest(data as RequestRow);
          set((state) => ({
            requests: [created, ...state.requests.filter((r) => r.id !== optimistic.id)],
          }));
        }
      },

      setRequestStatus: async (id, status) => {
        // Otimista
        set((state) => ({
          requests: state.requests.map((r) => (r.id === id ? { ...r, status } : r)),
        }));
        if (!isSupabaseConfigured) return;
        const now = new Date().toISOString();
        const patch: any = { status };
        if (status === 'accepted') patch.accepted_at = now;
        if (status === 'rejected') patch.rejected_at = now;
        if (status === 'cancelled') patch.cancelled_at = now;
        const { error } = await supabase.from('requests').update(patch).eq('id', id);
        if (error) throw error;
      },

      setRequestPrice: async ({ id, priceAmount, currency }) => {
        const normalizedCurrency = String(currency || '')
          .trim()
          .toLowerCase()
          // Para testes com Stripe PaymentSheet, padronizamos em USD.
          // (AOA pode falhar dependendo dos métodos ativados na conta Stripe.)
          .replace(/^kz$/, 'usd')
          .replace(/^kwanza$/, 'usd')
          .replace(/^aoa$/, 'usd') || 'usd';

        // Otimista
        set((state) => ({
          requests: state.requests.map((r) =>
            r.id === id ? { ...r, priceAmount, currency: normalizedCurrency || r.currency || 'aoa', paymentStatus: r.paymentStatus || 'unpaid' } : r
          ),
        }));
        if (!isSupabaseConfigured) return;
        // Alguns projetos ainda não têm a coluna 'currency'. Vamos tentar com ela e, se falhar,
        // salvar apenas price_amount (pra não bloquear o fluxo).
        const attempt = await supabase.from('requests').update({ price_amount: priceAmount, currency: normalizedCurrency || 'aoa' } as any).eq('id', id);
        if (attempt.error) {
          const msg = String((attempt.error as any)?.message || '');
          if (msg.includes("Could not find the 'currency' column")) {
            const retry = await supabase.from('requests').update({ price_amount: priceAmount } as any).eq('id', id);
            if (retry.error) throw retry.error;
            return;
          }
          throw attempt.error;
        }
      },

      markRequestPaid: async ({ id, paymentIntentId }) => {
        const paidAt = new Date().toISOString();
        // Otimista: já marca como pago + concluído no app
        set((state) => ({
          requests: state.requests.map((r) =>
            r.id === id
              ? {
                  ...r,
                  paymentStatus: 'succeeded',
                  paidAt,
                  stripePaymentIntentId: paymentIntentId || r.stripePaymentIntentId || null,
                  status: 'completed',
                }
              : r
          ),
        }));

        if (!isSupabaseConfigured) return;

        // Tenta salvar tudo no Supabase (se a constraint/status ainda não estiver pronta, faz fallback)
        const patch: any = {
          payment_status: 'succeeded',
          paid_at: paidAt,
          stripe_payment_intent_id: paymentIntentId || null,
          status: 'completed',
        };
        const attempt = await supabase.from('requests').update(patch).eq('id', id);
        if (attempt.error) {
          // Fallback: salva só payment_status/paid_at (não bloqueia UX)
          await supabase
            .from('requests')
            .update({
              payment_status: 'succeeded',
              paid_at: paidAt,
              stripe_payment_intent_id: paymentIntentId || null,
            } as any)
            .eq('id', id);
        }
      },

      cancelRequest: async (id) => {
        // Otimista: marca como cancelado (mantém para histórico)
        set((state) => ({
          requests: state.requests.map((r) => (r.id === id ? { ...r, status: 'cancelled' } : r)),
        }));
        if (!isSupabaseConfigured) return;
        const now = new Date().toISOString();
        const { error } = await supabase.from('requests').update({ status: 'cancelled', cancelled_at: now } as any).eq('id', id);
        if (error) throw error;
      },

      deleteRequest: async (id) => {
        // Otimista
        set((state) => ({ requests: state.requests.filter((r) => r.id !== id) }));
        if (!isSupabaseConfigured) return;
        const { error } = await supabase.from('requests').delete().eq('id', id);
        if (error) throw error;
      },

      submitReview: async ({ requestId, providerId, clientId, clientAvatarUrl, rating, comment }) => {
        if (!isSupabaseConfigured) return;
        const payload = {
          request_id: requestId,
          provider_id: providerId,
          client_id: clientId,
          client_avatar_url: clientAvatarUrl ?? null,
          rating,
          comment: comment?.trim() ? comment.trim() : null,
        };
        const { error: insErr } = await supabase.from('reviews').insert(payload as any);
        if (insErr) {
          // 23505 = unique_violation (já existe avaliação para este request_id)
          if (String((insErr as any)?.code || '') === '23505') {
            // Considera como sucesso para evitar travar UX em double-tap/retry.
            return;
          }
          throw insErr;
        }

        const reviewedAt = new Date().toISOString();
        const { error: upErr } = await supabase.from('requests').update({ reviewed_at: reviewedAt }).eq('id', requestId);
        if (upErr) throw upErr;

        set((state) => ({
          requests: state.requests.map((r) => (r.id === requestId ? { ...r, reviewedAt } : r)),
        }));
      },

      clear: () => set({ requests: [] }),
    }),
    {
      name: 'requests-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      migrate: (persisted: any) => {
        const requests: any[] = Array.isArray(persisted?.requests) ? persisted.requests : [];
        return {
          ...persisted,
          requests: requests.map((r) => ({
            ...r,
            description: typeof r?.description === 'string' ? r.description : '',
            location: typeof r?.location === 'string' ? r.location : '',
            clientAvatarUrl: r?.clientAvatarUrl ?? null,
            providerAvatarUrl: r?.providerAvatarUrl ?? null,
            date: typeof r?.date === 'string' ? r.date : '',
            time: typeof r?.time === 'string' ? r.time : '',
            status: (r?.status as ServiceRequestStatus) || 'pending',
            priceAmount: typeof r?.priceAmount === 'number' ? r.priceAmount : null,
            currency: typeof r?.currency === 'string' ? r.currency : null,
            paymentStatus: typeof r?.paymentStatus === 'string' ? r.paymentStatus : null,
            stripePaymentIntentId: typeof r?.stripePaymentIntentId === 'string' ? r.stripePaymentIntentId : null,
            paidAt: typeof r?.paidAt === 'string' ? r.paidAt : null,
            acceptedAt: r?.acceptedAt ?? null,
            reviewedAt: r?.reviewedAt ?? null,
          })),
        };
      },
    }
  )
);


