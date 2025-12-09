import { View } from 'react-native';
import { OnboardingCarousel } from '../features/onboarding/OnboardingCarousel';
import { onboardingSlides } from '../features/onboarding/data/slides';
import { useAppStore } from '../stores/appStore';

export default function OnboardingScreen() {
  const { setHasCompletedOnboarding } = useAppStore();

  const handleFinish = () => {
    setHasCompletedOnboarding(true);
    // O redirecionamento será feito automaticamente pelo useProtectedRoute
  };

  return (
    <View className="flex-1 bg-black">
      <OnboardingCarousel
        slides={onboardingSlides}
        onFinish={handleFinish}
      />
    </View>
  );
}

