import { useRouter } from 'expo-router';
import { HomeScreen } from '../../features/home/HomeScreen';

export default function WelcomeScreen() {
  const router = useRouter();

  const handleEnter = () => {
    router.push('/(auth)/login');
  };

  const handleCreateAccount = () => {
    router.push('/(auth)/account-type');
  };

  return (
    <HomeScreen 
      onEnter={handleEnter}
      onCreateAccount={handleCreateAccount}
    />
  );
}

