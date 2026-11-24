import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import type { ThemeMode } from './theme';

const THEME_STORAGE_KEY = 'craveapp.theme-mode.v1';

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'light' || value === 'dark';
}

function getWebStorage(): Storage {
  if (typeof globalThis.localStorage === 'undefined') {
    throw new Error('Theme preferences are unavailable in this browser.');
  }

  return globalThis.localStorage;
}

export function getInitialThemePreference(): {
  mode: ThemeMode;
  hydrated: boolean;
} {
  if (Platform.OS !== 'web') {
    return { mode: 'light', hydrated: false };
  }

  try {
    const savedMode = getWebStorage().getItem(THEME_STORAGE_KEY);
    return {
      mode: isThemeMode(savedMode) ? savedMode : 'light',
      hydrated: true,
    };
  } catch {
    return { mode: 'light', hydrated: false };
  }
}

export async function loadThemePreference(): Promise<ThemeMode> {
  const storedMode =
    Platform.OS === 'web'
      ? getWebStorage().getItem(THEME_STORAGE_KEY)
      : await AsyncStorage.getItem(THEME_STORAGE_KEY);

  return isThemeMode(storedMode) ? storedMode : 'light';
}

export async function saveThemePreference(mode: ThemeMode): Promise<void> {
  if (Platform.OS === 'web') {
    getWebStorage().setItem(THEME_STORAGE_KEY, mode);
    return;
  }

  await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
}
