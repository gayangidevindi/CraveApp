import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';

const RECIPE_CACHE_PREFIX = 'craveapp.recipes.cache.v1.';

function getStorageKey(cacheKey: string): string {
  return `${RECIPE_CACHE_PREFIX}${cacheKey}`;
}

export async function readRecipeCache<T>(
  cacheKey: string,
  schema: z.ZodType<T>,
): Promise<T | null> {
  const key = getStorageKey(cacheKey);
  const cachedValue = await AsyncStorage.getItem(key);

  if (cachedValue === null) {
    return null;
  }

  let parsedValue: unknown;

  try {
    parsedValue = JSON.parse(cachedValue);
  } catch {
    await AsyncStorage.removeItem(key);
    return null;
  }

  const result = schema.safeParse(parsedValue);

  if (!result.success) {
    await AsyncStorage.removeItem(key);
    return null;
  }

  return result.data;
}

export async function writeRecipeCache<T>(
  cacheKey: string,
  value: unknown,
  schema: z.ZodType<T>,
): Promise<void> {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw new Error('The recipe response could not be validated for caching.');
  }

  await AsyncStorage.setItem(
    getStorageKey(cacheKey),
    JSON.stringify(result.data),
  );
}
