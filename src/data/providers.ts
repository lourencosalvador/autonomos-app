import { toStreamSafeUserId } from '../utils/stream';

export type Provider = {
  id: string;
  name: string;
  email: string;
  jobTitle: string;
  rating: number;
  avatar: any;
};

const ProfileImage = require('../../assets/images/Profile.jpg');

export const PROVIDERS: Provider[] = [
  {
    id: toStreamSafeUserId('edson009@gmail.com'),
    name: 'Edson Santos',
    email: 'edsonsantos@gmail.com',
    jobTitle: 'Fotógrafo',
    rating: 4.8,
    avatar: ProfileImage,
  },
  {
    id: toStreamSafeUserId('romeu.cajamba@autonomos.com'),
    name: 'Romeu Cajamba',
    email: 'romeu.cajamba@autonomos.com',
    jobTitle: 'Fotógrafo',
    rating: 4.6,
    avatar: { uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200' },
  },
  {
    id: toStreamSafeUserId('marcelo.vica@autonomos.com'),
    name: 'Marcelo Vica',
    email: 'marcelo.vica@autonomos.com',
    jobTitle: 'Fotógrafo',
    rating: 4.7,
    avatar: { uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200' },
  },
  {
    id: toStreamSafeUserId('nani.fernandes@autonomos.com'),
    name: 'Nani Fernandes',
    email: 'nani.fernandes@autonomos.com',
    jobTitle: 'Fotógrafo',
    rating: 4.3,
    avatar: { uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200' },
  },
  {
    id: toStreamSafeUserId('helena.zau@autonomos.com'),
    name: 'Helena Zau',
    email: 'helena.zau@autonomos.com',
    jobTitle: 'Fotógrafo',
    rating: 4.5,
    avatar: { uri: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200' },
  },
  {
    id: toStreamSafeUserId('sandro.salvador@autonomos.com'),
    name: 'Sandro Salvador',
    email: 'sandro.salvador@autonomos.com',
    jobTitle: 'Fotógrafo',
    rating: 4.2,
    avatar: { uri: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200' },
  },
  {
    id: toStreamSafeUserId('roberta.paulo@autonomos.com'),
    name: 'Roberta Paulo',
    email: 'roberta.paulo@autonomos.com',
    jobTitle: 'Fotógrafo',
    rating: 4.4,
    avatar: { uri: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200' },
  },
  {
    id: toStreamSafeUserId('luine.dayane@autonomos.com'),
    name: 'Luine Dayane',
    email: 'luine.dayane@autonomos.com',
    jobTitle: 'Fotógrafo',
    rating: 4.1,
    avatar: { uri: 'https://images.unsplash.com/photo-1525134479668-1bee5c7c6845?w=200' },
  },
];


