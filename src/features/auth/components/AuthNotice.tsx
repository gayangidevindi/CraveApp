import { Feather } from '@expo/vector-icons';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { useCraveThemeStyles } from '../../../shared/theme/useCraveTheme';

interface AuthNoticeProps {
  message: string;
  tone?: 'error' | 'success' | 'info' | 'warning';
}

export function AuthNotice({ message, tone = 'error' }: AuthNoticeProps) {
  const { theme, styles } = useCraveThemeStyles(createStyles);
  const isError = tone === 'error';
  const toneStyles = {
    success: styles.successContainer,
    error: styles.errorContainer,
    info: styles.infoContainer,
    warning: styles.warningContainer,
  };
  const toneColors = {
    success: theme.colors.success,
    error: theme.colors.error,
    info: theme.colors.info,
    warning: theme.colors.warning,
  };
  const icons = {
    success: 'check-circle',
    error: 'alert-circle',
    info: 'info',
    warning: 'alert-triangle',
  } as const;

  return (
    <View
      style={[styles.container, toneStyles[tone]]}
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
        name={icons[tone]}
        size={18}
        color={toneColors[tone]}
        accessible={false}
      />
      <Text style={[styles.message, { color: toneColors[tone] }]}>{message}</Text>
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
    backgroundColor: theme.colors.successBackground,
  },
  errorContainer: {
    backgroundColor: theme.colors.errorBackground,
  },
  infoContainer: {
    backgroundColor: theme.colors.infoBackground,
  },
  warningContainer: {
    backgroundColor: theme.colors.warningBackground,
  },
  message: {
    flex: 1,
    fontSize: theme.typography.caption,
    lineHeight: theme.typography.lineHeight.body,
  },
  });
}
