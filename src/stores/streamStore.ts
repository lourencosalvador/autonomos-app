import { create } from 'zustand';

type StreamState = {
  ready: boolean;
  error: string | null;
  retryKey: number;
  setReady: (ready: boolean) => void;
  setError: (error: string | null) => void;
  retry: () => void;
};

export const useStreamStore = create<StreamState>((set) => ({
  ready: false,
  error: null,
  retryKey: 0,
  setReady: (ready) => set({ ready }),
  setError: (error) => set({ error }),
  retry: () => set((s) => ({ retryKey: s.retryKey + 1, error: null })),
}));


