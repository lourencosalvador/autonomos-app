import { Stack } from "expo-router";
import "../../global.css";

export default function Layout({ children }: { children: React.ReactNode }) {
    return <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>;
}