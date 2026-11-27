import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';

import { useCraveThemeStyles } from '../theme/useCraveTheme';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface ToastMessageProps {
  message: string | null;
  tone?: 'success' | 'error' | 'info' | 'warning';
  onDismiss: () => void;
}

export function ToastMessage({
  message,
  tone = 'success',
  onDismiss,
}: ToastMessageProps) {
  const { theme, styles } = useCraveThemeStyles(createStyles);
  const reducedMotion = useReducedMotion();
  const [appear] = useState(() => new Animated.Value(0));
  const isError = tone === 'error';
  const toneStyle = styles[tone];
  const toneColors = {
    success: theme.colors.success,
    error: theme.colors.error,
    info: theme.colors.info,
    warning: theme.colors.warning,
  };
  const toneIcons = {
    success: 'check-circle',
    error: 'alert-circle',
    info: 'info',
    warning: 'alert-triangle',
  } as const;
  const toneColor = toneColors[tone];

  useEffect(() => {
    if (!message) {
      appear.setValue(0);
      return;
    }

    if (reducedMotion) {
      appear.setValue(1);
      return;
    }

    appear.setValue(0);
    const animation = Animated.timing(appear, {
      toValue: 1,
      duration: 180,
      useNativeDriver: Platform.OS !== 'web',
    });
    animation.start();
    return () => animation.stop();
  }, [appear, message, reducedMotion]);

  useEffect(() => {
    if (!message) {
      return;
    }

    const timeout = setTimeout(onDismiss, 4_000);
    return () => clearTimeout(timeout);
  }, [message, onDismiss]);

  if (!message) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.toast,
        toneStyle,
        {
          opacity: appear,
          transform: [
            {
              translateY: appear.interpolate({
                inputRange: [0, 1],
                outputRange: [8, 0],
              }),
            },
          ],
        },
      ]}
      accessibilityRole={
        Platform.OS === 'web' ? undefined : isError ? 'alert' : 'text'
      }
      accessibilityLiveRegion={
        Platform.OS === 'android' ? (isError ? 'assertive' : 'polite') : undefined
      }
      role={
        Platform.OS === 'web' ? (isError ? 'alert' : 'status') : undefined
      }
      aria-live={
        Platform.OS === 'web' ? (isError ? 'assertive' : 'polite') : undefined
      }
    >
      <Feather
        name={toneIcons[tone]}
        size={19}
        color={toneColor}
        accessible={false}
      />
      <Text style={[styles.message, { color: toneColor }]}>{message}</Text>
      <Pressable
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel="Dismiss notification"
        style={styles.dismissButton}
      >
        <Feather
          name="x"
          size={18}
          color={toneColor}
          accessible={false}
        />
      </Pressable>
    </Animated.View>
  );
}

function createStyles(theme: import('../theme/theme').CraveTheme) {
  return StyleSheet.create({
    toast: {
      minHeight: 56,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      margin: theme.spacing.md,
      paddingLeft: theme.spacing.md,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.softYellow,
      ...theme.shadows.floating,
    },
    success: {
      backgroundColor: theme.colors.successBackground,
    },
    error: {
      backgroundColor: theme.colors.errorBackground,
    },
    info: {
      backgroundColor: theme.colors.infoBackground,
    },
    warning: {
      backgroundColor: theme.colors.warningBackground,
    },
    message: {
      flex: 1,
      color: theme.colors.darkBrown,
      fontSize: theme.typography.caption,
      lineHeight: theme.typography.lineHeight.caption,
    },
    dismissButton: {
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
