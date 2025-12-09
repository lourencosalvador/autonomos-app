import { StatusBar } from "expo-status-bar";
import { MotiView } from "moti";
import { cssInterop } from "nativewind";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ImageBackground,
    Pressable,
    Text,
    TouchableOpacity,
    View,
    type DimensionValue,
} from "react-native";
import type { OnboardingSlide } from "./data/slides";

const AUTO_ADVANCE = 4000;

export type OnboardingCarouselProps = {
    slides: OnboardingSlide[];
    onFinish: () => void;
    paused?: boolean;
};

cssInterop(MotiView, { className: { target: "style" } });

export function OnboardingCarousel({
    slides,
    onFinish,
    paused = false,
}: OnboardingCarouselProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isHolding, setIsHolding] = useState(false);

    const progressRef = useRef(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const effectivePaused = paused || isHolding;
    const currentSlide = slides[activeIndex];
    const isLastStep = activeIndex === slides.length - 1;

    const clearProgressTimer = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const goNext = useCallback(() => {
        if (activeIndex >= slides.length - 1) {
            setTimeout(onFinish, 0);
            return;
        }
        setActiveIndex((prev) => Math.min(prev + 1, slides.length - 1));
    }, [activeIndex, slides.length, onFinish]);

    const startProgressTimer = useCallback(() => {
        clearProgressTimer();
        intervalRef.current = setInterval(() => {
            progressRef.current = Math.min(
                progressRef.current + 50 / AUTO_ADVANCE,
                1
            );
            setProgress(progressRef.current);
            if (progressRef.current >= 1) {
                clearProgressTimer();
                goNext();
            }
        }, 50);
    }, [clearProgressTimer, goNext]);

    useEffect(() => {
        progressRef.current = 0;
        setProgress(0);
    }, [activeIndex]);

    useEffect(() => {
        if (effectivePaused) {
            clearProgressTimer();
            return;
        }
        startProgressTimer();
        return clearProgressTimer;
    }, [effectivePaused, startProgressTimer, clearProgressTimer, activeIndex]);

    return (
        <Pressable
            className="flex-1 bg-black"
            onPressIn={() => {
                if (!paused) {
                    setIsHolding(true);
                }
            }}
            onPressOut={() => setIsHolding(false)}
        >
            <StatusBar style="light" />
            <ImageBackground
                source={currentSlide.image}
                className="absolute inset-0 h-full w-full"
                imageStyle={{ width: "100%", height: "100%" }}
            >
                <View className="absolute inset-0 bg-black/55" />
            </ImageBackground>

            <View className="flex-1 justify-between px-7 pb-8 pt-16">
                <View className="mt-3 flex-row gap-2">
                    {slides.map((slide, idx) => {
                        const isCompleted = idx < activeIndex;
                        const isActive = idx === activeIndex;
                        const widthPercent: DimensionValue = isCompleted
                            ? "100%"
                            : isActive
                                ? `${Math.min(progress * 100, 100)}%`
                                : "0%";

                        return (
                            <View
                                key={slide.id}
                                className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/30"
                            >
                                <View
                                    className="h-full rounded-full"
                                    style={{
                                        width: widthPercent,
                                        backgroundColor: slide.accent,
                                    }}
                                />
                            </View>
                        );
                    })}
                </View>

                <MotiView
                    key={currentSlide.id}
                    from={{ opacity: 0, translateY: 16 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: "timing", duration: 600 }}
                    className="mt-96"
                >
              
                    <Text className="text-[32px] font-medium leading-10 text-white">
                        {currentSlide.copy.lead}{" "}
                        <Text
                            className="font-bold"
                            style={{ color: currentSlide.accent }}
                        >
                            {currentSlide.copy.highlight}
                        </Text>
                    </Text>
                    <Text className="text-[32px] font-medium italic leading-10 text-white/90">
                        {currentSlide.copy.tail}
                    </Text>
                
                </MotiView>

                <View className="flex-row items-center justify-between -top-7">
                    {/* Botão Pular - Esquerda */}
                    {!isLastStep && (
                        <TouchableOpacity
                            className="flex-row items-center justify-center gap-2"
                            onPress={onFinish}
                            activeOpacity={0.8}
                        >
                            <Text className="text-xl text-white/70">←</Text>
                            <Text className="text-[22px] font-medium text-white/70">
                                Pular
                            </Text>
                        </TouchableOpacity>
                    )}
                    
                    {/* Espaço vazio quando é último step */}
                    {isLastStep && <View />}
                    
                    {/* Botão Avançar/Começar - Direita */}
                    <TouchableOpacity
                        className="flex-row items-center justify-center gap-2"
                        onPress={goNext}
                        disabled={effectivePaused}
                        activeOpacity={0.8}
                    >
                        <Text className="text-[22px] font-medium text-white">
                            {isLastStep ? "Começar" : "Avançar"}
                        </Text>
                        <Text className="text-xl text-brand-cyan">➜</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Pressable>
    );
}

