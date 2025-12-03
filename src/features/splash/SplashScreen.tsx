import { MotiView } from "moti";
import { cssInterop } from "nativewind";
import { Image, View, type ImageSourcePropType } from "react-native";

type SplashScreenProps = {
    iconSource?: ImageSourcePropType;
};

const defaultIcon = require("../../../assets/images/splash-icon.png");

cssInterop(MotiView, { className: { target: "style" } });

export function SplashScreen({ iconSource = defaultIcon }: SplashScreenProps) {
    return (
        <View className="flex-1 items-center justify-center bg-brand-cyan">
            <MotiView
                className="w-[55%] aspect-square"
                from={{ translateY: -12, opacity: 0.2 }}
                animate={{ translateY: 12, opacity: 1 }}
                transition={{
                    type: "timing",
                    duration: 1800,
                    loop: true,
                    repeatReverse: true,
                }}
            >
                <Image
                    source={iconSource}
                    className="h-full w-full"
                    resizeMode="contain"
                />
            </MotiView>
        </View>
    );
}
