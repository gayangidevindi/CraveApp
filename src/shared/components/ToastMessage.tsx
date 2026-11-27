import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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

  if (!message) {
    return null;
  }

  return (
    <View
      style={[
        styles.toast,
        tone === 'error' && styles.errorToast,
      ]}
      accessibilityRole={tone === 'error' ? 'alert' : 'status'}
      accessibilityLiveRegion="polite"
    >
      <Feather
        name={tone === 'error' ? 'alert-circle' : 'check-circle'}
        size={19}
        color={tone === 'error' ? theme.colors.onPrimary : theme.colors.darkBrown}
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
          color={tone === 'error' ? theme.colors.onPrimary : theme.colors.darkBrown}
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
