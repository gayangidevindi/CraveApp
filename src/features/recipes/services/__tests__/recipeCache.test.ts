import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';

import { readRecipeCache, writeRecipeCache } from '../recipeCache';

jest.mock('@react-native-async-storage/async-storage', () => {
  const values = new Map<string, string>();

  return {
    __esModule: true,
    default: {
      clear: jest.fn(async () => values.clear()),
      getItem: jest.fn(async (key: string) => values.get(key) ?? null),
      getAllKeys: jest.fn(async () => Array.from(values.keys())),
      multiRemove: jest.fn(async (keys: string[]) =>
        keys.forEach((key) => values.delete(key)),
      ),
      removeItem: jest.fn(async (key: string) => values.delete(key)),
      setItem: jest.fn(async (key: string, value: string) =>
        values.set(key, value),
      ),
    },
  };
});

const cacheSchema = z.object({
  meals: z.array(
    z.object({
      idMeal: z.string(),
      strMeal: z.string(),
    }),
  ),
});

describe('recipeCache', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('persists validated responses for later offline use', async () => {
    const response = {
      meals: [{ idMeal: '52772', strMeal: 'Teriyaki Chicken' }],
    };

    await writeRecipeCache('search.teriyaki', response, cacheSchema);

    await expect(
      readRecipeCache('search.teriyaki', cacheSchema),
    ).resolves.toEqual(response);
  });

  it('removes corrupt cached JSON instead of returning invalid data', async () => {
    await AsyncStorage.setItem(
      'craveapp.recipes.cache.v1.search.teriyaki',
      '{invalid',
    );

    await expect(
      readRecipeCache('search.teriyaki', cacheSchema),
    ).resolves.toBeNull();
    await expect(
      AsyncStorage.getItem('craveapp.recipes.cache.v1.search.teriyaki'),
    ).resolves.toBeNull();
  });

  it('rejects invalid responses instead of persisting them', async () => {
    await expect(
      writeRecipeCache('search.teriyaki', { meals: [{ idMeal: '52772' }] }, cacheSchema),
    ).rejects.toThrow('The recipe response could not be validated for caching.');
    await expect(
      AsyncStorage.getItem('craveapp.recipes.cache.v1.search.teriyaki'),
    ).resolves.toBeNull();
  });

  it('keeps the persistent cache bounded to the most recent 60 entries', async () => {
    for (let index = 0; index < 65; index += 1) {
      await writeRecipeCache(
        `search.${index}`,
        { meals: [{ idMeal: String(index), strMeal: `Meal ${index}` }] },
        cacheSchema,
      );
    }

    const cacheKeys = (await AsyncStorage.getAllKeys()).filter((key) =>
      key.startsWith('craveapp.recipes.cache.v1.'),
    );
    expect(cacheKeys).toHaveLength(60);
    await expect(
      readRecipeCache('search.0', cacheSchema),
    ).resolves.toBeNull();
    await expect(
      readRecipeCache('search.64', cacheSchema),
    ).resolves.toEqual({
      meals: [{ idMeal: '64', strMeal: 'Meal 64' }],
    });
  });
});
