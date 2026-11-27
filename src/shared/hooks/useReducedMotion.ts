import { AccessibilityInfo } from 'react-native';
import { useEffect, useState } from 'react';

export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    let active = true;
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReducedMotion,
    );

    void AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (active) {
          setReducedMotion(enabled);
        }
      })
      .catch((error: unknown) => {
        console.warn('Could not read the reduced-motion preference.', error);
      });

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return reducedMotion;
}
