import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useAppStore } from '../store/useAppStore';

export function useMotionEnabled(): boolean {
  const reducedPreference = useAppStore((state) => state.settings.reducedMotion);
  const [systemReduced, setSystemReduced] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (active) setSystemReduced(value);
      })
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setSystemReduced);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return !reducedPreference && !systemReduced;
}
