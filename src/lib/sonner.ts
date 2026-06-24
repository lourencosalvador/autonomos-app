import { toast as baseToast } from 'sonner-native';
import { haptics } from './haptics';

export { Toaster } from 'sonner-native';

// Envolve o toast para disparar feedback tátil em sucesso/erro automaticamente,
// mantendo todos os outros métodos (loading, message, dismiss, promise, etc.).
export const toast = Object.assign(
  ((...args: any[]) => (baseToast as any)(...args)) as typeof baseToast,
  baseToast,
  {
    success: ((...args: any[]) => {
      haptics.success();
      return (baseToast.success as any)(...args);
    }) as typeof baseToast.success,
    error: ((...args: any[]) => {
      haptics.error();
      return (baseToast.error as any)(...args);
    }) as typeof baseToast.error,
  }
);
