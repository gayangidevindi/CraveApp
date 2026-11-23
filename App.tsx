import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppProvider } from './src/app/AppProvider';
import { theme } from './src/shared/theme/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <View style={styles.container}>
          <Feather
            name="coffee"
            size={56}
            color={theme.colors.primary}
            accessibilityElementsHidden
          />
          <Text style={styles.title}>CraveApp</Text>
          <Text style={styles.subtitle}>Offline-first food and recipes</Text>
          <StatusBar style="dark" />
        </View>
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.warmCream,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  title: {
    marginTop: theme.spacing.md,
    color: theme.colors.darkBrown,
    fontSize: theme.typography.title,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: theme.spacing.sm,
    color: theme.colors.chocolateBrown,
    fontSize: theme.typography.body,
    textAlign: 'center',
  },
});
