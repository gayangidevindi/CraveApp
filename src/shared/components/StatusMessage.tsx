import type { ComponentProps } from 'react';
import { Feather } from '@expo/vector-icons';
import {
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { CustomButton, type CustomButtonVariant } from './CustomButton';
import { useCraveThemeStyles } from '../theme/useCraveTheme';

type FeatherIconName = ComponentProps<typeof Feather>['name'];

interface StatusMessageProps {
  icon: FeatherIconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: CustomButtonVariant;
  tone?: 'success' | 'error' | 'info' | 'warning';
}

export function StatusMessage({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  variant = 'secondary',
  tone = 'info',
}: StatusMessageProps) {
  const { theme, styles } = useCraveThemeStyles(createStyles);
  const toneColors = {
    success: theme.colors.success,
    error: theme.colors.error,
    info: theme.colors.info,
    warning: theme.colors.warning,
  };
  const toneStyles = {
    success: styles.successIcon,
    error: styles.errorIcon,
    info: styles.infoIcon,
    warning: styles.warningIcon,
  };

  return (
    <View
      style={styles.container}
      accessibilityRole={
        Platform.OS === 'web' ? undefined : tone === 'error' ? 'alert' : 'text'
      }
      accessibilityLiveRegion={
        Platform.OS === 'android'
          ? tone === 'error'
            ? 'assertive'
            : 'polite'
          : undefined
      }
      role={
        Platform.OS === 'web' ? (tone === 'error' ? 'alert' : 'status') : undefined
      }
      aria-live={
        Platform.OS === 'web'
          ? tone === 'error'
            ? 'assertive'
            : 'polite'
          : undefined
      }
    >
      <View style={[styles.iconContainer, toneStyles[tone]]}>
        <Feather
          name={icon}
          size={28}
          color={toneColors[tone]}
          accessible={false}
        />
      </View>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <CustomButton
          title={actionLabel}
          variant={variant}
          onPress={onAction}
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

function createStyles(theme: import('../theme/theme').CraveTheme) {
  return StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.xl,
  },
  iconContainer: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.pill,
  },
  successIcon: {
    backgroundColor: theme.colors.successBackground,
  },
  errorIcon: {
    backgroundColor: theme.colors.errorBackground,
  },
  infoIcon: {
    backgroundColor: theme.colors.infoBackground,
  },
  warningIcon: {
    backgroundColor: theme.colors.warningBackground,
  },
  title: {
    color: theme.colors.heading,
    fontSize: theme.typography.heading,
    fontWeight: theme.typography.weight.bold,
    lineHeight: theme.typography.lineHeight.heading,
    textAlign: 'center',
  },
  message: {
    maxWidth: 360,
    color: theme.colors.chocolateBrown,
    fontSize: theme.typography.body,
    lineHeight: theme.typography.lineHeight.body,
    textAlign: 'center',
  },
  action: {
    minWidth: 144,
    marginTop: theme.spacing.sm,
  },
  });
}
