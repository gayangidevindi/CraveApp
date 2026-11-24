import {
  NavigationContainer,
  DefaultTheme,
} from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppProvider } from './src/app/AppProvider';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useCraveTheme } from './src/shared/theme/useCraveTheme';
import { SystemNavigationBar } from './src/shared/components/SystemNavigationBar';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <ThemedApp />
      </AppProvider>
    </SafeAreaProvider>
  );
}

function ThemedApp() {
  const theme = useCraveTheme();
  const navigationTheme = useMemo(
    () => ({
      ...DefaultTheme,
      dark: theme.mode === 'dark',
      colors: {
        ...DefaultTheme.colors,
        primary: theme.colors.primary,
        background: theme.colors.background,
        card: theme.colors.card,
        text: theme.colors.text,
        border: theme.colors.border,
        notification: theme.colors.deepOrange,
      },
    }),
    [theme],
  );

  return (
    <>
      <NavigationContainer theme={navigationTheme}>
        <RootNavigator />
      </NavigationContainer>
      <StatusBar
        style={theme.mode === 'dark' ? 'light' : 'dark'}
        animated
      />
      <SystemNavigationBar mode={theme.mode} />
    </>
  );
}
