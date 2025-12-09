import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

interface AppState {
  // Flags de primeira execução
  hasSeenSplash: boolean;
  hasCompletedOnboarding: boolean; // Mantido para compatibilidade, caso queira adicionar onboarding depois
  
  // Preferências
  theme: ThemeMode;
  language: string;
  notificationsEnabled: boolean;
  
  // Ações
  setHasSeenSplash: (value: boolean) => void;
  setHasCompletedOnboarding: (value: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
  setLanguage: (language: string) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  resetApp: () => void;
}

const initialState = {
  hasSeenSplash: false,
  hasCompletedOnboarding: true, // Sempre true, pois não temos onboarding no fluxo principal
  theme: 'system' as ThemeMode,
  language: 'pt',
  notificationsEnabled: true,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialState,

      setHasSeenSplash: (value: boolean) => {
        set({ hasSeenSplash: value });
      },

      setHasCompletedOnboarding: (value: boolean) => {
        set({ hasCompletedOnboarding: value });
      },

      setTheme: (theme: ThemeMode) => {
        set({ theme });
      },

      setLanguage: (language: string) => {
        set({ language });
      },

      setNotificationsEnabled: (enabled: boolean) => {
        set({ notificationsEnabled: enabled });
      },

      resetApp: () => {
        set(initialState);
      },
    }),
    {
      name: 'app-storage', // Nome da key no AsyncStorage
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

