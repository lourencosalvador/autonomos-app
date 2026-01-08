import { createApi } from 'unsplash-js';

const unsplash = createApi({
  accessKey: process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY || '00iDnQex9_bum0GTDUD4UTfcjzNDnK_T8LHZyLTDwQI',
});

const fallbackPhotos = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
  'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=400',
  'https://images.unsplash.com/photo-1554151228-14d9def656e4?w=400',
  'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=400',
  'https://images.unsplash.com/photo-1546961329-78bef0414d7c?w=400',
];

export async function getRandomPhotos(count: number = 10) {
  try {
    const result = await unsplash.photos.getRandom({ 
      count, 
      query: 'portrait',
      orientation: 'portrait'
    });
    
    if (Array.isArray(result.response)) {
      return result.response.map(photo => ({
        id: photo.id,
        url: photo.urls.small,
        author: photo.user.name,
      }));
    }
    
    console.warn('Unsplash API não retornou array, usando fallback');
    return getFallbackPhotos(count);
  } catch (error) {
    console.warn('Erro ao buscar fotos do Unsplash, usando fallback:', error);
    return getFallbackPhotos(count);
  }
}

function getFallbackPhotos(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `fallback-${i}`,
    url: fallbackPhotos[i % fallbackPhotos.length],
    author: 'Unsplash',
  }));
}
