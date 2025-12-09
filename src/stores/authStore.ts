import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { MOCK_USERS } from '../config/auth.config';

const secureStorage = {
  async setItem(key: string, value: string) {
    await SecureStore.setItemAsync(key, value);
  },
  async getItem(key: string) {
    return await SecureStore.getItemAsync(key);
  },
  async removeItem(key: string) {
    await SecureStore.deleteItemAsync(key);
  },
};

export type UserRole = 'client' | 'professional';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface SocialLoginData {
  email: string;
  name: string;
  id: string;
  provider: 'google' | 'apple';
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  signInWithSocial: (data: SocialLoginData) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  clearTokens: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      signIn: async (email: string, password: string) => {
        set({ isLoading: true });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          const validUser = MOCK_USERS.find(u => u.email === email && u.pass === password);

          if (!validUser) {
            throw new Error("Credenciais inválidas");
          }
          
          const mockUser: User = {
            id: Math.random().toString(36).substr(2, 9),
            name: validUser.name,
            email: validUser.email,
            role: validUser.role,
          };
          
          const mockTokens = {
            accessToken: 'mock_access_token_' + Date.now(),
            refreshToken: 'mock_refresh_token_' + Date.now(),
          };
          
          await get().setTokens(mockTokens.accessToken, mockTokens.refreshToken);
          
          set({
            user: mockUser,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      signUp: async (name: string, email: string, password: string, role: UserRole) => {
        set({ isLoading: true });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          const mockUser: User = {
            id: Math.random().toString(36).substr(2, 9),
            name: name,
            email: email,
            role: role,
          };
          
          const mockTokens = {
            accessToken: 'mock_access_token_' + Date.now(),
            refreshToken: 'mock_refresh_token_' + Date.now(),
          };
          
          await get().setTokens(mockTokens.accessToken, mockTokens.refreshToken);
          
          set({
            user: mockUser,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      signInWithSocial: async (data: SocialLoginData) => {
        set({ isLoading: true });
        try {
          // Simula verificação no backend
          await new Promise(resolve => setTimeout(resolve, 2000));

          const mockUser: User = {
            id: data.id,
            name: data.name,
            email: data.email,
            role: 'client', // Default role, em produção talvez precisasse perguntar
            avatar: data.avatar
          };

          const mockTokens = {
            accessToken: 'mock_social_token_' + Date.now(),
            refreshToken: 'mock_social_refresh_' + Date.now(),
          };

          await get().setTokens(mockTokens.accessToken, mockTokens.refreshToken);

          set({
            user: mockUser,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      signOut: async () => {
        await get().clearTokens();
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

      setTokens: async (accessToken: string, refreshToken: string) => {
        await secureStorage.setItem('access_token', accessToken);
        await secureStorage.setItem('refresh_token', refreshToken);
      },

      getAccessToken: async () => {
        return await secureStorage.getItem('access_token');
      },

      clearTokens: async () => {
        await secureStorage.removeItem('access_token');
        await secureStorage.removeItem('refresh_token');
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
