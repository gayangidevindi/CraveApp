import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { theme } from '../theme/theme';

export interface LoadingStateProps {
  label?: string;
  message?: string;
}

export function LoadingState({
  label = 'Loading...',
  message,
}: LoadingStateProps) {
  return (
    <View
      style={styles.container}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityState={{ busy: true }}
    >
      <ActivityIndicator
        size="large"
        color={theme.colors.deepOrange}
        accessible={false}
      />
      <Text style={styles.label}>{label}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.xl,
  },
  label: {
    color: theme.colors.darkBrown,
    fontSize: theme.typography.body,
    fontWeight: theme.typography.weight.semibold,
    textAlign: 'center',
  },
  message: {
    maxWidth: 360,
    color: theme.colors.chocolateBrown,
    fontSize: theme.typography.caption,
    lineHeight: theme.typography.lineHeight.caption,
    textAlign: 'center',
  },
});
