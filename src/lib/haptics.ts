import * as Haptics from 'expo-haptics';

/**
 * Feedback tátil (Taptic Engine no iOS / vibração no Android).
 * Totalmente protegido: em web, simulador ou build sem o módulo nativo, vira no-op (não crasha).
 */
function safe(fn: () => Promise<any> | void) {
  try {
    const r = fn();
    if (r && typeof (r as any).catch === 'function') (r as Promise<any>).catch(() => {});
  } catch {
    /* no-op */
  }
}

export const haptics = {
  success: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  error: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
  light: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  medium: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  heavy: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
  selection: () => safe(() => Haptics.selectionAsync()),
};
