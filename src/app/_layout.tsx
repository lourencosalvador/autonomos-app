import 'react-native-gesture-handler';
import 'react-native-url-polyfill/auto';
import * as WebBrowser from 'expo-web-browser';
import { Stack } from "expo-router";
import { useEffect } from "react";
import "../global.css";
import { useProtectedRoute } from "../hooks/useProtectedRoute";
import { StreamChatProvider } from "../providers/StreamChatProvider";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../stores/authStore';
import { Toaster } from '../lib/sonner';
import { StripeProvider } from '../providers/StripeProvider';

WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
    useProtectedRoute();
    const initAuth = useAuthStore((s) => s.init);

    useEffect(() => {
      let cleanup: (() => void) | undefined;
      initAuth()
        .then((c) => {
          cleanup = c;
        })
        .catch(() => {});
      return () => cleanup?.();
    }, []);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <StripeProvider>
                <StreamChatProvider>
                    <>
                        <Stack
                            screenOptions={{
                                headerShown: false,
                                animation: "fade",
                            }}
                        >
                            <Stack.Screen name="index" />
                            <Stack.Screen name="onboarding" />
                            <Stack.Screen name="(auth)" />
                            <Stack.Screen name="(tabs)" />
                            <Stack.Screen 
                                name="chat" 
                                options={{ animation: "slide_from_right" }}
                            />
                            <Stack.Screen
                                name="termos-servico"
                                options={{ animation: "slide_from_right" }}
                            />
                            <Stack.Screen
                                name="perguntas-frequentes"
                                options={{ animation: "slide_from_right" }}
                            />
                            <Stack.Screen
                                name="atualizar-telefone"
                                options={{ animation: "slide_from_right" }}
                            />
                            <Stack.Screen
                                name="atualizar-informacoes"
                                options={{ animation: "slide_from_right" }}
                            />
                            <Stack.Screen
                                name="atualizar-senha"
                                options={{ animation: "slide_from_right" }}
                            />
                            <Stack.Screen
                                name="notificacoes"
                                options={{ animation: "slide_from_right" }}
                            />
                            <Stack.Screen
                                name="all-services"
                                options={{ animation: "slide_from_right" }}
                            />
                            <Stack.Screen
                                name="service-providers"
                                options={{ animation: "slide_from_right" }}
                            />
                            <Stack.Screen
                                name="perfil-prestador"
                                options={{ animation: "slide_from_right" }}
                            />
                            <Stack.Screen
                                name="request-details"
                                options={{ animation: "slide_from_right" }}
                            />
                            <Stack.Screen
                                name="carteira"
                                options={{ animation: "slide_from_right" }}
                            />
                        <Stack.Screen
                            name="avaliar"
                            options={{ animation: "slide_from_right" }}
                        />
                        <Stack.Screen
                            name="historico-servicos"
                            options={{ animation: "slide_from_right" }}
                        />
                        </Stack>
                        <Toaster />
                    </>
                </StreamChatProvider>
            </StripeProvider>
        </GestureHandlerRootView>
    );
}