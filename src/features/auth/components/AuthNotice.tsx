import { Feather } from '@expo/vector-icons';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { useCraveThemeStyles } from '../../../shared/theme/useCraveTheme';

interface AuthNoticeProps {
  message: string;
  tone?: 'error' | 'success';
}

export function AuthNotice({ message, tone = 'error' }: AuthNoticeProps) {
  const { theme, styles } = useCraveThemeStyles(createStyles);
  const isError = tone === 'error';

  return (
    <View
      style={[styles.container, !isError && styles.successContainer]}
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
        size={18}
        color={isError ? theme.colors.deepOrange : theme.colors.darkBrown}
        accessible={false}
      />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

function createStyles(theme: import('../../../shared/theme/theme').CraveTheme) {
  return StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.softYellow,
  },
  successContainer: {
    backgroundColor: theme.colors.card,
  },
  message: {
    flex: 1,
    color: theme.colors.darkBrown,
    fontSize: theme.typography.caption,
    lineHeight: theme.typography.lineHeight.body,
  },
  });
}
