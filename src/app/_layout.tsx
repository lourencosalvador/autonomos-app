import { useEffect } from "react";
import { Stack } from "expo-router";
import { useProtectedRoute } from "../hooks/useProtectedRoute";
import "../global.css";

export default function RootLayout() {
    // Hook de proteção de rotas - gerencia redirecionamentos
    useProtectedRoute();

    useEffect(() => {
        // Inicialização de stores/hydration acontece aqui
        // Os stores do Zustand com persist carregam automaticamente
    }, []);

    return (
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
        </Stack>
    );
}