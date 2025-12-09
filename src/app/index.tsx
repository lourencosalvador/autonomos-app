import { useEffect, useState } from "react";
import { SplashScreen } from "../features/splash/SplashScreen";
import { useAppStore } from "../stores/appStore";

const SPLASH_DURATION = 5000;

export default function Index() {
    const [showSplash, setShowSplash] = useState(true);
    const { hasSeenSplash, setHasSeenSplash } = useAppStore();

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowSplash(false);
            
            if (!hasSeenSplash) {
                setHasSeenSplash(true);
            }
        }, SPLASH_DURATION);

        return () => clearTimeout(timer);
    }, []);

    if (showSplash) {
        return <SplashScreen />;
    }

    return null;
}
