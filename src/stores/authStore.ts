import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import Constants from 'expo-constants';
import { isSupabaseConfigured, supabase, type ProfileRole, type ProfileRow } from '../lib/supabase';

function assertSupabaseConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase não configurado. Defina EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY.');
  }
}

async function inferAndFixRole(userId: string, profile: ProfileRow | null) {
  const current = (profile?.role as ProfileRole | null) || null;
  const workArea = String((profile as any)?.work_area || '').trim();

  // Inferência segura:
  // - Se tiver work_area preenchido, tratamos como professional (só aparece para prestador no app).
  // - Caso contrário, client.
  const inferred: ProfileRole = workArea ? 'professional' : 'client';

  // Nunca rebaixa profissional para client automaticamente.
  if (current === 'professional') return 'professional';

  // Se estiver null ou marcado como client mas tem work_area, corrigimos para professional.
  if (!current || (current === 'client' && inferred === 'professional')) {
    await supabase.from('profiles').upsert({ id: userId, role: inferred }, { onConflict: 'id' });
    return inferred;
  }

  return current;
}

export type UserRole = 'client' | 'professional';

export type Availability = { days: number[]; start: string; end: string };

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole | null;
  avatar?: string;
  phone?: string | null;
  workArea?: string | null;
  autoAcceptMessage?: string | null;
  gender?: string | null;
  birthDate?: string | null; // YYYY-MM-DD
  // Onboarding do prestador
  bio?: string | null;
  workDescription?: string | null;
  experienceTime?: string | null; // 'lt1' | '2' | '3plus'
  availability?: Availability | null;
  onboardingCompleted?: boolean;
  approvalStatus?: 'approved' | 'pending' | 'rejected' | null;
  approvalNote?: string | null;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasInitialized: boolean;
  
  init: () => Promise<() => void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: { name?: string; phone?: string | null; avatarUrl?: string | null; workArea?: string | null; autoAcceptMessage?: string | null; gender?: string | null; birthDate?: string | null; bio?: string | null; workDescription?: string | null; experienceTime?: string | null; availability?: Availability | null; onboardingCompleted?: boolean; approvalStatus?: 'approved' | 'pending' | 'rejected'; }) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    name: string,
    email: string,
    password: string,
    role: UserRole,
    opts?: { phone?: string | null; workArea?: string | null; gender?: string | null; birthDate?: string | null }
  ) => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'apple', opts?: { role?: UserRole; workArea?: string | null }) => Promise<void>;
  setRole: (role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      hasInitialized: false,

      init: async () => {
        if (!isSupabaseConfigured) {
          set({ isLoading: false });
          return () => {};
        }
        set({ isLoading: true });

        const applySession = async (session: any) => {
          if (!session?.user) {
            set({ user: null, isAuthenticated: false, isLoading: false });
            return;
          }

          const sbUser = session.user;
          const email = sbUser.email || '';
          const meta: any = sbUser.user_metadata || {};
          const metaName = meta.full_name || meta.name || '';
          const metaAvatar = meta.avatar_url || meta.picture || meta.avatar || null;

          const prev = get().user;

          // Busca o profile
          let profile: ProfileRow | null = null;
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', sbUser.id)
            .maybeSingle();

          // IMPORTANTE: se a leitura FALHOU (RLS/rede), NÃO escrevemos nada (não sobrescrever
          // dados existentes). Mantemos o login com o que já sabemos (estado persistido).
          if (error) {
            set({
              user: {
                id: sbUser.id,
                email,
                name: prev?.name || metaName || email,
                role: prev?.role ?? null,
                avatar: prev?.avatar || metaAvatar || undefined,
                phone: prev?.phone ?? null,
                workArea: prev?.workArea ?? null,
                autoAcceptMessage: prev?.autoAcceptMessage ?? null,
                gender: prev?.gender ?? null,
                birthDate: prev?.birthDate ?? null,
                bio: prev?.bio ?? null,
                workDescription: prev?.workDescription ?? null,
                experienceTime: prev?.experienceTime ?? null,
                availability: prev?.availability ?? null,
                onboardingCompleted: prev?.onboardingCompleted,
                approvalStatus: prev?.approvalStatus ?? null,
                approvalNote: prev?.approvalNote ?? null,
              },
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          }

          profile = data as any;

          // Só cria a linha quando ela REALMENTE não existe (sem sobrescrever colunas existentes).
          if (!profile) {
            await supabase.from('profiles').upsert(
              { id: sbUser.id, role: null, name: metaName || null, avatar_url: metaAvatar },
              { onConflict: 'id' }
            );
            profile = { id: sbUser.id, role: null, name: metaName || null, avatar_url: metaAvatar } as any;
          }

          const safeProfile = profile;
          const role = await inferAndFixRole(sbUser.id, safeProfile as any);

          set({
            user: {
              id: sbUser.id,
              email,
              name: safeProfile?.name || metaName || email,
              role: role as any,
              avatar: safeProfile?.avatar_url || metaAvatar || undefined,
              phone: safeProfile?.phone || null,
              workArea: (safeProfile as any)?.work_area ?? null,
              autoAcceptMessage: (safeProfile as any)?.auto_accept_message ?? null,
              gender: (safeProfile as any)?.gender ?? null,
              birthDate: (safeProfile as any)?.birth_date ?? null,
              bio: (safeProfile as any)?.bio ?? null,
              workDescription: (safeProfile as any)?.work_description ?? null,
              experienceTime: (safeProfile as any)?.experience_time ?? null,
              availability: (safeProfile as any)?.availability ?? null,
              // true/false quando a coluna existe; undefined se a migração ainda não rodou
              onboardingCompleted: (safeProfile as any)?.onboarding_completed,
              approvalStatus: (safeProfile as any)?.approval_status ?? null,
              approvalNote: (safeProfile as any)?.approval_note ?? null,
            },
            isAuthenticated: true,
            isLoading: false,
          });
        };

        // Mesmo que já exista subscription, ainda precisamos hidratar a sessão atual
        // (ex: login chama init() novamente).
        const { data } = await supabase.auth.getSession();
        await applySession(data.session);

        if (get().hasInitialized) {
          // Já existe subscription ativa; não cria outra.
          return () => {};
        }

        const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
          await applySession(session);
        });

        set({ hasInitialized: true });
        return () => sub.subscription.unsubscribe();
      },

      refreshProfile: async () => {
        const current = get().user;
        if (!current) return;
        if (!isSupabaseConfigured) return;
        const fetch = async () =>
          supabase
            .from('profiles')
            .select('*')
            .eq('id', current.id)
            .maybeSingle();

        let { data, error } = await fetch();
        if ((error || !data) && current.id) {
          // Se não existir ainda, cria um profile mínimo (evita falhas em update/avatar)
          await supabase.from('profiles').upsert({ id: current.id }, { onConflict: 'id' });
          const retry = await fetch();
          data = retry.data as any;
          error = retry.error as any;
        }
        if (error || !data) return;
        const p: any = data as any;
        const ensuredRole = await inferAndFixRole(current.id, p as any);
        set({
          user: {
            ...current,
            name: p.name || current.name,
            role: ensuredRole ?? current.role,
            phone: p.phone ?? current.phone ?? null,
            avatar: p.avatar_url ?? current.avatar,
            workArea: p.work_area ?? current.workArea ?? null,
            autoAcceptMessage: p.auto_accept_message ?? current.autoAcceptMessage ?? null,
            gender: p.gender ?? current.gender ?? null,
            birthDate: p.birth_date ?? current.birthDate ?? null,
            bio: p.bio ?? current.bio ?? null,
            workDescription: p.work_description ?? current.workDescription ?? null,
            experienceTime: p.experience_time ?? current.experienceTime ?? null,
            availability: p.availability ?? current.availability ?? null,
            onboardingCompleted: typeof p.onboarding_completed === 'boolean' ? p.onboarding_completed : current.onboardingCompleted,
            approvalStatus: p.approval_status ?? current.approvalStatus ?? null,
            approvalNote: p.approval_note ?? current.approvalNote ?? null,
          },
        });
      },

      updateProfile: async ({ name, phone, avatarUrl, workArea, autoAcceptMessage, gender, birthDate, bio, workDescription, experienceTime, availability, onboardingCompleted, approvalStatus }) => {
        const current = get().user;
        if (!current) return;
        assertSupabaseConfigured();
        set({ isLoading: true });
        try {
          const payload: any = {};
          if (name !== undefined) payload.name = name;
          if (phone !== undefined) payload.phone = phone;
          if (avatarUrl !== undefined) payload.avatar_url = avatarUrl;
          if (workArea !== undefined) payload.work_area = workArea;
          if (autoAcceptMessage !== undefined) payload.auto_accept_message = autoAcceptMessage;
          if (gender !== undefined) payload.gender = gender;
          if (birthDate !== undefined) payload.birth_date = birthDate;
          if (bio !== undefined) payload.bio = bio;
          if (workDescription !== undefined) payload.work_description = workDescription;
          if (experienceTime !== undefined) payload.experience_time = experienceTime;
          if (availability !== undefined) payload.availability = availability;
          if (onboardingCompleted !== undefined) payload.onboarding_completed = onboardingCompleted;
          if (approvalStatus !== undefined) {
            payload.approval_status = approvalStatus;
            payload.approval_requested_at = new Date().toISOString();
          }

          // Upsert para garantir que a linha exista (evita erro quando profiles ainda não tem row)
          const { data, error } = await supabase
            .from('profiles')
            .upsert({ id: current.id, ...payload }, { onConflict: 'id' })
            .select('*')
            .maybeSingle();
          if (error) throw error;

          const p: any = data || {};
          set({
            user: {
              ...current,
              name: p.name ?? current.name,
              role: p.role ?? current.role,
              phone: p.phone ?? current.phone ?? null,
              avatar: p.avatar_url ?? current.avatar,
              workArea: p.work_area ?? current.workArea ?? null,
              autoAcceptMessage: p.auto_accept_message ?? current.autoAcceptMessage ?? null,
              gender: p.gender ?? current.gender ?? null,
              birthDate: p.birth_date ?? current.birthDate ?? null,
              bio: p.bio ?? current.bio ?? null,
              workDescription: p.work_description ?? current.workDescription ?? null,
              experienceTime: p.experience_time ?? current.experienceTime ?? null,
              availability: p.availability ?? current.availability ?? null,
              onboardingCompleted: typeof p.onboarding_completed === 'boolean' ? p.onboarding_completed : current.onboardingCompleted,
              approvalStatus: p.approval_status ?? current.approvalStatus ?? null,
              approvalNote: p.approval_note ?? current.approvalNote ?? null,
            },
            isLoading: false,
          });
        } catch (e) {
          set({ isLoading: false });
          throw e;
        }
      },

      signIn: async (email: string, password: string) => {
        set({ isLoading: true });
        
        try {
          assertSupabaseConfigured();
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;

          // A sessão vai cair no onAuthStateChange, mas aplicamos já para UX
          if (data.session?.user) {
            await get().init(); // garante leitura de profile/role
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      signUp: async (
        name: string,
        email: string,
        password: string,
        role: UserRole,
        opts?: { phone?: string | null; workArea?: string | null; gender?: string | null; birthDate?: string | null }
      ) => {
        set({ isLoading: true });
        
        try {
          assertSupabaseConfigured();
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { full_name: name },
            },
          });
          if (error) throw error;

          // cria/atualiza profile já com role. Resiliente: se alguma coluna opcional
          // (gender/birth_date/work_area) ainda não existir, remove-a e tenta de novo,
          // garantindo que pelo menos id+role+name são gravados (o app precisa do role).
          if (data.user) {
            const baseProfile: any = {
              id: data.user.id,
              role,
              name,
              avatar_url: (data.user.user_metadata as any)?.avatar_url || null,
            };
            const fullProfile: any = {
              ...baseProfile,
              phone: opts?.phone ?? null,
              work_area: opts?.workArea ?? null,
              gender: opts?.gender ?? null,
              birth_date: opts?.birthDate ?? null,
            };
            let { error: upErr } = await supabase.from('profiles').upsert(fullProfile, { onConflict: 'id' });
            for (let i = 0; i < 4 && upErr; i++) {
              const m = /could not find the '(\w+)' column/i.exec(String((upErr as any)?.message || ''));
              if (!m || !(m[1] in fullProfile)) break;
              delete fullProfile[m[1]];
              ({ error: upErr } = await supabase.from('profiles').upsert(fullProfile, { onConflict: 'id' }));
            }
            if (upErr) {
              // Último recurso: grava o essencial (id+role+name) para o app saber o tipo de conta.
              await supabase.from('profiles').upsert(baseProfile, { onConflict: 'id' });
            }
          }

          // Se o Supabase exigir confirmação de email, pode não vir sessão.
          if (!data.session) {
            set({ isLoading: false });
            // Conta criada, mas sem sessão (ex: confirmação de email ligada no Supabase).
            // A UI decide o próximo passo (normalmente enviar para o login).
            return;
          }

          await get().init();
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      signInWithOAuth: async (provider: 'google' | 'apple', opts?: { role?: UserRole; workArea?: string | null }) => {
        set({ isLoading: true });
        try {
          assertSupabaseConfigured();
          const isExpoGo = Constants.appOwnership === 'expo';
          const redirectTo = makeRedirectUri(
            isExpoGo
              ? { useProxy: true } // Expo Go: https://auth.expo.io/@user/slug
              : { scheme: 'autonomosapp', path: 'auth/callback' } // Dev-client / standalone
          ).trim();

          const { data, error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
              redirectTo,
              skipBrowserRedirect: true,
            },
          });
          if (error) throw error;
          if (!data?.url) throw new Error('Não foi possível iniciar o login social.');

          const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
          if (res.type !== 'success' || !res.url) {
            set({ isLoading: false });
            return;
          }

          const returnedUrl = new URL(res.url);
          const code = returnedUrl.searchParams.get('code');
          if (!code) throw new Error('Callback inválido do provedor.');

          const ex = await supabase.auth.exchangeCodeForSession(code);
          if (ex.error) throw ex.error;

          // Se veio role (fluxo: Criar conta → Tipo de conta → Register → Google),
          // persistimos no profile imediatamente.
          const desiredRole = opts?.role;
          const sbUser = ex.data?.session?.user;
          if ((desiredRole || opts?.workArea) && sbUser?.id) {
            const meta: any = sbUser.user_metadata || {};
            const metaName = meta.full_name || meta.name || null;
            const metaAvatar = meta.avatar_url || meta.picture || meta.avatar || null;
            await supabase.from('profiles').upsert(
              {
                id: sbUser.id,
                role: desiredRole ?? undefined,
                name: metaName,
                phone: null,
                avatar_url: metaAvatar,
                work_area: opts?.workArea ?? null,
              },
              { onConflict: 'id' }
            );
          }

          // Garante sincronização no app (mesmo que init já esteja ativo).
          await get().refreshProfile();
          set({ isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      setRole: async (role: UserRole) => {
        const current = get().user;
        if (!current) return;
        set({ isLoading: true });
        try {
          const { error } = await supabase
            .from('profiles')
            .upsert({ id: current.id, role }, { onConflict: 'id' });
          if (error) throw error;
          set({ user: { ...current, role }, isLoading: false });
        } catch (e) {
          set({ isLoading: false });
          throw e;
        }
      },

      signOut: async () => {
        // Limpa o estado JÁ (síncrono) para o redirect ser imediato e não "piscar" dados antigos.
        set({ user: null, isAuthenticated: false });
        try {
          await supabase.auth.signOut();
        } catch {
          // mesmo que a chamada de rede falhe, a sessão local já foi limpa
        }
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...userData } });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
