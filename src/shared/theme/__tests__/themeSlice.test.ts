import { configureStore } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

import themeReducer, {
  hydrateThemePreference,
  setThemeMode,
} from '../themeSlice';

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

function createTestStore() {
  return configureStore({
    reducer: { theme: themeReducer },
  });
}

describe('themeSlice', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('defaults to light mode before native preference hydration', () => {
    expect(themeReducer(undefined, { type: 'init' })).toMatchObject({
      mode: 'light',
      hydrated: false,
    });
  });

  it('updates the active theme immediately and persists the selection', async () => {
    const store = createTestStore();

    const update = store.dispatch(setThemeMode('dark'));
    expect(store.getState().theme.mode).toBe('dark');
    await update.unwrap();

    expect(store.getState().theme.isSaving).toBe(false);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'craveapp.theme-mode.v1',
      'dark',
    );
  });

  it('restores a saved theme and allows switching back to light', async () => {
    await AsyncStorage.setItem('craveapp.theme-mode.v1', 'dark');
    const store = createTestStore();

    await store.dispatch(hydrateThemePreference()).unwrap();
    expect(store.getState().theme).toMatchObject({
      mode: 'dark',
      hydrated: true,
    });

    await store.dispatch(setThemeMode('light')).unwrap();
    expect(store.getState().theme.mode).toBe('light');
    await expect(
      AsyncStorage.getItem('craveapp.theme-mode.v1'),
    ).resolves.toBe('light');
  });

  it('rolls back the visible mode and exposes errors if persistence fails', async () => {
    const store = createTestStore();
    jest
      .mocked(AsyncStorage.setItem)
      .mockRejectedValueOnce(new Error('Storage unavailable'));

    await expect(store.dispatch(setThemeMode('dark')).unwrap()).rejects.toBe(
      'Unable to save your appearance setting. Please try again.',
    );

    expect(store.getState().theme.mode).toBe('light');
    expect(store.getState().theme.error).toBe(
      'Unable to save your appearance setting. Please try again.',
    );
  });
});
