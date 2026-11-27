import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';

import type { Meal } from './mealApi';

const STORAGE_PREFIX = 'craveapp.recipes.recently-viewed.v1.';
const MAX_RECENTLY_VIEWED = 12;

const mealSchema = z
  .object({
    idMeal: z.string(),
    strMeal: z.string(),
    strMealThumb: z.string(),
    strCategory: z.string().nullish(),
    strArea: z.string().nullish(),
    strInstructions: z.string().nullish(),
  })
  .passthrough();

function getStorageKey(userId: string): string {
  return `${STORAGE_PREFIX}${encodeURIComponent(userId)}`;
}

export async function readRecentlyViewed(userId: string): Promise<Meal[]> {
  const storedValue = await AsyncStorage.getItem(getStorageKey(userId));
  if (storedValue === null) {
    return [];
  }

  let parsedValue: unknown;
  try {
    parsedValue = JSON.parse(storedValue);
  } catch {
    throw new Error('Recently viewed recipes could not be read.');
  }

  const result = z.array(mealSchema).safeParse(parsedValue);
  if (!result.success) {
    throw new Error('Saved recently viewed recipes have invalid data.');
  }

  return result.data.slice(0, MAX_RECENTLY_VIEWED);
}

export async function saveRecentlyViewed(
  userId: string,
  recipes: Meal[],
): Promise<void> {
  const uniqueRecipes = recipes.filter(
    (recipe, index) =>
      recipes.findIndex((candidate) => candidate.idMeal === recipe.idMeal) ===
      index,
  );
  await AsyncStorage.setItem(
    getStorageKey(userId),
    JSON.stringify(uniqueRecipes.slice(0, MAX_RECENTLY_VIEWED)),
  );
}
