import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { useCraveThemeStyles } from '../theme/useCraveTheme';

export interface OfflineBannerProps {
  message?: string;
}

export function OfflineBanner({
  message = "You're offline. Showing saved recipes.",
}: OfflineBannerProps) {
  const { theme, styles } = useCraveThemeStyles(createStyles);

  return (
    <View
      style={styles.container}
      accessibilityRole="alert"
      accessibilityLabel={message}
    >
      <Feather
        name="wifi-off"
        size={18}
        color={theme.colors.darkBrown}
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
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.elevatedSurface,
  },
  message: {
    flex: 1,
    flexShrink: 1,
    color: theme.colors.darkBrown,
    fontSize: theme.typography.caption,
    lineHeight: theme.typography.lineHeight.caption,
  },
  });
}
