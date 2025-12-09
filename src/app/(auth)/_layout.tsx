import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen 
        name="welcome" 
        options={{ animation: 'fade' }}
      />
      <Stack.Screen name="account-type" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen 
        name="forgot-password"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen name="verify-code" />
    </Stack>
  );
}

