import { Feather } from '@expo/vector-icons';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { useCraveThemeStyles } from '../theme/useCraveTheme';

export interface OfflineBannerProps {
  message?: string;
}

export function OfflineBanner({
  message = "You're offline. You can still explore your saved recipes.",
}: OfflineBannerProps) {
  const { theme, styles } = useCraveThemeStyles(createStyles);

  return (
    <View
      style={styles.container}
      accessibilityRole={
        Platform.OS === 'web'
          ? undefined
          : Platform.OS === 'android'
            ? 'text'
            : 'alert'
      }
      accessibilityLabel={message}
      accessibilityLiveRegion={
        Platform.OS === 'android' ? 'polite' : undefined
      }
      role={Platform.OS === 'web' ? 'status' : undefined}
      aria-live={Platform.OS === 'web' ? 'polite' : undefined}
    >
      <Feather
        name="wifi-off"
        size={18}
        color={theme.colors.warning}
        accessible={false}
      />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

function createStyles(theme: import('../theme/theme').CraveTheme) {
  return StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.warning,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.warningBackground,
  },
  message: {
    flex: 1,
    flexShrink: 1,
    color: theme.colors.warning,
    fontSize: theme.typography.caption,
    lineHeight: theme.typography.lineHeight.caption,
  },
  });
}
