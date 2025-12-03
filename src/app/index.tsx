import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { OnboardingCarousel } from "../features/onboarding/OnboardingCarousel";
import { onboardingSlides } from "../features/onboarding/data/slides";
import { SplashScreen } from "../features/splash/SplashScreen";

const SPLASH_DURATION = 5000;

type AppPhase = "splash" | "onboarding" | "home";

export default function App() {
    const [phase, setPhase] = useState<AppPhase>("splash");
    const [onboardingPaused] = useState(false);

    useEffect(() => {
        if (phase !== "splash") return;
        const timer = setTimeout(() => setPhase("onboarding"), SPLASH_DURATION);
        return () => clearTimeout(timer);
    }, [phase]);

    if (phase === "splash") {
        return <SplashScreen />;
    }

    if (phase === "onboarding") {
        return (
            <OnboardingCarousel
                slides={onboardingSlides}
                paused={onboardingPaused}
                onFinish={() => setPhase("home")}
            />
        );
    }

    return (
        <View className="flex-1 items-center justify-center bg-white">
            <Text className="text-lg font-semibold text-neutral-900">Home</Text>
        </View>
    );
}