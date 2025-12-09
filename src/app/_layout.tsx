import { Stack } from "expo-router";
import { useEffect } from "react";
import "../global.css";
import { useProtectedRoute } from "../hooks/useProtectedRoute";

export default function RootLayout() {
    useProtectedRoute();

    useEffect(() => {
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