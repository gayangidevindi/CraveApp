import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';

import type { Meal } from './mealApi';

const FAVOURITES_KEY_PREFIX = 'craveapp.favourites.v1.';

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

const favouritesSchema = z.array(mealSchema);

function getStorageKey(userId: string): string {
  return `${FAVOURITES_KEY_PREFIX}${encodeURIComponent(userId)}`;
}

function uniqueMeals(meals: Meal[]): Meal[] {
  const mealsById = new Map<string, Meal>();

  meals.forEach((meal) => {
    mealsById.set(meal.idMeal, meal);
  });

  return Array.from(mealsById.values());
}

export async function readUserFavourites(userId: string): Promise<Meal[]> {
  const key = getStorageKey(userId);
  const storedFavourites = await AsyncStorage.getItem(key);

  if (storedFavourites === null) {
    return [];
  }

  let parsedFavourites: unknown;

  try {
    parsedFavourites = JSON.parse(storedFavourites);
  } catch {
    await AsyncStorage.removeItem(key);
    return [];
  }

  const result = favouritesSchema.safeParse(parsedFavourites);

  if (!result.success) {
    await AsyncStorage.removeItem(key);
    return [];
  }

  return uniqueMeals(result.data);
}

export async function saveUserFavourites(
  userId: string,
  favourites: Meal[],
): Promise<void> {
  const uniqueFavourites = uniqueMeals(favourites);
  await AsyncStorage.setItem(
    getStorageKey(userId),
    JSON.stringify(uniqueFavourites),
  );
}
