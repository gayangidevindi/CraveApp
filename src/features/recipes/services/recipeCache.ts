import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';

const RECIPE_CACHE_PREFIX = 'craveapp.recipes.cache.v1.';
const CACHE_INDEX_KEY = 'craveapp.recipes.cache-index.v1';
const MAX_CACHED_ENTRIES = 60;

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
  await maintainCacheIndex(getStorageKey(cacheKey));
}

async function maintainCacheIndex(currentKey: string): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const existingCacheKeys = allKeys.filter((key) =>
      key.startsWith(RECIPE_CACHE_PREFIX),
    );
    const storedIndex = await AsyncStorage.getItem(CACHE_INDEX_KEY);
    let indexedKeys: string[] = [];

    if (storedIndex !== null) {
      try {
        const parsed: unknown = JSON.parse(storedIndex);
        if (Array.isArray(parsed)) {
          indexedKeys = parsed.filter(
            (key): key is string =>
              typeof key === 'string' && existingCacheKeys.includes(key),
          );
        }
      } catch {
        indexedKeys = [];
      }
    }

    const orderedKeys = [
      ...indexedKeys,
      ...existingCacheKeys.filter((key) => !indexedKeys.includes(key)),
    ].filter((key) => key !== currentKey);
    orderedKeys.push(currentKey);
    const keysToRemove = orderedKeys.slice(
      0,
      Math.max(0, orderedKeys.length - MAX_CACHED_ENTRIES),
    );
    const retainedKeys = orderedKeys.slice(-MAX_CACHED_ENTRIES);

    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
    }
    await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(retainedKeys));
  } catch (error) {
    console.warn('Could not maintain the bounded recipe cache index.', error);
  }
}
