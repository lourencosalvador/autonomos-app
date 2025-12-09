import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useAuthStore } from '../stores/authStore';

// Necessário para completar o fluxo de auth no WebBrowser
WebBrowser.maybeCompleteAuthSession();

export function useSocialAuth() {
  const { signInWithSocial } = useAuthStore();

  // Configuração do Google Auth
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      // Aqui você enviaria o token para seu backend validar
      // Como estamos simulando, vamos pegar os dados do user do endpoint do Google
      fetchUserInfo(authentication?.accessToken);
    }
  }, [response]);

  const fetchUserInfo = async (token?: string) => {
    if (!token) return;
    try {
      const response = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const user = await response.json();
      
      // Loga no store com os dados do Google
      await signInWithSocial({
        email: user.email,
        name: user.name,
        avatar: user.picture,
        provider: 'google',
        id: user.id
      });
    } catch (error) {
      console.error('Erro ao buscar dados do Google:', error);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await promptAsync();
    } catch (error) {
      console.error('Erro no login com Google:', error);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Apple só retorna nome/email na primeira vez. Nos logins seguintes só o user ID.
      // Em produção, você deve enviar o identityToken para seu backend validar.
      
      const name = credential.fullName?.givenName 
        ? `${credential.fullName.givenName} ${credential.fullName.familyName || ''}`.trim()
        : 'Usuário Apple'; // Fallback

      await signInWithSocial({
        email: credential.email || `apple-${credential.user}@privaterelay.appleid.com`, // Email pode ser null se oculto
        name: name,
        provider: 'apple',
        id: credential.user
      });

    } catch (e: any) {
      if (e.code === 'ERR_REQUEST_CANCELED') {
        // Usuário cancelou, não faz nada
      } else {
        console.error('Erro no login com Apple:', e);
      }
    }
  };

  return {
    handleGoogleSignIn,
    handleAppleSignIn,
    isGoogleLoading: !request,
    isAppleSupported: Platform.OS === 'ios',
  };
}

