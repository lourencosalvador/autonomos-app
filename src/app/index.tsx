import { useEffect, useState } from "react";
import { SplashScreen } from "../features/splash/SplashScreen";
import { useAppStore } from "../stores/appStore";

const SPLASH_DURATION = 5000;

export default function Index() {
    const [showSplash, setShowSplash] = useState(true);
    const { hasSeenSplash, setHasSeenSplash } = useAppStore();

    useEffect(() => {
        // Sempre mostra splash na primeira vez que o componente carrega
        const timer = setTimeout(() => {
            setShowSplash(false);
            
            // Marca que já viu a splash apenas na primeira execução do app
            if (!hasSeenSplash) {
                setHasSeenSplash(true);
            }
        }, SPLASH_DURATION);

        return () => clearTimeout(timer);
    }, []);

    if (showSplash) {
        return <SplashScreen />;
    }

    // Após splash, o useProtectedRoute no _layout redireciona automaticamente
    // baseado no estado de autenticação e onboarding
    return null;
}