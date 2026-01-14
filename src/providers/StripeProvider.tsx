import { ReactNode } from 'react';
import { Platform } from 'react-native';
import { StripeProvider as RNStripeProvider } from '@stripe/stripe-react-native';

export function StripeProvider({ children }: { children: ReactNode }) {
  const publishableKey = (process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '').trim();

  // Stripe RN não roda no web; e sem chave não inicializamos.
  if (Platform.OS === 'web' || !publishableKey) {
    return <>{children}</>;
  }

  return (
    <RNStripeProvider publishableKey={publishableKey} merchantIdentifier="merchant.com.autonomosapp">
      {children}
    </RNStripeProvider>
  );
}


