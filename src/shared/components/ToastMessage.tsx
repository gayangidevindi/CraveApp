import { Feather } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useCraveThemeStyles } from '../theme/useCraveTheme';

interface ToastMessageProps {
  message: string | null;
  tone?: 'success' | 'error';
  onDismiss: () => void;
}

export function ToastMessage({
  message,
  tone = 'success',
  onDismiss,
}: ToastMessageProps) {
  const { theme, styles } = useCraveThemeStyles(createStyles);
  const isError = tone === 'error';

  if (!message) {
    return null;
  }

  return (
    <View
      style={[
        styles.toast,
        isError && styles.errorToast,
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
        name={isError ? 'alert-circle' : 'check-circle'}
        size={19}
        color={isError ? theme.colors.onPrimary : theme.colors.darkBrown}
        accessible={false}
      />
      <Text style={styles.message}>{message}</Text>
      <Pressable
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel="Dismiss notification"
        style={styles.dismissButton}
      >
        <Feather
          name="x"
          size={18}
          color={isError ? theme.colors.onPrimary : theme.colors.darkBrown}
          accessible={false}
        />
      </Pressable>
    </View>
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
    errorToast: {
      backgroundColor: theme.colors.deepOrange,
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
