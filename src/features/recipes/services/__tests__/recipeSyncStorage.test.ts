import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  readLastRecipeSync,
  saveLastRecipeSync,
} from '../recipeSyncStorage';

jest.mock('@react-native-async-storage/async-storage', () => {
  const values = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      clear: jest.fn(async () => values.clear()),
      getItem: jest.fn(async (key: string) => values.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) =>
        values.set(key, value),
      ),
    },
  };
});

describe('recipe synchronization storage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('restores the last successful synchronization timestamp after restart', async () => {
    const syncedAt = 1_798_000_000_000;

    await saveLastRecipeSync(syncedAt);

    await expect(readLastRecipeSync()).resolves.toBe(syncedAt);
  });

  it('rejects invalid synchronization timestamps', async () => {
    await expect(saveLastRecipeSync(-1)).rejects.toThrow(
      'A valid recipe synchronization time is required.',
    );
  });
});
