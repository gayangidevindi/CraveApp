import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import {
  getInitialThemePreference,
  loadThemePreference,
  saveThemePreference,
} from '../themeStorage';

jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
}));

jest.mock('@react-native-async-storage/async-storage', () => {
  const values = new Map<string, string>();

  return {
    __esModule: true,
    default: {
      clear: jest.fn(async () => values.clear()),
      getItem: jest.fn(async (key: string) => values.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        values.set(key, value);
      }),
    },
  };
});

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => Array.from(values.keys())[index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
}

describe('theme preference storage', () => {
  beforeEach(async () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'android',
    });
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('persists and restores the selected theme on native platforms', async () => {
    await saveThemePreference('dark');

    await expect(loadThemePreference()).resolves.toBe('dark');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'craveapp.theme-mode.v1',
      'dark',
    );
  });

  it('reads the web preference synchronously to avoid a light-theme flash', async () => {
    const storage = createMemoryStorage();
    storage.setItem('craveapp.theme-mode.v1', 'dark');
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'web',
    });
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: storage,
    });

    expect(getInitialThemePreference()).toEqual({
      mode: 'dark',
      hydrated: true,
    });
    await saveThemePreference('light');
    expect(storage.getItem('craveapp.theme-mode.v1')).toBe('light');
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();

    Reflect.deleteProperty(globalThis, 'localStorage');
  });

  it('defaults to light mode when no valid preference is stored', async () => {
    await expect(loadThemePreference()).resolves.toBe('light');
  });
});
