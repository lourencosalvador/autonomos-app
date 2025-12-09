import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { useAppStore } from '../stores/appStore';

export function useProtectedRoute() {
  const router = useRouter();
  const segments = useSegments();
  
  const { isAuthenticated } = useAuthStore();
  const { hasSeenSplash } = useAppStore();

  useEffect(() => {
    const timeout = setTimeout(() => {
      const inAuthGroup = segments[0] === '(auth)';
      const inTabsGroup = segments[0] === '(tabs)';
      const inWelcome = segments[0] === '(auth)' && segments[1] === 'welcome';
      const inIndex = segments.length === 0 || segments[0] === 'index';

      if (!hasSeenSplash && !inIndex) {
        router.replace('/');
        return;
      }

      if (hasSeenSplash && !isAuthenticated) {
        if (inTabsGroup || inIndex) {
          router.replace('/(auth)/welcome');
          return;
        }
        if (inAuthGroup && !inWelcome) {
          return;
        }
      }

      if (isAuthenticated) {
        if (inAuthGroup || inIndex) {
          router.replace('/(tabs)/home');
          return;
        }
      }
    }, 150);

    return () => clearTimeout(timeout);
  }, [isAuthenticated, hasSeenSplash, segments]);
}

