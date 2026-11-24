import { NavigationBar } from 'expo-navigation-bar';

import type { SystemNavigationBarProps } from './SystemNavigationBar';

export function SystemNavigationBar({ mode }: SystemNavigationBarProps) {
  return <NavigationBar style={mode === 'dark' ? 'dark' : 'light'} />;
}
