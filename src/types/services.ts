export type ServiceStatus = 'pending' | 'accepted' | 'rejected';

export interface ServiceRequest {
  id: string;
  serviceName: string;
  providerName: string;
  providerRole: string;
  providerAvatar: string;
  rating: number;
  status: ServiceStatus;
  date: string;
}

export const mockServices: Omit<ServiceRequest, 'id' | 'providerAvatar'>[] = [
  {
    serviceName: 'Make Up',
    providerName: 'Ana André',
    providerRole: 'Maquiadora',
    rating: 5,
    status: 'pending',
    date: '2024-01-15',
  },
  {
    serviceName: 'Fotografia',
    providerName: 'Romeu Cajamba',
    providerRole: 'Fotógrafo',
    rating: 5,
    status: 'accepted',
    date: '2024-01-14',
  },
  {
    serviceName: 'Contabilid',
    providerName: 'Natália Rios',
    providerRole: 'Contabilista',
    rating: 5,
    status: 'rejected',
    date: '2024-01-13',
  },
  {
    serviceName: 'Design',
    providerName: 'Narciso Mateus',
    providerRole: 'Designer',
    rating: 5,
    status: 'accepted',
    date: '2024-01-12',
  },
  {
    serviceName: 'Pintura',
    providerName: 'Joaquim Miguel',
    providerRole: 'Pintor',
    rating: 5,
    status: 'accepted',
    date: '2024-01-11',
  },
  {
    serviceName: 'Canalização',
    providerName: 'Pedro Santos',
    providerRole: 'Canalizador',
    rating: 5,
    status: 'pending',
    date: '2024-01-10',
  },
  {
    serviceName: 'Jardinagem',
    providerName: 'Maria Silva',
    providerRole: 'Jardineira',
    rating: 5,
    status: 'accepted',
    date: '2024-01-09',
  },
  {
    serviceName: 'Elétrica',
    providerName: 'Carlos Mendes',
    providerRole: 'Eletricista',
    rating: 5,
    status: 'rejected',
    date: '2024-01-08',
  },
  {
    serviceName: 'Carpintaria',
    providerName: 'João Ferreira',
    providerRole: 'Carpinteiro',
    rating: 5,
    status: 'pending',
    date: '2024-01-07',
  },
];

