import type { ComponentProps } from 'react';
import { Feather } from '@expo/vector-icons';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { CustomButton, type CustomButtonVariant } from './CustomButton';
import { theme } from '../theme/theme';

type FeatherIconName = ComponentProps<typeof Feather>['name'];

interface StatusMessageProps {
  icon: FeatherIconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: CustomButtonVariant;
}

export function StatusMessage({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  variant = 'secondary',
}: StatusMessageProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Feather
          name={icon}
          size={28}
          color={theme.colors.deepOrange}
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

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.xl,
  },
  iconContainer: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.softYellow,
  },
  title: {
    color: theme.colors.darkBrown,
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
