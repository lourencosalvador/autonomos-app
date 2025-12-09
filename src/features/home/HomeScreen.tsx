import { StatusBar } from "expo-status-bar";
import { ImageBackground, Text, TouchableOpacity, View } from "react-native";

type HomeScreenProps = {
    onEnter?: () => void;
    onCreateAccount?: () => void;
};

const heroImage = require("../../../assets/images/home-screen.jpg");

export function HomeScreen({
    onEnter,
    onCreateAccount,
}: HomeScreenProps) {
    return (
        <View className="flex-1 bg-black">
            <StatusBar style="light" />
            <ImageBackground
                source={heroImage}
                resizeMode="cover"
                className="flex-1"
            >
                <View className="absolute inset-0 bg-black/55" />

                <View className="flex-1 justify-end px-6 pb-10">
                    <View className="mb-8 -top-14">
                        <Text className="text-[34px] font-extrabold leading-[44px] text-white">
                            Encontre. Conecte.
                            {"\n"}Confie.
                        </Text>
                        <Text className="mt-3 text-[18px] leading-6 text-white/80">
                            <Text className="font-bold  text-[21px]  text-[#00E7FF]">Profissionais</Text> de todas as áreas,{"\n"} prontos para
                            ajudar você.
                        </Text>
                    </View>

                    <View className="flex-row items-center gap-3">
                        <TouchableOpacity
                            className="flex-1 rounded-full bg-white py-3"
                            activeOpacity={0.85}
                            onPress={onEnter}
                        >
                            <Text className="text-center text-base font-semibold text-neutral-900">
                                Entrar
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="flex-1 rounded-full bg-brand-cyan py-3"
                            activeOpacity={0.85}
                            onPress={onCreateAccount}
                        >
                            <Text className="text-center text-base font-semibold text-white">
                                Criar Conta
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View className="mt-8 items-center">
                        <View className="h-1 w-16 rounded-full bg-white/80" />
                    </View>
                </View>
            </ImageBackground>
        </View>
    );
}

