import * as Haptics from 'expo-haptics';

function safe(action: () => Promise<unknown>) {
  action().catch(() => undefined);
}

export function tapHaptic() {
  safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

export function selectHaptic() {
  safe(() => Haptics.selectionAsync());
}

export function successHaptic() {
  safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}
