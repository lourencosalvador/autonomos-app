import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ServiceRequestStatus = 'pending' | 'accepted' | 'rejected';

export type ServiceRequest = {
  id: string;
  providerId: string;
  providerName: string;
  serviceName: string;
  clientId: string;
  clientName: string;
  description: string;
  date: string;
  time: string;
  status: ServiceRequestStatus;
  createdAt: string;
};

type RequestsState = {
  requests: ServiceRequest[];
  addRequest: (req: Omit<ServiceRequest, 'id' | 'createdAt' | 'status'>) => void;
  setRequestStatus: (id: string, status: ServiceRequestStatus) => void;
  deleteRequest: (id: string) => void;
  clear: () => void;
};

export const useRequestsStore = create<RequestsState>()(
  persist(
    (set) => ({
      requests: [],
      addRequest: (req) =>
        set((state) => ({
          requests: [
            {
              ...req,
              status: 'pending',
              id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
              createdAt: new Date().toISOString(),
            },
            ...state.requests,
          ],
        })),
      setRequestStatus: (id, status) =>
        set((state) => ({
          requests: state.requests.map((r) => (r.id === id ? { ...r, status } : r)),
        })),
      deleteRequest: (id) =>
        set((state) => ({
          requests: state.requests.filter((r) => r.id !== id),
        })),
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
            date: typeof r?.date === 'string' ? r.date : '',
            time: typeof r?.time === 'string' ? r.time : '',
            status: (r?.status as ServiceRequestStatus) || 'pending',
          })),
        };
      },
    }
  )
);


