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

export type UserRole = 'client' | 'professional';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole | null;
  avatar?: string;
  phone?: string | null;
  workArea?: string | null;
  gender?: string | null;
  birthDate?: string | null; // YYYY-MM-DD
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasInitialized: boolean;
  
  init: () => Promise<() => void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: { name?: string; phone?: string | null; avatarUrl?: string | null; workArea?: string | null; gender?: string | null; birthDate?: string | null; }) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'apple') => Promise<void>;
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
        if (get().hasInitialized) {
          // Já existe subscription ativa
          const { data } = await supabase.auth.getSession();
          if (!data.session?.user) set({ user: null, isAuthenticated: false, isLoading: false });
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

          // Busca (ou cria) profile
          let profile: ProfileRow | null = null;
          const { data, error } = await supabase
            .from('profiles')
            .select('id, role, name, phone, avatar_url, work_area, gender, birth_date, created_at, updated_at')
            .eq('id', sbUser.id)
            .maybeSingle();

          if (error) {
            // Se a tabela ainda não existir / RLS bloqueando, mantemos login, mas role vira null.
            profile = null;
          } else {
            profile = data as any;
          }

          if (!profile) {
            // tenta criar profile mínimo
            await supabase.from('profiles').upsert(
              {
                id: sbUser.id,
                role: null,
                name: metaName || null,
                phone: null,
                avatar_url: metaAvatar,
                work_area: null,
                gender: null,
                birth_date: null,
              },
              { onConflict: 'id' }
            );
            profile = {
              id: sbUser.id,
              role: null,
              name: metaName || null,
              phone: null,
              avatar_url: metaAvatar,
              work_area: null,
              gender: null,
              birth_date: null,
            };
          }

          const safeProfile = profile;
          const role = (safeProfile?.role as ProfileRole | null) || null;

          set({
            user: {
              id: sbUser.id,
              email,
              name: safeProfile?.name || metaName || email,
              role: role as any,
              avatar: safeProfile?.avatar_url || metaAvatar || undefined,
              phone: safeProfile?.phone || null,
              workArea: (safeProfile as any)?.work_area ?? null,
              gender: (safeProfile as any)?.gender ?? null,
              birthDate: (safeProfile as any)?.birth_date ?? null,
            },
            isAuthenticated: true,
            isLoading: false,
          });
        };

        const { data } = await supabase.auth.getSession();
        await applySession(data.session);

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
        const { data, error } = await supabase
          .from('profiles')
          .select('id, role, name, phone, avatar_url, work_area, gender, birth_date')
          .eq('id', current.id)
          .maybeSingle();
        if (error || !data) return;
        const p: any = data;
        set({
          user: {
            ...current,
            name: p.name || current.name,
            role: p.role ?? current.role,
            phone: p.phone ?? current.phone ?? null,
            avatar: p.avatar_url ?? current.avatar,
            workArea: p.work_area ?? current.workArea ?? null,
            gender: p.gender ?? current.gender ?? null,
            birthDate: p.birth_date ?? current.birthDate ?? null,
          },
        });
      },

      updateProfile: async ({ name, phone, avatarUrl, workArea, gender, birthDate }) => {
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
          if (gender !== undefined) payload.gender = gender;
          if (birthDate !== undefined) payload.birth_date = birthDate;

          const { data, error } = await supabase
            .from('profiles')
            .update(payload)
            .eq('id', current.id)
            .select('id, role, name, phone, avatar_url, work_area, gender, birth_date')
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
              gender: p.gender ?? current.gender ?? null,
              birthDate: p.birth_date ?? current.birthDate ?? null,
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

      signUp: async (name: string, email: string, password: string, role: UserRole) => {
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

          // cria/atualiza profile já com role
          if (data.user) {
            await supabase.from('profiles').upsert(
              {
                id: data.user.id,
                role,
                name,
                phone: null,
                avatar_url: (data.user.user_metadata as any)?.avatar_url || null,
              },
              { onConflict: 'id' }
            );
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

      signInWithOAuth: async (provider: 'google' | 'apple') => {
        set({ isLoading: true });
        try {
          assertSupabaseConfigured();
          const isExpoGo = Constants.appOwnership === 'expo';
          const redirectTo = makeRedirectUri(
            isExpoGo
              ? { useProxy: true } // Expo Go: https://auth.expo.io/@user/slug
              : { scheme: 'autonomosapp', path: 'auth/callback' } // Dev-client / standalone
          );

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

          await get().init();
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
        await supabase.auth.signOut();
        set({
          user: null,
          isAuthenticated: false,
        });
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
