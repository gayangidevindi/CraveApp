import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { theme } from '../theme/theme';

interface AppLoadingProps {
  label?: string;
}

export function AppLoading({ label = 'Loading...' }: AppLoadingProps) {
  return (
    <View style={styles.container} accessibilityRole="header">
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  label: {
    marginTop: theme.spacing.sm,
    color: theme.colors.chocolateBrown,
    fontSize: theme.typography.body,
  },
});
